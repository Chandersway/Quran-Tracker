export const pushDeviceKeys = {
  installation: 'wirdna:notification-preferences:v1:installation',
  registered: 'wirdna:notification-preferences:v1:device',
  user: 'wirdna:notification-preferences:v1:user',
  token: 'wirdna:notification-preferences:v1:token',
  local: 'wirdna:notification-preferences:v1',
  delivered: 'wirdna:notification-preferences:v1:delivered',
} as const;

// Local notification preferences are portable personal data; never put `local` here.
export const deviceTransientKeys = [
  pushDeviceKeys.installation,
  pushDeviceKeys.registered,
  pushDeviceKeys.user,
  pushDeviceKeys.token,
  pushDeviceKeys.delivered,
] as const;
