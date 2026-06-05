import type { CSSProperties } from 'react';
import type { FrictionCause } from '../../api/client';
import { Btn } from '../ui/Btn';

const CAUSES: { key: FrictionCause; label: string }[] = [
  { key: 'no_time', label: 'Sin tiempo' },
  { key: 'tired', label: 'Cansancio' },
  { key: 'forgot', label: 'Olvidé' },
  { key: 'mood', label: 'Ánimo' },
  { key: 'other', label: 'Otro' },
];

export const CAUSE_LABELS: Record<FrictionCause, string> = {
  no_time: 'Sin tiempo',
  tired: 'Cansancio',
  forgot: 'Olvidé',
  mood: 'Ánimo',
  other: 'Otro',
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
    <div className="flex flex-col gap-[12px]">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CAUSES.map((c) => (
          <Btn key={c.key} variant="chip" size="sm" active={cause === c.key} onClick={() => onCause(cause === c.key ? null : c.key)}>
            {c.label}
          </Btn>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => onNote(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="¿Qué se interpuso? (opcional)"
        className="font-hand text-ink"
        style={NOTE_STYLE}
      />
    </div>
  );
}
