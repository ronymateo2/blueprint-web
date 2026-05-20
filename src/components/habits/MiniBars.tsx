import { todayLocalDate, addDays } from '../../lib/dateUtils';

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function MiniBars({ weeklyChart, selectedDate, timezone }: { weeklyChart: number[]; selectedDate: string; timezone: string }) {
  const raw = weeklyChart.length >= 7 ? weeklyChart.slice(-7) : weeklyChart;
  const realToday = todayLocalDate(timezone);
  const selectedIso = (new Date(`${selectedDate}T12:00:00Z`).getDay() + 6) % 7;
  const mondayDateStr = addDays(selectedDate, -selectedIso);

  const dateToValue = Object.fromEntries(
    raw.map((v, i) => [addDays(realToday, i - (raw.length - 1)), v])
  );

  const slots = Array.from({ length: 7 }, (_, iso) => ({
    v: dateToValue[addDays(mondayDateStr, iso)] ?? 0,
    iso
  }));

  const max = Math.max(1, ...slots.map(s => s.v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
        {slots.map(({ v, iso }) => (
          <div key={iso} style={{
            flex: 1,
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: iso === selectedIso ? 'var(--coral)' : 'var(--ink)',
            opacity: iso === selectedIso ? 1 : 0.35,
            borderRadius: 2,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {slots.map(({ iso }) => (
          <div key={iso} className="font-hand" style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 10,
            color: iso === selectedIso ? 'var(--coral)' : 'var(--ink-soft)',
            fontWeight: iso === selectedIso ? 600 : 400,
          }}>{DAY_LETTERS[iso]}</div>
        ))}
      </div>
    </div>
  );
}
