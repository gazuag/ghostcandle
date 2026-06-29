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
  }, []);

  const login = async (email) => {
    const normalized = email.trim().toLowerCase();
    const session = { email: normalized, name: normalized.split('@')[0] || 'trader' };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
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
