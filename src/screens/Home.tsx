import { useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useStats } from '../hooks/useStats';
import { useUndo } from '../hooks/useUndo';
import { api, type Habit } from '../api/client';
import { Ring } from '../components/Ring';
import { HandIcon } from '../components/HandIcon';
import { IconTile } from '../components/IconTile';
import { SketchBox } from '../components/SketchBox';
import { TabBar } from '../components/TabBar';
import { UndoToast } from '../components/UndoToast';
import { Scribble } from '../components/Scribble';

function todayLocal(tz?: string): string {
  try {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: tz ?? 'UTC', dateStyle: 'short' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatDate(): string {
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
}

function habitSubtitle(h: Habit, todaySum: number): string {
  switch (h.type) {
    case 'count': return `${todaySum} de ${h.goal} hoy · +${h.points} pts c/u`;
    case 'time':  return `${todaySum} / ${h.goal} min`;
    case 'yn':    return todaySum >= 1 ? `Hecho · hoy` : 'Pendiente';
    case 'qty':   return `${todaySum} de ${h.goal} ${h.unit ?? 'unidades'}`;
    case 'at':    return todaySum >= 1 ? `Registrado` : `Pendiente a hora específica`;
    default:      return '';
  }
}

export function Home() {
  const navigate = useNavigate();
  const { habits, loading: habitsLoading } = useHabits();
  const today = todayLocal();
  const { entries, reload: reloadEntries } = useEntries({ from: today, to: today + 'T23:59:59Z' });
  const { stats, reload: reloadStats } = useStats();
  const { toast, show: showToast, dismiss, handleUndo } = useUndo();

  // Sum entries per habit for today
  const sumByHabit: Record<string, number> = {};
  entries.forEach((e) => {
    sumByHabit[e.habit_id] = (sumByHabit[e.habit_id] ?? 0) + e.value;
  });

  const totalHabits = habits.length;
  const doneHabits = habits.filter((h) => (sumByHabit[h.id] ?? 0) >= h.goal).length;
  const dayPct = totalHabits > 0 ? doneHabits / totalHabits : 0;

  async function logHabit(habit: Habit, e: React.MouseEvent) {
    e.stopPropagation();
    const entry = await api.entries.create({ habit_id: habit.id, value: 1 });
    await reloadEntries();
    await reloadStats();
    showToast({
      id: entry.id,
      text: `${habit.name} · +${entry.points} pts`,
      onUndo: async () => {
        await api.entries.delete(entry.id);
        await reloadEntries();
        await reloadStats();
      },
    });
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '14px 18px 0' }}>
        <span className="font-hand text-ink-soft" style={{ fontSize: 17 }}>{formatDate()}</span>
        <button onClick={() => navigate('/me')} className="bg-transparent border-none cursor-pointer p-[4px]">
          <HandIcon kind="heart" size={20} />
        </button>
      </div>

      <div style={{ padding: '2px 18px 6px' }}>
        <div className="font-display leading-none" style={{ fontSize: 44 }}>
          Hoy <Scribble width={58} style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -4 }} />
        </div>
        <div className="font-hand text-ink-soft flex items-center gap-[4px]" style={{ fontSize: 18, marginTop: 2 }}>
          {stats?.todayPoints ?? 0} pts · racha {stats?.streak ?? 0} días <HandIcon kind="fire" size={18} color="var(--coral)" />
        </div>
      </div>

      {/* Summary band */}
      <div className="flex items-center gap-[14px]" style={{ padding: '6px 18px 10px' }}>
        <Ring size={86} value={dayPct} label={`${Math.round(dayPct * 100)}%`} labelSize={26} sublabel="del día" color="var(--coral)" stroke={7} />
        <div className="flex-1 flex flex-col gap-[4px]">
          <span className="font-display leading-none" style={{ fontSize: 28 }}>{doneHabits} / {totalHabits} hábitos</span>
          <span className="font-hand text-ink-soft flex items-center gap-[4px]" style={{ fontSize: 17 }}>
            {totalHabits - doneHabits > 0
              ? `quedan ${totalHabits - doneHabits} por completar`
              : <><HandIcon kind="check" size={15} color="var(--coral)" /> ¡Todo listo por hoy!</>}
          </span>
        </div>
      </div>

      {/* Habit list */}
      <div className="screen-scroll flex flex-col gap-[8px]" style={{ padding: '0 14px 6px' }}>
        {habitsLoading ? (
          <div className="font-hand text-ink-soft text-center" style={{ padding: 20 }}>Cargando…</div>
        ) : habits.length === 0 ? (
          <div className="text-center" style={{ padding: 32 }}>
            <div className="font-display" style={{ fontSize: 22, marginBottom: 8 }}>Sin hábitos aún</div>
            <div className="font-hand text-ink-soft">Toca el + para crear el primero</div>
          </div>
        ) : (
          habits.map((h) => {
            const sum = sumByHabit[h.id] ?? 0;
            const done = sum >= h.goal;
            return (
              <SketchBox
                key={h.id}
                padding={10}
                radius={14}
                className={`flex items-center gap-[10px] cursor-pointer ${done ? 'opacity-55' : 'opacity-100'}`}
                onClick={() => navigate(`/habits/${h.id}`)}
              >
                <IconTile kind={h.icon} size={44} />
                <div className="flex-1 min-w-0">
                  <div className={`font-display leading-none overflow-hidden text-ellipsis whitespace-nowrap${done ? ' line-through' : ''}`} style={{ fontSize: 26 }}>{h.name}</div>
                  <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
                    {habitSubtitle(h, sum)}
                  </div>
                </div>
                <div
                  onClick={(e) => { void logHabit(h, e); }}
                  className="cursor-pointer"
                >
                  <Ring
                    size={52}
                    value={h.type === 'yn' ? (sum >= 1 ? 1 : 0) : sum / h.goal}
                    stroke={4}
                    color={done ? 'var(--ink-soft)' : 'var(--coral)'}
                    label={h.type === 'yn' ? (sum >= 1 ? '✓' : '+') : h.type === 'time' ? `${sum}′` : `${sum}`}
                  />
                </div>
              </SketchBox>
            );
          })
        )}
        <div style={{ height: 16 }} />
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/habits/new')}
        className="absolute flex items-center justify-center bg-coral cursor-pointer z-10 rounded-[27px]"
        style={{
          right: 18,
          bottom: 86,
          width: 54,
          height: 54,
          border: '2px solid var(--ink)',
          boxShadow: '2px 3px 0 rgba(0,0,0,0.15)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <HandIcon kind="plus" size={26} color="var(--paper)" />
      </button>

      {toast && (
        <UndoToast key={toast.id} text={toast.text} onUndo={handleUndo} onDismiss={dismiss} />
      )}

      <TabBar />
    </div>
  );
}
