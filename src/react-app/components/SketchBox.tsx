import React from 'react';

interface SketchBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number;
  radius?: number;
  accent?: boolean;
  dashed?: boolean;
}

export function SketchBox({ children, padding = 10, radius = 14, accent = false, dashed = false, style, ...rest }: SketchBoxProps) {
  return (
    <div
      {...rest}
      className={`shadow-sketch${rest.className ? ' ' + rest.className : ''}`}
      style={{
        border: `1.6px ${dashed ? 'dashed' : 'solid'} ${accent ? 'var(--coral)' : 'var(--ink)'}`,
        borderRadius: radius,
        padding,
        background: accent ? 'var(--coral-soft)' : 'transparent',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
