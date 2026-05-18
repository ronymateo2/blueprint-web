import { useState, useEffect, useCallback } from 'react';
import { api, type Entry } from '../api/client';

interface UseEntriesOptions {
  habitId?: string;
  from?: string;
  to?: string;
}

export function useEntries(opts: UseEntriesOptions = {}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.entries.list({ habit_id: opts.habitId, from: opts.from, to: opts.to });
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [opts.habitId, opts.from, opts.to]);

  useEffect(() => { void load(); }, [load]);

  return { entries, loading, reload: load, setEntries };
}
