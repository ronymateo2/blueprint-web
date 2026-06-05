import type { CSSProperties } from 'react';
import {
  CircleIcon, CheckCircleIcon,
  SmileyMehIcon, BatteryLowIcon, CloudIcon, SmileyXEyesIcon, ListBulletsIcon, CloudRainIcon, PencilSimpleIcon,
  HeartIcon,
} from '@phosphor-icons/react';
import type { FrictionCause } from '../../api/client';

const CAUSES: { key: FrictionCause; label: string; Icon: typeof SmileyMehIcon }[] = [
  { key: 'tired', label: 'Estaba cansado/a', Icon: SmileyMehIcon },
  { key: 'no_energy', label: 'No tuve energía', Icon: BatteryLowIcon },
  { key: 'forgot', label: 'Lo olvidé', Icon: CloudIcon },
  { key: 'resisted', label: 'Me resistí / no tenía ganas', Icon: SmileyXEyesIcon },
  { key: 'not_priority', label: 'No era prioridad hoy', Icon: ListBulletsIcon },
  { key: 'low_mood', label: 'Me sentí mal emocionalmente', Icon: CloudRainIcon },
  { key: 'other', label: 'Otra razón', Icon: PencilSimpleIcon },
];

export const CAUSE_LABELS: Record<FrictionCause, string> = {
  tired: 'Estaba cansado/a',
  no_energy: 'No tuve energía',
  forgot: 'Lo olvidé',
  resisted: 'Me resistí / no tenía ganas',
  not_priority: 'No era prioridad hoy',
  low_mood: 'Me sentí mal emocionalmente',
  other: 'Otra razón',
};

const NOTE_STYLE: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.8px solid var(--ink)', borderRadius: 12,
  background: 'transparent', padding: '12px 14px',
  fontSize: 16, outline: 'none', resize: 'none',
};

export function FrictionPicker({
  cause, onCause, note, onNote,
}: {
  cause: FrictionCause | null;
  onCause: (c: FrictionCause | null) => void;
  note: string;
  onNote: (n: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      {CAUSES.map((c) => {
        const sel = cause === c.key;
        const Icon = c.Icon;
        return (
          <button
            key={c.key}
            onClick={() => onCause(sel ? null : c.key)}
            className="cursor-pointer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 12, width: '100%',
              border: `1.6px solid ${sel ? 'var(--coral)' : 'var(--ink-soft)'}`,
              background: sel ? 'var(--coral-soft)' : 'transparent',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon size={26} color="var(--ink)" style={{ flexShrink: 0 }} />
            <span className="font-hand text-ink" style={{ flex: 1, textAlign: 'left', fontSize: 16, lineHeight: 1.15 }}>{c.label}</span>
            {sel
              ? <CheckCircleIcon size={24} weight="fill" color="var(--coral)" style={{ flexShrink: 0 }} />
              : <CircleIcon size={24} color="var(--ink-soft)" style={{ flexShrink: 0 }} />}
          </button>
        );
      })}

      {cause === 'other' && (
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="¿Qué se interpuso?"
          className="font-hand text-ink"
          style={{ ...NOTE_STYLE, marginTop: 4 }}
        />
      )}

      {cause && (
        <div
          className="flex items-start gap-[10px]"
          style={{ marginTop: 6, padding: '12px 14px', borderRadius: 12, background: '#e7f1df', border: '1.4px solid #6f9e5e' }}
        >
          <HeartIcon size={22} color="#6f9e5e" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="font-display text-ink" style={{ fontSize: 16, lineHeight: 1.1 }}>Gracias por ser honesto/a.</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 14, marginTop: 2, lineHeight: 1.2 }}>
              Reconocer tu fricción te hace más consciente y más fuerte.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
