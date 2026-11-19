import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { localDate } from '../../domain/localDate';
import {
  decodeNotificationPreferences,
  localNotificationDefaults,
  nextAllowedReminder,
  type LocalNotificationPreferences,
} from '../../domain/notificationPreferences';
import { sourceText } from '../../i18n';
import type { AppState } from '../../state/models';
import { desiredPlanReminders, type DesiredPlanReminder } from './planningReminders';
import { reconcileTrackedPlanReminders } from './planningReminderLedger';
import {
  expoPlanReminderPort,
  firstPlanReminderGrantAt,
  hasPlanReminderPermission,
  initialPlanReminderPermission,
} from './planningReminderPort';

export const localNotificationKey = 'wirdna:notification-preferences:v1';
let queue: Promise<unknown> = Promise.resolve();
let failure: 'restore' | 'cleanup' | null = null;
const failureListeners = new Set<() => void>();
export const getReminderFailure = () => failure;
export function onReminderFailureChanged(listener: () => void): () => void {
  failureListeners.add(listener);
  return () => {
    failureListeners.delete(listener);
  };
}
export function setReminderFailure(value: typeof failure): void {
  if (value === failure) return;
  failure = value;
  failureListeners.forEach((listener) => listener());
}
function ordered<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.catch(() => undefined).then(work);
  queue = next;
  return next;
}
export async function loadLocalNotifications(
  state?: AppState,
): Promise<LocalNotificationPreferences> {
  const legacy = state?.legacyAndroid?.preferences.notification_preferences_v1;
  const fallback = legacy ? decodeNotificationPreferences(legacy) : localNotificationDefaults;
  const raw = await AsyncStorage.getItem(localNotificationKey);
  const preferences = raw
    ? decodeNotificationPreferences(JSON.parse(raw), fallback)
    : { ...fallback };
  const goal = state?.goals.find((item) => item.id === 1);
  return goal
    ? { ...preferences, dailyMinute: goal.reminderHour * 60 + goal.reminderMinute }
    : preferences;
}
function desiredLocalReminders(
  state: AppState,
  preferences: LocalNotificationPreferences,
  now: Date,
  firstGrantAt: number | null = null,
): DesiredPlanReminder[] {
  if (!preferences.enabled) return [];
  const language = state.preferences.language;
  const plans: DesiredPlanReminder[] = preferences.planning
    ? desiredPlanReminders(state.plans, new Date(0), language).map((reminder) => {
        const dueAt = nextAllowedReminder(reminder.dueAt, preferences);
        return {
          ...reminder,
          dueAt,
          deliveryKey: reminder.key,
          key: `${reminder.key}:at:${dueAt.getTime()}:${language}`,
        };
      })
    : [];
  const minutes = new Set([
    ...(preferences.daily ? [preferences.dailyMinute] : []),
    ...(preferences.extra ? [preferences.extraMinute] : []),
  ]);
  const times = new Set<number>();
  for (const minute of minutes) {
    const due = new Date(now);
    due.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
    const dueAt = nextAllowedReminder(due, preferences);
    const allowedMinute = dueAt.getHours() * 60 + dueAt.getMinutes();
    if (times.has(allowedMinute)) continue;
    times.add(allowedMinute);
    const daily: DesiredPlanReminder = {
      key: `daily:${allowedMinute}:${language}`,
      planId: 'daily',
      sourceId: 'daily',
      dueAt,
      date: '',
      repeatDaily: true,
      title: sourceText('notifications.reminder', language),
      body: sourceText('notifications.readingReminderBody', language),
    };
    plans.push(daily);
    if (
      firstGrantAt === null ||
      localDate(new Date(firstGrantAt)) !== localDate(now) ||
      dueAt.getTime() > firstGrantAt
    )
      continue;

    // The first native DAILY can only fire in the future. Kotlin also offers
    // today's passed slot, in local time, once. Quiet hours may defer it today.
    const soon = new Date(now.getTime() + 5000);
    const allowed = nextAllowedReminder(soon, preferences);
    const day = localDate(now);
    if (localDate(allowed) !== day) continue;
    const firstAllowed = nextAllowedReminder(new Date(firstGrantAt + 5000), preferences);
    const scheduleTime = allowed === soon ? firstAllowed.getTime() : allowed.getTime();
    const deliveryKey = `daily-catchup:${day}:${minute}`;
    plans.push({
      ...daily,
      repeatDaily: false,
      firstGrantSlot: allowedMinute,
      deliveryKey,
      deliveryDueAt: dueAt.getTime(),
      key: `${deliveryKey}:at:${scheduleTime}:${language}`,
      dueAt: allowed,
      date: day,
    });
  }
  return plans;
}
export function reconcileLocalReminders(
  state: AppState,
  commit?: () => Promise<void>,
): Promise<void> {
  return ordered(async () => {
    if (Platform.OS === 'web') return commit?.();
    const preferences = await loadLocalNotifications(state);
    const opened = new Date();
    const hasUpcoming =
      preferences.enabled &&
      (preferences.daily ||
        preferences.extra ||
        desiredLocalReminders(state, preferences, opened).some(
          (reminder) => reminder.dueAt > opened,
        ));
    const permitted =
      !commit && state.preferences.onboardingComplete && hasUpcoming
        ? await initialPlanReminderPermission()
        : await hasPlanReminderPermission();
    if (commit && !permitted)
      throw new Error(sourceText('notifications.blocked', state.preferences.language));
    const firstGrant = permitted ? await firstPlanReminderGrantAt() : null;
    const now = new Date();
    const result = await reconcileTrackedPlanReminders(
      permitted ? desiredLocalReminders(state, preferences, now, firstGrant) : [],
      expoPlanReminderPort,
      AsyncStorage,
      {
        now: () => Date.now(),
        catchUpAllowed: nextAllowedReminder(now, preferences).getTime() === now.getTime(),
        commit,
      },
    );
    setReminderFailure(
      result.catchUpFailures.length ? 'restore' : result.cleanupFailures.length ? 'cleanup' : null,
    );
  });
}
/** A schedule or persistence failure leaves the old settings and reminder intact. */
export function saveLocalNotifications(
  state: AppState,
  next: LocalNotificationPreferences,
): Promise<void> {
  return ordered(async () => {
    const validated = decodeNotificationPreferences(next);
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(localNotificationKey, JSON.stringify(validated));
      return;
    }
    const permitted = await hasPlanReminderPermission();
    const firstGrant = permitted ? await firstPlanReminderGrantAt() : null;
    const now = new Date();
    const result = await reconcileTrackedPlanReminders(
      permitted ? desiredLocalReminders(state, validated, now, firstGrant) : [],
      expoPlanReminderPort,
      AsyncStorage,
      {
        now: () => Date.now(),
        catchUpAllowed: nextAllowedReminder(now, validated).getTime() === now.getTime(),
        commit: () => AsyncStorage.setItem(localNotificationKey, JSON.stringify(validated)),
      },
    );
    setReminderFailure(
      result.catchUpFailures.length ? 'restore' : result.cleanupFailures.length ? 'cleanup' : null,
    );
  });
}
