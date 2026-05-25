import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User } from '../api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  timezone: string;
  reload: () => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const logout = useCallback(() => {
    api.auth.logout().catch(() => {});
    setUser(null);
  }, []);

  const timezone = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <AuthContext.Provider value={{ user, loading, timezone, reload, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
