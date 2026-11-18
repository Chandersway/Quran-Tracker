import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { GROUP_PUSH_TASK, parseGroupReply } from './groupPushPolicy';
import { initializeGroupPushHandler, receiveGroupReply } from './groupPushRuntime';

initializeGroupPushHandler();
// Definition must run before React mounts so Expo can execute it in a headless JS runtime.
// Registration is deliberately confined to the explicit Enable push action.
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  GROUP_PUSH_TASK,
  async ({ data, error }) => {
    if (error || !data || 'actionIdentifier' in data || !parseGroupReply(data))
      return Notifications.BackgroundNotificationTaskResult.NoData;
    // APNs alert payloads are already presented by iOS in the background; avoid a duplicate local alert.
    if ('aps' in data && data.aps && typeof data.aps === 'object' && 'alert' in data.aps)
      return Notifications.BackgroundNotificationTaskResult.NoData;
    try {
      return (await receiveGroupReply(data))
        ? Notifications.BackgroundNotificationTaskResult.NewData
        : Notifications.BackgroundNotificationTaskResult.NoData;
    } catch {
      return Notifications.BackgroundNotificationTaskResult.Failed;
    }
  },
);
