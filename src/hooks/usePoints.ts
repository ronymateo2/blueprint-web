import { useState, useEffect } from 'react';
import { api, PointsData } from '../api/client';

export function usePoints() {
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.points.get().then(setData).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
