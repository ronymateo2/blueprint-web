interface HeatCellProps { v?: number; size?: number; }

function HeatCell({ v = 0, size = 12 }: HeatCellProps) {
  const bg = v <= 0 ? 'transparent' : `rgba(42,42,42,${0.15 + v * 0.7})`;
  return (
    <div className="border-ink" style={{ width: size, height: size, borderRadius: 3, border: '1px solid var(--ink)', background: bg }} />
  );
}

interface HeatmapProps {
  data?: number[]; // 0..1 per day, length = weeks*7
  weeks?: number;
  cellSize?: number;
}

export function Heatmap({ data, weeks = 14, cellSize = 12 }: HeatmapProps) {
  const total = weeks * 7;
  const values = data ?? Array.from({ length: total }, () => 0);
  return (
    <div className="grid gap-[3px]" style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 1fr)' }}>
      {values.slice(-total).map((v, i) => (
        <HeatCell key={i} v={v} size={cellSize} />
      ))}
    </div>
  );
}
