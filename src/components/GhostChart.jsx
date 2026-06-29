import { useEffect, useMemo, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

function sma(values, period) {
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

function bollingerBands(values, period = 20) {
  const result = [];
  for (let i = 0; i < values.length; i += 1) {
    if (i < period - 1) {
      result.push({ upper: null, middle: null, lower: null });
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const middle = slice.reduce((sum, value) => sum + value, 0) / period;
    const variance = slice.reduce((sum, value) => sum + Math.pow(value - middle, 2), 0) / period;
    const std = Math.sqrt(variance);
    result.push({ upper: middle + std * 2, middle, lower: middle - std * 2 });
  }
  return result;
}

function ema(values, period) {
  const k = 2 / (period + 1);
  const result = [];
  let prev = values[0] || 0;
  for (let i = 0; i < values.length; i += 1) {
    prev = i === 0 ? values[i] : values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function computeMACD(values) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const macd = fast.map((value, i) => value - slow[i]);
  const signal = ema(macd, 9);
  const histogram = macd.map((value, i) => value - (signal[i] ?? 0));
  return { macd, signal, histogram };
}

export default function GhostChart({ candles, predictions, showVolume, showMA, showBollingerBands, showRSI, showMACD, showConfidenceBands }) {
  const chartRef = useRef(null);
  const chart = useRef(null);
  const candleSeries = useRef(null);
  const volumeSeries = useRef(null);
  const ghostSeries = useRef(null);
  const ma20Series = useRef(null);
  const ma50Series = useRef(null);
  const ma200Series = useRef(null);
  const bbUpperSeries = useRef(null);
  const bbLowerSeries = useRef(null);
  const confidenceHighSeries = useRef(null);
  const confidenceLowSeries = useRef(null);

  const priceData = useMemo(() => candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })), [candles]);
  const volumeData = useMemo(() => candles.map((c) => ({ time: c.time, value: c.volume, color: c.close >= c.open ? 'rgba(56,248,148,0.4)' : 'rgba(255,84,103,0.35)' })), [candles]);
  const closePrices = useMemo(() => candles.map((c) => c.close), [candles]);
  const moving20 = useMemo(() => sma(closePrices, 20), [closePrices]);
  const moving50 = useMemo(() => sma(closePrices, 50), [closePrices]);
  const moving200 = useMemo(() => sma(closePrices, 200), [closePrices]);
  const bollinger = useMemo(() => bollingerBands(closePrices, 20), [closePrices]);
  const macdData = useMemo(() => computeMACD(closePrices), [closePrices]);
  const rsiData = useMemo(() => {
    const changes = closePrices.map((value, index) => (index === 0 ? 0 : value - closePrices[index - 1]));
    let gain = 0;
    let loss = 0;
    return closePrices.map((_, index) => {
      if (index === 0) return null;
      const change = changes[index];
      gain = gain * 13 / 14 + Math.max(change, 0);
      loss = loss * 13 / 14 + Math.max(-change, 0);
      if (loss === 0) return 100;
      return 100 - 100 / (1 + gain / loss);
    });
  }, [closePrices]);

  useEffect(() => {
    if (!chartRef.current) return;
    chart.current = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 640,
      layout: {
        background: { color: 'transparent' },
        textColor: '#d8f5ff',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(56,248,148,0.35)' },
        horzLine: { color: 'rgba(56,248,148,0.18)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false },
    });

    candleSeries.current = chart.current.addCandlestickSeries({
      upColor: '#38F894',
      downColor: '#FF5467',
      borderDownColor: '#FF5467',
      borderUpColor: '#38F894',
      wickUpColor: '#38F894',
      wickDownColor: '#FF5467',
    });
    volumeSeries.current = chart.current.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    ghostSeries.current = chart.current.addLineSeries({
      color: 'rgba(116,239,255,0.9)',
      lineStyle: 3,
      lineWidth: 2,
    });
    ma20Series.current = chart.current.addLineSeries({ color: '#7ed957', lineWidth: 1.5 });
    ma50Series.current = chart.current.addLineSeries({ color: '#51b2e8', lineWidth: 1.5 });
    ma200Series.current = chart.current.addLineSeries({ color: '#ff98c4', lineWidth: 1.5 });
    bbUpperSeries.current = chart.current.addLineSeries({ color: '#4f90ff', lineWidth: 1, lineStyle: 2 });
    bbLowerSeries.current = chart.current.addLineSeries({ color: '#4f90ff', lineWidth: 1, lineStyle: 2 });
    confidenceHighSeries.current = chart.current.addLineSeries({ color: 'rgba(116,239,255,0.35)', lineWidth: 1, lineStyle: 2 });
    confidenceLowSeries.current = chart.current.addLineSeries({ color: 'rgba(116,239,255,0.35)', lineWidth: 1, lineStyle: 2 });

    const resizeObserver = new ResizeObserver(() => {
      if (chart.current) {
        chart.current.applyOptions({ width: chartRef.current.clientWidth });
      }
    });
    resizeObserver.observe(chartRef.current);
    return () => {
      resizeObserver.disconnect();
      chart.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!chart.current || !candleSeries.current) return;
    candleSeries.current.setData(priceData);
    if (showVolume && volumeSeries.current) {
      volumeSeries.current.setData(volumeData);
    } else {
      volumeSeries.current?.setData([]);
    }
    if (showMA) {
      ma20Series.current.setData(priceData.map((point, index) => ({ time: point.time, value: moving20[index] })).filter((d) => d.value != null)); 
      ma50Series.current.setData(priceData.map((point, index) => ({ time: point.time, value: moving50[index] })).filter((d) => d.value != null)); 
      ma200Series.current.setData(priceData.map((point, index) => ({ time: point.time, value: moving200[index] })).filter((d) => d.value != null)); 
    } else {
      ma20Series.current.setData([]);
      ma50Series.current.setData([]);
      ma200Series.current.setData([]);
    }
    if (showBollingerBands) {
      bbUpperSeries.current.setData(priceData.map((point, index) => ({ time: point.time, value: bollinger[index]?.upper })).filter((d) => d.value != null)); 
      bbLowerSeries.current.setData(priceData.map((point, index) => ({ time: point.time, value: bollinger[index]?.lower })).filter((d) => d.value != null)); 
    } else {
      bbUpperSeries.current.setData([]);
      bbLowerSeries.current.setData([]);
    }
    if (predictions?.aggregated?.length) {
      ghostSeries.current.setData(predictions.aggregated.map((row) => ({ time: Math.round(row.time), value: row.close })));
      if (showConfidenceBands) {
        confidenceHighSeries.current.setData(predictions.aggregated.map((row) => ({ time: Math.round(row.time), value: row.confidenceHigh })));
        confidenceLowSeries.current.setData(predictions.aggregated.map((row) => ({ time: Math.round(row.time), value: row.confidenceLow })));
      } else {
        confidenceHighSeries.current.setData([]);
        confidenceLowSeries.current.setData([]);
      }
    } else {
      ghostSeries.current.setData([]);
      confidenceHighSeries.current.setData([]);
      confidenceLowSeries.current.setData([]);
    }
  }, [priceData, volumeData, showVolume, showMA, showBollingerBands, showConfidenceBands, predictions, moving20, moving50, moving200, bollinger]);

  return (
    <div className="glass relative overflow-hidden rounded-[32px] border border-slate-800/90 shadow-glow bg-slate-950/70">
      <div className="chart-scanlines" />
      <div className="relative h-[640px]" ref={chartRef} />
      {(showRSI || showMACD) && (
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
          {showRSI && <span className="rounded-3xl bg-slate-950/90 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-200">RSI</span>}
          {showMACD && <span className="rounded-3xl bg-slate-950/90 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-200">MACD</span>}
        </div>
      )}
      <div className="absolute left-6 bottom-6 rounded-3xl border border-slate-700/80 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-bull/10 px-3 py-1 text-bull">MA20</span>
          <span className="rounded-full bg-cyan-10 px-3 py-1 text-cyan-200">MA50</span>
          <span className="rounded-full bg-pink-10 px-3 py-1 text-pink-200">MA200</span>
          <span className="rounded-full bg-ghost/10 px-3 py-1 text-ghost">BB</span>
        </div>
      </div>
    </div>
  );
}
