import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FireIcon, ConfettiIcon, PlusIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useStats } from '../hooks/useStats';
import { useUndo } from '../hooks/useUndo';
import { useSkips } from '../hooks/useSkips';
import { api, type Habit } from '../api/client';
import { Ring } from '../components/ui/Ring';
import { Scribble } from '../components/ui/Scribble';
import { SketchBox } from '../components/ui/SketchBox';
import { HabitOptionsSheet } from '../components/home/HabitOptionsSheet';
import { HabitCard } from '../components/home/HabitCard';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { Btn } from '../components/ui/Btn';
import { MiniBars } from '../components/habits/MiniBars';
import { Collapsible } from '../components/ui/Collapsible';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { useAuthContext } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ConfettiBurst } from '../components/habits/ConfettiBurst';

function formatSelectedDate(localDate: string, tz: string): string {
  const { from } = localDayUtcRange(localDate, tz);
  const noon = new Date(new Date(from).getTime() + 12 * 3_600_000);
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' }).format(noon);
}

function formatDayName(localDate: string, tz: string): string {
  const { from } = localDayUtcRange(localDate, tz);
  const noon = new Date(new Date(from).getTime() + 12 * 3_600_000);
  return new Intl.DateTimeFormat('es', { weekday: 'long' }).format(noon);
}


function isHabitDueOnDate(h: Habit, localDate: string, tz: string): boolean {
  const ft = h.frequency_type ?? 'daily';
  if (ft === 'daily') return true;
  let cfg: Record<string, unknown> = {};
  try { cfg = JSON.parse(h.frequency_config ?? '{}'); } catch { /* */ }

  const { from } = localDayUtcRange(localDate, tz);
  const noon = new Date(new Date(from).getTime() + 12 * 3_600_000);

  if (ft === 'weekly') {
    const days = (cfg.days as string[]) ?? [];
    const short = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(noon);
    const map: Record<string, string> = { Mon: 'L', Tue: 'M', Wed: 'X', Thu: 'J', Fri: 'V', Sat: 'S', Sun: 'D' };
    return days.includes(map[short] ?? '');
  }
  if (ft === 'monthly') {
    const days = (cfg.days as number[]) ?? [];
    const dom = noon.getDate();
    return days.includes(dom);
  }
  if (ft === 'interval') {
    const every = (cfg.every as number) ?? 1;
    const diffDays = Math.floor((noon.getTime() - new Date(h.created_at).getTime()) / 86_400_000);
    return diffDays % every === 0;
  }
  return true;
}

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
  const skippedIds = new Set(skips.map((s) => s.habit_id));
  const { show: showToast } = useUndo();
  const [logStates, setLogStates] = useState<Record<string, 'logging' | 'done' | 'exiting'>>({});
  const [completingHabitIds, setCompletingHabitIds] = useState<Record<string, boolean>>({});
  const [ringFlipped, setRingFlipped] = useLocalStorage('ring_view', false);
  const [contextHabit, setContextHabit] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function toggleRingView() { setRingFlipped(!ringFlipped); }
  function goBack()    { setSelectedDate(d => addDays(d, -1)); }
  function goForward() { setSelectedDate(d => addDays(d, +1)); }
  function goToday()   { setSelectedDate(realToday); }

  const isFuture = selectedDate > realToday;
  const isYesterday = selectedDate === addDays(realToday, -1);
  const isTomorrow = selectedDate === addDays(realToday, 1);
  const isRelativeDay = isToday || isYesterday || isTomorrow;
  const relativeTitle = isToday
    ? 'Hoy'
    : isYesterday
    ? 'Ayer'
    : isTomorrow
    ? 'Mañana'
    : formatDayName(selectedDate, timezone);

  const sumByHabit: Record<string, number> = {};
  entries.forEach((e) => { sumByHabit[e.habit_id] = (sumByHabit[e.habit_id] ?? 0) + e.value; });

  const activeHabits = habits.filter(h => {
    if (h.archived_at) return false;
    const createdLocalDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(h.created_at));
    if (selectedDate < createdLocalDate) return false;
    if (h.start_date && selectedDate < h.start_date) return false;
    if (h.end_date && selectedDate > h.end_date) return false;
    return isHabitDueOnDate(h, selectedDate, timezone);
  });
  const nonSkippedActiveHabits = activeHabits.filter(h => !skippedIds.has(h.id));
  const pendingHabits = nonSkippedActiveHabits.filter(h => {
    const sum = sumByHabit[h.id] ?? 0;
    const isCompleted = sum >= h.goal;
    const isTransitioning = !!completingHabitIds[h.id];
    return !isCompleted || isTransitioning;
  });
  const completedHabits = nonSkippedActiveHabits.filter(h => {
    const sum = sumByHabit[h.id] ?? 0;
    const isCompleted = sum >= h.goal;
    const isTransitioning = !!completingHabitIds[h.id];
    return isCompleted && !isTransitioning;
  });
  const skippedHabits = activeHabits.filter(h => skippedIds.has(h.id));
  const doneHabits = nonSkippedActiveHabits.filter(h => (sumByHabit[h.id] ?? 0) >= h.goal).length;
  const dayPct = nonSkippedActiveHabits.length > 0 ? doneHabits / nonSkippedActiveHabits.length : 0;
  const totalPossiblePoints = nonSkippedActiveHabits.reduce((s, h) => s + h.points * h.goal, 0);
  const selectedDatePoints = entries.reduce((sum, e) => sum + e.points, 0);
  const displayPoints = isToday ? (stats?.todayPoints ?? 0) : selectedDatePoints;
  const ptsPct = totalPossiblePoints > 0 ? Math.min(1, displayPoints / totalPossiblePoints) : 0;

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
      {/* Title */}
      <div style={{ padding: '14px 18px 8px' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="font-display leading-none" style={{ fontSize: isRelativeDay ? 44 : 38, textTransform: 'capitalize' }}>
              {relativeTitle}
            </div>
            {isToday ? (
              <Scribble width={58} style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -4, marginLeft: 2 }} />
            ) : (
              <button
                onClick={goToday}
                className="font-hand cursor-pointer active:scale-95 transition-transform"
                style={{
                  border: '1.6px solid var(--coral)',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--coral)',
                  fontSize: 12,
                  padding: '2px 10px',
                  lineHeight: 1.2,
                  marginLeft: 8,
                  marginTop: 6,
                }}
              >
                hoy
              </button>
            )}
          </div>
          <Btn onClick={() => navigate('/habits/new')} style={{ fontSize: 16, padding: '4px 12px', marginTop: 6 }}><PlusIcon size={14} /> nuevo</Btn>
        </div>

        {/* Date navigator */}
        <div className="flex items-center" style={{ marginTop: 8, gap: 4 }}>
          <button
            onClick={goBack}
            className="font-hand bg-transparent cursor-pointer active:opacity-60 transition-opacity"
            style={{ color: 'var(--ink-soft)', padding: '2px 4px', border: 'none', lineHeight: 1, flexShrink: 0 }}
          ><CaretLeftIcon size={18} /></button>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span
              className="font-hand text-ink-soft"
              style={{ fontSize: 15, textTransform: 'capitalize', letterSpacing: 0.1 }}
            >
              {formatSelectedDate(selectedDate, timezone)}
            </span>
          </div>

          <button
            onClick={goForward}
            className="font-hand bg-transparent cursor-pointer active:opacity-60 transition-opacity"
            style={{ color: 'var(--ink-soft)', padding: '2px 4px', border: 'none', lineHeight: 1, flexShrink: 0 }}
          ><CaretRightIcon size={18} /></button>
        </div>

        <div className="font-hand text-ink-soft flex items-center gap-[4px]" style={{ fontSize: 15, marginTop: 4 }}>
          {isToday
            ? <>{displayPoints} pts · racha {stats?.streak ?? 0}d</>
            : <>{displayPoints > 0 ? `${displayPoints} pts ese día · racha ${stats?.streak ?? 0}d` : `racha ${stats?.streak ?? 0}d`}</>
          }
          {(stats?.streak ?? 0) >= 3 && <FireIcon size={15} weight="fill" color="var(--coral)" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} />}
        </div>
      </div>

      {/* Daily summary */}
      <div className="flex items-center gap-[18px]" style={{ padding: '4px 18px 10px' }}>
        <div style={{ position: 'relative', flexShrink: 0, cursor: isFuture ? 'default' : 'pointer' }} onClick={isFuture ? undefined : toggleRingView}>
          <Ring
            size={108} stroke={10}
            value={isFuture ? 0 : (ringFlipped ? dayPct : ptsPct)}
            color={isFuture ? 'var(--ink-soft)' : 'var(--coral)'}
          />
          {isFuture ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-display leading-none" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-soft)' }}>
                {activeHabits.length}
              </span>
              <span className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>hábitos</span>
            </div>
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.45s ease',
              transform: ringFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backfaceVisibility: 'hidden',
              }}>
                <span className="font-display leading-none" style={{ fontSize: 28, fontWeight: 700 }}>{displayPoints}</span>
                <span className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>{isToday ? 'pts hoy' : 'pts'}</span>
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}>
                <span className="font-display leading-none" style={{ fontSize: 28, fontWeight: 700 }}>{`${Math.round(dayPct * 100)}%`}</span>
                <span className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>del día</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-[6px]">
          {isFuture ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="font-display leading-none" style={{ fontSize: 56, letterSpacing: -1, lineHeight: 0.9 }}>
                  0
                </span>
                <span className="font-display" style={{ fontSize: 30, color: 'var(--ink-soft)' }}>
                  {' / '}{activeHabits.length}
                </span>
              </div>
              <span className="font-hand text-ink-soft" style={{ fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                hábitos programados
              </span>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="font-display leading-none" style={{ fontSize: 56, letterSpacing: -1, lineHeight: 0.9 }}>
                  {doneHabits}
                </span>
                <span className="font-display" style={{ fontSize: 30, color: 'var(--ink-soft)' }}>
                  {' / '}{nonSkippedActiveHabits.length}
                </span>
              </div>
              <span className="font-hand text-ink-soft" style={{ fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                hábitos{nonSkippedActiveHabits.length > 0 && doneHabits === nonSkippedActiveHabits.length ? <> · ¡completo! <ConfettiIcon size={14} weight="fill" color="var(--coral)" style={{ display: 'inline', verticalAlign: 'middle' }} /></> : ''}
              </span>
            </>
          )}
          {weeklyChart.length > 0 && <MiniBars weeklyChart={weeklyChart} selectedDate={selectedDate} timezone={timezone} />}
        </div>
      </div>

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
