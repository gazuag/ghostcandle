import { parseCsv, timeframeToYahooInterval } from './utils.js';

const endpointCache = new Map();

function buildUrl(ticker, timeframe) {
  const interval = timeframeToYahooInterval[timeframe] || '1d';
  const range = '1mo';
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false`; 
}

function normalizeYahoo(response) {
  const result = response?.chart?.result?.[0];
  if (!result) return null;
  const timestamps = result.timestamp || [];
  const indicators = result.indicators?.quote?.[0];
  if (!indicators) return null;
  const { open, high, low, close, volume } = indicators;
  const candles = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    if ([open[i], high[i], low[i], close[i], volume[i]].some((value) => value == null)) continue;
    candles.push({
      time: timestamps[i],
      open: open[i],
      high: high[i],
      low: low[i],
      close: close[i],
      volume: volume[i],
    });
  }
  return candles;
}

export async function fetchCandles(ticker, timeframe) {
  const key = `${ticker}:${timeframe}`;
  if (endpointCache.has(key)) {
    return endpointCache.get(key);
  }

  try {
    const response = await fetch(buildUrl(ticker, timeframe));
    const payload = await response.json();
    const candles = normalizeYahoo(payload);
    if (!candles || !candles.length) {
      throw new Error('No candles returned');
    }
    const result = { candles, source: 'Yahoo Finance' };
    endpointCache.set(key, result);
    return result;
  } catch (error) {
    throw new Error('Unable to load historical candles.');
  }
}

export async function loadCandlesFromCsv(file) {
  const text = await file.text();
  return parseCsv(text);
}
