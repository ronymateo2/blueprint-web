import { HandIcon } from './HandIcon';

interface IconTileProps {
  kind: string;
  size?: number;
  dashed?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function IconTile({ kind, size = 44, dashed = false, selected = false, onClick }: IconTileProps) {
  const border = selected ? 'var(--coral)' : dashed ? 'var(--ink-soft)' : 'var(--ink)';
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        border: `1.6px ${dashed && !selected ? 'dashed' : 'solid'} ${border}`,
        background: selected ? 'var(--coral-soft)' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected ? '1px 2px 0 rgba(0,0,0,0.1)' : 'none',
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <HandIcon kind={kind} size={size * 0.48} />
    </div>
  );
}
