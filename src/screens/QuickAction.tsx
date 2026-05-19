import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from '@phosphor-icons/react';
import { useEntries } from '../hooks/useEntries';
import { useUndo } from '../hooks/useUndo';
import { api, type Entry } from '../api/client';
import { Ring } from '../components/Ring';
import { HandIcon } from '../components/HandIcon';
import { IconTile } from '../components/IconTile';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { Btn } from '../components/Btn';
import { useHabits } from '../hooks/useHabits';
import { todayLocalDate, localDayUtcRange, formatTime } from '../lib/dateUtils';
import { useAuthContext } from '../context/AuthContext';

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'ahora';
  if (diff < 60) return `hace ${Math.round(diff)}m`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
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
          color: 'var(--ink)',
        }}
      ><Minus size={big ? 20 : 18} /></button>
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
          color: 'var(--ink)',
        }}
      ><Plus size={big ? 20 : 18} /></button>
    </div>
  );
}

interface EditEntrySheetProps {
  habit: ReturnType<typeof useHabits>['habits'][number];
  entry: Entry;
  amount: number;
  timezone: string;
  onAmountChange: (v: number) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function EditEntrySheet({ habit, entry, amount, timezone, onAmountChange, onSave, onDelete, onClose }: EditEntrySheetProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="font-display" style={{ fontSize: 28 }}>Editar registro</div>
      <div className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
        {habit.name} · {formatTime(entry.logged_at, timezone)}
      </div>
      {habit.type !== 'yn' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
          <span className="font-hand" style={{ fontSize: 16 }}>cantidad{habit.type === 'time' ? ' (min)' : ''}</span>
          <Stepper value={amount} onChange={onAmountChange} min={1} max={habit.type === 'time' ? 240 : 50} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Btn variant="danger" className="flex-1" style={{ padding: '14px 0' }} onClick={() => void onDelete()}>Borrar</Btn>
        {habit.type !== 'yn' ? (
          <Btn variant="ink" style={{ flex: 1.5, padding: '14px 0' }} onClick={() => void onSave()}>Guardar</Btn>
        ) : (
          <Btn style={{ flex: 1.5, padding: '14px 0' }} onClick={onClose}>Cerrar</Btn>
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
          <Btn key={v} variant="chip" size="sm" active={v === amount} onClick={() => setAmount(v)}>
            {v}{habit.type === 'time' ? '′' : ''}
          </Btn>
        ))}
      </div>

      <div className="font-hand text-ink-soft text-center" style={{ fontSize: 13, marginTop: 4 }}>
        Vas a sumar <b style={{ color: 'var(--coral)' }}>+{habit.points * amount} pts</b>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
        <Btn className="flex-1" style={{ padding: 12, fontSize: 16 }} onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" style={{ flex: 1.5, padding: 12, fontSize: 16 }} onClick={() => void onLog(amount)}>
          Registrar +{habit.points * amount} pts
        </Btn>
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
  const { timezone } = useAuthContext();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === id);
  const today = todayLocalDate(timezone);
  const { from, to } = localDayUtcRange(today, timezone);

  const { entries, reload: reloadEntries, setEntries } = useEntries({ habitId: id, from, to });
  const { show: showToast } = useUndo();
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    await api.habits.delete(id);
    navigate('/', { replace: true });
  }

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={() => navigate(-1)} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /> Hoy</Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => navigate(`/habits/${habit.id}/edit`)} style={{ height: 36, padding: '0 14px', fontSize: 16 }}>editar</Btn>
          <Btn onClick={() => setMoreOpen(true)} style={{ height: 36, padding: '0 14px', fontSize: 16 }}>···</Btn>
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
          onClick={() => void doLog(habit.type === 'time' ? habit.goal : 1)}
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
          <Btn
            variant="primary"
            onClick={() => void doLog(habit.type === 'time' ? habit.goal : 1)}
            style={{ padding: '14px 36px', fontSize: 20 }}
          >
            {habit.type !== 'time' && <HandIcon kind="plus" size={20} color="var(--paper)" />}
            {habit.type === 'yn'
              ? (done ? 'Ya marcado' : 'Marcar como hecho')
              : habit.type === 'time'
              ? `Registrar +${habit.goal} min`
              : 'Registrar uno'}
          </Btn>
          {habit.type !== 'yn' && (
            <Btn onClick={() => setLogOpen(true)} style={{ padding: '10px 28px', fontSize: 16 }}>
              registrar otra cantidad
            </Btn>
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
                      fontSize: 17, padding: '6px 0',
                      borderBottom: '1px dashed var(--ink-soft)',
                      whiteSpace: 'nowrap', gap: 4,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      · {formatTime(e.logged_at, timezone)} —{' '}
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
        <ActionMenuRow icon="clock" label="Ver historial completo" onTap={() => { setMoreOpen(false); navigate(`/habits/${habit.id}/history`); }} />
        <ActionMenuRow icon="clock" label="Ver estadísticas" onTap={() => { setMoreOpen(false); navigate(`/habits/${habit.id}/statistics`); }} />
        <ActionMenuRow icon="leaf" label="Archivar hábito" onTap={() => { setMoreOpen(false); void archiveHabit(); }} />
        <ActionMenuRow icon="plus" label="Eliminar permanente" onTap={() => { setMoreOpen(false); setConfirmDelete(true); }} danger />
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
            timezone={timezone}
            onAmountChange={setEditAmount}
            onSave={saveEntryEdit}
            onDelete={deleteEntryEdit}
            onClose={() => setEditEntry(null)}
          />
        )}
      </BottomSheet>

      <ConfirmSheet
        open={confirmDelete}
        title={`¿Eliminar «${habit.name}»?`}
        description="Se borrarán todos sus registros. No se puede deshacer."
        onConfirm={() => { setConfirmDelete(false); void deleteHabit(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
