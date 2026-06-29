import { useMemo } from 'react';
import { Zap, RefreshCcw, Cpu, Search } from 'lucide-react';
import { timeframeOptions } from '../lib/utils.js';

export default function TickerBar({ ticker, timeframe, isLoadingData, isTraining, isPredicting, onTickerChange, onTimeframeChange, onRefresh, onTrain, onPredict, errorMessage }) {
  const popular = useMemo(() => ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'NVDA', 'AMZN', 'META', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD'], []);

  return (
    <div className="glass relative overflow-hidden rounded-[32px] border border-slate-800/90 p-4 shadow-glow">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-3xl border border-cyan-400/10 bg-ghost/8 p-3 text-cyan-200 shadow-glow">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Ghost Candle</p>
            <h2 className="text-2xl font-semibold neon-text-green">Ghost Candle AI</h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto] xl:grid-cols-[1fr_auto_auto_auto] items-center">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-2xl border border-slate-700/90 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-fg outline-none transition focus:border-ghost"
              value={ticker}
              onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
              list="ticker-options"
              placeholder="Enter ticker"
            />
            <datalist id="ticker-options">
              {popular.map((symbol) => (
                <option key={symbol} value={symbol} />
              ))}
            </datalist>
          </label>
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/75 p-2 flex gap-2 flex-wrap justify-center">
            {timeframeOptions().map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onTimeframeChange(option)}
                className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${option === timeframe ? 'bg-ghost text-slate-950 shadow-glow' : 'text-slate-300 hover:bg-white/5'}`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoadingData}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/90 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-fg transition hover:border-ghost"
          >
            <RefreshCcw className={`transition ${isLoadingData ? 'animate-spin' : ''}`} size={18} />
            {isLoadingData ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={onTrain}
            disabled={isTraining}
            className="inline-flex items-center gap-2 rounded-2xl bg-bull px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Cpu size={18} />
            {isTraining ? 'Training…' : 'Train AI'}
          </button>
          <button
            type="button"
            onClick={onPredict}
            disabled={isPredicting}
            className="inline-flex items-center gap-2 rounded-2xl bg-ghost px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50 glow-cyan"
          >
            <span className={isPredicting ? 'animate-pulse-glow' : ''}>Predict</span>
          </button>
        </div>
      </div>
      {errorMessage && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-rose-300">{errorMessage}</div>}
    </div>
  );
}
