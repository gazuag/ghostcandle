export default function DataErrorPanel({ error, onRetry, onUpload }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/85 px-4 py-6">
      <div className="glass w-full max-w-2xl rounded-[32px] border border-red-500/20 p-8 shadow-glow">
        <h3 className="text-2xl font-semibold text-rose-200">Market data unavailable</h3>
        <p className="mt-3 text-slate-300">{error}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={onRetry} className="rounded-2xl bg-ghost px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Retry fetch
          </button>
          <label className="cursor-pointer rounded-2xl border border-slate-700/90 bg-slate-950/85 px-5 py-3 text-sm font-semibold text-fg transition hover:border-ghost">
            Upload CSV fallback
            <input type="file" accept=".csv" onChange={(event) => onUpload(event.target.files?.[0])} className="sr-only" />
          </label>
        </div>
      </div>
    </div>
  );
}
