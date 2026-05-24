import { ConfettiIcon } from '@phosphor-icons/react';
import { Ring } from '../ui/Ring';
import { MiniBars } from '../habits/MiniBars';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface DailyProgressProps {
  isFuture: boolean;
  isToday: boolean;
  activeHabitsCount: number;
  nonSkippedActiveHabitsCount: number;
  doneHabits: number;
  dayPct: number;
  ptsPct: number;
  displayPoints: number;
  weeklyChart: any[];
  selectedDate: string;
  timezone: string;
}

export function DailyProgress({
  isFuture,
  isToday,
  activeHabitsCount,
  nonSkippedActiveHabitsCount,
  doneHabits,
  dayPct,
  ptsPct,
  displayPoints,
  weeklyChart,
  selectedDate,
  timezone,
}: DailyProgressProps) {
  const [ringFlipped, setRingFlipped] = useLocalStorage('ring_view', false);

  function toggleRingView() {
    setRingFlipped(!ringFlipped);
  }

  return (
    <div className="flex items-center gap-[18px]" style={{ padding: '4px 18px 10px' }}>
      <div style={{ position: 'relative', flexShrink: 0, cursor: isFuture ? 'default' : 'pointer' }} onClick={isFuture ? undefined : toggleRingView}>
        <Ring
          size={108} stroke={10}
          value={isFuture ? 0 : (ringFlipped ? dayPct : ptsPct)}
          color={isFuture ? 'var(--ink-soft)' : 'var(--coral)'}
        />
        {isFuture ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-display leading-none" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-soft)' }}>
              {activeHabitsCount}
            </span>
            <span className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>hábitos</span>
          </div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s ease',
            transform: ringFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backfaceVisibility: 'hidden',
            }}>
              <span className="font-display leading-none" style={{ fontSize: 28, fontWeight: 700 }}>{displayPoints}</span>
              <span className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>{isToday ? 'pts hoy' : 'pts'}</span>
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}>
              <span className="font-display leading-none" style={{ fontSize: 28, fontWeight: 700 }}>{`${Math.round(dayPct * 100)}%`}</span>
              <span className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>del día</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-[6px]">
        {isFuture ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="font-display leading-none" style={{ fontSize: 56, letterSpacing: -1, lineHeight: 0.9 }}>
                0
              </span>
              <span className="font-display" style={{ fontSize: 30, color: 'var(--ink-soft)' }}>
                {' / '}{activeHabitsCount}
              </span>
            </div>
            <span className="font-hand text-ink-soft" style={{ fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              hábitos programados
            </span>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="font-display leading-none" style={{ fontSize: 56, letterSpacing: -1, lineHeight: 0.9 }}>
                {doneHabits}
              </span>
              <span className="font-display" style={{ fontSize: 30, color: 'var(--ink-soft)' }}>
                {' / '}{nonSkippedActiveHabitsCount}
              </span>
            </div>
            <span className="font-hand text-ink-soft" style={{ fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              hábitos{nonSkippedActiveHabitsCount > 0 && doneHabits === nonSkippedActiveHabitsCount ? <> · ¡completo! <ConfettiIcon size={14} weight="fill" color="var(--coral)" style={{ display: 'inline', verticalAlign: 'middle' }} /></> : ''}
            </span>
          </>
        )}
        {weeklyChart.length > 0 && <MiniBars weeklyChart={weeklyChart} selectedDate={selectedDate} timezone={timezone} />}
      </div>
    </div>
  );
}
