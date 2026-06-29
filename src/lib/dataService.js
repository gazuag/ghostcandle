import { parseCsv, timeframeToYahooInterval } from './utils.js';

const API_KEYS_KEY = 'ghostcandle_api_keys';
const endpointCache = new Map();

function buildUrl(ticker, timeframe) {
  const interval = timeframeToYahooInterval[timeframe] || '1d';
  const range = '1mo';
  const real = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false`;
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    return `/yahoo/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false`;
  }
  return `https://query1.finance.yahoo.com${real}`;
}

async function parseJsonOrText(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __rawText: text.trim(), status: response.status, statusText: response.statusText };
  }
}

function buildDemoCandles(ticker) {
  const count = 30;
  const day = 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);
  let price = 150 + (ticker.length % 10) * 3;
  return Array.from({ length: count }, (_, index) => {
    const time = now - (count - index) * day;
    const drift = Math.sin(index / 3) * 0.03 + (index / count) * 0.005;
    const open = price;
    const close = Math.max(1, price * (1 + drift));
    const high = Math.max(open, close) * 1.02;
    const low = Math.min(open, close) * 0.98;
    const volume = 600000 + Math.round(Math.abs(Math.sin(index / 2)) * 450000);
    price = close;
    return {
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    };
  });
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
    const url = buildUrl(ticker, timeframe);
    // eslint-disable-next-line no-console
    console.debug('[dataService] fetchCandles url=', url);
    const response = await fetch(url);
    const payload = await parseJsonOrText(response);
    if (!response.ok) {
      const detail = payload?.__rawText || payload?.error || `${response.status} ${response.statusText}`;
      throw new Error(`Yahoo Finance fetch failed: ${detail}`);
    }
    // eslint-disable-next-line no-console
    console.debug('[dataService] raw payload', payload?.chart?.result?.[0] || payload?.__rawText);
    const candles = normalizeYahoo(payload);
    // eslint-disable-next-line no-console
    console.debug('[dataService] normalized candles count=', candles ? candles.length : 0);
    if (!candles || !candles.length) {
      throw new Error('No candles returned');
    }
    const result = { candles, source: 'Yahoo Finance' };
    endpointCache.set(key, result);
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[dataService] fetchCandles error', error);
    try {
      const keys = JSON.parse(localStorage.getItem(API_KEYS_KEY) || '{}');
      const alphaKey = keys.ALPHA_VANTAGE_KEY || keys.alphaVantage;
      if (alphaKey) {
        // eslint-disable-next-line no-console
        console.debug('[dataService] yahoo failed — trying Alpha Vantage fallback');
        const avUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(ticker)}&outputsize=compact&apikey=${encodeURIComponent(alphaKey)}`;
        const avRes = await fetch(avUrl);
        const avJson = await avRes.json();
        const series = avJson['Time Series (Daily)'] || avJson['Time Series (60min)'] || null;
        if (series) {
          const candles = Object.keys(series).slice(0, 60).map((dateStr) => {
            const d = series[dateStr];
            return {
              time: Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 1000),
              open: parseFloat(d['1. open']),
              high: parseFloat(d['2. high']),
              low: parseFloat(d['3. low']),
              close: parseFloat(d['4. close']),
              volume: parseInt(d['6. volume'] || d['5. volume'] || 0, 10),
            };
          }).reverse();
          if (candles.length) {
            const result = { candles, source: 'Alpha Vantage' };
            endpointCache.set(key, result);
            return result;
          }
        }
      }
    } catch (fallbackErr) {
      // eslint-disable-next-line no-console
      console.error('[dataService] Alpha Vantage fallback failed', fallbackErr);
    }

    if (String(error.message || error).includes('Too Many Requests') || String(error.message || error).includes('No candles returned')) {
      const result = { candles: buildDemoCandles(ticker), source: 'Demo data fallback' };
      endpointCache.set(key, result);
      return result;
    }

    throw new Error(`Unable to load historical candles: ${error && error.message ? error.message : String(error)}`);
  }
}

export async function loadCandlesFromCsv(file) {
  const text = await file.text();
  return parseCsv(text);
}
