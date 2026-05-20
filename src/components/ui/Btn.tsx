import React from 'react';

type BtnVariant = 'primary' | 'outline' | 'danger' | 'ink' | 'segment' | 'chip';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  active?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const FONT_SIZE: Record<BtnSize, number> = {
  xs: 13,
  sm: 14,
  md: 17,
  lg: 18,
};

const PADDING: Record<BtnSize, string> = {
  xs: '5px 10px',
  sm: '8px 14px',
  md: '10px 18px',
  lg: '14px 20px',
};

const BORDER_W: Record<BtnSize, string> = {
  xs: '1.6px',
  sm: '1.6px',
  md: '1.8px',
  lg: '1.8px',
};

function resolveStyle(
  variant: BtnVariant,
  size: BtnSize,
  active: boolean,
  disabled: boolean,
): {
  border: string;
  background: string;
  color: string;
  boxShadow?: string;
  transition?: string;
} {
  const bw = BORDER_W[size];

  switch (variant) {
    case 'primary':
      return {
        border: `${bw} solid ${disabled ? 'var(--ink-soft)' : 'var(--coral)'}`,
        background: disabled ? 'rgba(217,119,87,0.35)' : 'var(--coral)',
        color: 'var(--paper)',
        boxShadow: disabled ? 'none' : 'var(--shadow-sketch)',
        transition: 'background 200ms, border-color 200ms',
      };
    case 'outline':
      return {
        border: `${bw} solid var(--ink)`,
        background: 'transparent',
        color: 'var(--ink)',
      };
    case 'danger':
      return {
        border: `${bw} solid var(--coral)`,
        background: 'transparent',
        color: 'var(--coral)',
      };
    case 'ink':
      return {
        border: `${bw} solid var(--ink)`,
        background: 'var(--ink)',
        color: 'var(--paper)',
        boxShadow: 'var(--shadow-sketch)',
      };
    case 'segment':
      return {
        border: `${bw} solid var(--ink)`,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
        transition: 'background 180ms',
      };
    case 'chip':
      return {
        border: `${bw} solid var(--ink)`,
        background: active ? 'var(--coral-soft)' : 'transparent',
        color: 'var(--ink)',
        transition: 'background 160ms',
      };
  }
}

export function Btn({
  variant = 'outline',
  size = 'md',
  active = false,
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  className,
  ...rest
}: BtnProps) {
  const isDisabled = disabled || loading;
  const visual = resolveStyle(variant, size, active, isDisabled);

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        fontSize: FONT_SIZE[size],
        padding: PADDING[size],
        borderRadius: 'var(--radius-pill)',
        WebkitTapHighlightColor: 'transparent',
        width: fullWidth ? '100%' : undefined,
        textAlign: fullWidth ? 'center' : undefined,
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled && variant !== 'primary' ? 0.45 : 1,
        ...visual,
        ...style,
      }}
      className={`inline-flex items-center justify-center gap-[6px] font-hand${className ? ` ${className}` : ''}`}
    >
      {loading ? '…' : children}
    </button>
  );
}
