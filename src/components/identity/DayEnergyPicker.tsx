import { BatteryFullIcon, BatteryMediumIcon, BatteryLowIcon } from '@phosphor-icons/react';
import type { Energy } from '../../lib/evidence';

const OPTIONS: { key: Energy; label: string; sub: string; Icon: typeof BatteryFullIcon; selBg: string; selBorder: string }[] = [
  { key: 'good', label: 'Bien', sub: 'Con energía', Icon: BatteryFullIcon, selBg: '#e7f1df', selBorder: '#6f9e5e' },
  { key: 'ok', label: 'Normal', sub: 'Estuvo ok', Icon: BatteryMediumIcon, selBg: 'var(--paper-2)', selBorder: 'var(--ink)' },
  { key: 'hard', label: 'Difícil', sub: 'Poca energía', Icon: BatteryLowIcon, selBg: 'var(--coral-soft)', selBorder: 'var(--coral)' },
];

export function DayEnergyPicker({ value, onChange }: { value: Energy | null; onChange: (v: Energy | null) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {OPTIONS.map((o) => {
        const sel = value === o.key;
        const Icon = o.Icon;
        return (
          <button
            key={o.key}
            onClick={() => onChange(sel ? null : o.key)}
            className="flex flex-col items-center gap-[5px] cursor-pointer"
            style={{
              flex: 1, padding: '12px 4px', borderRadius: 12,
              border: `1.8px solid ${sel ? o.selBorder : 'var(--ink-soft)'}`,
              background: sel ? o.selBg : 'transparent',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon size={28} color="var(--ink)" />
            <span className="font-hand" style={{ fontSize: 14, lineHeight: 1 }}>{o.label}</span>
            <span className="font-hand text-ink-soft" style={{ fontSize: 12, lineHeight: 1, textAlign: 'center' }}>{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
