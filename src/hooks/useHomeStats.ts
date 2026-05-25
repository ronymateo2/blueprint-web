import { useState, useEffect, useCallback } from 'react';
import { api, type HomeStats } from '../api/client';

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.stats.getHome();
      setStats(data);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { stats, loading, reload: () => load(false) };
}
