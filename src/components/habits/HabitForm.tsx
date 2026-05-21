import { useState, useEffect, type ReactNode } from 'react';
import { ArrowLeft, Plus, Minus, X, Bell } from '@phosphor-icons/react';
import { HandIcon } from '../ui/HandIcon';
import { Btn } from '../ui/Btn';
import { DatePicker } from '../ui/DatePicker';
import { todayLocalDate } from '../../lib/dateUtils';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'interval';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const FREQ_TYPES: { id: FrequencyType; label: string }[] = [
  { id: 'daily',    label: 'Diario' },
  { id: 'weekly',   label: 'Semanal' },
  { id: 'monthly',  label: 'Mensual' },
  { id: 'interval', label: 'Intervalo' },
];

export const ICONS = [
  'dish','water','run','pill','book','mug','sun','moon','fire','star',
  'leaf','bolt','clock','target','dumb','bell','heart','music','phone','plus',
  'walk','wash','shower',
  'avocado','cow','strategy',
];

export const TYPES = [
  { id: 'count', label: 'Contar',  hint: 'Cuenta cuántas veces lo haces (vasos, repeticiones…)' },
  { id: 'time',  label: 'Tiempo',  hint: 'Cronometra minutos (meditar, leer…)' },
  { id: 'yn',    label: 'Marcar',  hint: 'Sí/No · una vez al día' },
] as const;

export type HabitType = typeof TYPES[number]['id'];

export interface ReminderDraft {
  time: string;
  days: string[];
  enabled: boolean;
}

export interface HabitFormValues {
  name: string;
  icon: string;
  type: HabitType;
  goal: number;
  pts: number;
  frequency_type: FrequencyType;
  frequency_config: string;
  start_date: string | null;
  end_date: string | null;
  reminders?: ReminderDraft[];
}

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function Stepper({ value, onChange, min = 0, max = 999, step = 1 }: StepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: 48, height: 48, borderRadius: 999,
          border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)',
        }}
      ><Minus size={20} /></button>
      <span className="font-display text-center" style={{ fontSize: 42, minWidth: 64, lineHeight: 1 }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: 48, height: 48, borderRadius: 999,
          border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)',
        }}
      ><Plus size={20} /></button>
    </div>
  );
}

interface HabitFormProps {
  navTitle: string;
  saveLabel: ReactNode;
  defaultValues?: HabitFormValues;
  defaultReminders?: ReminderDraft[];
  onSubmit: (values: HabitFormValues) => Promise<void>;
  onCancel: () => void;
  bottomSlot?: React.ReactNode;
  autoFocusName?: boolean;
}

export function HabitForm({
  navTitle, saveLabel, defaultValues, defaultReminders,
  onSubmit, onCancel, bottomSlot, autoFocusName,
}: HabitFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [icon, setIcon] = useState(defaultValues?.icon ?? 'star');
  const [type, setType] = useState<HabitType>(defaultValues?.type ?? 'count');
  const [goal, setGoal] = useState(defaultValues?.goal ?? 3);
  const [pts, setPts] = useState(defaultValues?.pts ?? 5);
  const [freqType, setFreqTypeRaw] = useState<FrequencyType>(defaultValues?.frequency_type ?? 'daily');
  const [freqConfig, setFreqConfig] = useState(defaultValues?.frequency_config ?? '{}');
  const [startDate, setStartDate] = useState<string | null>(defaultValues?.start_date ?? null);
  const [endDate, setEndDate] = useState<string | null>(defaultValues?.end_date ?? null);
  const [reminders, setReminders] = useState<ReminderDraft[]>(defaultReminders ?? []);
  const [saving, setSaving] = useState(false);

  function setFreqType(ft: FrequencyType) {
    setFreqTypeRaw(ft);
    if (ft === 'weekly') setFreqConfig(JSON.stringify({ days: ['L', 'M', 'X', 'J', 'V'] }));
    else if (ft === 'monthly') setFreqConfig(JSON.stringify({ days: [1] }));
    else if (ft === 'interval') setFreqConfig(JSON.stringify({ every: 2 }));
    else setFreqConfig('{}');
  }

  // Auto-adjust goal defaults on type change — only for new habits
  useEffect(() => {
    if (defaultValues) return;
    if (type === 'yn') setGoal(1);
    else if (type === 'time' && goal < 5) setGoal(15);
    else if (type === 'count' && goal > 12) setGoal(3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function addReminder() {
    setReminders(prev => [...prev, { time: '08:00', days: ['L','M','X','J','V','S','D'], enabled: true }]);
  }

  function removeReminder(i: number) {
    setReminders(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateReminderTime(i: number, time: string) {
    setReminders(prev => prev.map((r, idx) => idx === i ? { ...r, time } : r));
  }

  function toggleReminderDay(i: number, day: string) {
    setReminders(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      const days = r.days.includes(day) ? r.days.filter(d => d !== day) : [...r.days, day];
      return days.length > 0 ? { ...r, days } : r;
    }));
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), icon, type, goal, pts, frequency_type: freqType, frequency_config: freqConfig, start_date: startDate, end_date: endDate, reminders });
    } finally {
      setSaving(false);
    }
  }

  const isValid = name.trim().length > 0;
  const goalChips = type === 'time' ? [5, 10, 20, 30] : [1, 3, 5, 8];
  const ptsChips = [1, 2, 5, 10];

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={onCancel} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /> cancelar</Btn>
        <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>{navTitle}</span>
        <Btn
          variant="danger"
          disabled={!isValid}
          onClick={isValid ? () => void handleSubmit() : undefined}
          style={{ height: 36, padding: '0 14px', fontSize: 16 }}
        >{saveLabel}</Btn>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 18px 24px' }}>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nombre</div>
          <input
            autoFocus={autoFocusName}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Beber agua"
            className="font-hand text-ink"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1.8px solid var(--ink)', borderRadius: 12,
              background: 'transparent', padding: '12px 14px',
              fontSize: 19, outline: 'none',
            }}
          />
        </div>

        {/* Type segmented */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tipo</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map((t) => (
              <Btn
                key={t.id}
                variant="segment"
                active={t.id === type}
                onClick={() => setType(t.id)}
                className="flex-1"
                style={{ padding: '10px 0', fontSize: 16 }}
              >{t.label}</Btn>
            ))}
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>
            {TYPES.find(t => t.id === type)?.hint}
          </div>
        </div>

        {/* Frequency */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Frecuencia</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {FREQ_TYPES.map((f) => (
              <Btn
                key={f.id}
                variant="segment"
                active={f.id === freqType}
                onClick={() => setFreqType(f.id)}
                className="flex-1"
                style={{ padding: '10px 0', fontSize: 14 }}
              >{f.label}</Btn>
            ))}
          </div>

          {freqType === 'weekly' && (() => {
            const cfg = JSON.parse(freqConfig) as { days?: string[] };
            const sel = cfg.days ?? ['L', 'M', 'X', 'J', 'V'];
            return (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {WEEK_DAYS.map((d) => (
                  <Btn
                    key={d}
                    variant="chip"
                    size="xs"
                    active={sel.includes(d)}
                    className="flex-1"
                    style={{ padding: '8px 0', fontSize: 15, fontWeight: 600 }}
                    onClick={() => {
                      const next = sel.includes(d) ? sel.filter(x => x !== d) : [...sel, d];
                      if (next.length > 0) setFreqConfig(JSON.stringify({ days: next }));
                    }}
                  >{d}</Btn>
                ))}
              </div>
            );
          })()}

          {freqType === 'monthly' && (() => {
            const cfg = JSON.parse(freqConfig) as { days?: number[] };
            const sel = cfg.days ?? [1];
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <Btn
                    key={d}
                    variant="chip"
                    size="xs"
                    active={sel.includes(d)}
                    style={{ width: 36, padding: '6px 0', fontSize: 13 }}
                    onClick={() => {
                      const next = sel.includes(d) ? sel.filter(x => x !== d) : [...sel, d].sort((a, b) => a - b);
                      if (next.length > 0) setFreqConfig(JSON.stringify({ days: next }));
                    }}
                  >{d}</Btn>
                ))}
              </div>
            );
          })()}

          {freqType === 'interval' && (() => {
            const cfg = JSON.parse(freqConfig) as { every?: number };
            const every = cfg.every ?? 2;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <span className="font-hand text-ink-soft" style={{ fontSize: 15 }}>Cada</span>
                <Stepper
                  value={every}
                  onChange={(v) => setFreqConfig(JSON.stringify({ every: v }))}
                  min={2}
                  max={90}
                />
                <span className="font-hand text-ink-soft" style={{ fontSize: 15 }}>días</span>
              </div>
            );
          })()}
        </div>

        {/* Goal */}
        {type !== 'yn' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {type === 'time' ? 'Meta · minutos / día' : 'Meta · veces / día'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <Stepper value={goal} onChange={setGoal} min={1} max={type === 'time' ? 240 : 50} step={type === 'time' ? 5 : 1} />
              <div style={{ display: 'flex', gap: 6 }}>
                {goalChips.map((v) => (
                  <Btn key={v} variant="chip" size="xs" active={v === goal} onClick={() => setGoal(v)}>{v}</Btn>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {type === 'time' ? 'Puntos · por minuto' : type === 'yn' ? 'Puntos · al completar' : 'Puntos · por cada uno'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setPts(Math.max(1, pts - 1))}
                className="font-display bg-transparent cursor-pointer"
                style={{
                  width: 38, height: 38, borderRadius: 999,
                  border: '1.8px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)',
                }}
              ><Minus size={18} /></button>
              <span className="font-display text-center" style={{ fontSize: 30, minWidth: 44, lineHeight: 1 }}>{pts}</span>
              <button
                onClick={() => setPts(Math.min(50, pts + 1))}
                className="font-display bg-transparent cursor-pointer"
                style={{
                  width: 38, height: 38, borderRadius: 999,
                  border: '1.8px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)',
                }}
              ><Plus size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ptsChips.map((v) => (
                <Btn key={v} variant="chip" size="xs" active={v === pts} onClick={() => setPts(v)}>{v}</Btn>
              ))}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Fechas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DatePicker
              label="Inicio"
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                if (endDate && v && endDate < v) setEndDate(null);
              }}
              placeholder="Desde siempre"
              minDate={todayLocalDate()}
            />
            <DatePicker
              label="Fin"
              value={endDate}
              onChange={setEndDate}
              placeholder="Sin fecha de fin"
              minDate={startDate || todayLocalDate()}
            />
          </div>
        </div>

        {/* Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Recordatorios</div>

          {reminders.map((r, i) => (
            <div key={i} style={{ border: '1.8px solid var(--ink)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
                <input
                  type="time"
                  value={r.time}
                  onChange={(e) => updateReminderTime(i, e.target.value)}
                  className="font-display text-ink"
                  style={{ fontSize: 22, border: 'none', background: 'transparent', outline: 'none', flex: 1 }}
                />
                <button
                  onClick={() => removeReminder(i)}
                  className="bg-transparent cursor-pointer"
                  style={{ border: 'none', padding: 4, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}
                ><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {WEEK_DAYS.map((d) => (
                  <Btn
                    key={d}
                    variant="chip"
                    size="xs"
                    active={r.days.includes(d)}
                    className="flex-1"
                    style={{ padding: '5px 0', fontSize: 13 }}
                    onClick={() => toggleReminderDay(i, d)}
                  >{d}</Btn>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={addReminder}
            className="font-hand text-ink-soft cursor-pointer bg-transparent"
            style={{
              border: '1.8px dashed var(--ink-soft)', borderRadius: 12,
              padding: '10px 0', fontSize: 15, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          ><Plus size={14} /> Añadir recordatorio</button>
        </div>

        {/* Icon picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Ícono</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, padding: '4px 0' }}>
            {ICONS.map((k) => {
              const on = k === icon;
              return (
                <button
                  key={k}
                  onClick={() => setIcon(k)}
                  style={{
                    aspectRatio: '1 / 1', width: '100%', borderRadius: 12,
                    border: `1.8px solid ${on ? 'var(--coral)' : 'var(--ink)'}`,
                    background: on ? 'var(--coral-soft)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 160ms',
                  }}
                >
                  <HandIcon kind={k} size={22} />
                </button>
              );
            })}
          </div>
        </div>

        {bottomSlot}

        <Btn
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isValid}
          loading={saving}
          onClick={isValid ? () => void handleSubmit() : undefined}
          style={{ marginTop: 4 }}
        >{saveLabel}</Btn>

      </div>
    </div>
  );
}
