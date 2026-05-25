import { useState, useEffect, useCallback } from 'react';
import { api, type Entry } from '../api/client';

interface UseEntriesOptions {
  habitId?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}

export function useEntries(opts: UseEntriesOptions = {}) {
  const enabled = opts.enabled !== false;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(async (showLoading = true) => {
    if (!enabled) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.entries.list({ habit_id: opts.habitId, from: opts.from, to: opts.to });
      setEntries(data);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [enabled, opts.habitId, opts.from, opts.to]);

  useEffect(() => { void load(); }, [load]);

  return { entries, loading, reload: () => load(false), setEntries };
}
