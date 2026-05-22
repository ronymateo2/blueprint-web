import { useState, useEffect, useCallback } from 'react';
import { api, type Skip } from '../api/client';

export function useSkips(localDate: string) {
  const [skips, setSkips] = useState<Skip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.skips.list(localDate);
      setSkips(data);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [localDate]);

  useEffect(() => { void load(); }, [load]);

  return { skips, loading, reload: () => load(false) };
}
