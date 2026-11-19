import { deviceStorage } from '../storage/deviceStorage';
import { pushDeviceKeys } from './pushDeviceKeys';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Backend } from '../backend/backend';
import type { Language } from '../../state/models';
import {
  GROUP_PUSH_CHANNEL,
  GROUP_PUSH_TASK,
  type GroupPushKind,
  type LocalPushPreferences,
} from './groupPushPolicy';
import { groupPushRevision, invalidateGroupPush } from './groupPushState';
import { loadLocalNotifications } from './localReminders';
import { notificationDeliveryAllowed } from './notificationSystem';

export { pushDeviceKeys } from './pushDeviceKeys';

export async function localPushPreferences(): Promise<LocalPushPreferences> {
  const { quiet, quietStart, quietEnd } = await loadLocalNotifications();
  return { quiet, quietStart, quietEnd };
}

export async function dismissGroupNotifications(
  groupCode?: string,
  kind?: GroupPushKind,
): Promise<void> {
  invalidateGroupPush();
  const matches = (data: Record<string, unknown> | undefined) =>
    (data?.kind === 'group_reply' || data?.kind === 'group_post') &&
    (!kind || data.kind === kind) &&
    (!groupCode || data.group_code === groupCode);
  const presented = await Notifications.getPresentedNotificationsAsync();
  await Promise.all(
    presented
      .filter((item) => matches(item.request.content.data))
      .map((item) => Notifications.dismissNotificationAsync(item.request.identifier)),
  );
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => matches(item.content.data))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/** Refresh an existing opt-in only; this never requests permission or opts another account in. */
export async function syncRegisteredPushDevice(
  backend: Pick<Backend, 'auth' | 'notifications'>,
  language: Language,
  nextToken?: string,
): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  const account = (await backend.auth.getSession())?.user.id;
  if (
    !account ||
    (await deviceStorage.getItem(pushDeviceKeys.user)) !== account ||
    (await deviceStorage.getItem(pushDeviceKeys.registered)) !== 'registered'
  )
    return;
  const installation = await deviceStorage.getItem(pushDeviceKeys.installation);
  const token = nextToken ?? (await deviceStorage.getItem(pushDeviceKeys.token));
  if (!installation || !token) return;
  const local = await localPushPreferences();
  const global = await backend.notifications.loadGroupPushPreferences();
  const permission = await Notifications.getPermissionsAsync();
  await backend.notifications.registerPushDevice({
    installation,
    token,
    platform: Platform.OS,
    enabled: global.enabled && notificationDeliveryAllowed(permission),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ...local,
    language,
  });
  if (
    (await backend.auth.getSession())?.user.id !== account ||
    (await deviceStorage.getItem(pushDeviceKeys.user)) !== account
  )
    return;
  await deviceStorage.setItem(pushDeviceKeys.token, token);
}

export async function enablePushDevice(
  backend: Pick<Backend, 'auth' | 'notifications'>,
  language: Language,
): Promise<void> {
  const revision = groupPushRevision();
  if (Platform.OS !== 'android' && Platform.OS !== 'ios')
    throw new Error('Native push is unavailable');
  const user = await backend.auth.getUser();
  if (!user) throw new Error('Sign in first');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(GROUP_PUSH_CHANNEL, {
      name: language === 'nl' ? 'Notificaties' : language === 'ar' ? 'الإشعارات' : 'Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!notificationDeliveryAllowed(permission))
    permission = await Notifications.requestPermissionsAsync();
  if (!notificationDeliveryAllowed(permission)) throw new Error('Notification permission denied');
  const token = await Notifications.getDevicePushTokenAsync();
  if (token.type !== Platform.OS || typeof token.data !== 'string' || token.data.length < 20)
    throw new Error('No native push token');
  const installation =
    (await deviceStorage.getItem(pushDeviceKeys.installation)) ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (part) => {
      const value = Math.floor(Math.random() * 16);
      return (part === 'x' ? value : (value & 3) | 8).toString(16);
    });
  await deviceStorage.setItem(pushDeviceKeys.installation, installation);
  const local = await localPushPreferences();
  const global = await backend.notifications.loadGroupPushPreferences();
  await backend.notifications.registerPushDevice({
    installation,
    token: token.data,
    platform: Platform.OS,
    enabled: global.enabled,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ...local,
    language,
  });
  if ((await backend.auth.getSession())?.user.id !== user.id)
    throw new Error('Account changed during registration');
  try {
    // Native task registration is an explicit consequence of the Enable push button.
    await Notifications.registerTaskAsync(GROUP_PUSH_TASK);
    if (groupPushRevision() !== revision || (await backend.auth.getSession())?.user.id !== user.id)
      throw new Error('Account changed during registration');
    await deviceStorage.multiSet([
      [pushDeviceKeys.token, token.data],
      [pushDeviceKeys.user, user.id],
      [pushDeviceKeys.registered, 'registered'],
    ]);
    if (
      groupPushRevision() !== revision ||
      (await backend.auth.getSession())?.user.id !== user.id
    ) {
      await deviceStorage.multiRemove([
        pushDeviceKeys.registered,
        pushDeviceKeys.user,
        pushDeviceKeys.token,
      ]);
      throw new Error('Account changed during registration');
    }
  } catch (error) {
    await backend.notifications.unregisterPushDevice(installation).catch(() => undefined);
    throw error;
  }
}

/** Remove this installation's remote push token before the user's session ends. */
export async function unregisterPushDevice(backend: Pick<Backend, 'notifications'>) {
  invalidateGroupPush();
  const installation = await deviceStorage.getItem(pushDeviceKeys.installation);
  const wasRegistered = (await deviceStorage.getItem(pushDeviceKeys.registered)) === 'registered';
  // Revoke the local account gate before waiting on any network/native operation.
  await deviceStorage.multiRemove([
    pushDeviceKeys.registered,
    pushDeviceKeys.user,
    pushDeviceKeys.token,
  ]);
  const cleanup = [
    dismissGroupNotifications(),
    Notifications.unregisterTaskAsync(GROUP_PUSH_TASK),
    Notifications.unregisterForNotificationsAsync(),
  ];
  if (installation && wasRegistered)
    cleanup.push(backend.notifications.unregisterPushDevice(installation));
  const results = await Promise.allSettled(cleanup);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') throw failed.reason;
}
