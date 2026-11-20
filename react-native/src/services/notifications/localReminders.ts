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
import {
  dailyReadingReminders,
  reminderWindow,
  pendingReminderCapacity,
} from './dailyReadingReminders';
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
  capacity?: number,
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
  return reminderWindow(
    dailyReadingReminders(state, preferences, now, firstGrantAt),
    plans,
    now,
    capacity,
  );
}
async function nativeReminderCapacity(): Promise<number> {
  const scheduled = await expoPlanReminderPort.list();
  return pendingReminderCapacity(
    scheduled.filter((item) => typeof item.data.planReminderKey !== 'string').length,
  );
}

export function reconcileLocalReminders(
  state: AppState,
  commit?: () => Promise<void>,
): Promise<void> {
  return ordered(async () => {
    if (Platform.OS === 'web') return commit?.();
    const preferences = await loadLocalNotifications(state);
    const opened = new Date();
    const hasUpcoming = desiredLocalReminders(state, preferences, opened).some(
      (reminder) => reminder.dueAt > opened,
    );
    const permitted =
      !commit && state.preferences.onboardingComplete && hasUpcoming
        ? await initialPlanReminderPermission()
        : await hasPlanReminderPermission();
    if (commit && !permitted)
      throw new Error(sourceText('notifications.blocked', state.preferences.language));
    const firstGrant = permitted ? await firstPlanReminderGrantAt() : null;
    const now = new Date();
    const capacity = permitted ? await nativeReminderCapacity() : undefined;
    const result = await reconcileTrackedPlanReminders(
      permitted ? desiredLocalReminders(state, preferences, now, firstGrant, capacity) : [],
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
    const capacity = permitted ? await nativeReminderCapacity() : undefined;
    const result = await reconcileTrackedPlanReminders(
      permitted ? desiredLocalReminders(state, validated, now, firstGrant, capacity) : [],
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
