import { useState, useEffect, useCallback } from 'react';
import { api, type Stats } from '../api/client';

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.stats.get();
      setStats(data);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { stats, loading, reload: () => load(false) };
}
