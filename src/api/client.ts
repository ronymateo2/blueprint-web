const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  identity: string | null;
}

export interface Reminder {
  id: string;
  habit_id: string;
  time: string;
  days: string;
  enabled: number;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  type: 'count' | 'time' | 'yn' | 'qty' | 'at';
  goal: number;
  unit: string | null;
  points: number;
  sort_order: number;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'interval';
  frequency_config: string;
  archived_at: string | null;
  start_date: string | null;
  end_date: string | null;
  identity: string | null;
  min_action: string | null;
  created_at: string;
  updated_at: string;
  reminders: Reminder[];
}

export interface Entry {
  id: string;
  user_id: string;
  habit_id: string;
  value: number;
  points: number;
  logged_at: string;
  note: string | null;
  alignment: 'yes' | 'maybe' | 'no' | null;
  day_energy: 'good' | 'ok' | 'hard' | null;
  created_at: string;
  habit_name?: string;
  habit_icon?: string;
}

export interface Skip {
  habit_id: string;
  local_date: string;
}

export type FrictionCause = 'no_time' | 'tired' | 'forgot' | 'mood' | 'other';

export interface FrictionLog {
  habit_id: string;
  local_date: string;
  cause: FrictionCause;
  note: string | null;
}

export interface Stats {
  totalPoints: number;
  todayPoints: number;
  streak: number;
  level: number;
  levelXp: number;
  levelNext: number;
  weekPct: number;
  weeklyChart: number[];
  timezone: string;
}

export interface HomeStats {
  todayPoints: number;
  streak: number;
  weeklyChart: number[];
}

export interface MeStats {
  totalPoints: number;
  streak: number;
  level: number;
}

export interface PointsChartBar {
  label: string;
  points: number;
  today: boolean;
}

export interface PointsData {
  totalPoints: number;
  streak: number;
  level: number;
  levelXp: number;
  levelNext: number;
  todayPoints: number;
  weekPct: number;
  dayChart: PointsChartBar[];
  weekChart: PointsChartBar[];
  monthChart: PointsChartBar[];
  yearChart: PointsChartBar[];
  habitHeatmaps: { habitId: string; values: number[] }[];
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    googleUrl: () => `${BASE}/api/auth/google`,
    me: () => req<User>('GET', '/api/auth/me'),
    logout: () => req<{ ok: boolean }>('POST', '/api/auth/logout'),
    patchMe: (data: Partial<Pick<User, 'timezone' | 'display_name' | 'identity'>>) => req<User>('PATCH', '/api/auth/me', data),
  },

  habits: {
    list: (archived = false) => req<Habit[]>('GET', `/api/habits${archived ? '?archived=1' : ''}`),
    get: (id: string) => req<Habit>('GET', `/api/habits/${id}`),
    create: (data: Omit<Habit, 'id' | 'user_id' | 'archived_at' | 'created_at' | 'updated_at' | 'reminders' | 'identity' | 'min_action'>) =>
      req<Habit>('POST', '/api/habits', data),
    update: (id: string, data: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
      req<Habit>('PUT', `/api/habits/${id}`, data),
    archive: (id: string) => req<{ ok: boolean }>('PATCH', `/api/habits/${id}/archive`),
    unarchive: (id: string) => req<{ ok: boolean }>('PATCH', `/api/habits/${id}/unarchive`),
    delete: (id: string) => req<{ ok: boolean }>('DELETE', `/api/habits/${id}`),
  },

  reminders: {
    list: (habitId: string) => req<Reminder[]>('GET', `/api/habits/${habitId}/reminders`),
    create: (habitId: string, data: Pick<Reminder, 'time' | 'days' | 'enabled'>) =>
      req<Reminder>('POST', `/api/habits/${habitId}/reminders`, data),
    update: (id: string, data: Partial<Pick<Reminder, 'time' | 'days' | 'enabled'>>) =>
      req<Reminder>('PUT', `/api/reminders/${id}`, data),
    delete: (id: string) => req<{ ok: boolean }>('DELETE', `/api/reminders/${id}`),
  },

  entries: {
    list: (params?: { from?: string; to?: string; habit_id?: string }) => {
      const q = new URLSearchParams();
      if (params?.from) q.set('from', params.from);
      if (params?.to) q.set('to', params.to);
      if (params?.habit_id) q.set('habit_id', params.habit_id);
      return req<Entry[]>('GET', `/api/entries?${q}`);
    },
    create: (data: { habit_id: string; value?: number; note?: string; logged_at?: string; alignment?: 'yes' | 'maybe' | 'no' | null; day_energy?: 'good' | 'ok' | 'hard' | null }) =>
      req<Entry>('POST', '/api/entries', data),
    delete: (id: string) => req<{ ok: boolean }>('DELETE', `/api/entries/${id}`),
  },

  skips: {
    list: (local_date: string) => req<Skip[]>('GET', `/api/skips?local_date=${encodeURIComponent(local_date)}`),
    listByHabit: (habit_id: string) => req<Skip[]>('GET', `/api/skips?habit_id=${encodeURIComponent(habit_id)}`),
    create: (habit_id: string, local_date: string) => req<Skip>('POST', '/api/skips', { habit_id, local_date }),
    delete: (habit_id: string, local_date: string) => req<{ ok: boolean }>('DELETE', `/api/skips/${encodeURIComponent(habit_id)}?local_date=${encodeURIComponent(local_date)}`),
  },

  friction: {
    list: (habit_id: string, from?: string, to?: string) => {
      const q = new URLSearchParams({ habit_id });
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      return req<FrictionLog[]>('GET', `/api/friction?${q}`);
    },
    save: (data: { habit_id: string; local_date: string; cause: FrictionCause; note?: string | null }) =>
      req<FrictionLog>('POST', '/api/friction', data),
  },

  stats: {
    get: () => req<Stats>('GET', '/api/stats'),
    getHome: () => req<HomeStats>('GET', '/api/stats/home'),
    getMe: () => req<MeStats>('GET', '/api/stats/me'),
  },

  points: {
    get: () => req<PointsData>('GET', '/api/points'),
  },
};
