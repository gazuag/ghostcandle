import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LoginPage from './pages/Login.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg text-fg">
        <div className="glass rounded-3xl p-10 text-center max-w-md">
          <div className="text-sm uppercase text-cyan-200/75 tracking-[0.28em] mb-4">Initializing Ghost Candle AI…</div>
          <div className="h-24 bg-gradient-to-r from-neon via-ghost to-cyan-300/30 rounded-3xl animate-pulse-glow" />
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
