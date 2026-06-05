import { useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, SmileyIcon, SmileyMehIcon, SmileySadIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Entry, type Habit } from '../api/client';
import { HABITS_KEY, useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useAuthContext } from '../context/AuthContext';
import { useNavDirection } from '../context/NavContext';
import { todayLocalDate, localDayUtcRange } from '../lib/dateUtils';
import { SketchBox } from '../components/ui/SketchBox';
import { Btn } from '../components/ui/Btn';

type Outcome = 'full' | 'min' | 'none';
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

function deriveOutcome(existing: Entry | null, habit: Habit): Outcome | null {
  if (!existing) return null;
  return existing.value >= habit.goal ? 'full' : 'min';
}

function RegisterForm({ habit, existing }: { habit: Habit; existing: Entry | null }) {
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const queryClient = useQueryClient();

  const [outcome, setOutcome] = useState<Outcome | null>(() => deriveOutcome(existing, habit));
  const [alignment, setAlignment] = useState<Alignment | null>(existing?.alignment ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);

  const completoDesc = habit.unit
    ? `Meta: ${habit.goal} ${habit.unit}`
    : habit.goal > 1
      ? `Meta: ${habit.goal}`
      : 'Hice todo mi plan';

  const outcomes: { key: Outcome; label: string; desc: string }[] = [
    { key: 'full', label: 'Completo', desc: completoDesc },
    { key: 'min', label: 'Mínimo', desc: habit.min_action || 'Hice la acción mínima' },
    { key: 'none', label: 'No pude', desc: 'Hoy no hice nada' },
  ];

  async function save() {
    if (!outcome) return;
    setSaving(true);
    try {
      // Edit = replace: remove today's prior entry, then re-create (unless "No pude").
      if (existing) await api.entries.delete(existing.id);
      if (outcome !== 'none') {
        const value = outcome === 'full' ? habit.goal : 1;
        await api.entries.create({
          habit_id: habit.id,
          value,
          note: note.trim() || undefined,
          alignment: alignment ?? undefined,
        });
      }
      await queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      toast(outcome === 'none' ? 'Registro actualizado' : 'Registro guardado');
      setDirection('left');
      navigate('/identity');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen-scroll flex flex-col gap-[14px]" style={{ padding: '8px 14px 24px' }}>
      <div className="font-display" style={{ fontSize: 26, lineHeight: 1 }}>
        Registro de hoy
        {existing && <span className="font-hand text-ink-soft" style={{ fontSize: 13, marginLeft: 8 }}>· editando</span>}
      </div>

      {/* Outcome */}
      <SketchBox padding={4} radius={16}>
        <div className="font-hand text-ink-soft" style={{ fontSize: 13, padding: '8px 12px 4px' }}>¿Cómo te fue?</div>
        {outcomes.map((o, i) => {
          const sel = outcome === o.key;
          return (
            <div
              key={o.key}
              onClick={() => setOutcome(o.key)}
              className="cursor-pointer"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: sel ? 'var(--coral-soft)' : 'transparent',
                borderBottom: i === outcomes.length - 1 ? 'none' : '1.4px dashed var(--ink-soft)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{ fontSize: 20, lineHeight: 1 }}>{o.label}</div>
                <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 2 }}>{o.desc}</div>
              </div>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 24, height: 24, borderRadius: 12,
                  border: `1.8px solid ${sel ? 'var(--coral)' : 'var(--ink-soft)'}`,
                  background: sel ? 'var(--coral)' : 'transparent',
                }}
              >
                {sel && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--paper)' }} />}
              </div>
            </div>
          );
        })}
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
        disabled={!outcome}
        onClick={() => void save()}
        style={{ marginTop: 4 }}
      >
        Guardar registro
      </Btn>
    </div>
  );
}
