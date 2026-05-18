import { useState, useEffect, useCallback } from 'react';
import { api, type User } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('habit_token');
    if (!token) { setLoading(false); return; }
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      localStorage.removeItem('habit_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const logout = useCallback(() => {
    localStorage.removeItem('habit_token');
    setUser(null);
  }, []);

  return { user, loading, reload: load, logout };
}
