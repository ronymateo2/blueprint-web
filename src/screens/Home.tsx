import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FireIcon, ConfettiIcon, PlusIcon, CheckIcon, CaretLeftIcon, CaretRightIcon, PencilSimpleIcon, LeafIcon, TrashIcon, CaretDownIcon } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useStats } from '../hooks/useStats';
import { useUndo } from '../hooks/useUndo';
import { api, type Habit } from '../api/client';
import { Ring } from '../components/Ring';
import { Scribble } from '../components/Scribble';
import { IconTile } from '../components/IconTile';
import { SketchBox } from '../components/SketchBox';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { Btn } from '../components/Btn';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { useAuthContext } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

function habitSubtitle(h: Habit, todaySum: number): string {
  switch (h.type) {
    case 'count': return todaySum >= h.goal ? 'hecho' : `de ${h.goal} · +${h.points} pts c/u`;
    case 'time':  return `de ${h.goal} min`;
    case 'yn':    return todaySum >= 1 ? 'hecho' : 'pendiente';
    case 'qty':   return `de ${h.goal} ${h.unit ?? ''}`;
    case 'at':    return todaySum >= 1 ? 'registrado' : 'pendiente';
    default:      return '';
  }
}

// 0=Mon … 6=Sun (ISO week order)
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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

function MiniBars({ weeklyChart, selectedDate, timezone }: { weeklyChart: number[]; selectedDate: string; timezone: string }) {
  const raw = weeklyChart.length >= 7 ? weeklyChart.slice(-7) : weeklyChart;
  const realToday = todayLocalDate(timezone);
  const selectedIso = (new Date(`${selectedDate}T12:00:00Z`).getDay() + 6) % 7;
  const mondayDateStr = addDays(selectedDate, -selectedIso);

  const dateToValue = Object.fromEntries(
    raw.map((v, i) => [addDays(realToday, i - (raw.length - 1)), v])
  );

  const slots = Array.from({ length: 7 }, (_, iso) => ({
    v: dateToValue[addDays(mondayDateStr, iso)] ?? 0,
    iso
  }));

  const max = Math.max(1, ...slots.map(s => s.v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
        {slots.map(({ v, iso }) => (
          <div key={iso} style={{
            flex: 1,
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: iso === selectedIso ? 'var(--coral)' : 'var(--ink)',
            opacity: iso === selectedIso ? 1 : 0.35,
            borderRadius: 2,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {slots.map(({ iso }) => (
          <div key={iso} className="font-hand" style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 10,
            color: iso === selectedIso ? 'var(--coral)' : 'var(--ink-soft)',
            fontWeight: iso === selectedIso ? 600 : 400,
          }}>{DAY_LETTERS[iso]}</div>
        ))}
      </div>
    </div>
  );
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
  const { show: showToast } = useUndo();
  const [logStates, setLogStates] = useState<Record<string, 'logging' | 'done'>>({});
  const [ringFlipped, setRingFlipped] = useLocalStorage('ring_view', false);
  const [contextHabit, setContextHabit] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActive = useRef(false);

  function startLongPress(h: Habit) {
    longPressTimer.current = setTimeout(() => {
      longPressActive.current = true;
      navigator.vibrate?.(18);
      setContextHabit(h);
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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

  const activeHabits = habits.filter(h => !h.archived_at && isHabitDueOnDate(h, selectedDate, timezone));
  const pendingHabits = activeHabits.filter(h => (sumByHabit[h.id] ?? 0) < h.goal);
  const completedHabits = activeHabits.filter(h => (sumByHabit[h.id] ?? 0) >= h.goal);
  const doneHabits = completedHabits.length;
  const dayPct = activeHabits.length > 0 ? doneHabits / activeHabits.length : 0;
  const totalPossiblePoints = activeHabits.reduce((s, h) => s + h.points * h.goal, 0);
  const selectedDatePoints = entries.reduce((sum, e) => sum + e.points, 0);
  const displayPoints = isToday ? (stats?.todayPoints ?? 0) : selectedDatePoints;
  const ptsPct = totalPossiblePoints > 0 ? Math.min(1, displayPoints / totalPossiblePoints) : 0;

  async function logHabit(habit: Habit, e: React.MouseEvent) {
    e.stopPropagation();
    if (logStates[habit.id]) return;
    setLogStates(prev => ({ ...prev, [habit.id]: 'logging' }));
    try {
      const payload: Parameters<typeof api.entries.create>[0] = { habit_id: habit.id, value: 1 };
      if (!isToday) {
        payload.logged_at = from;
      }
      const entry = await api.entries.create(payload);
      await reloadEntries();
      await reloadStats();
      setLogStates(prev => ({ ...prev, [habit.id]: 'done' }));
      showToast({
        id: entry.id,
        text: `${habit.name} · +${entry.points} pts`,
        onUndo: async () => {
          await api.entries.delete(entry.id);
          await reloadEntries();
          await reloadStats();
        },
      });
      setTimeout(() => {
        setLogStates(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
      }, 900);
    } catch {
      setLogStates(prev => { const n = { ...prev }; delete n[habit.id]; return n; });
    }
  }

  const weeklyChart = stats?.weeklyChart ?? [];

  if (habitsLoading || statsLoading || entriesLoading) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="screen">
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
                  {' / '}{activeHabits.length}
                </span>
              </div>
              <span className="font-hand text-ink-soft" style={{ fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                hábitos{activeHabits.length > 0 && doneHabits === activeHabits.length ? <> · ¡completo! <ConfettiIcon size={14} weight="fill" color="var(--coral)" style={{ display: 'inline', verticalAlign: 'middle' }} /></> : ''}
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
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 50) return;
          dx < 0 ? goForward() : goBack();
        }}
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
          (() => {
            const renderHabitCard = (h: Habit) => {
              const sum = sumByHabit[h.id] ?? 0;
              const done = sum >= h.goal;
              const state = logStates[h.id];
              const ringValue = h.type === 'yn' ? (sum >= 1 ? 1 : 0) : Math.min(1, sum / h.goal);
              const valueLabel = isFuture
                ? '—'
                : h.type === 'yn' ? (sum >= 1 ? <CheckIcon size={28} weight="bold" style={{ animation: 'check-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} /> : '0')
                : h.type === 'time' ? `${sum}′`
                : `${sum}`;

              return (
                <div
                  key={h.id}
                  onTouchStart={() => startLongPress(h)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseDown={() => startLongPress(h)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onClick={() => {
                    if (longPressActive.current) { longPressActive.current = false; return; }
                    if (!isFuture) navigate(`/habits/${h.id}`);
                  }}
                  style={{
                    cursor: !isFuture ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'opacity 160ms',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    animation: 'fadeIn 0.22s ease-out',
                  }}
                >
                  <SketchBox
                    padding={14}
                    radius={16}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      opacity: done ? 0.62 : 1,
                      background: done ? 'rgba(255,255,255,0.4)' : 'transparent',
                    }}
                  >
                    <IconTile kind={h.icon} size={50} />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display leading-none overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          fontSize: 28,
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {h.name}
                      </div>
                      <div className="font-hand text-ink-soft" style={{ fontSize: 15, marginTop: 4 }}>
                        {habitSubtitle(h, sum)}
                      </div>
                    </div>

                    {/* Tap-to-log area */}
                    <div
                      onClick={!isFuture ? (e) => { void logHabit(h, e); } : undefined}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 44,
                        opacity: !isFuture ? 1 : 0.35,
                        pointerEvents: !isFuture ? 'auto' : 'none',
                      }}
                    >
                      <div
                        className="font-display"
                        style={{
                          fontSize: 38,
                          lineHeight: 0.95,
                          letterSpacing: -0.5,
                          color: done ? 'var(--ink-soft)' : (sum > 0 ? 'var(--coral)' : 'var(--ink)'),
                          textAlign: 'center',
                          minWidth: 36,
                        }}
                      >
                        {state === 'logging' ? '…' : state === 'done' ? <CheckIcon size={28} weight="bold" style={{ animation: 'check-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} /> : valueLabel}
                      </div>
                      {h.type !== 'yn' && !isFuture && (
                        <div style={{
                          width: 44, height: 5, borderRadius: 999,
                          border: '1px solid var(--ink)', overflow: 'hidden',
                          background: 'var(--paper)',
                        }}>
                          <div style={{
                            width: `${Math.min(100, ringValue * 100)}%`,
                            height: '100%',
                            background: done ? 'var(--ink-soft)' : 'var(--coral)',
                            transition: 'width 320ms ease',
                          }} />
                        </div>
                      )}
                    </div>
                  </SketchBox>
                </div>
              );
            };

            return (
              <>
                {pendingHabits.map(renderHabitCard)}

                {completedHabits.length > 0 && (
                  <>
                    <div style={{ borderTop: '1.5px dashed var(--ink-soft)', margin: '6px 4px' }} />
                    <button
                      onClick={() => setCompletedExpanded(!completedExpanded)}
                      className="font-display active:scale-98 transition-transform cursor-pointer flex items-center justify-between"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        fontSize: 24,
                        color: 'var(--ink)',
                        padding: '6px 4px',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                      }}
                    >
                      <span>
                        {doneHabits} {doneHabits === 1 ? 'completado' : 'completados'}
                      </span>
                      <CaretDownIcon
                        size={18}
                        style={{
                          color: 'var(--ink-soft)',
                          transform: completedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s ease-in-out',
                        }}
                      />
                    </button>
                    <div
                      style={{
                        maxHeight: completedExpanded ? '1000px' : '0px',
                        opacity: completedExpanded ? 1 : 0,
                        transition: 'max-height 0.28s ease-in-out, opacity 0.22s ease-in-out',
                        overflow: completedExpanded ? 'visible' : 'hidden',
                      }}
                    >
                      <div className="flex flex-col gap-[10px]" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                        {completedHabits.map(renderHabitCard)}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()
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
      <BottomSheet open={!!contextHabit} onClose={() => setContextHabit(null)}>
        {contextHabit && (
          <>
            <div className="font-display" style={{ fontSize: 22, marginBottom: 2 }}>{contextHabit.name}</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 16 }}>opciones del hábito</div>
            {([
              {
                icon: <PencilSimpleIcon size={18} />,
                label: 'Editar hábito',
                color: 'var(--ink)',
                action: () => { setContextHabit(null); navigate(`/habits/${contextHabit.id}/edit`); },
              },
              {
                icon: <LeafIcon size={18} />,
                label: 'Archivar hábito',
                color: 'var(--ink)',
                action: () => archiveHabit(contextHabit),
              },
              {
                icon: <TrashIcon size={18} />,
                label: 'Eliminar permanente',
                color: 'var(--coral)',
                action: () => deleteHabit(contextHabit),
              },
            ] as const).map(({ icon, label, color, action }) => (
              <button
                key={label}
                onClick={action}
                className="font-hand"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '13px 0',
                  background: 'none', border: 'none', borderBottom: '1px dashed var(--ink-soft)',
                  cursor: 'pointer', fontSize: 17, color,
                  textAlign: 'left',
                }}
              >
                {icon}{label}
              </button>
            ))}
          </>
        )}
      </BottomSheet>
    </div>
  );
}
