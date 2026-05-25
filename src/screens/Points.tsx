import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { usePoints } from '../hooks/usePoints';
import { SketchBox } from '../components/ui/SketchBox';
import { HandIcon } from '../components/ui/HandIcon';
import { Scribble } from '../components/ui/Scribble';
import { Btn } from '../components/ui/Btn';
import type { PointsChartBar } from '../api/client';

const PERIOD_TABS = [
  { id: 'day',   label: 'Día' },
  { id: 'week',  label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year',  label: 'Año' },
] as const;

type Period = typeof PERIOD_TABS[number]['id'];

function rangeLabel(p: Period): string {
  if (p === 'day') return 'Hoy · por hora';
  if (p === 'week') return 'Esta semana';
  if (p === 'month') return 'Este mes';
  return 'Este año';
}

interface BarChartNewProps {
  bars: PointsChartBar[];
}

function BarChartNew({ bars }: BarChartNewProps) {
  const max = Math.max(1, ...bars.map(b => b.points));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 104, padding: '2px 0' }}>
        {bars.map((b, i) => {
          const h = max === 0 ? 0 : Math.max(3, (b.points / max) * 100);
          const background = b.today
            ? 'var(--coral)'
            : b.points > 0
              ? 'rgba(42, 42, 42, 0.08)'
              : 'transparent';
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              {b.points > 0 && (
                <div className="font-hand" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{b.points}</div>
              )}
              <div
                className="chart-bar"
                style={{
                  width: '100%', height: `${h}%`,
                  border: '1.6px solid var(--ink)',
                  background,
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {bars.map((b, i) => (
          <span key={i} className="font-hand text-ink-soft" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeatCell({ v, size = 9 }: { v: number; size?: number }) {
  const opacity = v <= 0 ? 0.25 : 0.4 + v * 0.6;
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 1.5,
      border: '1.0px solid var(--ink)',
      background: v <= 0 ? 'transparent' : 'var(--coral)',
      opacity,
      transition: 'opacity 200ms ease',
    }} />
  );
}

export function Points() {
  const navigate = useNavigate();
  const { habits } = useHabits();
  const { data: pointsData, loading: pointsLoading } = usePoints();
  const [period, setPeriod] = useState<Period>('week');
  const [showAll, setShowAll] = useState(false);

  const activeHabits = habits.filter(h => !h.archived_at);
  const shouldTruncate = activeHabits.length > 5;
  const visibleHabits = shouldTruncate && !showAll ? activeHabits.slice(0, 4) : activeHabits;

  if (pointsLoading || !pointsData) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  const xpPct = pointsData.levelXp / (pointsData.levelNext || 1);

  const bars: PointsChartBar[] =
    period === 'day'   ? pointsData.dayChart :
    period === 'week'  ? pointsData.weekChart :
    period === 'month' ? pointsData.monthChart :
    pointsData.yearChart;

  const barsTotal = bars.reduce((s, b) => s + b.points, 0);

  return (
    <div className="screen">
      <style>{`
        .chart-bar {
          transition: all 200ms ease-in-out;
        }
        .chart-bar:hover {
          background: var(--coral-soft) !important;
          border-color: var(--coral) !important;
          transform: scaleY(1.06);
          transform-origin: bottom;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn onClick={() => navigate('/')} size="sm">
            <ArrowLeft size={16} /> Hoy
          </Btn>
        </div>
        <div className="font-display leading-none flex items-center" style={{ fontSize: 34, marginTop: 4 }}>
          Puntos <Scribble width={50} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, marginTop: -2 }} />
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 15, marginTop: 2 }}>
          Visualiza tu nivel, racha y hábitos
        </div>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 100px' }}>

        {/* XP Card */}
        <SketchBox accent padding={16} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              border: '1.8px solid var(--ink)', background: 'var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <HandIcon kind="star" size={32} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-hand text-ink-soft" style={{ fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>
                Experiencia total
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="font-display" style={{ fontSize: 58, lineHeight: 0.85, letterSpacing: -1.5 }}>
                  {pointsData.totalPoints.toLocaleString('es')}
                </span>
                <span className="font-display" style={{ fontSize: 22, color: 'var(--ink-soft)' }}>XP</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, marginBottom: 2 }}>
            <span className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
              nivel {pointsData.level}
            </span>
            <span className="font-mono text-ink-soft" style={{ fontSize: 12 }}>
              {pointsData.levelXp} / {pointsData.levelNext} XP ({Math.round(xpPct * 100)}%)
            </span>
          </div>
          <div style={{ height: 14, border: '1.6px solid var(--ink)', borderRadius: 7, overflow: 'hidden', background: 'var(--paper)', position: 'relative' }}>
            <div style={{
              width: `${Math.round(xpPct * 100)}%`,
              height: '100%', background: 'var(--coral)',
              transition: 'width 600ms ease',
            }} />
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 4 }}>
            Faltan {pointsData.levelNext - pointsData.levelXp} pts para nivel {pointsData.level + 1}
          </div>
        </SketchBox>

        {/* Stat row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: 'fire',   value: pointsData.streak,      unit: 'd', label: 'racha',  accent: pointsData.streak >= 3 },
            { icon: 'bolt',   value: pointsData.todayPoints,  unit: '',  label: 'hoy',   accent: false },
            { icon: 'target', value: pointsData.weekPct,      unit: '%', label: 'semana',accent: false },
          ].map((s, i) => (
            <SketchBox
              key={i}
              padding={12}
              className="btn-hover"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <HandIcon kind={s.icon} size={22} color={s.accent ? 'var(--coral)' : 'var(--ink)'} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <span className="font-display" style={{ fontSize: 34, lineHeight: 0.9, letterSpacing: -0.5 }}>{s.value}</span>
                {s.unit && <span className="font-display" style={{ fontSize: 18, color: 'var(--ink-soft)' }}>{s.unit}</span>}
              </div>
              <span className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</span>
            </SketchBox>
          ))}
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_TABS.map((t) => (
            <Btn
              key={t.id}
              variant="segment"
              active={t.id === period}
              onClick={() => setPeriod(t.id)}
              className="flex-1"
              style={{ padding: '10px 0', fontSize: 16 }}
            >{t.label}</Btn>
          ))}
        </div>

        {/* Bar chart */}
        <SketchBox padding={10}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="font-hand text-ink-soft">
            <span style={{ fontSize: 13 }}>{rangeLabel(period)}</span>
            <span style={{ fontSize: 13 }}><b>{barsTotal}</b> pts</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <BarChartNew bars={bars} />
          </div>
        </SketchBox>

        {/* Per-habit heatmap */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="font-hand text-ink-soft">
            <span style={{ fontSize: 13 }}>Calor por hábito · 2 semanas</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>menos</span>
              <div style={{ width: 8, height: 8, border: '0.8px solid var(--ink)', background: 'transparent', opacity: 0.25, borderRadius: 1.5 }} />
              <div style={{ width: 8, height: 8, border: '0.8px solid var(--ink)', background: 'var(--coral)', opacity: 0.5, borderRadius: 1.5 }} />
              <div style={{ width: 8, height: 8, border: '0.8px solid var(--ink)', background: 'var(--coral)', opacity: 0.8, borderRadius: 1.5 }} />
              <div style={{ width: 8, height: 8, border: '0.8px solid var(--ink)', background: 'var(--coral)', opacity: 1, borderRadius: 1.5 }} />
              <span style={{ fontSize: 11, opacity: 0.8 }}>más</span>
            </div>
          </div>
          <SketchBox padding={8} style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeHabits.length === 0 && (
                <div className="font-hand text-ink-soft" style={{ fontSize: 13, padding: 8 }}>· sin hábitos activos</div>
              )}
              {visibleHabits.map((h) => {
                const heatmap = pointsData.habitHeatmaps.find(hm => hm.habitId === h.id);
                const cells = heatmap?.values ?? new Array(14).fill(0);
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                        <HandIcon kind={h.icon} size={16} />
                      </span>
                      <span className="font-hand" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
                      {cells.map((v, i) => <HeatCell key={i} v={v} size={9} />)}
                    </div>
                  </div>
                );
              })}
              {shouldTruncate && (
                <div style={{ borderTop: '1.6px dashed var(--ink-soft)', paddingTop: 8, display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                  <Btn
                    onClick={() => setShowAll(!showAll)}
                    size="xs"
                    variant="chip"
                    active={showAll}
                    style={{ padding: '4px 12px' }}
                  >
                    {showAll ? 'Ver menos ↑' : `Ver todos (${activeHabits.length}) ↓`}
                  </Btn>
                </div>
              )}
            </div>
          </SketchBox>
        </div>

      </div>
    </div>
  );
}
