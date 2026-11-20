import type { AppState, DailyGoal, GoalDay, ReadingEntry } from '../state/models';
import { verseCounts } from './quran';
import { addDays, parseDateKey } from './journey';
import { goalAction, goalDayProgress } from './planning';

export const goalUnits = ['pages', 'ayahs', 'rub', 'hizb', 'juz', 'minutes'] as const;
export function unitQuranFraction(unit: string): number {
  return unit === 'pages' || unit === 'page'
    ? 1 / 604
    : unit === 'hizb'
      ? 1 / 60
      : unit === 'juz'
        ? 1 / 30
        : unit === 'rub'
          ? 1 / 240
          : unit === 'minutes'
            ? 0
            : 1 / 6236;
}
export function historyQuranFraction(entry: ReadingEntry): number {
  if (entry.type === 'surah')
    return ((verseCounts[entry.surahId - 1] ?? Math.floor(6236 / 114)) * entry.amount) / 6236;
  if (entry.type === 'hizb' && entry.surahName.includes('(')) return entry.amount / 240;
  return unitQuranFraction(entry.type) * entry.amount;
}
export function progressForGoal(day: GoalDay, history: readonly ReadingEntry[]) {
  const entries = history.filter(
    (entry) => entry.dateKey === day.date && entry.action === goalAction(day.goalId),
  );
  const done =
    day.unit === 'minutes'
      ? entries
          .filter((entry) => entry.type === 'minutes')
          .reduce((sum, entry) => sum + entry.amount, 0)
      : Math.floor(
          entries.reduce((sum, entry) => sum + historyQuranFraction(entry), 0) /
            unitQuranFraction(day.unit) +
            0.000001,
        );
  return goalDayProgress(day, done);
}

/** GoalRepository.record links the exact planned content and never logs it twice. */
export function recordGoalSession(state: AppState, entry: ReadingEntry, planId?: string): AppState {
  if (!planId)
    return state.history.some((row) => row.sourceKey === entry.sourceKey)
      ? state
      : { ...state, history: [entry, ...state.history] };
  const plan = state.plans.find((row) => row.id === planId);
  if (
    !plan ||
    goalAction(plan.goalId) !== entry.action ||
    (plan.measurementUnit || plan.type) !== entry.type ||
    plan.amount !== entry.amount ||
    plan.type !== entry.contentType ||
    plan.referenceId !== entry.surahId
  )
    throw new Error('The planned session no longer matches this reading.');
  if (plan.historyLogged) return state;
  const sourceKey = `plan:${plan.id}`;
  return {
    ...state,
    history: state.history.some((row) => row.sourceKey === sourceKey)
      ? state.history
      : [{ ...entry, sourceKey }, ...state.history],
    plans: state.plans.map((row) =>
      row.id === planId
        ? {
            ...row,
            isDone: true,
            historyLogged: true,
            reminderHour: null,
            reminderMinute: null,
            reminderNotificationId: null,
            reminderDueAt: null,
          }
        : row,
    ),
  };
}
export function refreshGoalDays(state: AppState, today: string): AppState {
  parseDateKey(today);
  const days = [...state.goalDays];
  for (const goal of state.goals.filter((goal) => goal.target > 0)) {
    const latest = days
      .filter((day) => day.goalId === goal.id && day.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    let date = latest ? addDays(latest.date, 1) : today;
    while (date <= today) {
      days.push({
        goalId: goal.id,
        date,
        unit: goal.unit,
        target: goal.target,
        extra: 0,
        resolution: '',
      });
      date = addDays(date, 1);
    }
  }
  return days.length === state.goalDays.length ? state : { ...state, goalDays: days };
}
export function saveGoalDefinition(state: AppState, goal: DailyGoal, today: string): AppState {
  if (
    !Number.isInteger(goal.id) ||
    goal.id < 1 ||
    goal.id > 3 ||
    !goalUnits.some((unit) => unit === goal.unit) ||
    !Number.isInteger(goal.target) ||
    goal.target < 0 ||
    goal.target > 10000 ||
    !Number.isInteger(goal.reminderHour) ||
    goal.reminderHour < 0 ||
    goal.reminderHour > 23 ||
    !Number.isInteger(goal.reminderMinute) ||
    goal.reminderMinute < 0 ||
    goal.reminderMinute > 59
  )
    throw new Error('Choose a valid goal, amount, and reminder time.');
  const refreshed = refreshGoalDays(state, today);
  const affected = refreshed.goalDays.filter((day) => day.goalId === goal.id && day.date >= today);
  if (affected.some((day) => day.extra > 0 && day.unit !== goal.unit))
    throw new Error('Complete or resolve carried reading before changing the unit.');
  const days = refreshed.goalDays.map((day) =>
    day.goalId === goal.id && day.date >= today
      ? { ...day, unit: goal.unit, target: goal.target }
      : day,
  );
  if (!days.some((day) => day.goalId === goal.id && day.date === today))
    days.push({
      goalId: goal.id,
      date: today,
      unit: goal.unit,
      target: goal.target,
      extra: 0,
      resolution: '',
    });
  return {
    ...refreshed,
    goals: [...refreshed.goals.filter((g) => g.id !== goal.id), goal].sort((a, b) => a.id - b.id),
    goalDays: days,
    goal:
      goal.id === 1
        ? { unit: goal.unit as AppState['goal']['unit'], target: goal.target }
        : state.goal,
  };
}
export function resolveGoalDay(
  state: AppState,
  goalId: number,
  date: string,
  mode: 'carry' | 'spread' | 'skip',
  today: string,
): AppState {
  if (date >= today) throw new Error('Only past days can be resolved.');
  const original = state.goalDays.find((day) => day.goalId === goalId && day.date === date);
  const definition = state.goals.find((goal) => goal.id === goalId);
  if (!original || !definition || original.resolution) return state;
  if (original.unit !== definition.unit && mode !== 'skip')
    throw new Error('The unit has changed. You can skip this old goal.');
  const remaining = progressForGoal(original, state.history).remaining;
  const count = mode === 'spread' ? 3 : mode === 'carry' ? 1 : 0;
  const days = state.goalDays.map((day) => (day === original ? { ...day, resolution: mode } : day));
  for (let index = 0; index < count; index++) {
    const nextDate = addDays(today, index);
    const existing = days.find((day) => day.goalId === goalId && day.date === nextDate);
    const extra = Math.floor(remaining / count) + (index < remaining % count ? 1 : 0);
    if (existing) days[days.indexOf(existing)] = { ...existing, extra: existing.extra + extra };
    else
      days.push({
        goalId,
        date: nextDate,
        unit: definition.unit,
        target: definition.target,
        extra,
        resolution: '',
      });
  }
  return { ...state, goalDays: days };
}
