import React from 'react';

interface SketchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: boolean;
  filled?: boolean;
  small?: boolean;
}

export function SketchButton({ children, accent = false, filled = false, small = false, style, ...rest }: SketchButtonProps) {
  const c = accent ? 'var(--coral)' : 'var(--ink)';
  return (
    <button
      {...rest}
      style={{
        fontSize: small ? 14 : 17,
        border: `1.6px solid ${c}`,
        borderRadius: 'var(--radius-pill)',
        padding: small ? '4px 12px' : '8px 18px',
        background: filled ? c : 'transparent',
        color: filled ? 'var(--paper)' : c,
        boxShadow: filled ? 'var(--shadow-sketch)' : 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      className="inline-flex items-center gap-[6px] font-hand cursor-pointer"
    >
      {children}
    </button>
  );
}
