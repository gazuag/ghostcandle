function movingAverage(values, period) {
  const result = [];
  for (let i = 0; i < values.length; i += 1) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((sum, value) => sum + value, 0) / period);
  }
  return result;
}

function rsi(values, period = 14) {
  const changes = values.map((value, index) => (index === 0 ? 0 : value - values[index - 1]));
  let gain = 0;
  let loss = 0;
  const output = [];
  for (let i = 0; i < changes.length; i += 1) {
    const change = changes[i];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
    if (i >= period) {
      gain -= Math.max(changes[i - period], 0);
      loss -= Math.max(-changes[i - period], 0);
    }
    if (i < period) {
      output.push(null);
      continue;
    }
    const rs = loss === 0 ? 100 : gain / loss;
    output.push(100 - 100 / (1 + rs));
  }
  return output;
}

export function analyzePatterns(candles) {
  const output = [];
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const rsiSeries = rsi(closes);

  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const prev = candles[i - 1];
    const body = Math.abs(current.close - current.open);
    const range = current.high - current.low || 1;
    if (body < range * 0.1) {
      output.push({ name: 'Doji', signal: 'neutral', confidence: 0.6, startIndex: i - 1, endIndex: i, description: 'Small real body indicates indecision.' });
    }
    if (current.close > prev.open && current.open < prev.close && current.close > current.open) {
      output.push({ name: 'Bullish Engulfing', signal: 'bullish', confidence: 0.78, startIndex: i - 1, endIndex: i, description: 'A bullish candle covers the prior bearish candle.' });
    }
    if (current.close < prev.open && current.open > prev.close && current.close < current.open) {
      output.push({ name: 'Bearish Engulfing', signal: 'bearish', confidence: 0.78, startIndex: i - 1, endIndex: i, description: 'A bearish candle covers the prior bullish candle.' });
    }
    const tail = (Math.min(current.open, current.close) - current.low) / range;
    if (tail > 0.55 && body < range * 0.4) {
      output.push({ name: 'Hammer', signal: 'bullish', confidence: 0.7, startIndex: i - 1, endIndex: i, description: 'Long lower wick may signal upside reversal.' });
    }
    const upper = (current.high - Math.max(current.open, current.close)) / range;
    if (upper > 0.55 && body < range * 0.4) {
      output.push({ name: 'Shooting Star', signal: 'bearish', confidence: 0.68, startIndex: i - 1, endIndex: i, description: 'Long upper wick may signal downside reversal.' });
    }

    const currentRsi = rsiSeries[i];
    if (currentRsi != null && currentRsi < 30) {
      output.push({ name: 'RSI Oversold', signal: 'bullish', confidence: 0.58, startIndex: i - 1, endIndex: i, description: 'RSI below 30 often indicates oversold conditions.' });
    } else if (currentRsi != null && currentRsi > 70) {
      output.push({ name: 'RSI Overbought', signal: 'bearish', confidence: 0.58, startIndex: i - 1, endIndex: i, description: 'RSI above 70 often indicates overbought conditions.' });
    }
  }

  if (output.length === 0 && candles.length) {
    output.push({ name: 'Quiet Market', signal: 'neutral', confidence: 0.45, startIndex: 0, endIndex: candles.length - 1, description: 'No strong patterns detected in recent candles.' });
  }

  return output.map((pattern, index) => ({ ...pattern, id: `${pattern.name}-${index}` }));
}
