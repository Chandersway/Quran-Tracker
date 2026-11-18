import type { GroupPushPreferences } from '../backend/types';

export type GroupReply = { eventId: string; recipient: string };
export const GROUP_PUSH_TASK = 'wirdna:group-reply:v1';
export const GROUP_PUSH_CHANNEL = 'firebase_messages_v1';
export type GroupPushTarget = { groupCode: string; postId: string };
export type LocalPushPreferences = { quiet: boolean; quietStart: number; quietEnd: number };
export type GroupReplyGate = {
  account(): Promise<string | null>;
  local(): Promise<LocalPushPreferences & { registeredUser: string | null; permission: boolean }>;
  target(eventId: string): Promise<GroupPushTarget | null>;
  preferences(): Promise<{ enabled: boolean; reaction: boolean }>;
  groupPreferences(code: string): Promise<GroupPushPreferences>;
};
export const validPushUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Accept the existing FCM v1 fields, APNs fields and Expo's serialized task/response envelopes. */
function findGroupReply(value: unknown, depth = 0): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || depth > 6) return null;
  const row = value as Record<string, unknown>;
  if (row.kind === 'group_reply') return row;
  if (typeof row.dataString === 'string' && row.dataString.length < 16384) {
    try {
      const result = findGroupReply(JSON.parse(row.dataString), depth + 1);
      if (result) return result;
    } catch {
      /* Malformed provider data is ignored. */
    }
  }
  for (const key of ['data', 'notification', 'request', 'content', 'trigger', 'remoteMessage']) {
    const result = findGroupReply(row[key], depth + 1);
    if (result) return result;
  }
  return null;
}

export const isGroupReplyMessage = (value: unknown): boolean => findGroupReply(value) !== null;
export function parseGroupReply(value: unknown): GroupReply | null {
  const row = findGroupReply(value);
  return row && validPushUuid(row.event_id) && validPushUuid(row.recipient)
    ? { eventId: row.event_id, recipient: row.recipient }
    : null;
}

export function quietHoursActive(preferences: LocalPushPreferences, now = new Date()): boolean {
  const { quiet, quietStart: start, quietEnd: end } = preferences;
  if (!quiet || start === end) return false;
  const minute = now.getHours() * 60 + now.getMinutes();
  return start > end ? minute >= start || minute < end : minute >= start && minute < end;
}

/** Identity and preferences are checked again after the authenticated membership/post lookup. */
export async function authorizeGroupReply(
  reply: GroupReply,
  gate: GroupReplyGate,
  now = new Date(),
): Promise<GroupPushTarget | null> {
  const account = await gate.account();
  if (account !== reply.recipient) return null;
  const local = await gate.local();
  const allowedHere = (value: typeof local) =>
    value.registeredUser === account && value.permission && !quietHoursActive(value, now);
  if (!allowedHere(local)) return null;
  const target = await gate.target(reply.eventId);
  if (!target) return null;
  const [global, group] = await Promise.all([
    gate.preferences(),
    gate.groupPreferences(target.groupCode),
  ]);
  if (
    !global.enabled ||
    !global.reaction ||
    !group.pushEnabled ||
    ['muted', 'mentions'].includes(group.level)
  )
    return null;
  if (group.mutedUntil && Date.parse(group.mutedUntil) > now.getTime()) return null;
  if ((await gate.account()) !== account || !allowedHere(await gate.local())) return null;
  return target;
}

/** A tap may open an existing discussion even during quiet hours; ownership/membership still must resolve. */
export async function resolveGroupReplyNavigation(
  reply: { eventId: string; recipient?: string },
  gate: Pick<GroupReplyGate, 'account' | 'target'>,
): Promise<GroupPushTarget | null> {
  if (!validPushUuid(reply.eventId)) return null;
  const account = await gate.account();
  if (!account || (reply.recipient && reply.recipient !== account)) return null;
  const target = await gate.target(reply.eventId);
  return target && (await gate.account()) === account ? target : null;
}

/** Exact notification copy from Kotlin NotificationText.kt. */
export const groupReplyCopy = {
  nl: {
    title: 'Nieuwe groepsreactie',
    body: 'Er is gereageerd op een discussie waaraan je deelneemt. Tik om te bekijken.',
  },
  en: {
    title: 'New group reply',
    body: 'Someone replied to a discussion you participate in. Tap to view.',
  },
  ar: { title: 'رد جديد في المجموعة', body: 'هناك رد جديد في نقاش تشارك فيه. اضغط لعرضه.' },
} as const;
