import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useStats } from '../hooks/useStats';
import { useSkips } from '../hooks/useSkips';
import { api, type Habit } from '../api/client';
import { SketchBox } from '../components/ui/SketchBox';
import { HabitOptionsSheet } from '../components/home/HabitOptionsSheet';
import { HabitCard } from '../components/home/HabitCard';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { Btn } from '../components/ui/Btn';
import { Collapsible } from '../components/ui/Collapsible';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { useAuthContext } from '../context/AuthContext';
import { ConfettiBurst } from '../components/habits/ConfettiBurst';
import { isHabitDueOnDate } from '../lib/habitUtils';
import { useHabitLogger } from '../hooks/useHabitLogger';
import { HomeHeader } from '../components/home/HomeHeader';
import { DailyProgress } from '../components/home/DailyProgress';

export function Home() {
  const navigate = useNavigate();
  const { timezone } = useAuthContext();
  const { habits, loading: habitsLoading, reload: reloadHabits } = useHabits();
  const { stats, loading: statsLoading, reload: reloadStats } = useStats();
  const realToday = todayLocalDate(timezone);
  const [selectedDate, setSelectedDate] = useState(realToday);
  const isToday = selectedDate === realToday;
  const { from, to } = localDayUtcRange(selectedDate, timezone);
  const { entries, loading: entriesLoading, reload: reloadEntries } = useEntries({ from, to });
  const { skips, loading: skipsLoading, reload: reloadSkips } = useSkips(selectedDate);

  const skippedIds = useMemo(() => new Set(skips.map((s) => s.habit_id)), [skips]);

  const sumByHabit = useMemo(() => {
    const sum: Record<string, number> = {};
    entries.forEach((e) => {
      sum[e.habit_id] = (sum[e.habit_id] ?? 0) + e.value;
    });
    return sum;
  }, [entries]);

  const {
    logStates,
    completingHabitIds,
    confettiActive,
    confettiKey,
    logHabit,
  } = useHabitLogger({
    isToday,
    from,
    skippedIds,
    sumByHabit,
    reloadEntries,
    reloadStats,
  });

  const [contextHabit, setContextHabit] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null);

  async function skipHabit(h: Habit) {
    setContextHabit(null);
    await api.skips.create(h.id, selectedDate);
    await reloadSkips();
  }

  async function unskipHabit(h: Habit) {
    setContextHabit(null);
    await api.skips.delete(h.id, selectedDate);
    await reloadSkips();
  }

  async function archiveHabit(h: Habit) {
    setContextHabit(null);
    await api.habits.archive(h.id);
    await reloadHabits();
  }

  async function deleteHabit(h: Habit) {
    setContextHabit(null);
    setConfirmDelete(h);
  }

  async function executeDelete() {
    if (!confirmDelete) return;
    const h = confirmDelete;
    setConfirmDelete(null);
    await api.habits.delete(h.id);
    await reloadHabits();
  }

  function goBack()    { setSelectedDate(d => addDays(d, -1)); }
  function goForward() { setSelectedDate(d => addDays(d, +1)); }
  function goToday()   { setSelectedDate(realToday); }

  const isFuture = selectedDate > realToday;

  const activeHabits = useMemo(() => {
    return habits.filter(h => {
      if (h.archived_at) return false;
      const createdLocalDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(h.created_at));
      if (selectedDate < createdLocalDate) return false;
      if (h.start_date && selectedDate < h.start_date) return false;
      if (h.end_date && selectedDate > h.end_date) return false;
      return isHabitDueOnDate(h, selectedDate, timezone);
    });
  }, [habits, selectedDate, timezone]);

  const nonSkippedActiveHabits = useMemo(() => {
    return activeHabits.filter(h => !skippedIds.has(h.id));
  }, [activeHabits, skippedIds]);

  const pendingHabits = useMemo(() => {
    return nonSkippedActiveHabits.filter(h => {
      const sum = sumByHabit[h.id] ?? 0;
      const isCompleted = sum >= h.goal;
      const isTransitioning = !!completingHabitIds[h.id];
      return !isCompleted || isTransitioning;
    });
  }, [nonSkippedActiveHabits, sumByHabit, completingHabitIds]);

  const completedHabits = useMemo(() => {
    return nonSkippedActiveHabits.filter(h => {
      const sum = sumByHabit[h.id] ?? 0;
      const isCompleted = sum >= h.goal;
      const isTransitioning = !!completingHabitIds[h.id];
      return isCompleted && !isTransitioning;
    });
  }, [nonSkippedActiveHabits, sumByHabit, completingHabitIds]);

  const skippedHabits = useMemo(() => {
    return activeHabits.filter(h => skippedIds.has(h.id));
  }, [activeHabits, skippedIds]);

  const doneHabits = useMemo(() => {
    return nonSkippedActiveHabits.filter(h => (sumByHabit[h.id] ?? 0) >= h.goal).length;
  }, [nonSkippedActiveHabits, sumByHabit]);

  const dayPct = useMemo(() => {
    return nonSkippedActiveHabits.length > 0 ? doneHabits / nonSkippedActiveHabits.length : 0;
  }, [nonSkippedActiveHabits, doneHabits]);

  const totalPossiblePoints = useMemo(() => {
    return nonSkippedActiveHabits.reduce((s, h) => s + h.points * h.goal, 0);
  }, [nonSkippedActiveHabits]);

  const selectedDatePoints = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.points, 0);
  }, [entries]);

  const displayPoints = isToday ? (stats?.todayPoints ?? 0) : selectedDatePoints;

  const ptsPct = useMemo(() => {
    return totalPossiblePoints > 0 ? Math.min(1, displayPoints / totalPossiblePoints) : 0;
  }, [totalPossiblePoints, displayPoints]);

  const weeklyChart = stats?.weeklyChart ?? [];

  if (habitsLoading || statsLoading || entriesLoading || skipsLoading) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  const renderHabitCard = (h: Habit) => (
    <HabitCard
      key={h.id}
      habit={h}
      sum={sumByHabit[h.id] ?? 0}
      isSkipped={skippedIds.has(h.id)}
      isFuture={isFuture}
      isToday={isToday}
      selectedDate={selectedDate}
      timezone={timezone}
      logState={logStates[h.id]}
      onLog={logHabit}
      onLongPress={setContextHabit}
    />
  );

  return (
    <div className="screen">
      {confettiActive && <ConfettiBurst key={confettiKey} />}

      <HomeHeader
        selectedDate={selectedDate}
        timezone={timezone}
        displayPoints={displayPoints}
        streak={stats?.streak ?? 0}
        onGoBack={goBack}
        onGoForward={goForward}
        onGoToday={goToday}
      />

      <DailyProgress
        isFuture={isFuture}
        isToday={isToday}
        activeHabitsCount={activeHabits.length}
        nonSkippedActiveHabitsCount={nonSkippedActiveHabits.length}
        doneHabits={doneHabits}
        dayPct={dayPct}
        ptsPct={ptsPct}
        displayPoints={displayPoints}
        weeklyChart={weeklyChart}
        selectedDate={selectedDate}
        timezone={timezone}
      />

      {/* Habit list */}
      <div
        className="screen-scroll flex flex-col gap-[10px]"
        style={{ padding: '4px 14px 100px' }}
      >
        {activeHabits.length === 0 ? (
          <SketchBox dashed padding={20} style={{ textAlign: 'center', marginTop: 20 }}>
            <div className="font-display" style={{ fontSize: 26, marginBottom: 4 }}>
              {isToday ? 'Sin hábitos todavía' : 'Día libre'}
            </div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginBottom: isToday ? 12 : 0 }}>
              {isToday ? 'Empieza creando uno nuevo' : 'No hay hábitos programados para este día'}
            </div>
            {isToday && (
              <Btn variant="primary" onClick={() => navigate('/habits/new')} style={{ padding: '12px 24px', fontSize: 16 }}>
                <PlusIcon size={14} /> Crear hábito
              </Btn>
            )}
          </SketchBox>
        ) : (
          <>
            {pendingHabits.map(renderHabitCard)}

            {completedHabits.length > 0 && (
              <Collapsible title={`${doneHabits} ${doneHabits === 1 ? 'completado' : 'completados'}`}>
                {completedHabits.map(renderHabitCard)}
              </Collapsible>
            )}

            {skippedHabits.length > 0 && (
              <Collapsible title={`${skippedHabits.length} ${skippedHabits.length === 1 ? 'salteado' : 'salteados'}`}>
                {skippedHabits.map(renderHabitCard)}
              </Collapsible>
            )}
          </>
        )}
        <div style={{ height: 20 }} />
      </div>

      <ConfirmSheet
        open={!!confirmDelete}
        title={`¿Eliminar «${confirmDelete?.name}»?`}
        description="Se borrarán todos sus registros. No se puede deshacer."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <HabitOptionsSheet
        habit={contextHabit}
        isSkipped={contextHabit ? skippedIds.has(contextHabit.id) : false}
        onClose={() => setContextHabit(null)}
        onSkip={() => skipHabit(contextHabit!)}
        onUnskip={() => unskipHabit(contextHabit!)}
        onArchive={() => archiveHabit(contextHabit!)}
        onDelete={() => deleteHabit(contextHabit!)}
      />
    </div>
  );
}
