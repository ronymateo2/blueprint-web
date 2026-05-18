import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { HandIcon } from '../components/HandIcon';
import { TabBar } from '../components/TabBar';

const TABS = ['Día', 'Semana', 'Mes', 'Año'];

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function History() {
  const [activeTab, setActiveTab] = useState(1);
  const { habits } = useHabits();
  const from = activeTab === 0 ? daysAgo(0) : activeTab === 1 ? daysAgo(6) : activeTab === 2 ? daysAgo(29) : daysAgo(364);
  const { entries } = useEntries({ from });

  // Build per-habit heatmap data (14 weeks)
  function habitHeatmap(habitId: string): number[] {
    const byDay: Record<string, number> = {};
    entries.filter((e) => e.habit_id === habitId).forEach((e) => {
      const d = e.logged_at.slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + 1;
    });
    const vals: number[] = [];
    for (let i = 97; i >= 0; i--) {
      const d = daysAgo(i);
      vals.push(Math.min(1, (byDay[d] ?? 0) * 0.5));
    }
    return vals;
  }

  const recent = entries.slice(0, 20);

  return (
    <div className="screen">
      <div style={{ padding: '16px 18px 0' }}>
        <div className="font-display leading-none" style={{ fontSize: 34 }}>Histórico</div>
      </div>

      {/* D/S/M/A underline tabs */}
      <div className="flex gap-[6px]" style={{ padding: '10px 14px 4px' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className="flex-1 text-center cursor-pointer bg-transparent font-hand"
            style={{
              padding: '5px 0',
              borderBottom: `${i === activeTab ? 2.5 : 1.5}px solid ${i === activeTab ? 'var(--coral)' : 'var(--ink-soft)'}`,
              fontSize: 13,
              color: i === activeTab ? 'var(--ink)' : 'var(--ink-soft)',
              border: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >{t}</button>
        ))}
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '8px 14px 0' }}>

        {/* Per-habit heatmap rows */}
        <div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginBottom: 6 }}>
            Calor por hábito · 14 semanas
          </div>
          <div className="flex flex-col gap-[6px]">
            {habits.slice(0, 6).map((h) => (
              <div key={h.id} className="flex items-center gap-[8px]">
                <HandIcon kind={h.icon} size={16} />
                <span className="font-hand overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 12, width: 64 }}>{h.name}</span>
                <div className="flex-1 grid gap-[2px]" style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(2, 1fr)' }}>
                  {habitHeatmap(h.id).slice(-28).map((v, i) => (
                    <div
                      key={i}
                      style={{
                        width: 8, height: 8, borderRadius: 2,
                        border: '0.5px solid var(--ink)',
                        background: v <= 0 ? 'transparent' : `rgba(42,42,42,${0.15 + v * 0.7})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginBottom: 6 }}>RECIENTES</div>
          {recent.length === 0 ? (
            <div className="font-hand text-ink-soft" style={{ fontSize: 14, padding: '8px 0' }}>Sin registros en este período</div>
          ) : (
            recent.map((e) => (
              <div key={e.id} className="flex justify-between items-center font-hand" style={{
                fontSize: 13,
                padding: '5px 0', borderBottom: '1px dashed var(--ink-soft)',
              }}>
                <span className="text-ink-soft" style={{ width: 44 }}>{formatTime(e.logged_at)}</span>
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ marginLeft: 10 }}>
                  {e.habit_name ?? 'Hábito'} {e.value > 1 ? `+${e.value}` : '+1'}
                </span>
                <span className="text-ink-soft">+{e.points}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ height: 16 }} />
      </div>

      <TabBar />
    </div>
  );
}
