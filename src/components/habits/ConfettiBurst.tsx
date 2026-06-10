import { useState } from 'react';

const COLORS = ['#e05c4a', '#2b2b2b', '#f5c842', '#74c874', '#a89ff5', '#ff9a6c', '#60c9f8'];

export function ConfettiBurst() {

  const [pieces] = useState(() => {
    const out = [];

    for (let i = 0; i < 28; i++) {
      const left = i % 2 === 0;
      out.push({
        id: i,
        source: left ? 'left' : 'right',
        color: COLORS[i % COLORS.length],
        w: 5 + Math.random() * 9,
        h: 5 + Math.random() * 11,
        top: `${8 + Math.random() * 68}vh`,
        cx: left ? `${80 + Math.random() * 150}px` : `${-(80 + Math.random() * 150)}px`,
        cy: `${50 + Math.random() * 220}px`,
        cr: `${Math.floor(Math.random() * 540 - 270)}deg`,
        dur: `${(1.4 + Math.random() * 1.0).toFixed(2)}s`,
        del: `${(Math.random() * 0.25).toFixed(2)}s`,
        br: Math.random() > 0.45 ? '50%' : '2px',
      });
    }

    for (let i = 0; i < 20; i++) {
      out.push({
        id: 28 + i,
        source: 'top',
        color: COLORS[(28 + i) % COLORS.length],
        w: 4 + Math.random() * 7,
        h: 6 + Math.random() * 12,
        top: -8,
        left: `${Math.random() * 100}%`,
        cx: `${(Math.random() - 0.5) * 120}px`,
        cy: `${110 + Math.random() * 60}vh`,
        cr: `${Math.floor(Math.random() * 720 - 360)}deg`,
        dur: `${(2.0 + Math.random() * 1.2).toFixed(2)}s`,
        del: `${(Math.random() * 0.6).toFixed(2)}s`,
        br: Math.random() > 0.5 ? '50%' : '2px',
      });
    }

    return out;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          ...(p.source === 'top'
            ? { left: p.left, top: p.top }
            : { [p.source]: 0, top: p.top }),
          width: p.w,
          height: p.h,
          background: p.color,
          borderRadius: p.br,
          '--cx': p.cx,
          '--cy': p.cy,
          '--cr': p.cr,
          animation: `cfetti ${p.dur} ${p.del} ease-out both`,
        } as unknown as React.CSSProperties} />
      ))}
    </div>
  );
}
