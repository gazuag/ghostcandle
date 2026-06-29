import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also surface to console for dev
    // eslint-disable-next-line no-console
    console.error('Unhandled error caught by ErrorBoundary', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;
    return (
      <div className="min-h-screen grid place-items-center bg-bg text-fg px-4">
        <div className="glass max-w-2xl w-full rounded-3xl p-8 shadow-glow">
          <h2 className="text-2xl font-semibold neon-text-red">Unexpected error</h2>
          <p className="mt-3 text-sm text-slate-300">An unexpected error occurred while running Ghost Candle AI.</p>
          <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/70 p-3 text-xs text-slate-300">
            <div className="font-mono text-[12px] whitespace-pre-wrap break-words">{error?.toString()}</div>
            {info?.componentStack && <pre className="mt-3 text-[11px] text-slate-400">{info.componentStack}</pre>}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => window.location.reload()} className="rounded-2xl bg-ghost px-4 py-2 text-sm font-semibold">Reload</button>
            <button onClick={() => console.clear()} className="rounded-2xl border border-slate-700 px-4 py-2 text-sm">Clear Console</button>
          </div>
        </div>
      </div>
    );
  }
}
