import type { AppState } from '../state/models';
import { progressForGoal } from './goals';

/** Only the read intention controls its reminders; hifz and review never complete it. */
export function needsDailyReadingReminder(state: AppState, date: string): boolean {
  const definition = state.goals.find((goal) => goal.id === 1);
  if (!definition || definition.target <= 0) return false;
  const snapshot = state.goalDays.find((day) => day.goalId === 1 && day.date === date) ?? {
    goalId: 1,
    date,
    unit: definition.unit,
    target: definition.target,
    extra: 0,
    resolution: '',
  };
  if (snapshot.resolution) return false;
  return progressForGoal(snapshot, state.history).remaining > 0;
}
