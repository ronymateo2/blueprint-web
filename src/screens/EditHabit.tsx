import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Habit, type Reminder } from '../api/client';
import { IconTile } from '../components/IconTile';
import { SketchBox } from '../components/SketchBox';
import { SketchButton } from '../components/SketchButton';
import { HandIcon } from '../components/HandIcon';
import { BarChart } from '../components/BarChart';
import { useEntries } from '../hooks/useEntries';

const ICONS = ['dish','water','mug','pill','book','run','dumb','sun','moon','fire','star','leaf','bolt','clock','target','bell','heart','music','phone','plus'];
const TYPES = [
  { id: 'count', label: 'Contar veces' },
  { id: 'time',  label: 'Duración (min)' },
  { id: 'yn',    label: 'Sí / No' },
  { id: 'qty',   label: 'Cantidad' },
  { id: 'at',    label: 'A hora' },
] as const;
const POINTS_OPTIONS = [1, 5, 10, 20];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function EditHabit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('star');
  const [type, setType] = useState<Habit['type']>('count');
  const [goal, setGoal] = useState(1);
  const [unit, setUnit] = useState('');
  const [points, setPoints] = useState(5);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const { entries } = useEntries({ habitId: id, from: daysAgo(6) });

  // Weekly bar chart data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    return entries.filter((e) => e.logged_at.slice(0, 10) === d).reduce((s, e) => s + e.value, 0);
  });

  useEffect(() => {
    if (!id) return;
    void api.habits.get(id).then((h) => {
      setHabit(h);
      setName(h.name);
      setIcon(h.icon);
      setType(h.type);
      setGoal(h.goal);
      setUnit(h.unit ?? '');
      setPoints(h.points);
      setReminders(h.reminders);
    });
  }, [id]);

  async function save() {
    if (!id || !name.trim()) return;
    setSaving(true);
    try {
      await api.habits.update(id, { name: name.trim(), icon, type, goal, unit: unit || null, points });
      navigate(-1);
    } finally {
      setSaving(false);
    }
  }

  async function addReminder() {
    if (!id || !newReminderTime) return;
    const r = await api.reminders.create(id, { time: newReminderTime, days: 'LMXJVSD', enabled: 1 });
    setReminders((prev) => [...prev, r]);
    setNewReminderTime('');
  }

  async function toggleReminder(r: Reminder) {
    const updated = await api.reminders.update(r.id, { enabled: r.enabled ? 0 : 1 });
    setReminders((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
  }

  async function deleteReminder(reminderId: string) {
    await api.reminders.delete(reminderId);
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  }

  if (!habit) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Nav */}
      <div className="flex items-center justify-between" style={{ padding: '14px 18px 8px' }}>
        <SketchButton small onClick={() => navigate(-1)}>← Listo</SketchButton>
        <SketchButton small accent filled onClick={() => void save()} disabled={saving}>{saving ? '…' : 'Guardar'}</SketchButton>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '0 14px' }}>

        {/* Header card */}
        <SketchBox padding={10} className="flex items-center gap-[10px]">
          <div className="relative">
            <IconTile kind={icon} size={56} onClick={() => setShowIconPicker((s) => !s)} />
            <div
              className="absolute flex items-center justify-center bg-coral"
              style={{
                right: -4, bottom: -4,
                width: 22, height: 22, borderRadius: 11,
                border: '1.6px solid var(--ink)',
              }}
            >
              <HandIcon kind="plus" size={12} color="var(--paper)" />
            </div>
          </div>
          <div className="flex-1">
            <div className="font-hand text-ink-soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>nombre</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-display leading-none bg-transparent w-full outline-none text-ink border-none"
              style={{ fontSize: 24, borderBottom: '1.5px dashed var(--ink)', paddingBottom: 2 }}
            />
          </div>
        </SketchBox>

        {/* Icon picker */}
        {showIconPicker && (
          <SketchBox padding={8}>
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {ICONS.map((k) => (
                <IconTile key={k} kind={k} size={40} selected={icon === k} onClick={() => { setIcon(k); setShowIconPicker(false); }} />
              ))}
            </div>
          </SketchBox>
        )}

        {/* Mini bar chart */}
        <SketchBox padding={10}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 11, marginBottom: 6 }}>Esta semana</div>
          <BarChart values={weeklyData} activeIndex={(new Date().getDay() + 6) % 7} height={48} />
        </SketchBox>

        {/* Tipo & Meta */}
        <SectionLabel>TIPO Y META</SectionLabel>
        <SketchBox padding={0} className="overflow-hidden">
          {/* Type */}
          <div className="flex flex-col gap-[6px] flex-wrap" style={{ padding: '10px 12px', borderBottom: '1px dashed var(--ink-soft)' }}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginBottom: 6 }}>Tipo</div>
            <div className="flex gap-[6px] flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="font-hand cursor-pointer"
                  style={{
                    fontSize: 12,
                    padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                    border: '1.4px solid var(--ink)',
                    background: type === t.id ? 'var(--ink)' : 'transparent',
                    color: type === t.id ? 'var(--paper)' : 'var(--ink)',
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>
          {/* Goal */}
          <div className="flex items-center justify-between" style={{ padding: '10px 12px', borderBottom: '1px dashed var(--ink-soft)' }}>
            <span className="font-hand" style={{ fontSize: 14 }}>Meta diaria</span>
            <div className="flex items-center gap-[8px]">
              <button onClick={() => setGoal((g) => Math.max(1, g - 1))} className="flex items-center justify-center font-hand bg-transparent cursor-pointer" style={{ width: 26, height: 26, borderRadius: 13, border: '1.4px solid var(--ink)', fontSize: 16 }}>−</button>
              <span className="font-display text-center" style={{ fontSize: 20, minWidth: 24 }}>{goal}</span>
              <button onClick={() => setGoal((g) => g + 1)} className="flex items-center justify-center font-hand bg-transparent cursor-pointer" style={{ width: 26, height: 26, borderRadius: 13, border: '1.4px solid var(--ink)', fontSize: 16 }}>+</button>
            </div>
          </div>
          {/* Points */}
          <div className="flex items-center justify-between" style={{ padding: '10px 12px' }}>
            <span className="font-hand" style={{ fontSize: 14 }}>Puntos por registro</span>
            <div className="flex gap-[4px]">
              {POINTS_OPTIONS.map((n) => (
                <button key={n} onClick={() => setPoints(n)} className="font-hand cursor-pointer" style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                  border: '1.4px solid var(--ink)', fontSize: 12,
                  background: points === n ? 'var(--ink)' : 'transparent',
                  color: points === n ? 'var(--paper)' : 'var(--ink)',
                }}>{n}</button>
              ))}
            </div>
          </div>
        </SketchBox>

        {/* Recordatorios */}
        <SectionLabel>RECORDATORIOS</SectionLabel>
        <SketchBox padding={0} className="overflow-hidden">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between" style={{ padding: '10px 12px', borderBottom: '1px dashed var(--ink-soft)' }}>
              <span className="font-hand" style={{ fontSize: 14 }}>{r.time}</span>
              <div className="flex items-center gap-[10px]">
                {/* Toggle */}
                <div
                  onClick={() => void toggleReminder(r)}
                  className="flex items-center cursor-pointer"
                  style={{ width: 40, height: 22, borderRadius: 11, border: '1.4px solid var(--ink)', background: r.enabled ? 'var(--coral)' : 'transparent', padding: 2, justifyContent: r.enabled ? 'flex-end' : 'flex-start' }}
                >
                  <div className="bg-paper" style={{ width: 14, height: 14, borderRadius: 7, border: '1px solid var(--ink)' }} />
                </div>
                <button onClick={() => void deleteReminder(r.id)} className="bg-transparent border-none cursor-pointer font-hand" style={{ color: '#a03a2a', fontSize: 18 }}>×</button>
              </div>
            </div>
          ))}
          {/* Add new */}
          <div className="flex items-center gap-[10px]" style={{ padding: '10px 12px' }}>
            <input
              type="time"
              value={newReminderTime}
              onChange={(e) => setNewReminderTime(e.target.value)}
              className="font-hand bg-transparent outline-none text-ink flex-1 border-none"
              style={{ fontSize: 14, borderBottom: '1px dashed var(--ink-soft)' }}
            />
            <SketchButton small onClick={() => void addReminder()} disabled={!newReminderTime}>+ Añadir</SketchButton>
          </div>
        </SketchBox>

        {/* Danger zone */}
        <SectionLabel> </SectionLabel>
        <SketchBox padding={0} className="overflow-hidden" style={{ borderColor: '#a03a2a' }}>
          <button
            onClick={async () => { if (!id) return; await api.habits.archive(id); navigate('/', { replace: true }); }}
            className="block w-full font-hand bg-transparent border-none cursor-pointer text-left"
            style={{ padding: '12px 14px', borderBottom: '1px dashed rgba(160,58,42,0.3)', fontSize: 14, color: '#a03a2a' }}
          >Archivar hábito</button>
          <button
            onClick={async () => {
              if (!id || !confirm('¿Eliminar este hábito y todo su historial?')) return;
              await api.habits.delete(id);
              navigate('/', { replace: true });
            }}
            className="block w-full font-hand bg-transparent border-none cursor-pointer text-left"
            style={{ padding: '12px 14px', fontSize: 14, color: '#a03a2a' }}
          >Eliminar hábito</button>
        </SketchBox>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-hand text-ink-soft" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px 0' }}>
      {children}
    </div>
  );
}

