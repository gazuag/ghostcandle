export default function LoadingOverlay({ loading, title, subtitle, progress, loss }) {
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 backdrop-blur-xl px-4 py-6">
      <div className="glass relative max-w-2xl rounded-[32px] border border-slate-700/80 p-8 shadow-glow">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neon via-ghost to-cyan-200 rounded-t-[28px]" />
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Ghost Candle AI</p>
          <h2 className="mt-4 text-3xl font-semibold neon-text-cyan">{title}</h2>
          <p className="mt-3 text-sm text-slate-300">{subtitle}</p>
        </div>
        <div className="space-y-4">
          <div className="h-4 overflow-hidden rounded-full bg-slate-900 border border-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-ghost to-cyan-400 transition-all" style={{ width: `${progress || 70}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{progress != null ? `Progress: ${Math.round(progress)}%` : 'Processing…'}</span>
            <span>{loss != null ? `Loss: ${loss.toFixed(4)}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
