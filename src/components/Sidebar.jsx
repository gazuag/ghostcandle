import { useEffect, useMemo, useState } from 'react';

const API_KEYS_KEY = 'ghostcandle_api_keys';

function PatternBadge({ pattern, active, onClick }) {
  const classes = {
    bullish: 'pattern-badge-bullish',
    bearish: 'pattern-badge-bearish',
    neutral: 'pattern-badge-neutral',
  }[pattern.signal] || 'pattern-badge-neutral';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group mb-3 w-full rounded-3xl border px-4 py-3 text-left transition ${classes} ${active ? 'border-white' : 'border-transparent'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{pattern.name}</div>
          <div className="mt-1 text-xs text-slate-300">{pattern.description}</div>
        </div>
        <span className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
          {Math.round(pattern.confidence * 100)}%
        </span>
      </div>
    </button>
  );
}

export default function Sidebar({
  patterns,
  activeTab,
  onSetTab,
  predictionMode,
  onPredictionMode,
  numFutureCandles,
  onNumFutureCandles,
  numSimulations,
  onNumSimulations,
  showVolume,
  showConfidenceBands,
  showMA,
  showBollingerBands,
  showRSI,
  showMACD,
  onToggleVolume,
  onToggleConfidence,
  onToggleMA,
  onToggleBollinger,
  onToggleRSI,
  onToggleMACD,
  modelData,
  modelCached,
  trainingProgress,
  trainingLoss,
  onResetModel,
  onUpload,
  uploadError,
  isUploadMode,
  clearUpload,
}) {
  const [apiKeys, setApiKeys] = useState({ TWELVE_DATA_KEY: '', FMP_KEY: '', FINNHUB_KEY: '', ALPHA_VANTAGE_KEY: '' });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(API_KEYS_KEY);
      if (saved) setApiKeys(JSON.parse(saved));
    } catch (error) {
      // ignore
    }
  }, []);

  const saveKeys = () => {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(apiKeys));
  };

  const marketBias = useMemo(() => {
    const score = patterns.reduce((sum, pattern) => sum + (pattern.signal === 'bullish' ? 1 : pattern.signal === 'bearish' ? -1 : 0) * pattern.confidence, 0);
    if (score > 0.5) return 'Bullish';
    if (score < -0.5) return 'Bearish';
    return 'Neutral';
  }, [patterns]);

  return (
    <div className="glass rounded-[32px] border border-slate-800/90 p-4 shadow-glow backdrop-blur-xl">
      <div className="flex gap-2 rounded-3xl bg-slate-950/80 p-2 text-sm uppercase tracking-[0.28em] text-cyan-200/70">
        {['patterns', 'model', 'settings'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSetTab(tab)}
            className={`flex-1 rounded-3xl px-3 py-2 transition ${activeTab === tab ? 'bg-ghost text-slate-950 shadow-glow' : 'hover:bg-white/5'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {activeTab === 'patterns' && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/60 p-4">
              <div className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Market bias</div>
              <div className="mt-2 text-2xl font-semibold neon-text-green">{marketBias}</div>
            </div>
            {patterns.length ? (
              patterns.map((pattern) => (
                <PatternBadge key={pattern.id} pattern={pattern} active={false} onClick={() => {}} />
              ))
            ) : (
              <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-6 text-sm text-slate-300">
                No strong technical patterns detected yet. Adjust the ticker or timeframe to surface fresh signals.
              </div>
            )}
          </section>
        )}

        {activeTab === 'model' && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Model status</div>
                  <div className="mt-2 text-lg font-semibold">{modelCached ? 'Ready' : 'Not trained'}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em] ${modelCached ? 'bg-bull/15 text-bull' : 'bg-bear/15 text-bear'}`}>
                  {modelCached ? 'Cached' : 'Cold'}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>Architecture: 3-layer MLP</div>
                <div>Window: 30 candles</div>
                <div>Output steps: 5</div>
                <div>Training loss: {trainingLoss != null ? trainingLoss.toFixed(4) : '--'}</div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Prediction mode</div>
                <div className="mt-3 flex gap-2">
                  {['neural', 'tech'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onPredictionMode(mode)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${predictionMode === mode ? 'bg-ghost text-slate-950 shadow-glow' : 'bg-slate-900 text-slate-300 hover:bg-white/5'}`}
                    >
                      {mode === 'neural' ? 'Neural Net' : 'Tech Analysis'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Future candles</div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={numFutureCandles}
                    onChange={(event) => onNumFutureCandles(Number(event.target.value))}
                    className="w-full mt-3"
                  />
                  <div className="mt-2 text-sm text-slate-300">{numFutureCandles} candles</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Monte Carlo runs</div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={numSimulations}
                    onChange={(event) => onNumSimulations(Number(event.target.value))}
                    className="w-full mt-3"
                  />
                  <div className="mt-2 text-sm text-slate-300">{numSimulations} simulations</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onResetModel}
              className="w-full rounded-3xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-red-500/20"
            >
              Reset Global Model
            </button>
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 text-xs text-slate-400">
              100% in-browser, no data sent to external ML servers.
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 space-y-4">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Chart overlays</div>
              {[
                { label: 'Volume', value: showVolume, onToggle: onToggleVolume },
                { label: 'Confidence bands', value: showConfidenceBands, onToggle: onToggleConfidence },
                { label: 'Moving averages', value: showMA, onToggle: onToggleMA },
                { label: 'Bollinger Bands', value: showBollingerBands, onToggle: onToggleBollinger },
                { label: 'RSI', value: showRSI, onToggle: onToggleRSI },
                { label: 'MACD', value: showMACD, onToggle: onToggleMACD },
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-sm">
                  <span>{item.label}</span>
                  <input type="checkbox" checked={item.value} onChange={(event) => item.onToggle(event.target.checked)} />
                </label>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 space-y-4">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">API keys</div>
              {['TWELVE_DATA_KEY', 'FMP_KEY', 'FINNHUB_KEY', 'ALPHA_VANTAGE_KEY'].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-slate-400">{key.replace('_KEY', '').replace('_', ' ')}</label>
                  <input
                    type="text"
                    value={apiKeys[key]}
                    onChange={(event) => setApiKeys((prev) => ({ ...prev, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-3 py-3 text-sm text-fg outline-none"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={saveKeys} className="rounded-2xl bg-ghost px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Save keys
                </button>
                <button type="button" onClick={() => setApiKeys({ TWELVE_DATA_KEY: '', FMP_KEY: '', FINNHUB_KEY: '', ALPHA_VANTAGE_KEY: '' })} className="rounded-2xl border border-slate-700/80 px-4 py-3 text-sm text-slate-300 hover:bg-white/5">
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 text-sm text-slate-300">
              Data source: public Yahoo Finance endpoint, CSV fallback, and client-side inference only.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
