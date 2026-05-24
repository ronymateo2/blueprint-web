import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon } from '@phosphor-icons/react';
import { type Habit } from '../../api/client';
import { IconTile } from '../habits/IconTile';
import { SketchBox } from '../ui/SketchBox';
import { ReminderBadge } from '../habits/ReminderBadge';

interface HabitCardProps {
  habit: Habit;
  sum: number;
  isSkipped: boolean;
  isFuture: boolean;
  isToday: boolean;
  selectedDate: string;
  timezone: string;
  logState?: 'logging' | 'done' | 'exiting';
  onLog: (habit: Habit, e: React.MouseEvent) => void;
  onLongPress: (habit: Habit) => void;
}

function habitSubtitle(h: Habit, todaySum: number): string {
  switch (h.type) {
    case 'count': return todaySum >= h.goal ? 'hecho' : `de ${h.goal} · +${h.points} pts c/u`;
    case 'time':  return `de ${h.goal} min`;
    case 'yn':    return todaySum >= 1 ? 'hecho' : 'pendiente';
    case 'qty':   return `de ${h.goal} ${h.unit ?? ''}`;
    case 'at':    return todaySum >= 1 ? 'registrado' : 'pendiente';
    default:      return '';
  }
}

export function HabitCard({
  habit,
  sum,
  isSkipped,
  isFuture,
  isToday,
  selectedDate,
  timezone,
  logState,
  onLog,
  onLongPress,
}: HabitCardProps) {
  const navigate = useNavigate();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActive = useRef(false);

  function startLongPress() {
    longPressTimer.current = setTimeout(() => {
      longPressActive.current = true;
      navigator.vibrate?.(18);
      onLongPress(habit);
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const done = sum >= habit.goal;
  const ringValue = habit.type === 'yn' ? (sum >= 1 ? 1 : 0) : Math.min(1, sum / habit.goal);
  const valueLabel = isFuture
    ? '—'
    : isSkipped
    ? '—'
    : habit.type === 'yn' ? (sum >= 1 ? <CheckIcon size={28} weight="bold" style={{ animation: 'check-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} /> : '0')
    : habit.type === 'time' ? `${sum}′`
    : `${sum}`;

  return (
    <div
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onClick={() => {
        if (longPressActive.current) {
          longPressActive.current = false;
          return;
        }
        if (!isFuture) {
          navigate(`/habits/${habit.id}`, { state: { selectedDate } });
        }
      }}
      style={{
        cursor: !isFuture ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        animation: logState === 'exiting'
          ? 'card-exit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'fadeIn 0.22s ease-out',
        overflow: logState === 'exiting' ? 'hidden' : undefined,
      }}
    >
      <SketchBox
        padding={14}
        radius={16}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: (done || isSkipped) ? 0.62 : 1,
          background: (done || isSkipped) ? 'rgba(255,255,255,0.4)' : 'transparent',
        }}
      >
        <IconTile kind={habit.icon} size={50} />
        <div className="flex-1 min-w-0">
          <div
            className="font-display leading-none overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              fontSize: 28,
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {habit.name}
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 15, marginTop: 4 }}>
            {habitSubtitle(habit, sum)}
          </div>
          {isToday && !done && habit.reminders && habit.reminders.length > 0 && (
            <ReminderBadge reminders={habit.reminders} timezone={timezone} />
          )}
        </div>

        {/* Tap-to-log area */}
        <div
          onClick={(!isFuture && !isSkipped) ? (e) => onLog(habit, e) : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            minWidth: 44,
            opacity: (!isFuture && !isSkipped) ? 1 : 0.35,
            pointerEvents: (!isFuture && !isSkipped) ? 'auto' : 'none',
          }}
        >
          <div
            className="font-display"
            style={{
              fontSize: 38,
              lineHeight: 0.95,
              letterSpacing: -0.5,
              color: done ? 'var(--ink-soft)' : (sum > 0 ? 'var(--coral)' : 'var(--ink)'),
              textAlign: 'center',
              minWidth: 36,
            }}
          >
            {logState === 'logging' ? '…' : (logState === 'done' || logState === 'exiting') ? (
              <CheckIcon size={28} weight="bold" style={{ animation: 'check-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} />
            ) : valueLabel}
          </div>
          {habit.type !== 'yn' && !isFuture && !isSkipped && (
            <div style={{
              width: 44,
              height: 5,
              borderRadius: 999,
              border: '1px solid var(--ink)',
              overflow: 'hidden',
              background: 'var(--paper)',
            }}>
              <div style={{
                width: `${Math.min(100, ringValue * 100)}%`,
                height: '100%',
                background: done ? 'var(--ink-soft)' : 'var(--coral)',
                transition: 'width 320ms ease',
              }} />
            </div>
          )}
        </div>
      </SketchBox>
    </div>
  );
}
