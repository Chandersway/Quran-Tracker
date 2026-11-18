import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
import { expoPlanReminderPort, hasPlanReminderPermission } from './planningReminderPort';

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
  now = new Date(),
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
    plans.push({
      key: `daily:${allowedMinute}:${language}`,
      planId: 'daily',
      sourceId: 'daily',
      dueAt,
      date: '',
      repeatDaily: true,
      title: sourceText('notifications.reminder', language),
      body: sourceText('notifications.readingReminderBody', language),
    });
  }
  return plans;
}
export function reconcileLocalReminders(state: AppState): Promise<void> {
  return ordered(async () => {
    if (Platform.OS === 'web') return;
    const preferences = await loadLocalNotifications(state);
    const desired = (await hasPlanReminderPermission())
      ? desiredLocalReminders(state, preferences)
      : [];
    const now = new Date();
    const result = await reconcileTrackedPlanReminders(
      desired,
      expoPlanReminderPort,
      AsyncStorage,
      {
        now: () => Date.now(),
        catchUpAllowed: nextAllowedReminder(now, preferences).getTime() === now.getTime(),
      },
    );
    setReminderFailure(result.cleanupFailures.length ? 'cleanup' : null);
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
    const desired = (await hasPlanReminderPermission())
      ? desiredLocalReminders(state, validated)
      : [];
    const now = new Date();
    const result = await reconcileTrackedPlanReminders(
      desired,
      expoPlanReminderPort,
      AsyncStorage,
      {
        now: () => Date.now(),
        catchUpAllowed: nextAllowedReminder(now, validated).getTime() === now.getTime(),
        commit: () => AsyncStorage.setItem(localNotificationKey, JSON.stringify(validated)),
      },
    );
    setReminderFailure(result.cleanupFailures.length ? 'cleanup' : null);
  });
}
