import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatPrice } from '../lib/utils.js';

export default function StatsBar({ ticker, price, change, high, low, range52, volume, source }) {
  const isBull = change?.startsWith('+');

  return (
    <div className="glass rounded-[32px] border border-slate-800/90 p-4 shadow-glow">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Ticker</p>
          <div className="mt-2 text-2xl font-semibold neon-text-green">{ticker}</div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Current</p>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(price)}</div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Change</p>
          <div className={`mt-2 inline-flex items-center gap-2 text-base font-semibold ${isBull ? 'text-bull' : 'text-bear'}`}>
            {isBull ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {change || '--'}
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Period high / low</p>
          <div className="mt-2 text-sm text-slate-200">
            {formatPrice(high)} / {formatPrice(low)}
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">20-day avg vol</p>
          <div className="mt-2 text-sm text-slate-200">{volume ? volume.toLocaleString() : '--'}</div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
        Data source: <span className="text-ghost">{source}</span>
      </div>
    </div>
  );
}
