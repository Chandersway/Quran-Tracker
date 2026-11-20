import type { ReadingEntry } from '../state/models';
import { historyQuranFraction, unitQuranFraction } from './goals';
import { parseDateKey } from './journey';

export const readingPlanUnits = ['hizb', 'rub', 'juz', 'pages', 'ayahs'] as const;
export type ReadingPlanUnit = (typeof readingPlanUnits)[number];
export type IndependentReadingPlan = {
  target: number;
  unit: ReadingPlanUnit;
  started: number;
  end: string;
  adjustment: number;
};
export const defaultReadingPlan: IndependentReadingPlan = {
  target: 30,
  unit: 'hizb',
  started: 0,
  end: '',
  adjustment: 0,
};

/** Matches ReadingPlanScreen.kt; this plan never mutates history/daily goals. */
export function readingPlanLogged(
  plan: IndependentReadingPlan,
  history: readonly ReadingEntry[],
): number {
  if (!plan.started) return 0;
  return (
    history
      .filter(
        (entry) =>
          entry.action === 'read' && entry.timestamp >= plan.started && entry.type !== 'minutes',
      )
      .reduce((sum, entry) => sum + historyQuranFraction(entry), 0) / unitQuranFraction(plan.unit)
  );
}
export function readingPlanDone(
  plan: IndependentReadingPlan,
  history: readonly ReadingEntry[],
): number {
  return Math.max(0, readingPlanLogged(plan, history) + plan.adjustment);
}
export function normalizePlanNumber(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[,٫]/g, '.');
}
export function decodeReadingPlan(value: unknown): IndependentReadingPlan {
  if (!value || typeof value !== 'object') throw new Error('Invalid reading plan');
  const raw = value as Record<string, unknown>;
  const plan = {
    target: Number(raw.target ?? 30),
    unit: String(raw.unit ?? 'hizb') as ReadingPlanUnit,
    started: Number(raw.started ?? 0),
    end: String(raw.end ?? ''),
    adjustment: Number(raw.adjustment ?? 0),
  };
  validateReadingPlan(plan);
  return plan;
}
export function validateReadingPlan(plan: IndependentReadingPlan): void {
  if (
    !Number.isInteger(plan.target) ||
    plan.target < 1 ||
    plan.target > 100000 ||
    !readingPlanUnits.includes(plan.unit) ||
    !Number.isFinite(plan.started) ||
    plan.started < 0 ||
    !Number.isFinite(plan.adjustment)
  )
    throw new Error('Invalid reading plan');
  if (plan.end) parseDateKey(plan.end);
}
export function saveReadingPlan(
  previous: IndependentReadingPlan,
  target: number,
  unit: ReadingPlanUnit,
  end: string,
  now: number,
): IndependentReadingPlan {
  const next = {
    target,
    unit,
    end,
    started: previous.started || now,
    adjustment: (previous.adjustment * unitQuranFraction(previous.unit)) / unitQuranFraction(unit),
  };
  validateReadingPlan(next);
  return next;
}
export function correctReadingPlan(
  plan: IndependentReadingPlan,
  history: readonly ReadingEntry[],
  total: number,
): IndependentReadingPlan {
  if (!Number.isFinite(total) || total < 0 || total > 1000000)
    throw new Error('Invalid reading plan correction');
  return { ...plan, adjustment: total - readingPlanLogged(plan, history) };
}
export function readingPlanPace(
  plan: IndependentReadingPlan,
  history: readonly ReadingEntry[],
  target: number,
  unit: ReadingPlanUnit,
  end: string,
  today: string,
): number | null {
  if (!end) return null;
  const finish = parseDateKey(end);
  const start = parseDateKey(today);
  const days = Math.round((finish.getTime() - start.getTime()) / 86400000) + 1;
  if (days <= 0) return null;
  const convertedDone =
    (readingPlanDone(plan, history) * unitQuranFraction(plan.unit)) / unitQuranFraction(unit);
  return Math.max(0, target - convertedDone) / days;
}
