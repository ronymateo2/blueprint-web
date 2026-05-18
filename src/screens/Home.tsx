import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useStats } from '../hooks/useStats';
import { useUndo } from '../hooks/useUndo';
import { api, type Habit } from '../api/client';
import { Ring } from '../components/Ring';
import { IconTile } from '../components/IconTile';
import { SketchBox } from '../components/SketchBox';
import { UndoToast } from '../components/UndoToast';
import { Scribble } from '../components/Scribble';

function formatDate(): string {
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
}

function todayLocal(): string {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' }).format(new Date());
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

function MiniBars({ weeklyChart }: { weeklyChart: number[] }) {
  const data = weeklyChart.length >= 7 ? weeklyChart.slice(-7) : weeklyChart;
  const max = Math.max(1, ...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(14, (v / max) * 100)}%`,
          background: i === data.length - 1 ? 'var(--coral)' : 'var(--ink)',
          opacity: i === data.length - 1 ? 1 : 0.35,
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { habits, loading: habitsLoading } = useHabits();
  const today = todayLocal();
  const { entries, reload: reloadEntries } = useEntries({ from: today, to: today + 'T23:59:59Z' });
  const { stats, reload: reloadStats } = useStats();
  const { toast, show: showToast, dismiss, handleUndo } = useUndo();
  const [logStates, setLogStates] = useState<Record<string, 'logging' | 'done'>>({});

  const sumByHabit: Record<string, number> = {};
  entries.forEach((e) => { sumByHabit[e.habit_id] = (sumByHabit[e.habit_id] ?? 0) + e.value; });

  const activeHabits = habits.filter(h => !h.archived_at);
  const doneHabits = activeHabits.filter(h => (sumByHabit[h.id] ?? 0) >= h.goal).length;
  const dayPct = activeHabits.length > 0 ? doneHabits / activeHabits.length : 0;

  async function logHabit(habit: Habit, e: React.MouseEvent) {
    e.stopPropagation();
    if (logStates[habit.id]) return;
    setLogStates(prev => ({ ...prev, [habit.id]: 'logging' }));
    try {
      const entry = await api.entries.create({ habit_id: habit.id, value: 1 });
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

  return (
    <div className="screen">
      {/* Nav row */}
      <div className="flex items-center justify-between" style={{ padding: '14px 18px 0' }}>
        <span className="font-hand text-ink-soft" style={{ fontSize: 13, textTransform: 'capitalize' }}>
          {formatDate()}
        </span>
        <button
          onClick={() => navigate('/habits/new')}
          className="bg-transparent border-none cursor-pointer font-hand text-ink"
          style={{ fontSize: 16, padding: '4px 12px', border: '1.8px solid var(--ink)', borderRadius: 999 }}
        >
          + nuevo
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: '4px 18px 8px' }}>
        <div className="font-display leading-none" style={{ fontSize: 44 }}>
          Hoy <Scribble width={58} style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -4 }} />
        </div>
        <div className="font-hand text-ink-soft flex items-center gap-[4px]" style={{ fontSize: 16, marginTop: 4 }}>
          {stats?.todayPoints ?? 0} pts hoy · racha {stats?.streak ?? 0}d
          {(stats?.streak ?? 0) >= 3 && ' 🔥'}
        </div>
      </div>

      {/* Daily summary */}
      <div className="flex items-center gap-[18px]" style={{ padding: '4px 18px 10px' }}>
        <Ring
          size={108}
          value={dayPct}
          stroke={10}
          color="var(--coral)"
          label={`${Math.round(dayPct * 100)}%`}
          labelSize={28}
          sublabel="del día"
        />
        <div className="flex-1 flex flex-col gap-[6px]">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="font-display leading-none" style={{ fontSize: 56, letterSpacing: -1, lineHeight: 0.9 }}>
              {doneHabits}
            </span>
            <span className="font-display" style={{ fontSize: 30, color: 'var(--ink-soft)' }}>
              {' / '}{activeHabits.length}
            </span>
          </div>
          <span className="font-hand text-ink-soft" style={{ fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            hábitos{activeHabits.length > 0 && doneHabits === activeHabits.length ? ' · ¡completo! 🎉' : ''}
          </span>
          {weeklyChart.length > 0 && <MiniBars weeklyChart={weeklyChart} />}
        </div>
      </div>

      {/* Habit list */}
      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 14px' }}>
        {habitsLoading ? (
          <div className="font-hand text-ink-soft text-center" style={{ padding: 20 }}>Cargando…</div>
        ) : activeHabits.length === 0 ? (
          <SketchBox dashed padding={20} style={{ textAlign: 'center', marginTop: 20 }}>
            <div className="font-display" style={{ fontSize: 26, marginBottom: 4 }}>Sin hábitos todavía</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginBottom: 12 }}>Empieza creando uno nuevo</div>
            <button
              onClick={() => navigate('/habits/new')}
              className="font-hand cursor-pointer"
              style={{
                padding: '12px 24px', borderRadius: 999,
                border: '1.8px solid var(--coral)', background: 'var(--coral)',
                color: 'var(--paper)', fontSize: 16,
              }}
            >
              + Crear hábito
            </button>
          </SketchBox>
        ) : (
          activeHabits.map((h) => {
            const sum = sumByHabit[h.id] ?? 0;
            const done = sum >= h.goal;
            const state = logStates[h.id];
            const ringValue = h.type === 'yn' ? (sum >= 1 ? 1 : 0) : Math.min(1, sum / h.goal);
            const valueLabel = h.type === 'yn' ? (sum >= 1 ? '✓' : '0') : h.type === 'time' ? `${sum}′` : `${sum}`;

            return (
              <div
                key={h.id}
                onClick={() => navigate(`/habits/${h.id}`)}
                style={{
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'opacity 160ms',
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
                    onClick={(e) => { void logHabit(h, e); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 44 }}
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
                      {state === 'logging' ? '…' : state === 'done' ? '✓' : valueLabel}
                    </div>
                    {h.type !== 'yn' && (
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
          })
        )}
        <div style={{ height: 20 }} />
      </div>

      {toast && <UndoToast key={toast.id} text={toast.text} onUndo={handleUndo} onDismiss={dismiss} />}
    </div>
  );
}
