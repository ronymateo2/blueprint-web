import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { useUndo } from '../hooks/useUndo';
import { api, type Entry } from '../api/client';
import { Ring } from '../components/Ring';
import { HandIcon } from '../components/HandIcon';
import { IconTile } from '../components/IconTile';
import { UndoToast } from '../components/UndoToast';
import { BottomSheet } from '../components/BottomSheet';
import { useHabits } from '../hooks/useHabits';

function todayLocal(): string {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' }).format(new Date());
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'ahora';
  if (diff < 60) return `hace ${Math.round(diff)}m`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function shortTime(iso: string): string {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function typeLabel(type: string): string {
  if (type === 'count') return 'Contar';
  if (type === 'time') return 'Duración';
  if (type === 'yn') return 'Marcar';
  if (type === 'qty') return 'Cantidad';
  if (type === 'at') return 'A hora';
  return '';
}

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  big?: boolean;
}

function Stepper({ value, onChange, min = 0, max = 999, big = false }: StepperProps) {
  const btnSize = big ? 48 : 38;
  const btnFontSize = big ? 28 : 24;
  const numFontSize = big ? 42 : 30;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: btnSize, height: btnSize, borderRadius: 999,
          border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: btnFontSize, lineHeight: 1, color: 'var(--ink)',
        }}
      >−</button>
      <span className="font-display text-center" style={{ fontSize: numFontSize, minWidth: big ? 64 : 44, lineHeight: 1 }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: btnSize, height: btnSize, borderRadius: 999,
          border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: btnFontSize, lineHeight: 1, color: 'var(--ink)',
        }}
      >+</button>
    </div>
  );
}

interface EditEntrySheetProps {
  habit: ReturnType<typeof useHabits>['habits'][number];
  entry: Entry;
  amount: number;
  onAmountChange: (v: number) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function EditEntrySheet({ habit, entry, amount, onAmountChange, onSave, onDelete, onClose }: EditEntrySheetProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="font-display" style={{ fontSize: 28 }}>Editar registro</div>
      <div className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
        {habit.name} · {shortTime(entry.logged_at)}
      </div>
      {habit.type !== 'yn' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
          <span className="font-hand" style={{ fontSize: 16 }}>cantidad{habit.type === 'time' ? ' (min)' : ''}</span>
          <Stepper value={amount} onChange={onAmountChange} min={1} max={habit.type === 'time' ? 240 : 50} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button
          onClick={() => void onDelete()}
          className="font-hand cursor-pointer flex-1"
          style={{
            padding: '14px 0', textAlign: 'center', borderRadius: 999,
            border: '1.8px solid var(--coral)', color: 'var(--coral)',
            fontSize: 17, background: 'transparent',
          }}
        >Borrar</button>
        {habit.type !== 'yn' ? (
          <button
            onClick={() => void onSave()}
            className="font-hand cursor-pointer"
            style={{
              flex: 1.5, padding: '14px 0', textAlign: 'center', borderRadius: 999,
              border: '1.8px solid var(--ink)', background: 'var(--ink)',
              color: 'var(--paper)', fontSize: 17,
            }}
          >Guardar</button>
        ) : (
          <button
            onClick={onClose}
            className="font-hand cursor-pointer"
            style={{
              flex: 1.5, padding: '14px 0', textAlign: 'center', borderRadius: 999,
              border: '1.8px solid var(--ink)', fontSize: 17, background: 'transparent',
            }}
          >Cerrar</button>
        )}
      </div>
    </div>
  );
}

interface QuickLogBodyProps {
  habit: ReturnType<typeof useHabits>['habits'][number];
  todaySum: number;
  onLog: (amount: number) => Promise<void>;
  onClose: () => void;
}

function QuickLogBody({ habit, todaySum: _todaySum, onLog, onClose }: QuickLogBodyProps) {
  const [amount, setAmount] = useState(habit.type === 'time' ? 5 : 1);
  const chips = habit.type === 'time' ? [5, 10, 15, 20, 30] : [1, 2, 3, 5, 8];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconTile kind={habit.icon} size={42} />
        <div>
          <div className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>{habit.name}</div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>
            {typeLabel(habit.type)} · meta {habit.goal}{habit.type === 'time' ? ' min' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px 0' }}>
        <span className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
          cantidad{habit.type === 'time' ? ' (min)' : ''}
        </span>
        <Stepper value={amount} onChange={setAmount} min={1} max={habit.type === 'time' ? 240 : 50} big />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {chips.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className="font-hand cursor-pointer"
            style={{
              padding: '6px 14px', border: '1.6px solid var(--ink)', borderRadius: 999,
              fontSize: 14,
              background: v === amount ? 'var(--coral-soft)' : 'transparent',
              color: 'var(--ink)',
            }}
          >
            {v}{habit.type === 'time' ? '′' : ''}
          </button>
        ))}
      </div>

      <div className="font-hand text-ink-soft text-center" style={{ fontSize: 13, marginTop: 4 }}>
        Vas a sumar <b style={{ color: 'var(--coral)' }}>+{habit.points * amount} pts</b>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
        <button
          onClick={onClose}
          className="font-hand cursor-pointer flex-1"
          style={{
            padding: 12, textAlign: 'center', borderRadius: 999,
            border: '1.8px solid var(--ink)', fontSize: 16,
            background: 'transparent',
          }}
        >Cancelar</button>
        <button
          onClick={() => void onLog(amount)}
          className="font-hand cursor-pointer"
          style={{
            flex: 1.5, padding: 12, textAlign: 'center', borderRadius: 999,
            border: '1.8px solid var(--coral)', background: 'var(--coral)',
            color: 'var(--paper)', fontSize: 16,
          }}
        >
          Registrar +{habit.points * amount} pts
        </button>
      </div>
    </div>
  );
}

function ActionMenuRow({ icon, label, onTap, danger }: { icon: string; label: string; onTap: () => void; danger?: boolean }) {
  return (
    <div
      onClick={onTap}
      className="cursor-pointer flex items-center gap-[14px]"
      style={{
        padding: '12px 4px',
        borderBottom: '1px dashed var(--ink-soft)',
      }}
    >
      <HandIcon kind={icon} size={20} color={danger ? 'var(--coral)' : 'var(--ink)'} />
      <span className="font-hand" style={{ fontSize: 17, color: danger ? 'var(--coral)' : 'var(--ink)' }}>{label}</span>
    </div>
  );
}

export function QuickAction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === id);
  const today = todayLocal();

  const { entries, reload: reloadEntries, setEntries } = useEntries({ habitId: id, from: today, to: today + 'T23:59:59Z' });
  const { toast, show: showToast, dismiss, handleUndo } = useUndo();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editAmount, setEditAmount] = useState(1);

  useEffect(() => {
    if (editEntry) setEditAmount(editEntry.value);
  }, [editEntry]);

  if (!habit) return (
    <div className="screen items-center justify-center">
      <span className="font-hand text-ink-soft">Cargando…</span>
    </div>
  );

  const todaySum = entries.reduce((s, e) => s + e.value, 0);
  const done = todaySum >= habit.goal;
  const ringValue = habit.type === 'yn' ? (todaySum >= 1 ? 1 : 0) : Math.min(1, todaySum / habit.goal);
  const ringLabel = habit.type === 'time' ? `${todaySum}′` : habit.type === 'yn' ? (todaySum >= 1 ? '✓' : '+') : `${todaySum}`;
  const ringSubLabel = habit.type === 'yn'
    ? (done ? 'completado' : 'toca para marcar')
    : `de ${habit.goal}${habit.type === 'time' ? ' min' : ''} hoy`;
  const lastEntry = [...entries].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];

  async function doLog(value: number) {
    const entry = await api.entries.create({ habit_id: habit!.id, value });
    await reloadEntries();
    showToast({
      id: entry.id,
      text: `${habit!.name} · +${entry.points} pts`,
      onUndo: async () => {
        await api.entries.delete(entry.id);
        await reloadEntries();
      },
    });
    setLogOpen(false);
  }

  async function saveEntryEdit() {
    if (!editEntry) return;
    await api.entries.delete(editEntry.id);
    await api.entries.create({ habit_id: habit!.id, value: editAmount });
    await reloadEntries();
    setEditEntry(null);
  }

  async function deleteEntryEdit() {
    if (!editEntry) return;
    await api.entries.delete(editEntry.id);
    setEntries(prev => prev.filter(e => e.id !== editEntry.id));
    setEditEntry(null);
  }

  async function archiveHabit() {
    if (!id) return;
    await api.habits.archive(id);
    navigate('/', { replace: true });
  }

  async function deleteHabit() {
    if (!id || !habit) return;
    if (!confirm(`¿Eliminar "${habit.name}" y todos sus registros?`)) return;
    await api.habits.delete(id);
    navigate('/', { replace: true });
  }

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(-1)}
          className="font-hand cursor-pointer"
          style={{
            height: 36, padding: '0 14px', borderRadius: 999,
            border: '1.8px solid var(--ink)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 16, background: 'transparent', color: 'var(--ink)',
          }}
        >
          ← Hoy
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/habits/${habit.id}/edit`)}
            className="font-hand cursor-pointer"
            style={{
              height: 36, padding: '0 14px', borderRadius: 999,
              border: '1.8px solid var(--ink)',
              display: 'inline-flex', alignItems: 'center',
              fontSize: 16, background: 'transparent', color: 'var(--ink)',
            }}
          >
            editar
          </button>
          <button
            onClick={() => setMoreOpen(true)}
            className="font-hand cursor-pointer"
            style={{
              height: 36, padding: '0 14px', borderRadius: 999,
              border: '1.8px solid var(--ink)',
              display: 'inline-flex', alignItems: 'center',
              fontSize: 16, background: 'transparent', color: 'var(--ink)',
            }}
          >
            ···
          </button>
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: '6px 18px 18px' }}>
        {/* Habit name + icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, maxWidth: '100%' }}>
          <IconTile kind={habit.icon} size={44} />
          <div
            className="font-display overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 34, lineHeight: 1, minWidth: 0 }}
          >
            {habit.name}
          </div>
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 14, marginTop: 6, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' }}>
          {typeLabel(habit.type)} · meta {habit.goal}{habit.type === 'time' ? ' min' : ''} / día
        </div>

        {/* Big ring */}
        <div
          onClick={() => void doLog(1)}
          style={{ margin: '22px auto 0', position: 'relative', cursor: 'pointer', width: 230, height: 230 }}
        >
          <Ring
            size={230}
            stroke={14}
            value={ringValue}
            color={done ? 'var(--ink)' : 'var(--coral)'}
            label={ringLabel}
            labelSize={60}
            sublabel={ringSubLabel}
          />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px dashed var(--ink-soft)', opacity: 0.18,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Last entry info */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {lastEntry ? (
            <span className="font-hand" style={{ fontSize: 17 }}>
              última vez · <b>{relTime(lastEntry.logged_at)}</b>
            </span>
          ) : (
            <span className="font-hand text-ink-soft" style={{ fontSize: 17 }}>aún no hay registros</span>
          )}
          <span className="font-hand text-ink-soft" style={{ fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {habit.type === 'time' ? `+${habit.points} pts / minuto` : `+${habit.points} pts / registro`}
          </span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => void doLog(1)}
            className="font-hand cursor-pointer flex items-center gap-[8px]"
            style={{
              padding: '14px 36px', fontSize: 20, borderRadius: 999,
              border: '1.8px solid var(--coral)', background: 'var(--coral)',
              color: 'var(--paper)',
            }}
          >
            <HandIcon kind="plus" size={20} color="var(--paper)" />
            {habit.type === 'yn'
              ? (done ? 'Ya marcado' : 'Marcar como hecho')
              : habit.type === 'time'
              ? 'Registrar +1 min'
              : 'Registrar uno'}
          </button>
          {habit.type !== 'yn' && (
            <button
              onClick={() => setLogOpen(true)}
              className="font-hand bg-transparent border-none cursor-pointer text-ink-soft"
              style={{ fontSize: 15, borderBottom: '1px dashed var(--ink-soft)' }}
            >
              registrar otra cantidad
            </button>
          )}
        </div>

        {/* Today's log */}
        <div style={{ marginTop: 24 }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, margin: '0 0 4px', letterSpacing: 0.5 }}>HOY</div>
          {entries.length === 0 ? (
            <div className="font-hand text-ink-soft" style={{ fontSize: 14, padding: '6px 0' }}>· sin registros aún</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...entries].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
                .slice(0, 5).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setEditEntry(e)}
                    className="cursor-pointer flex justify-between font-hand"
                    style={{
                      fontSize: 15, padding: '6px 0',
                      borderBottom: '1px dashed var(--ink-soft)',
                      whiteSpace: 'nowrap', gap: 8,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      · {shortTime(e.logged_at)} —{' '}
                      {habit.type === 'time' ? `${e.value} min` : habit.type === 'yn' ? 'marcado' : `+${e.value}`}
                    </span>
                    <span className="text-ink-soft" style={{ flex: '0 0 auto' }}>+{e.points} pts</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* More options sheet */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <div className="font-display" style={{ fontSize: 24, marginBottom: 4 }}>{habit.name}</div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 8 }}>opciones del hábito</div>
        <ActionMenuRow icon="clock" label="Ver historial completo" onTap={() => { setMoreOpen(false); navigate(`/history`); }} />
        <ActionMenuRow icon="leaf" label="Archivar hábito" onTap={() => { setMoreOpen(false); void archiveHabit(); }} />
        <ActionMenuRow icon="plus" label="Eliminar permanente" onTap={() => { setMoreOpen(false); void deleteHabit(); }} danger />
      </BottomSheet>

      {/* Quick log with custom amount */}
      <BottomSheet open={logOpen} onClose={() => setLogOpen(false)}>
        <QuickLogBody
          habit={habit}
          todaySum={todaySum}
          onLog={doLog}
          onClose={() => setLogOpen(false)}
        />
      </BottomSheet>

      {/* Edit entry sheet */}
      <BottomSheet open={!!editEntry} onClose={() => setEditEntry(null)}>
        {editEntry && (
          <EditEntrySheet
            habit={habit}
            entry={editEntry}
            amount={editAmount}
            onAmountChange={setEditAmount}
            onSave={saveEntryEdit}
            onDelete={deleteEntryEdit}
            onClose={() => setEditEntry(null)}
          />
        )}
      </BottomSheet>

      {toast && <UndoToast key={toast.id} text={toast.text} onUndo={handleUndo} onDismiss={dismiss} />}
    </div>
  );
}
