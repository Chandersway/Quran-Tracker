import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { PlanReminderPort } from './planningReminders';
import { notificationDeliveryAllowed } from './notificationSystem';

export const PLAN_REMINDER_CHANNEL = 'reading-plans';
const CHANNEL = PLAN_REMINDER_CHANNEL;
export async function hasPlanReminderPermission(): Promise<boolean> {
  return (
    Platform.OS !== 'web' && notificationDeliveryAllowed(await Notifications.getPermissionsAsync())
  );
}
export async function requestPlanReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Planning',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  return (
    notificationDeliveryAllowed(await Notifications.getPermissionsAsync()) ||
    notificationDeliveryAllowed(await Notifications.requestPermissionsAsync())
  );
}
export const expoPlanReminderPort: PlanReminderPort = {
  async list() {
    if (Platform.OS === 'web') return [];
    return (await Notifications.getAllScheduledNotificationsAsync()).map((item) => ({
      id: item.identifier,
      data:
        item.content.data?.kind === 'wirdna-daily-reading'
          ? { planReminderKey: `legacy-daily:${item.identifier}` }
          : (item.content.data ?? {}),
    }));
  },
  async schedule(reminder) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: {
          kind: reminder.repeatDaily ? 'daily_reading' : 'planning',
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
