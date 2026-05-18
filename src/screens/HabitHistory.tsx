import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { Scribble } from '../components/Scribble';
import { Btn } from '../components/Btn';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat('es', { month: 'short' }).format(d);
  return `${weekday} ${day} ${month}`.toUpperCase();
}

function formatSinceDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat('es', { month: 'short' }).format(d);
  return `${weekday} ${day} ${month}`;
}

export function HabitHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === id);

  // Fetch all entries for this habit
  const { entries, loading } = useEntries({ habitId: id });

  // Heatmap: last 98 days (14 weeks)
  const heatmapData = (() => {
    const byDay: Record<string, number> = {};
    entries.forEach((e) => {
      const d = e.logged_at.slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + 1;
    });
    const vals: number[] = [];
    for (let i = 97; i >= 0; i--) {
      const d = daysAgo(i);
      vals.push(Math.min(1, (byDay[d] ?? 0) * 0.5));
    }
    return vals;
  })();


  // Group entries by date, sorted desc
  const byDate: Record<string, typeof entries> = {};
  entries.forEach((e) => {
    const d = e.logged_at.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });
  const grouped = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, es]) => ({
      date,
      entries: [...es].sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
    }));

  const totalEntries = entries.length;
  const sinceDate = entries.length > 0
    ? [...entries].sort((a, b) => a.logged_at.localeCompare(b.logged_at))[0].logged_at.slice(0, 10)
    : null;

  if (!habit) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={() => navigate(-1)} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /> Detalle</Btn>
        <span
          className="font-hand text-ink-soft overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ fontSize: 15, maxWidth: 150 }}
        >
          {habit.name}
        </span>
        <div style={{ width: 90 }} />
      </div>

      <div className="screen-scroll" style={{ padding: '12px 14px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: 4 }}>
          <div className="font-display leading-none" style={{ fontSize: 34 }}>Histórico</div>
          <Scribble width={96} style={{ marginTop: 3 }} />
        </div>

        {/* Stats */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 14, marginTop: 4 }}>
          {loading ? '…' : `${totalEntries} registros${sinceDate ? ` · desde ${formatSinceDate(sinceDate)}` : ''}`}
        </div>

        {/* Heatmap */}
        <div style={{ marginTop: 16 }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 8, letterSpacing: 0.4 }}>
            Últimas 14 semanas
          </div>
          <div style={{
            border: '1.6px solid var(--ink)',
            borderRadius: 12,
            padding: 10,
            overflow: 'hidden',
          }}>
            {/* 1fr columns → always fills container, no pixel calc needed */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(14, 1fr)',
              gridTemplateRows: 'repeat(7, auto)',
              gridAutoFlow: 'column',
              gap: 3,
            }}>
              {heatmapData.map((v, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 3,
                    border: '1px solid var(--ink)',
                    background: v <= 0 ? 'transparent' : `rgba(42,42,42,${0.15 + v * 0.7})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Entry list grouped by date */}
        <div style={{ marginTop: 20 }}>
          {loading && grouped.length === 0 ? (
            <div className="font-hand text-ink-soft" style={{ fontSize: 17, paddingTop: 8 }}>Cargando…</div>
          ) : grouped.length === 0 ? (
            <div className="font-hand text-ink-soft" style={{ fontSize: 17, paddingTop: 8 }}>Sin registros aún</div>
          ) : (
            grouped.map(({ date, entries: dayEntries }) => (
              <div key={date} style={{ marginBottom: 14 }}>
                <div className="font-hand text-ink-soft" style={{ fontSize: 13, letterSpacing: 0.5, marginBottom: 2 }}>
                  {formatDateHeader(date)}
                </div>
                {dayEntries.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center font-hand"
                    style={{
                      fontSize: 15, padding: '6px 0',
                      borderBottom: '1px dashed var(--ink-soft)',
                    }}
                  >
                    <span>· {formatTime(e.logged_at)} – +{e.value}</span>
                    <span className="text-ink-soft">+{e.points} pts</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
