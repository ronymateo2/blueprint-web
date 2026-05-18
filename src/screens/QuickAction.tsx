import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { useUndo } from '../hooks/useUndo';
import { api } from '../api/client';
import { Ring } from '../components/Ring';
import { SketchButton } from '../components/SketchButton';
import { UndoToast } from '../components/UndoToast';
import { useHabits } from '../hooks/useHabits';

function todayLocal(): string {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' }).format(new Date());
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
  return `${Math.floor(diff / 1440)}d`;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function QuickAction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === id);
  const today = todayLocal();

  const { entries, reload: reloadEntries, setEntries } = useEntries({ habitId: id, from: today, to: today + 'T23:59:59Z' });
  const { toast, show: showToast, dismiss, handleUndo } = useUndo();
  const [customVal, setCustomVal] = useState<number | null>(null);
  const [showStepper, setShowStepper] = useState(false);

  if (!habit) return (
    <div className="screen items-center justify-center">
      <span className="font-hand text-ink-soft">Cargando…</span>
    </div>
  );

  const todaySum = entries.reduce((s, e) => s + e.value, 0);
  const ringValue = habit.type === 'yn' ? (todaySum >= 1 ? 1 : 0) : todaySum / habit.goal;
  const ringLabel = habit.type === 'time' ? `${todaySum}′` : habit.type === 'yn' ? (todaySum >= 1 ? '✓' : '0') : `${todaySum} / ${habit.goal}`;
  const lastEntry = entries[0];

  async function doLog(value: number) {
    const entry = await api.entries.create({ habit_id: habit!.id, value });
    await reloadEntries();
    showToast({
      id: entry.id,
      text: `${habit!.name} · +${entry.points} pts`,
      onUndo: async () => {
        await api.entries.delete(entry.id);
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      },
    });
    setShowStepper(false);
    setCustomVal(null);
  }

  const unitLabel = habit.type === 'time' ? 'min' : habit.unit ?? 'unidades';

  return (
    <div className="screen">
      {/* Top bar */}
      <div className="flex items-center justify-between" style={{ padding: '14px 16px 4px' }}>
        <SketchButton small onClick={() => navigate(-1)}>← Hoy</SketchButton>
        <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>{habit.name}</span>
        <SketchButton small onClick={() => navigate(`/habits/${habit.id}/edit`)}>···</SketchButton>
      </div>

      <div className="screen-scroll">
        <div className="flex flex-col items-center" style={{ padding: '8px 18px 0' }}>
          <div className="font-display leading-none" style={{ fontSize: 30, marginTop: 4 }}>{habit.name}</div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 2 }}>
            {habit.type === 'count' ? `contar · meta ${habit.goal}×/día` :
             habit.type === 'time'  ? `duración · meta ${habit.goal} min/día` :
             habit.type === 'yn'    ? 'sí / no · una vez al día' :
             habit.type === 'qty'   ? `cantidad · meta ${habit.goal} ${habit.unit}` :
             `a hora específica`}
          </div>

          {/* BIG CIRCLE */}
          <div className="relative" style={{ marginTop: 20 }}>
            <Ring
              size={220}
              value={ringValue}
              stroke={14}
              color="var(--coral)"
              label={ringLabel}
              sublabel="completados hoy"
            />
            <div className="absolute inset-0 rounded-[50%] pointer-events-none" style={{ border: '2px dashed var(--ink-soft)', opacity: 0.2 }} />
          </div>

          <div className="flex flex-col items-center gap-[4px]" style={{ marginTop: 14 }}>
            {lastEntry ? (
              <span className="font-hand" style={{ fontSize: 14 }}>
                última vez · <b>hace {timeAgo(lastEntry.logged_at)}</b>
              </span>
            ) : (
              <span className="font-hand text-ink-soft" style={{ fontSize: 14 }}>sin registros hoy</span>
            )}
            <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>+{habit.points} pts por cada registro</span>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-[10px]" style={{ marginTop: 20 }}>
            <SketchButton filled accent style={{ padding: '12px 32px', fontSize: 18 }} onClick={() => void doLog(1)}>
              + Registrar uno
            </SketchButton>
            <button
              onClick={() => setShowStepper((s) => !s)}
              className="font-hand text-ink-soft bg-transparent border-none cursor-pointer"
              style={{ fontSize: 13, borderBottom: '1px dashed var(--ink-soft)' }}
            >
              registrar otra cantidad
            </button>
          </div>

          {/* Stepper */}
          {showStepper && (
            <div className="flex flex-col items-center gap-[10px] w-full" style={{ marginTop: 16, padding: '0 32px' }}>
              <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>añadir {unitLabel}</span>
              <div className="flex items-center gap-[14px]">
                <SketchButton style={{ padding: '6px 16px', fontSize: 22 }} onClick={() => setCustomVal((v) => Math.max(1, (v ?? 1) - 1))}>−</SketchButton>
                <span className="font-display text-center" style={{ fontSize: 36, minWidth: 40 }}>{customVal ?? 1}</span>
                <SketchButton style={{ padding: '6px 16px', fontSize: 22 }} onClick={() => setCustomVal((v) => (v ?? 1) + 1)}>+</SketchButton>
              </div>
              <SketchButton filled accent style={{ padding: '10px 28px', fontSize: 16, marginTop: 4 }} onClick={() => void doLog(customVal ?? 1)}>
                Guardar · +{habit.points} pts
              </SketchButton>
            </div>
          )}

          {/* Today's log */}
          {entries.length > 0 && (
            <div className="w-full" style={{ padding: '20px 18px 100px' }}>
              <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginBottom: 6 }}>HOY</div>
              {entries.map((e) => (
                <div key={e.id} className="flex justify-between items-center font-hand" style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px dashed var(--ink-soft)' }}>
                  <span className="text-ink-soft">{formatTime(e.logged_at)}</span>
                  <span>+{e.value} {habit.type === 'time' ? 'min' : ''}</span>
                  <span className="text-ink-soft">+{e.points} pts</span>
                  <button
                    onClick={async () => { await api.entries.delete(e.id); await reloadEntries(); }}
                    className="bg-transparent border-none cursor-pointer font-hand text-ink-soft"
                    style={{ fontSize: 13 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <UndoToast key={toast.id} text={toast.text} onUndo={handleUndo} onDismiss={dismiss} />}
    </div>
  );
}
