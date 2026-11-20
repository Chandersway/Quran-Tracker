import type { Plan } from '../state/models';
import { addDays, parseDateKey } from './journey';

export type AgendaDayStatus = 'Empty' | 'Planned' | 'Partial' | 'Completed' | 'Missed';
export type AgendaReminderPreset = 'now' | 'plusThirtyMinutes' | 'tonight';

/** Presets select a clock time on the plan's date, just like the source dialog. */
export function agendaReminderPreset(
  preset: AgendaReminderPreset,
  now = new Date(),
): { hour: number; minute: number } {
  if (preset === 'tonight') return { hour: 20, minute: 0 };
  const clock = new Date(now.getTime() + (preset === 'plusThirtyMinutes' ? 30 * 60_000 : 0));
  return { hour: clock.getHours(), minute: clock.getMinutes() };
}
export function agendaWeekDates(selected: string): string[] {
  const date = parseDateKey(selected);
  const monday = addDays(selected, -((date.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
export function agendaDayStatus(
  date: string,
  plans: readonly Plan[],
  today: string,
): AgendaDayStatus {
  const rows = plans.filter((plan) => plan.date === date);
  const done = rows.filter((plan) => plan.isDone).length;
  return !rows.length
    ? 'Empty'
    : done === rows.length
      ? 'Completed'
      : date < today
        ? 'Missed'
        : done > 0
          ? 'Partial'
          : 'Planned';
}
export function moveAgendaPeriod(selected: string, direction: number, month: boolean): string {
  if (!month) return addDays(selected, direction * 7);
  const date = parseDateKey(selected);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + direction);
  date.setUTCDate(
    Math.min(
      day,
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(),
    ),
  );
  return date.toISOString().slice(0, 10);
}
export function orderedAgendaPlans(plans: readonly Plan[], date?: string): Plan[] {
  return plans
    .filter((plan) => date === undefined || plan.date === date)
    .slice()
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        Number(a.isDone) - Number(b.isDone) ||
        (a.reminderHour ?? 24) - (b.reminderHour ?? 24) ||
        (a.reminderMinute ?? 0) - (b.reminderMinute ?? 0) ||
        a.createdAt - b.createdAt,
    );
}
