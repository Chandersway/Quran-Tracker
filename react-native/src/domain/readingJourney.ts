import type { AppState, DailyGoal, ReadingEntry } from '../state/models';
import { addDays, parseDateKey } from './journey';
import { historyQuranFraction, saveGoalDefinition, unitQuranFraction } from './goals';

export type ReadingJourneyConfiguration = {
  enabled: boolean;
  startDate: string;
  totalDays: number;
  autoDailyGoal: boolean;
  updatedAt: number;
};
export const defaultReadingJourney: ReadingJourneyConfiguration = {
  enabled: false,
  startDate: '',
  totalDays: 30,
  autoDailyGoal: true,
  updatedAt: 0,
};

export function readingJourneyProgress(
  journey: ReadingJourneyConfiguration,
  history: readonly ReadingEntry[],
  today: string,
) {
  const start = journey.startDate || today;
  const fraction = Math.min(
    1,
    Math.max(
      0,
      history
        .filter((row) => row.action === 'read' && row.dateKey >= start)
        .reduce((sum, row) => sum + historyQuranFraction(row), 0),
    ),
  );
  return { start, fraction, remainingPages: Math.max(0, 604 * (1 - fraction)) };
}
/** Source GoalRepository.readingJourney dynamically follows the daily goal. */
export function readingJourneyForecast(
  journey: ReadingJourneyConfiguration,
  goal: DailyGoal,
  history: readonly ReadingEntry[],
  today: string,
): { totalDays: number; end: string | null } {
  const progress = readingJourneyProgress(journey, history, today);
  if (!journey.enabled || goal.unit === 'minutes' || goal.target <= 0)
    return { totalDays: journey.totalDays, end: null };
  const elapsed = Math.max(
    0,
    Math.round((parseDateKey(today).getTime() - parseDateKey(progress.start).getTime()) / 86400000),
  );
  const remaining = Math.ceil(
    Math.max(0, 1 - progress.fraction) / (unitQuranFraction(goal.unit) * goal.target),
  );
  const totalDays = Math.max(1, elapsed + remaining);
  return { totalDays, end: addDays(progress.start, totalDays - 1) };
}
/** Source ReadingJourneyDialog supports pages/day or an inclusive finish date. */
export function journeyDialogTarget(
  remainingPages: number,
  amount: string,
  finish: string | null,
  today: string,
): number | null {
  if (finish) {
    const days =
      Math.round((parseDateKey(finish).getTime() - parseDateKey(today).getTime()) / 86400000) + 1;
    return days > 0 ? Math.max(1, Math.ceil(remainingPages / days)) : null;
  }
  const target = Number(amount);
  return /^\d+$/.test(amount) && target >= 1 && target <= 10000 ? target : null;
}
export function saveReadingJourneyConfiguration(
  state: AppState,
  journey: ReadingJourneyConfiguration,
  goal: DailyGoal | undefined,
  today: string,
): AppState {
  if (journey.startDate) parseDateKey(journey.startDate);
  if (
    typeof journey.enabled !== 'boolean' ||
    !Number.isInteger(journey.totalDays) ||
    journey.totalDays < 1 ||
    journey.totalDays > 10000 ||
    !Number.isFinite(journey.updatedAt)
  )
    throw new Error('Invalid reading journey');
  const updated = goal ? saveGoalDefinition(state, goal, today) : state;
  // Keep the source journey's original starting point when adjusting its goal.
  return {
    ...updated,
    readingJourney: {
      ...journey,
      startDate: state.readingJourney.startDate || journey.startDate || today,
      autoDailyGoal: true,
    },
  };
}
