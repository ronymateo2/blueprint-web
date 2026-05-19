import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User } from '../api/client';

function timezoneFromToken(): string | null {
  const token = localStorage.getItem('habit_token');
  if (!token) return null;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64)) as { timezone?: string };
    return payload.timezone ?? null;
  } catch {
    return null;
  }
}

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
    const token = localStorage.getItem('habit_token');
    if (!token) { setLoading(false); return; }
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      localStorage.removeItem('habit_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const logout = useCallback(() => {
    localStorage.removeItem('habit_token');
    setUser(null);
  }, []);

  const timezone = user?.timezone ?? timezoneFromToken() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

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
