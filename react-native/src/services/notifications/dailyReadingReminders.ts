import { needsDailyReadingReminder } from '../../domain/dailyReadingGoal';
import { localDate } from '../../domain/localDate';
import {
  nextAllowedReminder,
  type LocalNotificationPreferences,
} from '../../domain/notificationPreferences';
import { sourceText } from '../../i18n';
import type { AppState } from '../../state/models';
import type { DesiredPlanReminder } from './planningReminders';

export const DAILY_REMINDER_LOOKAHEAD_DAYS = 14;
// Reconciliation schedules replacements before cancelling old alarms. Keeping
// at most 30 owned entries leaves room for both generations under iOS's 64 cap.
export const MAX_OWNED_REMINDERS = 30;
export const AGENDA_REMINDER_RESERVE = 14;

export function pendingReminderCapacity(unownedCount: number): number {
  return Math.max(0, Math.min(MAX_OWNED_REMINDERS, Math.floor((64 - unownedCount) / 2)));
}

/** Dated native alarms can skip a completed day without disabling tomorrow. */
export function dailyReadingReminders(
  state: AppState,
  preferences: LocalNotificationPreferences,
  now: Date,
  firstGrantAt: number | null = null,
): DesiredPlanReminder[] {
  if (!preferences.enabled) return [];
  const slots = [
    ...new Set([
      ...(preferences.daily ? [preferences.dailyMinute] : []),
      ...(preferences.extra ? [preferences.extraMinute] : []),
    ]),
  ];
  const reminders: DesiredPlanReminder[] = [];
  const seen = new Set<number>();
  const language = state.preferences.language;
  for (let offset = 0; offset < DAILY_REMINDER_LOOKAHEAD_DAYS; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const date = localDate(day);
    if (!needsDailyReadingReminder(state, date)) continue;
    for (const minute of slots) {
      const at = new Date(day);
      at.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
      const regular = nextAllowedReminder(at, preferences);
      let dueAt = regular;
      let key = `daily:${date}:${minute}:at:${regular.getTime()}:${language}`;
      let deliveryKey = `daily:${date}:${minute}`;
      let firstGrantSlot: number | undefined;
      let deliveryDueAt: number | undefined;
      if (regular.getTime() <= now.getTime()) {
        if (
          offset !== 0 ||
          firstGrantAt === null ||
          localDate(new Date(firstGrantAt)) !== date ||
          regular.getTime() > firstGrantAt
        )
          continue;
        dueAt = nextAllowedReminder(new Date(now.getTime() + 5000), preferences);
        if (localDate(dueAt) !== date) continue;
        const initial = nextAllowedReminder(new Date(firstGrantAt + 5000), preferences);
        deliveryKey = `daily-catchup:${date}:${minute}`;
        key = `${deliveryKey}:at:${initial.getTime()}:${language}`;
        firstGrantSlot = regular.getHours() * 60 + regular.getMinutes();
        deliveryDueAt = regular.getTime();
      }
      if (seen.has(regular.getTime())) continue;
      seen.add(regular.getTime());
      reminders.push({
        key,
        deliveryKey,
        deliveryDueAt,
        firstGrantSlot,
        planId: 'daily',
        sourceId: 'daily',
        date,
        dueAt,
        repeatDaily: false,
        title: sourceText('notifications.reminder', language),
        body: sourceText('notifications.readingReminderBody', language),
      });
    }
  }
  return reminders.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

/** Keep nearby agenda items as well as a daily forecast; reopen replenishes both. */
export function reminderWindow(
  daily: readonly DesiredPlanReminder[],
  agenda: readonly DesiredPlanReminder[],
  now: Date,
  capacity = MAX_OWNED_REMINDERS,
): DesiredPlanReminder[] {
  const plans = agenda
    .filter((reminder) => reminder.dueAt.getTime() >= now.getTime() - 12 * 60 * 60 * 1000)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const reserved = plans.slice(
    0,
    daily.length ? Math.min(AGENDA_REMINDER_RESERVE, Math.floor(capacity / 2)) : capacity,
  );
  const readings = daily.slice(0, Math.max(0, capacity - reserved.length));
  const extraPlans = plans.slice(
    reserved.length,
    reserved.length + Math.max(0, capacity - reserved.length - readings.length),
  );
  return [...reserved, ...readings, ...extraPlans].sort(
    (a, b) => a.dueAt.getTime() - b.dueAt.getTime(),
  );
}
