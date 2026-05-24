import { useNavigate } from 'react-router-dom';
import { FireIcon, PlusIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Scribble } from '../ui/Scribble';
import { Btn } from '../ui/Btn';
import { todayLocalDate, addDays } from '../../lib/dateUtils';
import { formatSelectedDate, formatDayName } from '../../lib/habitUtils';

interface HomeHeaderProps {
  selectedDate: string;
  timezone: string;
  displayPoints: number;
  streak: number;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoToday: () => void;
}

export function HomeHeader({
  selectedDate,
  timezone,
  displayPoints,
  streak,
  onGoBack,
  onGoForward,
  onGoToday,
}: HomeHeaderProps) {
  const navigate = useNavigate();
  const realToday = todayLocalDate(timezone);
  const isToday = selectedDate === realToday;

  const isYesterday = selectedDate === addDays(realToday, -1);
  const isTomorrow = selectedDate === addDays(realToday, 1);
  const isRelativeDay = isToday || isYesterday || isTomorrow;
  const relativeTitle = isToday
    ? 'Hoy'
    : isYesterday
    ? 'Ayer'
    : isTomorrow
    ? 'Mañana'
    : formatDayName(selectedDate, timezone);

  return (
    <div style={{ padding: '14px 18px 8px' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="font-display leading-none" style={{ fontSize: isRelativeDay ? 44 : 38, textTransform: 'capitalize' }}>
            {relativeTitle}
          </div>
          {isToday ? (
            <Scribble width={58} style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -4, marginLeft: 2 }} />
          ) : (
            <button
              onClick={onGoToday}
              className="font-hand cursor-pointer active:scale-95 transition-transform"
              style={{
                border: '1.6px solid var(--coral)',
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--coral)',
                fontSize: 12,
                padding: '2px 10px',
                lineHeight: 1.2,
                marginLeft: 8,
                marginTop: 6,
              }}
            >
              hoy
            </button>
          )}
        </div>
        <Btn onClick={() => navigate('/habits/new')} style={{ fontSize: 16, padding: '4px 12px', marginTop: 6 }}><PlusIcon size={14} /> nuevo</Btn>
      </div>

      {/* Date navigator */}
      <div className="flex items-center" style={{ marginTop: 8, gap: 4 }}>
        <button
          onClick={onGoBack}
          className="font-hand bg-transparent cursor-pointer active:opacity-60 transition-opacity"
          style={{ color: 'var(--ink-soft)', padding: '2px 4px', border: 'none', lineHeight: 1, flexShrink: 0 }}
        ><CaretLeftIcon size={18} /></button>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span
            className="font-hand text-ink-soft"
            style={{ fontSize: 15, textTransform: 'capitalize', letterSpacing: 0.1 }}
          >
            {formatSelectedDate(selectedDate, timezone)}
          </span>
        </div>

        <button
          onClick={onGoForward}
          className="font-hand bg-transparent cursor-pointer active:opacity-60 transition-opacity"
          style={{ color: 'var(--ink-soft)', padding: '2px 4px', border: 'none', lineHeight: 1, flexShrink: 0 }}
        ><CaretRightIcon size={18} /></button>
      </div>

      <div className="font-hand text-ink-soft flex items-center gap-[4px]" style={{ fontSize: 15, marginTop: 4 }}>
        {isToday
          ? <>{displayPoints} pts · racha {streak}d</>
          : <>{displayPoints > 0 ? `${displayPoints} pts ese día · racha ${streak}d` : `racha ${streak}d`}</>
        }
        {streak >= 3 && <FireIcon size={15} weight="fill" color="var(--coral)" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} />}
      </div>
    </div>
  );
}
