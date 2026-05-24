import { type Habit } from '../api/client';
import { localDayUtcRange } from './dateUtils';

export function formatSelectedDate(localDate: string, tz: string): string {
  const { from } = localDayUtcRange(localDate, tz);
  const noon = new Date(new Date(from).getTime() + 12 * 3_600_000);
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' }).format(noon);
}

export function formatDayName(localDate: string, tz: string): string {
  const { from } = localDayUtcRange(localDate, tz);
  const noon = new Date(new Date(from).getTime() + 12 * 3_600_000);
  return new Intl.DateTimeFormat('es', { weekday: 'long' }).format(noon);
}

export function isHabitDueOnDate(h: Habit, localDate: string, tz: string): boolean {
  const ft = h.frequency_type ?? 'daily';
  if (ft === 'daily') return true;
  let cfg: Record<string, unknown> = {};
  try { cfg = JSON.parse(h.frequency_config ?? '{}'); } catch { /* */ }

  const { from } = localDayUtcRange(localDate, tz);
  const noon = new Date(new Date(from).getTime() + 12 * 3_600_000);

  if (ft === 'weekly') {
    const days = (cfg.days as string[]) ?? [];
    const short = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(noon);
    const map: Record<string, string> = { Mon: 'L', Tue: 'M', Wed: 'X', Thu: 'J', Fri: 'V', Sat: 'S', Sun: 'D' };
    return days.includes(map[short] ?? '');
  }
  if (ft === 'monthly') {
    const days = (cfg.days as number[]) ?? [];
    const dom = noon.getDate();
    return days.includes(dom);
  }
  if (ft === 'interval') {
    const every = (cfg.every as number) ?? 1;
    const diffDays = Math.floor((noon.getTime() - new Date(h.created_at).getTime()) / 86_400_000);
    return diffDays % every === 0;
  }
  return true;
}
