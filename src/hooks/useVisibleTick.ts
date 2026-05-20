import { useState, useEffect } from 'react';

/** Re-renders every `intervalMs` while tab is visible. Pauses when hidden, refreshes on return. */
export function useVisibleTick(intervalMs = 60_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => { id = setInterval(() => setTick(t => t + 1), intervalMs); };
    const stop = () => { if (id !== null) { clearInterval(id); id = null; } };
    const onVisibility = () => {
      if (document.hidden) { stop(); } else { setTick(t => t + 1); start(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [intervalMs]);
}
