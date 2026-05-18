import React from 'react';

interface RingProps {
  size?: number;
  value?: number; // 0..1+ (can exceed 1)
  stroke?: number;
  color?: string;
  track?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}

export function Ring({
  size = 120,
  value = 0,
  stroke = 8,
  color = 'var(--ink)',
  track = '#e8e1cf',
  label,
  sublabel,
}: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(value, 1);
  const offset = circ * (1 - capped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      {(label !== undefined || sublabel !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label !== undefined && (
            <span className="font-display leading-none" style={{ fontSize: size * 0.22 }}>{label}</span>
          )}
          {sublabel !== undefined && (
            <span className="font-hand text-ink-soft" style={{ fontSize: size * 0.1, marginTop: 2, lineHeight: 1.1 }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
