import { ClockIcon } from '@phosphor-icons/react';
import { useVisibleTick } from '../hooks/useVisibleTick';
import type { Reminder } from '../api/client';

function nowMinutesInTz(tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

function todayDayLetter(tz: string): string {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(new Date());
  const map: Record<string, string> = { Mon: 'L', Tue: 'M', Wed: 'X', Thu: 'J', Fri: 'V', Sat: 'S', Sun: 'D' };
  return map[short] ?? '';
}

function reminderStatus(reminders: Reminder[] | undefined, tz: string): { kind: 'upcoming' | 'past'; minutes: number } | null {
  if (!reminders || reminders.length === 0) return null;
  const letter = todayDayLetter(tz);
  const slots: number[] = [];
  for (const r of reminders) {
    if (!r.enabled) continue;
    let days: string[] = [];
    try { days = JSON.parse(r.days) as string[]; } catch { /* */ }
    if (!days.includes(letter)) continue;
    const [h, m] = r.time.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) slots.push(h * 60 + m);
  }
  if (slots.length === 0) return null;
  slots.sort((a, b) => a - b);
  const now = nowMinutesInTz(tz);
  const next = slots.find(s => s >= now);
  if (next !== undefined) return { kind: 'upcoming', minutes: next - now };
  return { kind: 'past', minutes: now - slots[slots.length - 1] };
}

function formatDiff(mins: number): string {
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function ReminderBadge({ reminders, timezone }: { reminders: Reminder[] | undefined; timezone: string }) {
  useVisibleTick();
  const r = reminderStatus(reminders, timezone);
  if (!r) return null;
  const isPast = r.kind === 'past';
  return (
    <div
      className="font-hand"
      style={{
        fontSize: 13, marginTop: 3,
        display: 'flex', alignItems: 'center', gap: 4,
        color: isPast ? 'var(--coral)' : 'var(--ink-soft)',
        opacity: isPast ? 1 : 0.85,
      }}
    >
      <ClockIcon size={11} weight={isPast ? 'fill' : 'regular'} />
      {isPast ? `hace ${formatDiff(r.minutes)}` : `en ${formatDiff(r.minutes)}`}
    </div>
  );
}
