import { useState, useEffect, useCallback } from 'react';
import { api, type Skip } from '../api/client';

export function useHabitSkips(habitId: string | undefined) {
  const [skips, setSkips] = useState<Skip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!habitId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.skips.listByHabit(habitId);
      setSkips(data);
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => { void load(); }, [load]);

  return { skips, loading };
}
