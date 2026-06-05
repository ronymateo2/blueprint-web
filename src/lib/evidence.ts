// Motor de evidencia (Psico-Cibernética). Puro, sin red.
// Deriva esfuerzo de entries (value vs goal), enriquece con energía del día,
// y produce frases de evidencia, conteos de período y % de fuerza de identidad.
import { type Entry, type Habit } from '../api/client';
import { utcToLocalDate, todayLocalDate, addDays } from './dateUtils';
import { isHabitDueOnDate } from './habitUtils';

export type Effort = 'full' | 'min' | 'none'; // derivado de value vs goal
export type Energy = 'good' | 'ok' | 'hard';
export type Alignment = 'yes' | 'maybe' | 'no';
export type Period = 'week' | 'month' | '3m' | 'year';

export const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, '3m': 90, year: 365 };
export const PERIOD_LABELS: Record<Period, string> = { week: 'Semana', month: 'Mes', '3m': '3 meses', year: 'Año' };

// Pesos y constantes — placeholders, afinar con datos reales.
const W_CONSISTENCY = 0.5;
const W_ALIGNED = 0.3;
const W_RESILIENCE = 0.2;

export interface DayState {
  date: string; // local YYYY-MM-DD
  effort: Effort;
  energy: Energy | null;
  alignment: Alignment | null;
}

// ── Estados por día ─────────────────────────────────────────────────────────

function dayStatesByDate(entries: Entry[], habit: Habit, tz: string): Map<string, DayState> {
  const acc = new Map<string, { sum: number; energy: Energy | null; alignment: Alignment | null; lastTs: string }>();
  for (const e of entries) {
    const d = utcToLocalDate(e.logged_at, tz);
    const cur = acc.get(d) ?? { sum: 0, energy: null, alignment: null, lastTs: '' };
    cur.sum += e.value;
    // energía/alignment del registro más reciente del día (fallback al primero no-nulo)
    if (e.logged_at >= cur.lastTs) {
      cur.lastTs = e.logged_at;
      if (e.day_energy) cur.energy = e.day_energy;
      if (e.alignment) cur.alignment = e.alignment;
    } else {
      if (!cur.energy && e.day_energy) cur.energy = e.day_energy;
      if (!cur.alignment && e.alignment) cur.alignment = e.alignment;
    }
    acc.set(d, cur);
  }
  const out = new Map<string, DayState>();
  for (const [d, v] of acc) {
    out.set(d, {
      date: d,
      effort: v.sum >= habit.goal ? 'full' : v.sum > 0 ? 'min' : 'none',
      energy: v.energy,
      alignment: v.alignment,
    });
  }
  return out;
}

function prevDueDate(habit: Habit, tz: string, date: string): string | null {
  for (let i = 1; i <= 60; i++) {
    const d = addDays(date, -i);
    if (isHabitDueOnDate(habit, d, tz)) return d;
  }
  return null;
}

// ── Evidencia de un día (pantallas 2 y 3) ───────────────────────────────────

export interface DayEvidence {
  statements: string[]; // todas (pantalla 2); cap a 3 en pantalla 3
  proofOfDay: string; // "Hoy demostraste que: <X>"
  acted: boolean;
}

export function buildDayEvidence(day: DayState, returnedAfterFail: boolean, identity: string | null): DayEvidence {
  const s: string[] = [];
  const acted = day.effort !== 'none';

  if (acted) s.push('No abandonaste tu hábito');
  if (day.effort === 'min') s.push(day.energy === 'hard' ? 'Usaste la versión mínima en un día difícil' : 'Usaste la versión mínima');
  if (acted && day.energy === 'hard') s.push('Mantuviste tu identidad a pesar del cansancio');
  if (returnedAfterFail && acted) s.push('Volviste después de fallar — no abandonas, regresas y ajustas');
  if (day.alignment === 'yes') s.push('Esto se sintió como la persona que quieres ser');
  if (day.effort === 'full' && day.energy === 'good') s.push('Diste lo mejor en un buen día');
  if (!acted) s.push('Registraste tu día — eso ya es no abandonar. Mañana ajustas y vuelves.');

  let proofOfDay = 'Eres alguien que no abandona';
  if (returnedAfterFail) proofOfDay = 'Eres alguien que regresa y ajusta';
  else if (day.effort === 'full' && identity) proofOfDay = identity;

  return { statements: [...new Set(s)], proofOfDay, acted };
}

// Evidencia de un día concreto a partir de los entries (resuelve returnedAfterFail).
export function dayEvidenceFor(entries: Entry[], habit: Habit, tz: string, localDate: string): DayEvidence {
  const states = dayStatesByDate(entries, habit, tz);
  const day: DayState = states.get(localDate) ?? { date: localDate, effort: 'none', energy: null, alignment: null };
  let returnedAfterFail = false;
  if (day.effort !== 'none') {
    const prev = prevDueDate(habit, tz, localDate);
    const prevState = prev ? states.get(prev) : undefined;
    returnedAfterFail = !!prev && (!prevState || prevState.effort === 'none');
  }
  return buildDayEvidence(day, returnedAfterFail, habit.identity);
}

// ── Agregación de un rango ──────────────────────────────────────────────────

interface Agg {
  daysDue: number;
  daysShownUp: number;
  minActionDays: number;
  failDays: number;
  hardDayWins: number; // acted && energy === 'hard'
  alignedDays: number;
  returns: number; // apareció justo tras un fallo
}

function aggregate(states: Map<string, DayState>, habit: Habit, tz: string, start: string, end: string): Agg {
  const dueDays: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (isHabitDueOnDate(habit, d, tz)) dueDays.push(d);
  }
  let daysShownUp = 0, minActionDays = 0, failDays = 0, hardDayWins = 0, alignedDays = 0, returns = 0;
  let prevFail = false;
  for (const d of dueDays) {
    const st = states.get(d);
    const effort = st?.effort ?? 'none';
    if (effort === 'none') { failDays++; prevFail = true; continue; }
    daysShownUp++;
    if (effort === 'min') minActionDays++;
    if (st?.energy === 'hard') hardDayWins++;
    if (st?.alignment === 'yes') alignedDays++;
    if (prevFail) returns++;
    prevFail = false;
  }
  return { daysDue: dueDays.length, daysShownUp, minActionDays, failDays, hardDayWins, alignedDays, returns };
}

const rate = (n: number, d: number) => (d > 0 ? n / d : 0);

function consistencyOf(a: Agg) { return rate(a.daysShownUp, a.daysDue); }
function alignedRateOf(a: Agg) { return rate(a.alignedDays, a.daysShownUp); }
function resilienceOf(a: Agg) {
  const adversity = a.failDays + a.hardDayWins;
  return adversity > 0 ? (a.returns + a.hardDayWins) / adversity : consistencyOf(a);
}

// ── Evidencia acumulada (pantalla 4) ────────────────────────────────────────

export interface PeriodEvidence {
  daysShownUp: number;
  minActionDays: number;
  failDays: number;
  hardDayWins: number;
  alignedDays: number;
  returns: number;
  daysDue: number;
  consistency: number; // 0..1
  narrative: string;
}

export function buildPeriodEvidence(entries: Entry[], habit: Habit, tz: string, period: Period): PeriodEvidence {
  const today = todayLocalDate(tz);
  const start = addDays(today, -(PERIOD_DAYS[period] - 1));
  const states = dayStatesByDate(entries, habit, tz);
  const a = aggregate(states, habit, tz, start, today);
  return {
    daysShownUp: a.daysShownUp,
    minActionDays: a.minActionDays,
    failDays: a.failDays,
    hardDayWins: a.hardDayWins,
    alignedDays: a.alignedDays,
    returns: a.returns,
    daysDue: a.daysDue,
    consistency: consistencyOf(a),
    narrative: buildNarrative(a),
  };
}

function buildNarrative(a: Agg): string {
  if (a.daysShownUp === 0) return 'Aún no hay registros este período. Un pequeño paso hoy ya es evidencia.';
  const pct = Math.round(consistencyOf(a) * 100);
  if (a.returns > 0) return `Fallaste y volviste ${a.returns} ${a.returns === 1 ? 'vez' : 'veces'}. No eres perfecto. Eres constante. Y eso te hace diferente cada día.`;
  if (a.hardDayWins > 0) return 'Apareciste incluso en días difíciles. Estás demostrando quién eres, un día a la vez.';
  return `${pct}% de consistencia. Cada registro suma a la persona que eliges ser.`;
}

// ── Progreso de identidad (pantalla 5) ──────────────────────────────────────

export interface TraitDelta {
  score: number; // 0..100
  delta: number; // puntos vs período previo
}

export interface IdentityProgress {
  strength: number; // 0..100
  traits: { resiliente: TraitDelta; disciplinado: TraitDelta; constante: TraitDelta };
}

export function buildIdentityProgress(entries: Entry[], habit: Habit, tz: string, period: Period): IdentityProgress {
  const today = todayLocalDate(tz);
  const len = PERIOD_DAYS[period];
  const states = dayStatesByDate(entries, habit, tz);

  const curStart = addDays(today, -(len - 1));
  const prevEnd = addDays(curStart, -1);
  const prevStart = addDays(prevEnd, -(len - 1));

  const cur = aggregate(states, habit, tz, curStart, today);
  const prev = aggregate(states, habit, tz, prevStart, prevEnd);

  const strength = Math.round(100 * (W_CONSISTENCY * consistencyOf(cur) + W_ALIGNED * alignedRateOf(cur) + W_RESILIENCE * resilienceOf(cur)));

  const trait = (c: number, p: number): TraitDelta => ({ score: Math.round(c * 100), delta: Math.round((c - p) * 100) });

  return {
    strength,
    traits: {
      resiliente: trait(resilienceOf(cur), resilienceOf(prev)),
      disciplinado: trait(rate(cur.minActionDays, cur.daysShownUp), rate(prev.minActionDays, prev.daysShownUp)),
      constante: trait(consistencyOf(cur), consistencyOf(prev)),
    },
  };
}
