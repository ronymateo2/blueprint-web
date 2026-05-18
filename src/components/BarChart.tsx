interface BarChartProps {
  values: number[]; // 7 values, one per day
  labels?: string[];
  activeIndex?: number;
  height?: number;
}

export function BarChart({ values, labels = ['L','M','X','J','V','S','D'], activeIndex, height = 70 }: BarChartProps) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex items-end gap-[6px]" style={{ height, padding: '2px 0' }}>
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 border-ink rounded-[3px]"
            style={{
              height: `${(v / max) * 100}%`,
              minHeight: 4,
              border: '1.6px solid var(--ink)',
              background: i === activeIndex ? 'var(--coral)' : 'transparent',
              transition: 'height 0.3s ease',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
