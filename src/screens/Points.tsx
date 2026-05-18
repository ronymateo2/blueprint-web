import { useState } from 'react';
import { useStats } from '../hooks/useStats';
import { BarChart } from '../components/BarChart';
import { Heatmap } from '../components/Heatmap';
import { SketchBox } from '../components/SketchBox';
import { HandIcon } from '../components/HandIcon';

const TABS = ['Día', 'Semana', 'Mes', 'Año'];

function levelName(level: number): string {
  const names = ['Semilla', 'Brote', 'Plántula', 'Árbol', 'Roble', 'Bosque', 'Selva', 'Universo'];
  return names[Math.min(level - 1, names.length - 1)] ?? 'Maestro';
}

export function Points() {
  const { stats, loading } = useStats();
  const [activeTab, setActiveTab] = useState(1);

  // Current weekday index (0=L … 6=D) for highlighting today's bar
  const todayIdx = (new Date().getDay() + 6) % 7; // JS: 0=Sun, make 0=Mon

  if (loading || !stats) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  const xpPct = stats.levelXp / stats.levelNext;

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '16px 18px 0' }}>
        <div className="font-display leading-none" style={{ fontSize: 34 }}>Puntos</div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
          Nivel {stats.level} · {levelName(stats.level)}
        </div>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '10px 14px 0' }}>

        {/* XP Card */}
        <SketchBox accent padding={12} radius={16}>
          <div className="flex items-center gap-[10px]">
            <HandIcon kind="star" size={28} />
            <div className="flex-1">
              <div className="font-display leading-none" style={{ fontSize: 28 }}>
                {stats.totalPoints.toLocaleString('es')} XP
              </div>
              <div className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
                {stats.levelNext - stats.levelXp} para nivel {stats.level + 1}
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden" style={{ marginTop: 10, height: 10, border: '1.5px solid var(--ink)', borderRadius: 6 }}>
            <div style={{ width: `${Math.round(xpPct * 100)}%`, height: '100%', background: 'var(--coral)', transition: 'width 0.4s ease' }} />
          </div>
        </SketchBox>

        {/* Stats pills */}
        <div className="flex gap-[8px]">
          {[
            { icon: 'fire', value: `${stats.streak}d`, label: 'racha' },
            { icon: 'bolt', value: stats.todayPoints, label: 'hoy' },
            { icon: 'target', value: `${stats.weekPct}%`, label: 'semana' },
          ].map((s) => (
            <SketchBox key={s.label} padding={8} className="flex-1 flex flex-col items-center gap-[2px]">
              <HandIcon kind={s.icon} size={20} />
              <span className="font-display leading-none" style={{ fontSize: 22 }}>{s.value}</span>
              <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>{s.label}</span>
            </SketchBox>
          ))}
        </div>

        {/* D/S/M/A tabs */}
        <div className="flex gap-[6px]">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className="flex-1 text-center cursor-pointer font-hand"
              style={{
                padding: '5px 0',
                border: `1.6px solid var(--ink)`, borderRadius: 'var(--radius-pill)',
                background: i === activeTab ? 'var(--ink)' : 'transparent',
                color: i === activeTab ? 'var(--paper)' : 'var(--ink)',
                fontSize: 15,
                WebkitTapHighlightColor: 'transparent',
              }}
            >{t}</button>
          ))}
        </div>

        {/* Bar chart */}
        <SketchBox padding={10}>
          <div className="flex justify-between font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 4 }}>
            <span>Esta semana</span>
            <span>{stats.weeklyChart.reduce((s, v) => s + v, 0).toLocaleString('es')} pts</span>
          </div>
          <BarChart values={stats.weeklyChart} activeIndex={todayIdx} />
        </SketchBox>

        {/* Heatmap */}
        <div>
          <div className="flex justify-between font-hand text-ink-soft" style={{ fontSize: 14, marginBottom: 4 }}>
            <span>Últimas 14 semanas</span>
            <span style={{ fontSize: 12 }}>menos · □ □ ■ ■ · más</span>
          </div>
          <SketchBox padding={10}>
            <Heatmap data={stats.heatmap} weeks={14} cellSize={12} />
          </SketchBox>
        </div>

        <div style={{ height: 16 }} />
      </div>

    </div>
  );
}
