import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  TurboModuleRegistry,
  type TurboModule,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { localDate } from '../../domain/localDate';
import type { PlanReminderPort } from './planningReminders';
import { notificationDeliveryAllowed } from './notificationSystem';

export const PLAN_REMINDER_CHANNEL = 'reading-plans';
const CHANNEL = PLAN_REMINDER_CHANNEL;
const initialPermissionKey = 'wirdna:local-reminder-permission-offered:v1';
const awaitingFirstGrant = 'awaiting-first-grant';
let permissionPrompt: Promise<boolean> | null = null;

async function rememberFirstGrant(): Promise<number> {
  const now = new Date();
  await AsyncStorage.setItem(initialPermissionKey, `granted:${localDate(now)}:${now.getTime()}`);
  return now.getTime();
}

function promptForPermission(afterOnboarding: boolean): Promise<boolean> {
  if (permissionPrompt) return permissionPrompt;
  permissionPrompt = (async () => {
    const prior = await AsyncStorage.getItem(initialPermissionKey);
    if (prior === null) await AsyncStorage.setItem(initialPermissionKey, awaitingFirstGrant);
    let granted: boolean;
    try {
      if (afterOnboarding && AppState.currentState !== 'active') {
        if (prior === null) await AsyncStorage.removeItem(initialPermissionKey);
        return false;
      }
      granted = notificationDeliveryAllowed(await Notifications.requestPermissionsAsync());
    } catch (error) {
      if (prior === null) await AsyncStorage.removeItem(initialPermissionKey);
      throw error;
    }
    if (granted && (prior === null || prior === awaitingFirstGrant)) await rememberFirstGrant();
    return granted;
  })().finally(() => {
    permissionPrompt = null;
  });
  return permissionPrompt;
}

/** Called after OS authorization is confirmed, including a grant made in Settings. */
export async function firstPlanReminderGrantAt(): Promise<number | null> {
  const value = await AsyncStorage.getItem(initialPermissionKey);
  if (value === awaitingFirstGrant) return rememberFirstGrant();
  const match = /^granted:(\d{4}-\d{2}-\d{2}):(\d+)$/.exec(value ?? '');
  return match?.[1] === localDate() ? Number(match[2]) : null;
}

/** Android can report a fresh installation as denied before the first prompt. */
async function hasPreviousAndroidDenial(): Promise<boolean> {
  const permissions = TurboModuleRegistry.get<
    TurboModule & {
      shouldShowRequestPermissionRationale(permission: string): Promise<boolean>;
    }
  >('PermissionsAndroid');
  return permissions
    ? permissions.shouldShowRequestPermissionRationale(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )
    : true;
}

async function ensureReminderChannel(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const channel = await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Planning',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    return !channel || channel.importance !== Notifications.AndroidImportance.NONE;
  }
  return true;
}
export async function hasPlanReminderPermission(): Promise<boolean> {
  return (
    Platform.OS !== 'web' && notificationDeliveryAllowed(await Notifications.getPermissionsAsync())
  );
}
export async function requestPlanReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!(await ensureReminderChannel())) return false;
  const permission = await Notifications.getPermissionsAsync();
  if (notificationDeliveryAllowed(permission)) return true;
  return permission.canAskAgain !== false && promptForPermission(false);
}

/** Check and, on the first eligible foreground launch, offer local reminder permission. */
export async function initialPlanReminderPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  const permission = await Notifications.getPermissionsAsync();
  const allowed = notificationDeliveryAllowed(permission);
  if (
    AppState.currentState !== 'active' ||
    (Platform.OS === 'android' && Number(Platform.Version) < 33) ||
    (await AsyncStorage.getItem(initialPermissionKey)) !== null
  )
    return allowed;

  if (
    allowed ||
    !permission.canAskAgain ||
    (Platform.OS === 'ios'
      ? permission.status !== 'undetermined'
      : await hasPreviousAndroidDenial()) ||
    !(await ensureReminderChannel())
  ) {
    await AsyncStorage.setItem(initialPermissionKey, '1');
    return allowed;
  }
  return promptForPermission(true);
}
export const expoPlanReminderPort: PlanReminderPort = {
  async list() {
    if (Platform.OS === 'web') return [];
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    // Repair pending reminders submitted by an older build without a channel,
    // even when reconciliation can retain their existing key without rescheduling.
    if (
      Platform.OS === 'android' &&
      scheduled.some(
        (item) =>
          typeof item.content.data?.planReminderKey === 'string' ||
          item.content.data?.kind === 'wirdna-daily-reading',
      )
    )
      await ensureReminderChannel();
    return scheduled.map((item) => ({
      id: item.identifier,
      data:
        item.content.data?.kind === 'wirdna-daily-reading'
          ? { planReminderKey: `legacy-daily:${item.identifier}` }
          : (item.content.data ?? {}),
    }));
  },
  async schedule(reminder) {
    // Restoration may already have OS permission without ever opening the
    // permission button. Android will not display against a missing channel.
    if (!(await ensureReminderChannel())) throw new Error('Reading reminder channel is disabled');
    return Notifications.scheduleNotificationAsync({
      ...(reminder.firstGrantSlot !== undefined ? { identifier: reminder.key } : {}),
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: 'default',
        data: {
          kind: reminder.sourceId === 'daily' ? 'daily_reading' : 'planning',
          planId: reminder.planId,
          sourceId: reminder.sourceId,
          planReminderKey: reminder.key,
        },
      },
      trigger: reminder.repeatDaily
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: reminder.dueAt.getHours(),
            minute: reminder.dueAt.getMinutes(),
            channelId: CHANNEL,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminder.dueAt,
            channelId: CHANNEL,
          },
    });
  },
  cancel: (id) => Notifications.cancelScheduledNotificationAsync(id),
};
