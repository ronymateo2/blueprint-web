import { TrendUpIcon, TrendDownIcon } from '@phosphor-icons/react';

export function TraitBar({ label, score, delta }: { label: string; score: number; delta: number }) {
  const up = delta >= 0;
  return (
    <div className="flex flex-col gap-[6px]">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-hand text-ink" style={{ fontSize: 15 }}>{label}</span>
        <span
          className="font-hand"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 14, color: up ? '#6f9e5e' : 'var(--coral)' }}
        >
          {up ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
          {up ? '+' : ''}{delta}%
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: 'var(--paper-2)', border: '1.4px solid var(--ink-soft)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', background: 'var(--coral)', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}
