interface ScribbleProps {
  width?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function Scribble({ width = 80, color = 'var(--coral)', strokeWidth = 2.5, style }: ScribbleProps) {
  const h = strokeWidth * 5;
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="block" style={style}>
      <path
        d={`M2 ${h - 2} Q ${width * 0.25} 2, ${width * 0.5} ${h - 2} T ${width - 2} 2`}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
