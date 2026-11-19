export type LocalNotificationPreferences = {
  enabled: boolean;
  daily: boolean;
  dailyMinute: number;
  extra: boolean;
  extraMinute: number;
  planning: boolean;
  quiet: boolean;
  quietStart: number;
  quietEnd: number;
};
export const localNotificationDefaults: LocalNotificationPreferences = {
  enabled: true,
  daily: true,
  dailyMinute: 480,
  extra: true,
  extraMinute: 1260,
  planning: true,
  quiet: false,
  quietStart: 1320,
  quietEnd: 420,
};
export function decodeNotificationPreferences(
  value: unknown,
  fallback = localNotificationDefaults,
): LocalNotificationPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid local notification preferences');
  const row = value as Record<string, unknown>;
  const result = { ...fallback };
  for (const key of ['enabled', 'daily', 'extra', 'planning', 'quiet'] as const) {
    if (row[key] !== undefined && typeof row[key] !== 'boolean')
      throw new Error('Invalid local notification preference');
    result[key] = row[key] === undefined ? fallback[key] : row[key];
  }
  for (const key of ['dailyMinute', 'extraMinute', 'quietStart', 'quietEnd'] as const) {
    if (
      row[key] !== undefined &&
      (!Number.isInteger(row[key]) || Number(row[key]) < 0 || Number(row[key]) > 1439)
    )
      throw new Error('Invalid notification time');
    result[key] = row[key] === undefined ? fallback[key] : Number(row[key]);
  }
  return result;
}
/** NotificationPolicy.QuietHours: end belongs to today or tomorrow in device time. */
export function nextAllowedReminder(
  at: Date,
  preferences: Pick<LocalNotificationPreferences, 'quiet' | 'quietStart' | 'quietEnd'>,
): Date {
  const { quiet, quietStart: start, quietEnd: end } = preferences;
  if (!quiet || start === end) return at;
  const minute = at.getHours() * 60 + at.getMinutes();
  const overnight = start > end;
  if (!(overnight ? minute >= start || minute < end : minute >= start && minute < end)) return at;
  const allowed = new Date(at);
  if (overnight && minute >= start) allowed.setDate(allowed.getDate() + 1);
  allowed.setHours(Math.floor(end / 60), end % 60, 0, 0);
  return allowed;
}
