import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const LOCAL_USER_KEY = 'ghostcandle_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_USER_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
    // eslint-disable-next-line no-console
    console.log('[Auth] initialized, user:', stored ? JSON.parse(stored) : null);
  }, []);

  const login = async (email) => {
    const normalized = email.trim().toLowerCase();
    const session = { email: normalized, name: normalized.split('@')[0] || 'trader' };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(session));
    setUser(session);
    // eslint-disable-next-line no-console
    console.log('[Auth] login', session);
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
    // eslint-disable-next-line no-console
    console.log('[Auth] logout');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
