import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceStorage } from '../storage/deviceStorage';
import { pushDeviceKeys } from './pushDeviceKeys';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getBackend } from '../../config/runtime';
import { localPushPreferences } from './pushDevice';
import {
  authorizeGroupPush,
  groupReplyCopy,
  groupPostCopy,
  GROUP_PUSH_CHANNEL,
  isGroupPushMessage,
  parseGroupPush,
  type GroupReplyGate,
} from './groupPushPolicy';
import { groupPushRevision, withGroupPushLock } from './groupPushState';
import { notificationDeliveryAllowed } from './notificationSystem';

const blocked = {
  shouldShowBanner: false,
  shouldShowList: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
};
const shown = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
};
const approvedLocal = new Map<string, number>();
let initialized = false;

async function pushGate(): Promise<GroupReplyGate | null> {
  const backend = getBackend();
  if (!backend) return null;
  return {
    account: async () => (await backend.auth.getSession())?.user.id ?? null,
    local: async () => ({
      ...(await localPushPreferences()),
      permission: notificationDeliveryAllowed(await Notifications.getPermissionsAsync()),
      registeredUser:
        (await deviceStorage.getItem(pushDeviceKeys.registered)) === 'registered'
          ? await deviceStorage.getItem(pushDeviceKeys.user)
          : null,
    }),
    target: (eventId) => backend.notifications.groupPushTarget(eventId),
    preferences: () => backend.notifications.loadGroupPushPreferences(),
    groupPreferences: (code) => backend.notifications.loadGroupPreferences(code),
  };
}

/** Both the foreground receiver and native headless task enter this ordered, deduplicated gate. */
export function receiveGroupReply(value: unknown): Promise<boolean> {
  return withGroupPushLock(async () => {
    const reply = parseGroupPush(value);
    if (!reply || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return false;
    const revision = groupPushRevision();
    const gate = await pushGate();
    if (!gate) return false;
    const target = await authorizeGroupPush(reply, gate);
    if (!target || revision !== groupPushRevision()) return false;
    const now = Date.now();
    const raw = await deviceStorage.getItem(pushDeviceKeys.delivered);
    const delivered = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    if (delivered[reply.eventId]) return false;
    const stateRaw = await AsyncStorage.getItem('wirdna:state:v1');
    const language = stateRaw
      ? (JSON.parse(stateRaw) as { preferences?: { language?: string } }).preferences?.language
      : 'en';
    const catalog = reply.kind === 'group_post' ? groupPostCopy : groupReplyCopy;
    const copy = catalog[language === 'ar' || language === 'nl' ? language : 'en'];
    if (revision !== groupPushRevision() || (await gate.account()) !== reply.recipient)
      return false;
    const identifier = `${reply.kind === 'group_post' ? 'group-post' : 'group-reply'}:${reply.eventId}`;
    approvedLocal.set(identifier, revision);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: copy.title,
          body: copy.body,
          data: {
            kind: reply.kind,
            event_id: reply.eventId,
            recipient: reply.recipient,
            group_code: target.groupCode,
            post_id: target.postId,
          },
          sound: 'default',
        },
        trigger: Platform.OS === 'android' ? { channelId: GROUP_PUSH_CHANNEL } : null,
      });
      if (revision !== groupPushRevision() || (await gate.account()) !== reply.recipient) {
        await Notifications.dismissNotificationAsync(identifier);
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return false;
      }
      const recent = Object.fromEntries(
        Object.entries(delivered)
          .filter(([, timestamp]) => timestamp > now - 24 * 60 * 60 * 1000)
          .slice(-999),
      );
      recent[reply.eventId] = now;
      await deviceStorage.setItem(pushDeviceKeys.delivered, JSON.stringify(recent));
      return true;
    } finally {
      // The foreground callback runs as part of immediate delivery; retain approval briefly for native dispatch.
      setTimeout(() => approvedLocal.delete(identifier), 10000);
    }
  });
}

export function initializeGroupPushHandler(): void {
  if (initialized || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return;
  initialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      if (!isGroupPushMessage(notification)) return shown;
      if (approvedLocal.get(notification.request.identifier) === groupPushRevision()) return shown;
      // SDK 58 shows a notification when this handler times out. Never await network work here.
      void receiveGroupReply(notification).catch(() => undefined);
      return blocked;
    },
  });
}
