export default function DisclaimerBar() {
  return (
    <div className="glass rounded-[32px] border border-slate-800/90 px-6 py-4 text-sm text-slate-300 shadow-glow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>⚠ Not financial advice. Predictions are probabilistic simulations for educational purposes only.</span>
        <span className="text-cyan-200">Ghost Candle AI • Powered by in-browser ML</span>
      </div>
    </div>
  );
}
