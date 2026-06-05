import { useState, useEffect, useRef } from 'react';

/** Counts down from `seconds` to 0 while `running` is true; resets when toggled. Fires `onDone` at 0. */
export function useCountdown(seconds: number, running: boolean, onDone?: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // Reset to full whenever `running` toggles (render-time pattern, no effect needed).
  const [prevRunning, setPrevRunning] = useState(running);
  if (running !== prevRunning) {
    setPrevRunning(running);
    setRemaining(seconds);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onDoneRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  return remaining;
}
