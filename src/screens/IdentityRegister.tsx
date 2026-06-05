import { useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, SmileyIcon, SmileyMehIcon, SmileySadIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { api, type Entry, type Habit } from '../api/client';
import { HABITS_KEY, useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useAuthContext } from '../context/AuthContext';
import { useNavDirection } from '../context/NavContext';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { dayEvidenceFor, type DayEvidence, type Energy } from '../lib/evidence';
import { SketchBox } from '../components/ui/SketchBox';
import { Btn } from '../components/ui/Btn';
import { Ring } from '../components/ui/Ring';
import { DayEnergyPicker } from '../components/identity/DayEnergyPicker';
import { EvidenceList } from '../components/identity/EvidenceList';

type Alignment = 'yes' | 'maybe' | 'no';

const ALIGNMENTS: { key: Alignment; label: string; Icon: typeof SmileyIcon; selBg: string; selBorder: string }[] = [
  { key: 'yes', label: 'Sí', Icon: SmileyIcon, selBg: '#e7f1df', selBorder: '#6f9e5e' },
  { key: 'maybe', label: 'Más o menos', Icon: SmileyMehIcon, selBg: 'var(--paper-2)', selBorder: 'var(--ink)' },
  { key: 'no', label: 'No todavía', Icon: SmileySadIcon, selBg: 'var(--coral-soft)', selBorder: 'var(--coral)' },
];

const NOTE_STYLE: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.8px solid var(--ink)', borderRadius: 12,
  background: 'transparent', padding: '12px 14px',
  fontSize: 16, outline: 'none', resize: 'none',
};

function Stepper({ value, onChange, max }: { value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: 44, height: 44, borderRadius: 999, border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)',
        }}
      ><Minus size={20} /></button>
      <span className="font-display text-center" style={{ fontSize: 38, minWidth: 60, lineHeight: 1 }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: 44, height: 44, borderRadius: 999, border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)',
        }}
      ><Plus size={20} /></button>
    </div>
  );
}

export function IdentityRegister() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const { timezone } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();

  const habit = habits.find((h) => h.id === habitId);
  const { from, to } = localDayUtcRange(todayLocalDate(timezone), timezone);
  const { entries, loading: loadingEntries } = useEntries({ habitId, from, to });

  function back() {
    setDirection('left');
    navigate(-1);
  }

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={back} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /></Btn>
        <span className="font-display" style={{ fontSize: 22 }}>{habit?.name ?? 'Registro'}</span>
        <div style={{ width: 52 }} />
      </div>

      {loadingHabits || loadingEntries ? (
        <div className="screen-scroll flex items-center justify-center font-hand text-ink-soft" style={{ fontSize: 15 }}>Cargando…</div>
      ) : !habit ? (
        <div className="screen-scroll flex items-center justify-center font-hand text-ink-soft" style={{ fontSize: 15 }}>Hábito no encontrado</div>
      ) : (
        <RegisterForm habit={habit} existing={entries[0] ?? null} />
      )}
    </div>
  );
}

function RegisterForm({ habit, existing }: { habit: Habit; existing: Entry | null }) {
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const { timezone } = useAuthContext();
  const queryClient = useQueryClient();

  const isTime = habit.type === 'time';
  const isYn = habit.type === 'yn';
  const maxValue = isTime ? 240 : 50;

  const [value, setValue] = useState<number>(existing?.value ?? 0);
  const [alignment, setAlignment] = useState<Alignment | null>(existing?.alignment ?? null);
  const [energy, setEnergy] = useState<Energy | null>(existing?.day_energy ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<DayEvidence | null>(null);

  const chips = isTime ? [5, 10, 15, 20, 30] : [1, 2, 3, 5, 8];
  const ringValue = isYn ? (value >= 1 ? 1 : 0) : Math.min(1, value / habit.goal);
  const done = isYn ? value >= 1 : value >= habit.goal;
  const ringLabel = isTime ? `${value}′` : isYn ? (value >= 1 ? '✓' : '·') : `${value}`;
  const ringSub = isYn
    ? (done ? 'hecho' : 'sin marcar')
    : `de ${habit.goal}${isTime ? ' min' : ''}`;

  async function save() {
    setSaving(true);
    try {
      // Edit = replace: remove today's prior entry, then re-create (unless value is 0 = no pude).
      if (existing) await api.entries.delete(existing.id);
      if (value > 0) {
        await api.entries.create({
          habit_id: habit.id,
          value,
          note: note.trim() || undefined,
          alignment: alignment ?? undefined,
          day_energy: energy ?? undefined,
        });
      }
      await queryClient.invalidateQueries({ queryKey: HABITS_KEY });

      // Build today's evidence from a short window (needs prior days for "volviste tras fallar").
      const today = todayLocalDate(timezone);
      const window = await api.entries.list({
        habit_id: habit.id,
        from: localDayUtcRange(addDays(today, -14), timezone).from,
        to: localDayUtcRange(today, timezone).to,
      });
      setSaved(dayEvidenceFor(window, habit, timezone, today));
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="screen-scroll flex flex-col gap-[16px]" style={{ padding: '8px 14px 24px' }}>
        <div className="flex flex-col items-center text-center" style={{ marginTop: 12, gap: 10 }}>
          <CheckCircleIcon size={64} weight="fill" color="var(--coral)" />
          <div className="font-display" style={{ fontSize: 28, lineHeight: 1.05 }}>¡Gracias por no abandonar!</div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 15 }}>Esto también es parte de tu identidad.</div>
        </div>

        <SketchBox padding={16} radius={16}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 10 }}>Evidencia generada</div>
          <EvidenceList statements={saved.statements} />
        </SketchBox>

        <Btn
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => { setDirection('right'); navigate(`/identity/${habit.id}/evidencia/hoy`); }}
        >
          Ver mi identidad
        </Btn>
        <Btn variant="outline" size="md" fullWidth onClick={() => { setDirection('left'); navigate('/identity'); }}>
          Volver
        </Btn>
      </div>
    );
  }

  return (
    <div className="screen-scroll flex flex-col gap-[14px]" style={{ padding: '8px 14px 24px' }}>
      <div className="font-display" style={{ fontSize: 26, lineHeight: 1 }}>
        Registro de hoy
        {existing && <span className="font-hand text-ink-soft" style={{ fontSize: 13, marginLeft: 8 }}>· editando</span>}
      </div>

      {/* Compact QuickAction — ring + stepper/chips */}
      <SketchBox padding={16} radius={16}>
        <div onClick={isYn ? () => setValue(value >= 1 ? 0 : 1) : undefined}
          style={{ margin: '4px auto 0', width: 150, height: 150, cursor: isYn ? 'pointer' : 'default' }}>
          <Ring
            size={150}
            stroke={11}
            value={ringValue}
            color={done ? 'var(--ink)' : 'var(--coral)'}
            label={ringLabel}
            labelSize={44}
            sublabel={ringSub}
          />
        </div>

        {!isYn && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <Stepper value={value} onChange={setValue} max={maxValue} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {chips.map((v) => (
                <Btn key={v} variant="chip" size="sm" active={v === value} onClick={() => setValue(v)}>
                  {v}{isTime ? '′' : ''}
                </Btn>
              ))}
              <Btn variant="chip" size="sm" active={value === 0} onClick={() => setValue(0)}>No pude</Btn>
            </div>
          </>
        )}

        <div className="font-hand text-ink-soft text-center" style={{ fontSize: 13, marginTop: 12 }}>
          {value > 0
            ? <>Vas a sumar <b style={{ color: 'var(--coral)' }}>+{habit.points * value} pts</b></>
            : 'Hoy no hice nada'}
        </div>
      </SketchBox>

      {/* Alignment */}
      <SketchBox padding={14} radius={16}>
        <div className="font-hand" style={{ fontSize: 16, lineHeight: 1.2 }}>
          ¿Esto se sintió como la persona que quieres ser?
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {ALIGNMENTS.map((a) => {
            const sel = alignment === a.key;
            const Icon = a.Icon;
            return (
              <button
                key={a.key}
                onClick={() => setAlignment(sel ? null : a.key)}
                className="flex flex-col items-center gap-[6px] cursor-pointer"
                style={{
                  flex: 1, padding: '12px 4px', borderRadius: 12,
                  border: `1.8px solid ${sel ? a.selBorder : 'var(--ink-soft)'}`,
                  background: sel ? a.selBg : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={28} color="var(--ink)" />
                <span className="font-hand" style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.1 }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </SketchBox>

      {/* Day energy */}
      <SketchBox padding={14} radius={16}>
        <div className="font-hand" style={{ fontSize: 16, lineHeight: 1.2 }}>
          ¿Cómo estuvo tu día?
        </div>
        <div style={{ marginTop: 12 }}>
          <DayEnergyPicker value={energy} onChange={setEnergy} />
        </div>
      </SketchBox>

      {/* Notes */}
      <div className="font-hand text-ink-soft" style={{ fontSize: 13, padding: '0 4px' }}>Notas rápidas (opcional)</div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="¿Qué aprendiste hoy?"
        className="font-hand text-ink"
        style={NOTE_STYLE}
      />

      <Btn
        variant="primary"
        size="lg"
        fullWidth
        loading={saving}
        onClick={() => void save()}
        style={{ marginTop: 4 }}
      >
        Guardar registro
      </Btn>
    </div>
  );
}
