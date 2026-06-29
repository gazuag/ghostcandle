import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Enter a valid email to continue.');
      return;
    }
    await login(email);
    navigate('/');
  };

  return (
    <div className="min-h-screen grid place-items-center bg-bg text-fg px-4">
      <div className="glass max-w-md w-full rounded-3xl p-8 shadow-glow">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-2xl bg-neon/15 p-3 text-neon shadow-glow">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs uppercase text-cyan-200/70 tracking-[0.3em] mb-2">Ghost Candle AI</p>
            <h1 className="text-3xl font-semibold text-fg">Secure terminal access</h1>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6">
          Authenticate to unlock the in-browser stock forecasting terminal with neural model training and simulation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-slate-300">Email address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ghostcandle.ai"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-fg outline-none transition focus:border-ghost"
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-2xl bg-ghost px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-950 transition hover:bg-cyan-400"
          >
            Enter terminal
          </button>
        </form>
      </div>
    </div>
  );
}
