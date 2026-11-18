import { AppState, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { GROUP_PUSH_CHANNEL } from './groupPushPolicy';
import { PLAN_REMINDER_CHANNEL } from './planningReminderPort';
import type { NotificationSystemPort } from './notificationSystem';

export const notificationSystemPort: NotificationSystemPort = {
  platform: Platform.OS,
  async permission() {
    const status = await Notifications.getPermissionsAsync();
    return {
      granted: status.granted,
      status: status.status,
      iosStatus: status.ios?.status,
      androidImportance: status.android?.importance,
    };
  },
  async channels() {
    return Promise.all(
      [PLAN_REMINDER_CHANNEL, GROUP_PUSH_CHANNEL].map(async (id) => {
        const channel = await Notifications.getNotificationChannelAsync(id);
        return {
          id,
          state:
            channel === null
              ? ('notCreated' as const)
              : channel.importance === Notifications.AndroidImportance.NONE
                ? ('blocked' as const)
                : ('enabled' as const),
        };
      }),
    );
  },
  openAndroidSettings: () =>
    Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: 'com.Ameender.qurantracker' },
    ]),
  openSettings: () => Linking.openSettings(),
  onResume(callback) {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') callback();
    });
    return () => subscription.remove();
  },
};
