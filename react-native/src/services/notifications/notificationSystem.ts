export type NotificationPermission =
  | 'allowed'
  | 'provisional'
  | 'blocked'
  | 'undetermined'
  | 'unavailable';
export type NotificationChannelState = 'enabled' | 'blocked' | 'notCreated';

/** iOS provisional authorization permits quiet delivery without another OS prompt. */
export function notificationDeliveryAllowed(permission: {
  granted: boolean;
  ios?: { status?: number };
}): boolean {
  return permission.granted || permission.ios?.status === 3;
}

export type NotificationSystemStatus = {
  permission: NotificationPermission;
  channels: { id: string; state: NotificationChannelState }[];
};
export type NotificationSystemPort = {
  platform: string;
  permission(): Promise<{
    granted: boolean;
    status: string;
    androidImportance?: number;
    iosStatus?: number;
  }>;
  channels(): Promise<NotificationSystemStatus['channels']>;
  openAndroidSettings(): Promise<void>;
  openSettings(): Promise<void>;
  onResume(callback: () => void): () => void;
};

/** Read-only inspection: never requests permission, creates channels or registers a device. */
export async function readNotificationSystem(
  port: NotificationSystemPort,
): Promise<NotificationSystemStatus> {
  if (port.platform !== 'android' && port.platform !== 'ios')
    return { permission: 'unavailable', channels: [] };
  const [permission, channels] = await Promise.all([
    port.permission(),
    port.platform === 'android' ? port.channels() : Promise.resolve([]),
  ]);
  return {
    permission:
      permission.iosStatus === 3
        ? 'provisional'
        : permission.granted && permission.androidImportance !== 0
          ? 'allowed'
          : permission.status === 'undetermined'
            ? 'undetermined'
            : 'blocked',
    channels,
  };
}

export async function openNotificationSettings(port: NotificationSystemPort): Promise<void> {
  if (port.platform === 'android') {
    try {
      await port.openAndroidSettings();
      return;
    } catch {
      /* Older OEMs may only support app settings. */
    }
  }
  if (port.platform !== 'web') await port.openSettings();
}

/** A late pre-resume response cannot replace a newer system setting. */
export function observeNotificationSystem(
  port: NotificationSystemPort,
  changed: (status: NotificationSystemStatus) => void,
  failed: () => void,
) {
  let active = true;
  let revision = 0;
  const refresh = async () => {
    if (!active) return;
    const request = ++revision;
    try {
      const status = await readNotificationSystem(port);
      if (active && request === revision) changed(status);
    } catch {
      if (active && request === revision) failed();
    }
  };
  const stop = port.onResume(() => void refresh());
  void refresh();
  return {
    refresh,
    dispose() {
      active = false;
      revision++;
      stop();
    },
  };
}
