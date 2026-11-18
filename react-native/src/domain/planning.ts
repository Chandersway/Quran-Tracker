import { QuranProgressType } from './quran';
import type { Plan } from '../state/models';

/** Different daily intentions may schedule the same passage on the same date. */
export function planIdentity(
  plan: Pick<Plan, 'date' | 'goalId' | 'type' | 'referenceId' | 'subId'>,
): string {
  return `${plan.date}:${plan.goalId}:${plan.type}:${plan.referenceId}:${plan.subId}`;
}

export type GoalUnit = 'juz' | 'hizb' | 'rub';

/** Matches Android's 240-quarter journey calculation and unit preference. */
export function deriveDailyGoalFromJourney(totalDays: number): readonly [GoalUnit, number] {
  const safeDays = Math.min(240, Math.max(1, Math.trunc(totalDays)));
  const partsPerDay = Math.max(1, Math.ceil(240 / safeDays));
  if (partsPerDay % 8 === 0) return [QuranProgressType.juz, Math.max(1, partsPerDay / 8)];
  if (partsPerDay % 4 === 0) return [QuranProgressType.hizb, Math.max(1, partsPerDay / 4)];
  return [QuranProgressType.rub, partsPerDay];
}

export function goalAction(goalId: number): 'read' | 'memorized' | 'review' {
  return goalId === 2 ? 'memorized' : goalId === 3 ? 'review' : 'read';
}

export interface GoalDaySnapshot {
  goalId: number;
  date: string;
  unit: string;
  target: number;
  extra: number;
}

export interface GoalDayProgress {
  target: number;
  done: number;
  remaining: number;
  fraction: number;
}

export function goalDayProgress(day: GoalDaySnapshot, done: number): GoalDayProgress {
  const target = day.target + day.extra;
  const safeDone = Number.isFinite(done) ? done : 0;
  return {
    target,
    done: safeDone,
    remaining: Math.max(target - safeDone, 0),
    fraction: target > 0 ? Math.min(1, Math.max(0, safeDone / target)) : 0,
  };
}
