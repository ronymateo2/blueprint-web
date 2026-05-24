import { useState, useRef, useEffect } from 'react';
import { api, type Habit } from '../api/client';
import { useUndo } from './useUndo';

interface UseHabitLoggerProps {
  isToday: boolean;
  from: string;
  skippedIds: Set<string>;
  sumByHabit: Record<string, number>;
  reloadEntries: () => Promise<any>;
  reloadStats: () => Promise<any>;
}

export function useHabitLogger({
  isToday,
  from,
  skippedIds,
  sumByHabit,
  reloadEntries,
  reloadStats,
}: UseHabitLoggerProps) {
  const { show: showToast } = useUndo();
  const [logStates, setLogStates] = useState<Record<string, 'logging' | 'done' | 'exiting'>>({});
  const [completingHabitIds, setCompletingHabitIds] = useState<Record<string, boolean>>({});
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confettiTimer.current) {
        clearTimeout(confettiTimer.current);
      }
    };
  }, []);

  async function logHabit(habit: Habit, e: React.MouseEvent) {
    e.stopPropagation();
    if (logStates[habit.id] || skippedIds.has(habit.id)) return;

    const currentSum = sumByHabit[habit.id] ?? 0;
    const logValue = habit.type === 'time' ? habit.goal : 1;
    const isCompleting = currentSum < habit.goal && (currentSum + logValue) >= habit.goal;

    setLogStates(prev => ({ ...prev, [habit.id]: 'logging' }));
    if (isCompleting) {
      setCompletingHabitIds(prev => ({ ...prev, [habit.id]: true }));
    }

    try {
      const payload: Parameters<typeof api.entries.create>[0] = { habit_id: habit.id, value: logValue };
      if (!isToday) {
        payload.logged_at = from;
      }
      const entry = await api.entries.create(payload);
      await Promise.allSettled([reloadEntries(), reloadStats()]);
      setLogStates(prev => ({ ...prev, [habit.id]: 'done' }));
      showToast({
        id: entry.id,
        text: `${habit.name} · +${entry.points} pts`,
        onUndo: async () => {
          await api.entries.delete(entry.id);
          await Promise.allSettled([reloadEntries(), reloadStats()]);
        },
      });

      if (isCompleting) {
        if (confettiTimer.current) clearTimeout(confettiTimer.current);
        setConfettiKey(k => k + 1);
        setConfettiActive(true);
        confettiTimer.current = setTimeout(() => setConfettiActive(false), 2800);

        setTimeout(() => {
          setLogStates(prev => ({ ...prev, [habit.id]: 'exiting' }));
          setTimeout(() => {
            setLogStates(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
            setCompletingHabitIds(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
          }, 300);
        }, 800);
      } else {
        setTimeout(() => {
          setLogStates(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
        }, 800);
      }
    } catch {
      setLogStates(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
      setCompletingHabitIds(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
    }
  }

  return {
    logStates,
    completingHabitIds,
    confettiActive,
    confettiKey,
    logHabit,
  };
}
