import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { Scribble } from '../components/Scribble';
import { Btn } from '../components/Btn';
import { SketchBox } from '../components/SketchBox';
import { HandIcon } from '../components/HandIcon';
import { daysAgoLocalDate, utcToLocalDate, todayLocalDate, formatTime } from '../lib/dateUtils';
import { useAuthContext } from '../context/AuthContext';

function formatDateHeader(dateStr: string, timezone: string): string {
  const today = todayLocalDate(timezone);
  const yesterday = daysAgoLocalDate(1, timezone);
  if (dateStr === today) return 'HOY';
  if (dateStr === yesterday) return 'AYER';

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
  const { timezone } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();
  const habit = habits.find((h) => h.id === id);

  // Fetch all entries for this habit
  const { entries, loading: loadingEntries } = useEntries({ habitId: id });

  const isLoading = loadingHabits || loadingEntries;

  // Heatmap: last 98 days (14 weeks)
  const heatmapData = (() => {
    const byDay: Record<string, number> = {};
    entries.forEach((e) => {
      const d = utcToLocalDate(e.logged_at, timezone);
      byDay[d] = (byDay[d] ?? 0) + 1;
    });
    const vals: number[] = [];
    for (let i = 97; i >= 0; i--) {
      const d = daysAgoLocalDate(i, timezone);
      vals.push(Math.min(1, (byDay[d] ?? 0) * 0.5));
    }
    return vals;
  })();

  // Group entries by date, sorted desc
  const byDate: Record<string, typeof entries> = {};
  entries.forEach((e) => {
    const d = utcToLocalDate(e.logged_at, timezone);
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
    ? utcToLocalDate([...entries].sort((a, b) => a.logged_at.localeCompare(b.logged_at))[0].logged_at, timezone)
    : null;

  return (
    <div className="screen">
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.38; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Btn onClick={() => navigate(-1)} style={{ height: 36, padding: '0 14px', fontSize: 15 }}>
          <ArrowLeft size={16} /> Volver
        </Btn>
      </div>

      <div className="screen-scroll" style={{ padding: '12px 14px 100px' }}>
        {/* Habit Title & Icon */}
        <div style={{ marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {isLoading ? (
              <div className="skeleton-pulse" style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(42,42,42,0.12)' }} />
            ) : (
              <HandIcon kind={habit?.icon ?? ''} size={28} />
            )}
            {isLoading ? (
              <div className="skeleton-pulse" style={{ height: 30, width: '55%', backgroundColor: 'rgba(42,42,42,0.12)', borderRadius: 5 }} />
            ) : (
              <div className="font-display leading-none" style={{ fontSize: 34 }}>
                {habit?.name}
              </div>
            )}
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 15, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            Historial <Scribble width={54} style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -2 }} />
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="skeleton-pulse" style={{ height: 14, width: '65%', backgroundColor: 'rgba(42,42,42,0.08)', borderRadius: 3, marginTop: 6 }} />
        ) : (
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, marginTop: 6, letterSpacing: 0.2 }}>
            {`${totalEntries} ${totalEntries === 1 ? 'registro' : 'registros'}${sinceDate ? ` · desde ${formatSinceDate(sinceDate)}` : ''}`}
          </div>
        )}

        {/* Heatmap */}
        <SketchBox padding={12} radius={14} style={{ marginTop: 16 }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
            Últimas 14 semanas
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 1fr)',
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
            gap: 3.5,
          }}>
            {isLoading
              ? Array.from({ length: 98 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-pulse"
                    style={{
                      aspectRatio: '1',
                      borderRadius: 3.5,
                      border: '1.2px solid rgba(42,42,42,0.15)',
                      background: 'transparent',
                    }}
                  />
                ))
              : heatmapData.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 3.5,
                      border: '1.2px solid var(--ink)',
                      background: v <= 0 ? 'transparent' : `rgba(42,42,42,${0.15 + v * 0.7})`,
                    }}
                  />
                ))
            }
          </div>
        </SketchBox>

        {/* Entry list grouped by date */}
        <div style={{ marginTop: 20 }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, padding: '4px 4px 6px', textTransform: 'uppercase' }}>
            REGISTROS
          </div>
          {isLoading ? (
            <SketchBox padding={14} radius={14}>
              <div className="flex flex-col gap-[14px]">
                {Array.from({ length: 2 }).map((_, groupIdx) => (
                  <div
                    key={groupIdx}
                    style={{
                      borderBottom: groupIdx === 1 ? 'none' : '1.6px dashed var(--ink-soft)',
                      paddingBottom: groupIdx === 1 ? 0 : 12,
                    }}
                  >
                    <div className="skeleton-pulse" style={{ height: 12, width: '30%', backgroundColor: 'rgba(42,42,42,0.08)', borderRadius: 3, marginBottom: 10 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Array.from({ length: groupIdx === 0 ? 3 : 2 }).map((_, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex justify-between items-center"
                          style={{ padding: '6px 0', borderBottom: itemIdx === (groupIdx === 0 ? 2 : 1) ? 'none' : '1px dashed var(--ink-soft)' }}
                        >
                          <div className="flex items-center gap-[8px] flex-1 min-w-0">
                            <div className="skeleton-pulse" style={{ height: 12, width: 35, backgroundColor: 'rgba(42,42,42,0.06)', borderRadius: 2 }} />
                            <div className="skeleton-pulse" style={{ height: 14, width: '45%', backgroundColor: 'rgba(42,42,42,0.12)', borderRadius: 3, marginLeft: 6 }} />
                          </div>
                          <div className="skeleton-pulse" style={{ height: 16, width: 45, backgroundColor: 'rgba(235,94,85,0.12)', borderRadius: 4 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SketchBox>
          ) : grouped.length === 0 ? (
            <SketchBox padding={16} radius={14} dashed style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="font-hand text-ink-soft" style={{ fontSize: 16 }}>Sin registros aún</div>
            </SketchBox>
          ) : (
            <SketchBox padding={14} radius={14}>
              <div className="flex flex-col gap-[14px]">
                {grouped.map(({ date, entries: dayEntries }, groupIdx) => (
                  <div key={date} style={{ borderBottom: groupIdx === grouped.length - 1 ? 'none' : '1.6px dashed var(--ink-soft)', paddingBottom: groupIdx === grouped.length - 1 ? 0 : 12 }}>
                    <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.5, marginBottom: 6, fontWeight: 'bold' }}>
                      {formatDateHeader(date, timezone)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEntries.map((e, itemIdx) => (
                        <div
                          key={e.id}
                          className="flex justify-between items-center font-hand"
                          style={{
                            fontSize: 16,
                            padding: '6px 0',
                            borderBottom: itemIdx === dayEntries.length - 1 ? 'none' : '1px dashed var(--ink-soft)',
                            opacity: 0.9,
                          }}
                        >
                          <div className="flex items-center gap-[8px] flex-1 min-w-0">
                            <span className="text-ink-soft" style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                              {formatTime(e.logged_at, timezone)}
                            </span>
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-ink" style={{ marginLeft: 6 }}>
                              {habit?.name}{e.value > 1 ? ` +${e.value}` : ''}
                            </span>
                          </div>
                          <span className="font-display text-coral" style={{ fontSize: 18, fontWeight: 'bold' }}>
                            +{e.points} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SketchBox>
          )}
        </div>
      </div>
    </div>
  );
}
