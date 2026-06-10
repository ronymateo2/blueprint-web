const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const fmtCache = new Map<string, Intl.DateTimeFormat>();
export function fmt(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + '|' + JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    fmtCache.set(key, f);
  }
  return f;
}

export function utcToLocalDate(isoUtc: string, tz = browserTz): string {
  return fmt('sv-SE', { timeZone: tz, dateStyle: 'short' }).format(new Date(isoUtc));
}

export function todayLocalDate(tz = browserTz): string {
  return utcToLocalDate(new Date().toISOString(), tz);
}

export function daysAgoLocalDate(n: number, tz = browserTz): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return utcToLocalDate(d.toISOString(), tz);
}

export function localDayUtcRange(localDate: string, tz = browserTz): { from: string; to: string } {
  // Find UTC offset by comparing probe UTC time vs its local representation
  const probe = new Date(`${localDate}T12:00:00Z`);
  const localStr = fmt('sv-SE', {
    timeZone: tz, dateStyle: 'short', timeStyle: 'medium',
  }).format(probe); // e.g. "2026-05-18 07:00:00"
  const offsetMs = probe.getTime() - new Date(localStr.replace(' ', 'T') + 'Z').getTime();
  const fromMs = new Date(`${localDate}T00:00:00Z`).getTime() + offsetMs;
  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(fromMs + 86_400_000 - 1).toISOString(),
  };
}

export function addDays(localDate: string, n: number): string {
  const d = new Date(`${localDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatTime(isoUtc: string, tz = browserTz): string {
  return fmt('es', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(isoUtc));
}
