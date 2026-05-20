import { useState } from 'react';

const COLORS = ['#e05c4a', '#2b2b2b', '#f5c842', '#74c874', '#a89ff5', '#ff9a6c', '#60c9f8'];

export function ConfettiBurst() {

  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => {
      const left = i < 18;
      return {
        id: i,
        left,
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
      };
    })
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          [p.left ? 'left' : 'right']: 0,
          top: p.top,
          width: p.w,
          height: p.h,
          background: p.color,
          borderRadius: p.br,
          '--cx': p.cx,
          '--cy': p.cy,
          '--cr': p.cr,
          animation: `cfetti ${p.dur} ${p.del} ease-out both`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
