import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useStats } from '../hooks/useStats';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { SketchBox } from '../components/SketchBox';
import { HandIcon } from '../components/HandIcon';
import { Scribble } from '../components/Scribble';
import { Btn } from '../components/Btn';
import { daysAgoLocalDate, utcToLocalDate, todayLocalDate, localDayUtcRange } from '../lib/dateUtils';
import { useAuthContext } from '../context/AuthContext';

function localHour(isoUtc: string, tz: string): number {
  const timeStr = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, timeStyle: 'short' }).format(new Date(isoUtc));
  return parseInt(timeStr.split(':')[0]);
}

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
  bars: { label: string; points: number; today?: boolean }[];
}

function BarChartNew({ bars }: BarChartNewProps) {
  const max = Math.max(1, ...bars.map(b => b.points));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 104, padding: '2px 0' }}>
        {bars.map((b, i) => {
          const h = max === 0 ? 0 : Math.max(3, (b.points / max) * 100);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              {b.points > 0 && (
                <div className="font-hand" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{b.points}</div>
              )}
              <div style={{
                width: '100%', height: `${h}%`,
                border: '1.6px solid var(--ink)',
                background: b.today ? 'var(--coral)' : 'transparent',
                borderRadius: 3,
                transition: 'height 360ms ease',
              }} />
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

function HeatCell({ v, size = 10 }: { v: number; size?: number }) {
  const opacity = v <= 0 ? 0 : 0.15 + v * 0.75;
  return (
    <div style={{
      width: size, height: size, borderRadius: 2,
      border: '1px solid var(--ink)',
      background: v <= 0 ? 'transparent' : `rgba(42,42,42,${opacity})`,
    }} />
  );
}

export function Points() {
  const navigate = useNavigate();
  const { timezone } = useAuthContext();
  const { stats, loading } = useStats();
  const { habits } = useHabits();
  const [period, setPeriod] = useState<Period>('week');

  const from = localDayUtcRange(daysAgoLocalDate(97, timezone), timezone).from;
  const { entries } = useEntries({ from });

  const activeHabits = habits.filter(h => !h.archived_at).slice(0, 4);

  function habitHeatmap(habitId: string): number[] {
    const byDay: Record<string, number> = {};
    entries.filter(e => e.habit_id === habitId).forEach(e => {
      const d = utcToLocalDate(e.logged_at, timezone);
      byDay[d] = (byDay[d] ?? 0) + 1;
    });
    const vals: number[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = daysAgoLocalDate(i, timezone);
      vals.push(Math.min(1, (byDay[d] ?? 0) * 0.5));
    }
    return vals;
  }

  function buildBars(): { label: string; points: number; today?: boolean }[] {
    const dayLabels = ['D','L','M','X','J','V','S'];
    if (period === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const localDate = daysAgoLocalDate(6 - i, timezone);
        const [y, mo, d] = localDate.split('-').map(Number);
        const dow = new Date(y, mo - 1, d).getDay();
        const pts = entries.filter(e => utcToLocalDate(e.logged_at, timezone) === localDate).reduce((s, e) => s + e.points, 0);
        return { label: dayLabels[dow], points: pts, today: i === 6 };
      });
    }
    if (period === 'day') {
      const labels = ['0-4','4-8','8-12','12-16','16-20','20-24'];
      const todayStr = todayLocalDate(timezone);
      const nowHour = localHour(new Date().toISOString(), timezone);
      return labels.map((label, i) => {
        const pts = entries
          .filter(e => {
            const h = localHour(e.logged_at, timezone);
            return utcToLocalDate(e.logged_at, timezone) === todayStr && h >= i * 4 && h < (i + 1) * 4;
          })
          .reduce((s, e) => s + e.points, 0);
        return { label, points: pts, today: i === Math.floor(nowHour / 4) };
      });
    }
    if (period === 'month') {
      return Array.from({ length: 5 }, (_, i) => {
        const startLocal = daysAgoLocalDate((4 - i) * 7, timezone);
        const endLocal = i < 4 ? daysAgoLocalDate((3 - i) * 7, timezone) : '9999-12-31';
        const pts = entries.filter(e => {
          const d = utcToLocalDate(e.logged_at, timezone);
          return d >= startLocal && d < endLocal;
        }).reduce((s, e) => s + e.points, 0);
        return { label: `s${i + 1}`, points: pts, today: i === 4 };
      });
    }
    // year
    const monthLabels = ['E','F','M','A','M','J','J','A','S','O','N','D'];
    const currentMonth = parseInt(todayLocalDate(timezone).split('-')[1]) - 1;
    return Array.from({ length: 12 }, (_, m) => {
      const pts = entries.filter(e => parseInt(utcToLocalDate(e.logged_at, timezone).split('-')[1]) - 1 === m).reduce((s, e) => s + e.points, 0);
      return { label: monthLabels[m], points: pts, today: m === currentMonth };
    });
  }

  if (loading || !stats) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  const xpPct = stats.levelXp / stats.levelNext;
  const bars = buildBars();
  const barsTotal = bars.reduce((s, b) => s + b.points, 0);

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn onClick={() => navigate('/')} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /> Hoy</Btn>
        </div>
        <div className="font-display leading-none flex items-center" style={{ fontSize: 42, marginTop: 4 }}>
          Puntos <Scribble width={64} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, marginTop: -2 }} />
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
          Nivel {stats.level} · {stats.levelNext - stats.levelXp} para nivel {stats.level + 1}
        </div>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 20px' }}>

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
                  {stats.totalPoints.toLocaleString('es')}
                </span>
                <span className="font-display" style={{ fontSize: 22, color: 'var(--ink-soft)' }}>XP</span>
              </div>
            </div>
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, marginTop: 4 }}>
            nivel {stats.level} · faltan {stats.levelNext - stats.levelXp} pts para nivel {stats.level + 1}
          </div>
          <div style={{ marginTop: 8, height: 14, border: '1.6px solid var(--ink)', borderRadius: 7, overflow: 'hidden', background: 'var(--paper)', position: 'relative' }}>
            <div style={{
              width: `${Math.round(xpPct * 100)}%`,
              height: '100%', background: 'var(--coral)',
              transition: 'width 600ms ease',
            }} />
          </div>
        </SketchBox>

        {/* Stat row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: 'fire',   value: stats.streak,      unit: 'd', label: 'racha',  accent: stats.streak >= 3 },
            { icon: 'bolt',   value: stats.todayPoints,  unit: '',  label: 'hoy',   accent: false },
            { icon: 'target', value: stats.weekPct,      unit: '%', label: 'semana',accent: false },
          ].map((s, i) => (
            <SketchBox key={i} padding={12} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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
            <span style={{ fontSize: 13 }}>Calor por hábito · 4 semanas</span>
            <span style={{ fontSize: 12 }}>□ ▤ ▥ ▦ ▩</span>
          </div>
          <SketchBox padding={8} style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeHabits.length === 0 && (
                <div className="font-hand text-ink-soft" style={{ fontSize: 13, padding: 8 }}>· sin hábitos activos</div>
              )}
              {activeHabits.map((h) => {
                const cells = habitHeatmap(h.id);
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HandIcon kind={h.icon} size={16} />
                    <span className="font-hand" style={{ fontSize: 13, width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.name}
                    </span>
                    <div style={{ flex: 1, display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(2, 10px)', gridAutoColumns: 10, gap: 3, justifyContent: 'end' }}>
                      {cells.map((v, i) => <HeatCell key={i} v={v} size={10} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </SketchBox>
        </div>

      </div>
    </div>
  );
}
