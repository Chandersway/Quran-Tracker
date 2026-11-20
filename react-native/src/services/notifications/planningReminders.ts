import type { Language, Plan } from '../../state/models';
import { sourceText } from '../../i18n';

export type DesiredPlanReminder = {
  key: string;
  planId: string;
  sourceId: string;
  date: string;
  dueAt: Date;
  title: string;
  body: string;
  repeatDaily?: boolean;
  /** Effective wall-clock minute of the repeating alarm paired with this first-grant DATE. */
  firstGrantSlot?: number;
  /** Stable plan/reminder identity, independent of UI language and quiet-hour deferral. */
  deliveryKey?: string;
  /** Original allowed time when a bounded catch-up is scheduled a few seconds ahead. */
  deliveryDueAt?: number;
};
export type ExistingPlanReminder = { id: string; data: Record<string, unknown> };
export type PlanReminderPort = {
  list: () => Promise<ExistingPlanReminder[]>;
  schedule: (reminder: DesiredPlanReminder) => Promise<string>;
  cancel: (id: string) => Promise<void>;
};
export type ReminderReconcileResult = {
  notificationIds: Record<string, string>;
  scheduled: string[];
  cancelled: string[];
  cleanupFailures: string[];
  catchUpFailures: string[];
};

export function planningReminderDueAt(dateKey: string, hour: number, minute: number): Date {
  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  )
    throw new Error('Choose a valid reminder time.');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error('Choose a valid plan date.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  )
    throw new Error('Choose a valid plan date.');
  // Construct in local time. Round-trip checks reject a nonexistent wall-clock time in the spring DST gap.
  const dueAt = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    dueAt.getFullYear() !== year ||
    dueAt.getMonth() !== month - 1 ||
    dueAt.getDate() !== day ||
    dueAt.getHours() !== hour ||
    dueAt.getMinutes() !== minute
  )
    throw new Error(
      'That local time does not exist because of the daylight-saving change. Choose another time.',
    );
  return dueAt;
}

export function planReminderKey(
  plan: Pick<Plan, 'id' | 'date' | 'reminderHour' | 'reminderMinute' | 'reminderDueAt'>,
): string | null {
  const { reminderHour: hour, reminderMinute: minute } = plan;
  if (hour === null || minute === null) return null;
  return `planning:${plan.id}:${plan.date}:${hour}:${minute}${plan.reminderDueAt != null ? `:exact:${plan.reminderDueAt}` : ''}`;
}

export function desiredPlanReminders(
  plans: readonly Plan[],
  now = new Date(),
  language: Language = 'en',
): DesiredPlanReminder[] {
  const reminders: DesiredPlanReminder[] = [];
  for (const plan of plans) {
    if (plan.isDone) continue;
    const key = planReminderKey(plan);
    if (!key || plan.reminderHour === null || plan.reminderMinute === null) continue;
    let dueAt: Date;
    try {
      dueAt =
        plan.reminderDueAt == null
          ? planningReminderDueAt(plan.date, plan.reminderHour, plan.reminderMinute)
          : new Date(plan.reminderDueAt);
      if (!Number.isFinite(dueAt.getTime())) continue;
    } catch {
      continue;
    }
    if (dueAt.getTime() <= now.getTime()) continue;
    const copy = reminderCopy(language);
    reminders.push({
      key,
      planId: plan.id,
      sourceId: `planning:${plan.id}`,
      date: plan.date,
      dueAt,
      title: copy.title,
      body: plan.displayName,
    });
  }
  return reminders.sort(
    (a, b) => a.dueAt.getTime() - b.dueAt.getTime() || a.key.localeCompare(b.key),
  );
}

export async function reconcilePlanReminders(
  desired: readonly DesiredPlanReminder[],
  port: PlanReminderPort,
  commit?: () => Promise<void>,
): Promise<ReminderReconcileResult> {
  const scheduled: string[] = [];
  const catchUpFailures: string[] = [];
  const cancelled: string[] = [];
  const notificationIds: Record<string, string> = {};
  const desiredByKey = new Map(desired.map((item) => [item.key, item]));
  const seen = new Set<string>();
  const existing = await port.list();
  const obsolete: string[] = [];
  for (const notification of existing) {
    const key =
      typeof notification.data.planReminderKey === 'string'
        ? notification.data.planReminderKey
        : null;
    if (!key) continue;
    if (key && desiredByKey.has(key) && !seen.has(key)) {
      seen.add(key);
      notificationIds[key] = notification.id;
      continue;
    }
    obsolete.push(notification.id);
  }
  // Keep the old reminder until every replacement is safely scheduled.
  try {
    for (const reminder of desired) {
      if (seen.has(reminder.key)) continue;
      let id: string;
      try {
        id = await port.schedule(reminder);
      } catch (error) {
        // The supplemental DATE must not undo the regular DAILY for tomorrow.
        if (reminder.firstGrantSlot === undefined) throw error;
        catchUpFailures.push(reminder.key);
        continue;
      }
      notificationIds[reminder.key] = id;
      scheduled.push(id);
    }
    await commit?.();
  } catch (cause) {
    await Promise.allSettled(scheduled.map((id) => port.cancel(id)));
    throw cause;
  }
  const cleanupFailures: string[] = [];
  for (const id of obsolete) {
    try {
      await port.cancel(id);
      cancelled.push(id);
    } catch {
      cleanupFailures.push(id);
    }
  }
  return { notificationIds, scheduled, cancelled, cleanupFailures, catchUpFailures };
}

export function planReminderCopy(language: Language): {
  title: string;
  permissionRequired: string;
  permissionDenied: string;
} {
  const all = {
    en: {
      title: 'Your reading',
      permissionRequired: 'Allow notifications to set a reminder for this reading.',
      permissionDenied:
        'Notifications are off. Enable them in system settings to use reading reminders.',
    },
    nl: {
      title: 'Jouw lezing',
      permissionRequired: 'Sta meldingen toe om een herinnering voor deze lezing in te stellen.',
      permissionDenied:
        'Meldingen staan uit. Schakel ze in via de systeeminstellingen om leesherinneringen te gebruiken.',
    },
    ar: {
      title: 'قراءتك',
      permissionRequired: 'اسمح بالإشعارات لتعيين تذكير لهذه القراءة.',
      permissionDenied: 'الإشعارات متوقفة. فعّلها من إعدادات النظام لاستخدام تذكيرات القراءة.',
    },
  };
  return { ...all[language], title: sourceText('notifications.planning', language) };
}
function reminderCopy(language: Language): Pick<ReturnType<typeof planReminderCopy>, 'title'> {
  return { title: planReminderCopy(language).title };
}
