import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { DesiredPlanReminder, PlanReminderPort } from './planningReminders';
import { notificationDeliveryAllowed as granted } from './notificationSystem';

/** Called only by the explicit Save action in a plan reminder sheet. */
export async function requestPlanReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('reading-reminders', {
      name: 'Reading reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const existing = await Notifications.getPermissionsAsync();
  if (granted(existing)) return true;
  if (existing.status === 'denied' && !existing.canAskAgain) return false;
  return granted(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    }),
  );
}

/** A status read never shows the OS permission prompt. */
export async function hasPlanReminderPermission(): Promise<boolean> {
  return granted(await Notifications.getPermissionsAsync());
}

export const expoPlanReminderPort: PlanReminderPort = {
  async list() {
    const rows = await Notifications.getAllScheduledNotificationsAsync();
    return rows.map((row) => ({ id: row.identifier, data: row.content.data ?? {} }));
  },
  schedule(reminder: DesiredPlanReminder) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: {
          planReminderKey: reminder.key,
          sourceId: reminder.sourceId,
          route: 'agenda',
          planId: reminder.planId,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.dueAt,
        channelId: 'reading-reminders',
      },
    });
  },
  cancel: (id) => Notifications.cancelScheduledNotificationAsync(id),
};
