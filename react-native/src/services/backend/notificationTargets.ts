import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationService } from './types';

/** Resolve only server-authorized IDs; legacy fallback is limited to missing RPCs. */
export async function readGroupPushTarget(
  client: Pick<SupabaseClient, 'rpc'>,
  eventId: string,
): ReturnType<NotificationService['groupPushTarget']> {
  let result = await client.rpc('get_group_push_target_v2', { p_event: eventId });
  const legacy = result.error?.code === 'PGRST202' || result.error?.code === '42883';
  if (legacy) result = await client.rpc('get_group_push_target_v1', { p_event: eventId });
  if (result.error) throw new Error(result.error.message);
  const row: unknown = Array.isArray(result.data) ? result.data[0] : null;
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;
  if (typeof value.group_code !== 'string' || typeof value.post_id !== 'string') return null;
  if (legacy) return { groupCode: value.group_code, postId: value.post_id };
  if (value.kind !== 'group_reply' && value.kind !== 'group_post') return null;
  return { groupCode: value.group_code, postId: value.post_id, kind: value.kind };
}
