import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthService } from '../auth/types';
import type { BackendConfig } from '../backend/types';
import { captureDraftActor } from './draftActor';
import { createGroupTypingService, type GroupTypingScope } from './groupTyping';

/** Optional feature adapter; the ordinary chat transport never depends on this RPC. */
export function createSupabaseGroupTyping(
  client: SupabaseClient,
  auth: AuthService,
  config: BackendConfig,
) {
  const actor = (expectedUserId: string) =>
    captureDraftActor(async () => {
      const result = await client.auth.getSession();
      if (result.error) throw result.error;
      return result.data.session;
    }, expectedUserId);
  return createGroupTypingService({
    async resolve(code, expectedUserId): Promise<GroupTypingScope> {
      const captured = await actor(expectedUserId);
      const started = Date.now();
      const result = await client
        .rpc('get_group_typing_channel_v1', { p_code: code.trim().toUpperCase() })
        .setHeader('Authorization', `Bearer ${captured.accessToken}`);
      const received = Date.now();
      if (result.error) throw result.error;
      const row = result.data as {
        group_id?: unknown;
        topic?: unknown;
        server_time?: unknown;
      } | null;
      if (
        !row ||
        typeof row.group_id !== 'string' ||
        row.topic !== `group-typing:v1:${row.group_id}:${expectedUserId}` ||
        typeof row.server_time !== 'string' ||
        !Number.isFinite(Date.parse(row.server_time))
      )
        throw new Error('INVALID_TYPING_SCOPE');
      const members = await client
        .rpc('list_group_members_v3', { p_group_id: row.group_id })
        .setHeader('Authorization', `Bearer ${captured.accessToken}`);
      if (members.error) throw members.error;
      // A switch while either authorized request was pending invalidates its result.
      await actor(expectedUserId);
      return {
        groupId: row.group_id,
        topic: row.topic as string,
        clockOffsetMs: Date.parse(row.server_time as string) - (started + received) / 2,
        members: (members.data as Array<{ user_id: string; display_name: string }>).map(
          (member) => ({
            userId: member.user_id,
            displayName: member.display_name,
          }),
        ),
      };
    },
    open(topic, expectedUserId, onPayload, onReady) {
      // An isolated authenticated socket avoids shared-channel reuse and prevents
      // a later main-client account change from adopting an old typing scope.
      const socket = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        accessToken: async () => (await actor(expectedUserId)).accessToken,
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const channel = socket.channel(topic, {
        config: { private: true, broadcast: { self: false } },
      });
      channel.on('broadcast', { event: 'typing' }, (event) => onPayload(event.payload));
      channel.subscribe((state) => onReady(state === 'SUBSCRIBED'));
      return () => {
        void socket
          .removeChannel(channel)
          .catch(() => undefined)
          .finally(() => socket.realtime.disconnect());
      };
    },
    async publish(groupId, expectedUserId, typing) {
      const captured = await actor(expectedUserId);
      const result = await client
        .rpc('publish_group_typing_v1', { p_group_id: groupId, p_typing: typing })
        .setHeader('Authorization', `Bearer ${captured.accessToken}`);
      if (result.error) throw result.error;
    },
    onActorChange(expectedUserId, close) {
      return auth.onChange((session) => {
        if (session?.user.id !== expectedUserId) close();
      });
    },
  });
}
