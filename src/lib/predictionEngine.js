import { clamp, percentile } from './utils.js';

const INPUT_WINDOW = 30;
const FEATURES = 6;
const MAX_DIRECT_STEPS = 5;
const MAX_PCT_CHANGE = 0.04;
const BATCH_SIZE = 24;
const EPOCHS = 40;
const LR_START = 0.005;

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function dsigmoid(y) {
  return y * (1 - y);
}

function tanh(x) {
  return Math.tanh(x);
}

function dtanh(y) {
  return 1 - y * y;
}

function initMatrix(rows, cols) {
  const scale = Math.sqrt(2 / (rows + cols));
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => randn() * scale));
}

function dot(a, b) {
  const result = Array(a.length).fill(0);
  for (let i = 0; i < a.length; i += 1) result[i] = a[i] * b[i];
  return result.reduce((sum, value) => sum + value, 0);
}

function vectorAdd(a, b) {
  return a.map((value, index) => value + b[index]);
}

function vectorSub(a, b) {
  return a.map((value, index) => value - b[index]);
}

function makeModel(outputSteps) {
  return {
    inputSize: INPUT_WINDOW * FEATURES,
    hiddenA: 64,
    hiddenB: 64,
    outputSize: outputSteps * 2,
    weights1: initMatrix(64, INPUT_WINDOW * FEATURES),
    bias1: Array(64).fill(0),
    weights2: initMatrix(64, 64),
    bias2: Array(64).fill(0),
    weights3: initMatrix(outputSteps * 2, 64),
    bias3: Array(outputSteps * 2).fill(0),
  };
}

function clampFeatures(features) {
  return features.map((feature) => {
    const [name, value] = feature;
    switch (name) {
      case 'pct_change':
        return clamp(value * 0.5 + 0.5, 0, 1);
      case 'volatility':
        return clamp(value / 0.06, 0, 1);
      case 'body_ratio':
      case 'upper_wick':
      case 'lower_wick':
        return clamp(value, 0, 1);
      case 'volume_rel':
        return clamp(value / 5, 0, 1);
      default:
        return clamp(value, 0, 1);
    }
  });
}

function computeFeatures(candle, previous, avgVolume) {
  const prevClose = previous?.close || candle.open;
  const pct_change = (candle.close - prevClose) / prevClose;
  const range = candle.high - candle.low || 1;
  const body_ratio = Math.abs(candle.close - candle.open) / range;
  const upper_wick = (candle.high - Math.max(candle.open, candle.close)) / range;
  const lower_wick = (Math.min(candle.open, candle.close) - candle.low) / range;
  const volume_rel = avgVolume ? clamp(candle.volume / avgVolume, 0, 5) : 1;
  return clampFeatures([
    ['pct_change', pct_change],
    ['volatility', range / prevClose],
    ['body_ratio', body_ratio],
    ['upper_wick', upper_wick],
    ['lower_wick', lower_wick],
    ['volume_rel', volume_rel],
  ]);
}

function createTrainingData(candles, outputSteps) {
  const avgVolume = candles.slice(-20).reduce((sum, row) => sum + row.volume, 0) / 20 || 1;
  const windows = [];
  for (let i = 0; i + INPUT_WINDOW + outputSteps < candles.length; i += 1) {
    const window = candles.slice(i, i + INPUT_WINDOW);
    const target = candles.slice(i + INPUT_WINDOW, i + INPUT_WINDOW + outputSteps);
    const inputs = [];
    for (let j = 0; j < window.length; j += 1) {
      const previous = j > 0 ? window[j - 1] : window[0];
      inputs.push(...computeFeatures(window[j], previous, avgVolume));
    }
    const outputs = [];
    let prevClose = window[window.length - 1].close;
    for (let j = 0; j < target.length; j += 1) {
      const row = target[j];
      const pct = clamp((row.close - prevClose) / prevClose, -MAX_PCT_CHANGE, MAX_PCT_CHANGE);
      const vol = clamp((row.high - row.low) / prevClose, 0, 0.06);
      outputs.push((pct + MAX_PCT_CHANGE) / (2 * MAX_PCT_CHANGE));
      outputs.push(vol / 0.06);
      prevClose = row.close;
    }
    windows.push({ inputs, outputs });
  }
  return windows;
}

function forward(model, inputVector) {
  const a1 = model.weights1.map((row, idx) => tanh(dot(row, inputVector) + model.bias1[idx]));
  const a2 = model.weights2.map((row, idx) => tanh(dot(row, a1) + model.bias2[idx]));
  const output = model.weights3.map((row, idx) => sigmoid(dot(row, a2) + model.bias3[idx]));
  return { a1, a2, output };
}

function updateParameters(model, grads, lr) {
  const clampVal = (value) => Math.max(-1, Math.min(1, value));
  for (let i = 0; i < model.weights3.length; i += 1) {
    for (let j = 0; j < model.weights3[i].length; j += 1) {
      model.weights3[i][j] -= lr * grads.dW3[i][j];
    }
    model.bias3[i] -= lr * grads.db3[i];
  }
  for (let i = 0; i < model.weights2.length; i += 1) {
    for (let j = 0; j < model.weights2[i].length; j += 1) {
      model.weights2[i][j] -= lr * grads.dW2[i][j];
    }
    model.bias2[i] -= lr * grads.db2[i];
  }
  for (let i = 0; i < model.weights1.length; i += 1) {
    for (let j = 0; j < model.weights1[i].length; j += 1) {
      model.weights1[i][j] -= lr * grads.dW1[i][j];
    }
    model.bias1[i] -= lr * grads.db1[i];
  }
}

function computeGradients(model, inputVector, target) {
  const { a1, a2, output } = forward(model, inputVector);
  const dOutput = output.map((y, index) => (y - target[index]) * dsigmoid(y));
  const dW3 = model.weights3.map((row) => row.map(() => 0));
  const db3 = Array(model.bias3.length).fill(0);
  const dA2 = Array(model.hiddenB).fill(0);

  for (let i = 0; i < model.weights3.length; i += 1) {
    db3[i] = dOutput[i];
    for (let j = 0; j < model.weights3[i].length; j += 1) {
      dW3[i][j] = dOutput[i] * a2[j];
      dA2[j] += dOutput[i] * model.weights3[i][j];
    }
  }

  const dZ2 = dA2.map((value, index) => value * dtanh(a2[index]));
  const dW2 = model.weights2.map((row) => row.map(() => 0));
  const db2 = Array(model.bias2.length).fill(0);
  const dA1 = Array(model.hiddenA).fill(0);

  for (let i = 0; i < model.weights2.length; i += 1) {
    db2[i] = dZ2[i];
    for (let j = 0; j < model.weights2[i].length; j += 1) {
      dW2[i][j] = dZ2[i] * a1[j];
      dA1[j] += dZ2[i] * model.weights2[i][j];
    }
  }

  const dZ1 = dA1.map((value, index) => value * dtanh(a1[index]));
  const dW1 = model.weights1.map((row) => row.map(() => 0));
  const db1 = Array(model.bias1.length).fill(0);
  for (let i = 0; i < model.weights1.length; i += 1) {
    db1[i] = dZ1[i];
    for (let j = 0; j < model.weights1[i].length; j += 1) {
      dW1[i][j] = dZ1[i] * inputVector[j];
    }
  }

  return { dW3, db3, dW2, db2, dW1, db1 };
}

export async function trainModel(candles, outputSteps) {
  const data = createTrainingData(candles, outputSteps);
  const model = makeModel(outputSteps);
  if (!data.length) return { model, outputSteps, lastFeatures: null, loss: 0 };
  let loss = 0;
  for (let epoch = 0; epoch < EPOCHS; epoch += 1) {
    let epochLoss = 0;
    for (let i = 0; i < data.length; i += 1) {
      const sample = data[i];
      const { a1, a2, output } = forward(model, sample.inputs);
      const target = sample.outputs;
      const sampleLoss = output.reduce((sum, value, idx) => sum + 0.5 * Math.pow(value - target[idx], 2), 0);
      epochLoss += sampleLoss;
      const grads = computeGradients(model, sample.inputs, target);
      const lr = LR_START * (1 - epoch / EPOCHS);
      updateParameters(model, grads, lr);
    }
    loss = epochLoss / data.length;
  }

  const lastWindow = candles.slice(-INPUT_WINDOW);
  const avgVolume = candles.slice(-20).reduce((sum, row) => sum + row.volume, 0) / 20 || 1;
  const lastFeatures = lastWindow.map((candle, idx) => computeFeatures(candle, idx > 0 ? lastWindow[idx - 1] : lastWindow[0], avgVolume)).flat();
  return { model, outputSteps, lastFeatures, loss };
}

function decodeOutput(output, lastClose) {
  const predictions = [];
  for (let i = 0; i < output.length; i += 2) {
    const pct = (output[i] * 2 - 1) * MAX_PCT_CHANGE;
    const vol = clamp(output[i + 1] * 0.06, 0, 0.06);
    const close = lastClose * (1 + pct);
    const range = close * vol * 4;
    const high = Math.max(close, lastClose) + range * 0.4;
    const low = Math.min(close, lastClose) - range * 0.4;
    predictions.push({ close, high, low, volume: lastClose * vol * 3 });
    lastClose = close;
  }
  return predictions;
}

export function runMonteCarlo(modelData, lastWindow, numFutureCandles, runs) {
  if (!modelData || !modelData.model || !lastWindow.length) return null;
  const { model, outputSteps } = modelData;
  const simulations = [];
  const baseFeatures = lastWindow.flat();
  for (let s = 0; s < runs; s += 1) {
    let features = [...baseFeatures];
    const prediction = [];
    let lastClose = lastWindow.slice(-1)[0][0] || 0;
    const effectiveDirect = Math.min(outputSteps, MAX_DIRECT_STEPS, numFutureCandles);
    for (let step = 0; step < numFutureCandles; step += 1) {
      const noisyInput = features.map((value, idx) => clamp(value + randn() * 0.02 * (step + 1) / numFutureCandles, 0, 1));
      const { output } = forward(model, noisyInput);
      const stepOutput = output.slice(0, 2);
      const decoded = decodeOutput(stepOutput, lastClose)[0];
      const reconstructed = {
        time: Date.now() / 1000 + 60 * 60 * 24 * (step + 1),
        open: lastClose,
        high: decoded.high,
        low: decoded.low,
        close: decoded.close,
        volume: Math.max(0, decoded.volume),
      };
      prediction.push(reconstructed);
      lastClose = decoded.close;
      const nextFeatures = computeFeatures(reconstructed, { close: reconstructed.open, high: reconstructed.high, low: reconstructed.low, open: reconstructed.open, volume: reconstructed.volume }, 1);
      features = [...features.slice(FEATURES), ...nextFeatures];
      if (step >= effectiveDirect) {
        continue;
      }
    }
    simulations.push(prediction);
  }

  const aggregated = [];
  for (let i = 0; i < numFutureCandles; i += 1) {
    const closes = simulations.map((sim) => sim[i]?.close || 0);
    const highs = simulations.map((sim) => sim[i]?.high || 0);
    const lows = simulations.map((sim) => sim[i]?.low || 0);
    const volumes = simulations.map((sim) => sim[i]?.volume || 0);
    const meanClose = closes.reduce((sum, value) => sum + value, 0) / closes.length;
    const meanHigh = highs.reduce((sum, value) => sum + value, 0) / highs.length;
    const meanLow = lows.reduce((sum, value) => sum + value, 0) / lows.length;
    aggregated.push({
      time: Date.now() / 1000 + 60 * 60 * 24 * (i + 1),
      close: meanClose,
      high: meanHigh,
      low: meanLow,
      open: i === 0 ? lastWindow.slice(-1)[0][0] : aggregated[i - 1].close,
      volume: volumes.reduce((sum, value) => sum + value, 0) / volumes.length,
      confidenceHigh: percentile(closes, 0.8),
      confidenceLow: percentile(closes, 0.2),
    });
  }

  return { aggregated, simulations };
}

export function saveModelToCache(cacheKey, modelData) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(modelData));
  } catch (error) {
    // ignore
  }
}

export function loadModelFromCache(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function resetModelCache(cacheKey) {
  localStorage.removeItem(cacheKey);
}
