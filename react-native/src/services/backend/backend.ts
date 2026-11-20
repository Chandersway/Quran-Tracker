import { sessionStorage } from '../storage/sessionStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAuthService } from '../auth/auth';
import { createAccountMutation } from '../auth/accountMutation';
import { createProfileService } from '../profiles/profiles';
import type { ProfileService } from '../profiles/types';
import { createClient } from '@supabase/supabase-js';
import type {
  AuthService,
  AudioService,
  BackendConfig,
  Group,
  GroupComment,
  GroupFeedPost,
  GroupMemberPermissions,
  GroupService,
  NotificationPreferences,
  NotificationService,
  PushDeviceInput,
} from './types';
import { createAudioService } from '../audio/audio';
import { unregisterPushDevice } from '../notifications/pushDevice';
import { createGroupOperations } from '../groups/groupOperations';
import { readGroupProgressEntries } from '../groups/groupProgressReader';
import {
  createGroupFeedReader,
  feedCursorFilter,
  type FeedRow,
  type GroupFeedReadPort,
} from '../groups/groupFeedReader';
import { createGroupFeedSubscription } from '../groups/groupFeedSubscription';
import { createGroupChatService } from '../groups/groupChat';
import { createSupabaseGroupTyping } from '../groups/groupTypingSupabase';
import { captureDraftActor } from '../groups/draftActor';
import { readGroupPushTarget } from './notificationTargets';
import type { GroupMedia } from '../groups/groupTypes';

export type Backend = {
  auth: AuthService;
  groups: GroupService;
  notifications: NotificationService;
  audio: AudioService;
  profiles: ProfileService;
};

function unwrap<T>(result: { data: T; error: { message: string; details?: string } | null }): T {
  if (result.error)
    throw new Error([result.error.message, result.error.details].filter(Boolean).join('\n'));
  return result.data;
}
function required<T>(value: T | null | undefined, label: string): T {
  if (value == null) throw new Error(`${label} returned no record`);
  return value;
}
function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
type DbRow = Record<string, unknown>;

/** Supabase-backed services. Data services use user-owned tables and can be replaced by local stores. */
export function createBackend(config: BackendConfig): Backend {
  if (!config.supabaseUrl || !config.supabaseAnonKey)
    throw new Error('Supabase URL and anon key are required');
  const authStorageKey = `sb-${new URL(config.supabaseUrl).hostname.split('.')[0]}-auth-token`;
  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storageKey: authStorageKey,
      storage: sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });

  const profiles = createProfileService(client, { storage: AsyncStorage });
  const auth = createAuthService(
    client,
    config.supabaseUrl,
    () => unregisterPushDevice({ notifications }),
    (accountId) => profiles.clearCache(accountId),
    undefined,
    createAccountMutation({
      backendUrl: config.supabaseUrl,
      publicKey: config.supabaseAnonKey,
      storageKey: authStorageKey,
      storage: sessionStorage,
    }),
  );

  let feedSubscriptionId = 0;
  const draftActor = (expectedUserId?: string) =>
    captureDraftActor(async () => {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    }, expectedUserId);
  async function loadPostMedia(groupId: string, posts: FeedRow[]): Promise<GroupMedia[]> {
    const mediaIds = posts.filter((post) => post.type === 'media').map((post) => String(post.id));
    if (!mediaIds.length) return [];
    const media = unwrap(
      await client
        .from('group_media')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'visible')
        .is('deleted_at', null)
        .in('source_post_id', mediaIds),
    ) as DbRow[];
    if (!media.length) return [];
    const attachments = unwrap(
      await client
        .from('post_attachments')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'ready')
        .is('deleted_at', null)
        .in(
          'id',
          media.map((row) => String(row.attachment_id)),
        ),
    ) as DbRow[];
    const rows = await Promise.all(
      media.map(async (row): Promise<GroupMedia | null> => {
        const file = attachments.find((entry) => entry.id === row.attachment_id);
        if (!file) return null;
        const path = String(file.storage_path);
        const signed = await client.storage.from('group-media').createSignedUrl(path, 7200);
        if (signed.error) throw signed.error;
        return {
          id: String(row.id),
          attachment_id: String(file.id),
          source_post_id: String(row.source_post_id),
          storage_path: path,
          mime_type: String(file.mime_type),
          file_name: String(file.file_name),
          byte_size: Number(file.byte_size),
          width: file.width == null ? null : Number(file.width),
          height: file.height == null ? null : Number(file.height),
          created_by: String(file.uploaded_by),
          display_name: '',
          avatar_url: null,
          caption: String(posts.find((post) => post.id === row.source_post_id)?.content ?? ''),
          created_at: String(row.created_at),
          can_delete: false,
          signedUrl: signed.data.signedUrl,
        };
      }),
    );
    return rows.filter((row): row is GroupMedia => row !== null);
  }
  async function hydrateFeed(code: string, posts: FeedRow[]): Promise<GroupFeedPost[]> {
    if (!posts.length) return [];
    const group = await groups.get(code);
    const userId = (await client.auth.getUser()).data.user?.id ?? null;
    const ids = posts.map((post) => String(post.id));
    const [memberRows, reactionRows, commentRows, mediaRows] = await Promise.all([
      groups.listMembers(code),
      client
        .from('post_reactions')
        .select('post_id,user_id,reaction')
        .eq('group_id', group.id)
        .in('post_id', ids),
      client
        .from('post_comments')
        .select('*')
        .eq('group_id', group.id)
        .eq('status', 'published')
        .in('post_id', ids)
        .order('created_at'),
      loadPostMedia(group.id, posts),
    ]);
    const reactions = unwrap(reactionRows) as DbRow[];
    const comments = unwrap(commentRows) as DbRow[];
    const members = new Map(memberRows.map((member) => [member.userId, member]));
    return posts.map((post) => {
      const postReactions = reactions.filter((reaction) => reaction.post_id === post.id);
      const postComments: GroupComment[] = comments
        .filter((comment) => comment.post_id === post.id)
        .map((comment) => ({
          id: String(comment.id),
          postId: String(comment.post_id),
          createdBy: String(comment.created_by),
          displayName:
            members.get(String(comment.created_by))?.displayName ??
            String(comment.display_name_snapshot ?? 'Member'),
          content: String(comment.content ?? ''),
          createdAt: String(comment.created_at ?? ''),
          isMine: comment.created_by === userId,
          ...(members.get(String(comment.created_by))?.avatarUrl
            ? { avatarUrl: members.get(String(comment.created_by))!.avatarUrl }
            : {}),
        }));
      const counts: Record<string, number> = {};
      for (const reaction of postReactions)
        counts[String(reaction.reaction)] = (counts[String(reaction.reaction)] ?? 0) + 1;
      const authorId = String(post.created_by ?? '');
      return {
        id: String(post.id),
        createdBy: authorId,
        displayName:
          members.get(authorId)?.displayName ?? String(post.display_name_snapshot ?? 'Member'),
        type: String(post.type ?? 'text'),
        content: String(post.content ?? ''),
        createdAt: String(post.created_at ?? ''),
        editedAt: typeof post.edited_at === 'string' ? post.edited_at : null,
        isPinned: Boolean(post.pinned_at),
        isMine: authorId === userId,
        likeCount: counts.like ?? 0,
        likedByMe: Boolean(
          userId && postReactions.some((r) => r.user_id === userId && r.reaction === 'like'),
        ),
        reactionCounts: counts,
        myReaction: userId
          ? optionalString(postReactions.find((r) => r.user_id === userId)?.reaction)
          : null,
        comments: postComments,
        avatarUrl: members.get(authorId)?.avatarUrl ?? null,
        media: mediaRows.find((media) => media.source_post_id === post.id) ?? null,
      };
    });
  }

  const feedPort: GroupFeedReadPort = {
    groupId: async (code) => (await groups.get(code)).id,
    async read(input) {
      let query = client
        .from('group_posts')
        .select('*')
        .eq('group_id', input.groupId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (input.textOnly) query = query.eq('type', 'text');
      if (input.postId) query = query.eq('id', input.postId);
      if (input.cursor) query = query.or(feedCursorFilter(input.cursor));
      if (input.pinnedOnly) {
        query = query.not('pinned_at', 'is', null);
        const pins: FeedRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const batch = unwrap(await query.range(offset, offset + 499)) as FeedRow[];
          pins.push(...batch);
          if (batch.length < 500) return pins;
        }
      }
      return unwrap(await query.limit(input.limit)) as FeedRow[];
    },
    hydrate: hydrateFeed,
  };
  const groups: GroupService = {
    ...createSupabaseGroupTyping(client, auth, config),
    ...createGroupChatService({
      ...feedPort,
      subscribe: (code, change, status) => groups.subscribeFeed(code, change, status),
      send: (code, content, actorId) => groups.createTextPost(code, content, undefined, actorId),
    }),
    ...createGroupOperations({
      async rpc<T>(name: string, params?: Record<string, unknown>) {
        return unwrap(await client.rpc(name, params)) as T;
      },
      async select<T>(table: string, groupId: string) {
        if (table === 'group_progress_entries')
          return (await readGroupProgressEntries(client, groupId)) as T[];
        return unwrap(await client.from(table).select('*').eq('group_id', groupId)) as T[];
      },
      userId: async () => (await auth.getSession())?.user.id ?? null,
      group: (code) => groups.get(code),
      members: (code) => groups.listMembers(code),
      feed: (code, postId) => groups.listFeed(code, postId),
      async upload(bucket, path, bytes, mime, upsert = false) {
        const result = await client.storage
          .from(bucket)
          .upload(path, bytes, { contentType: mime, upsert });
        if (result.error) throw result.error;
      },
      async remove(bucket, path) {
        const result = await client.storage.from(bucket).remove([path]);
        if (result.error) throw result.error;
      },
      async signedUrl(bucket, path, seconds) {
        const result = await client.storage.from(bucket).createSignedUrl(path, seconds);
        if (result.error) throw result.error;
        return result.data.signedUrl;
      },
      publicUrl: (bucket, path) => client.storage.from(bucket).getPublicUrl(path).data.publicUrl,
      uuid: () =>
        globalThis.crypto?.randomUUID?.() ??
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (part) => {
          const value = Math.floor(Math.random() * 16);
          return (part === 'x' ? value : (value & 3) | 8).toString(16);
        }),
    }),
    async list() {
      return unwrap(await client.rpc('list_my_groups_v2')) as Group[];
    },
    async get(code) {
      const rows = unwrap(
        await client.rpc('get_group_detail_v3', { p_code: code.trim().toUpperCase() }),
      ) as Group[] | Group;
      return required(Array.isArray(rows) ? rows[0] : rows, 'Get group');
    },
    async create(input) {
      const result = unwrap(
        await client.rpc('create_group_v3_full', {
          p_code: input.code.trim().toUpperCase(),
          p_name: input.name.trim(),
          p_description: input.description ?? '',
          p_goal_type: input.goalType ?? 'free_reading',
          p_progress_unit: input.progressUnit ?? 'page',
          p_goal_period: input.goalPeriod ?? 'none',
          p_goal_target: input.goalTarget ?? null,
          p_privacy: input.privacy ?? 'restricted',
          p_member_permissions: input.memberPermissions ?? {
            canPostMessages: true,
            canShareProgress: true,
            canComment: true,
            canInviteMembers: false,
          },
        }),
      ) as Group | Group[];
      const created = required(Array.isArray(result) ? result[0] : result, 'Create group');
      return groups.get(created.code);
    },
    async join(code, displayName = '') {
      const rows = unwrap(
        await client.rpc('join_group_v2_by_code', {
          p_code: code.trim().toUpperCase(),
          p_display_name: displayName,
        }),
      ) as Group | Group[];
      const joined = required(Array.isArray(rows) ? rows[0] : rows, 'Join group');
      return groups.get(joined.code);
    },
    async listMembers(code) {
      const group = await groups.get(code);
      const userId = (await client.auth.getUser()).data.user?.id;
      const rows = unwrap(
        await client.rpc('list_group_members_v3', { p_group_id: group.id }),
      ) as Array<Record<string, unknown>>;
      return rows.map((row) => ({
        groupCode: String(row.group_code ?? group.code),
        userId: String(row.user_id ?? ''),
        displayName: String(row.display_name ?? ''),
        role: String(row.role ?? 'member'),
        avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : null,
        joinedAt: String(row.joined_at ?? ''),
        isCurrentUser: Boolean(userId && row.user_id === userId),
      }));
    },
    listFeedPage: createGroupFeedReader(feedPort),
    subscribeFeed: createGroupFeedSubscription({
      groupId: async (code) => (await groups.get(code)).id,
      open(groupId, change, status) {
        const channel = client.channel(`group-feed:${groupId}:${++feedSubscriptionId}`, {
          // A socket join alone does not prove postgres_changes is ready.
          config: { postgres_changes_options: { wait: true } },
        });
        // DELETE payloads cannot reliably be group-filtered with RLS; polling handles them.
        for (const table of [
          'group_posts',
          'post_comments',
          'post_reactions',
          'group_media',
          'post_attachments',
        ]) {
          for (const event of ['INSERT', 'UPDATE'] as const) {
            channel.on(
              'postgres_changes',
              { event, schema: 'public', table, filter: `group_id=eq.${groupId}` },
              (payload) => {
                if ('group_id' in payload.new && payload.new.group_id === groupId) change();
              },
            );
          }
        }
        channel.subscribe((state) => {
          status(
            state === 'SUBSCRIBED'
              ? 'live'
              : state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED'
                ? 'polling'
                : 'connecting',
          );
        });
        return () => {
          void client.removeChannel(channel).catch(() => undefined);
        };
      },
    }),
    async listFeed(code, postId) {
      const page = await groups.listFeedPage(code, { postId, limit: 60 });
      return [
        ...new Map([...page.pinnedPosts, ...page.posts].map((post) => [post.id, post])).values(),
      ];
    },
    async createTextPost(code, content, displayName, expectedUserId) {
      const actor = await draftActor(expectedUserId);
      const group = await groups.get(code);
      const name = displayName ?? actor.displayName;
      const result = unwrap(
        await client
          .rpc('create_group_text_post_v2', {
            p_group_id: group.id,
            p_content: content.trim(),
            p_display_name: name,
          })
          .setHeader('Authorization', `Bearer ${actor.accessToken}`),
      ) as DbRow | DbRow[];
      const post = required(Array.isArray(result) ? result[0] : result, 'Create group post');
      // Once the RPC acknowledged the write, a later refresh failure must not mark it unsent.
      return {
        id: String(post.id),
        createdBy: String(post.created_by ?? ''),
        displayName: String(post.display_name_snapshot ?? name ?? 'Member'),
        type: String(post.type ?? 'text'),
        content: String(post.content ?? content),
        createdAt: String(post.created_at ?? ''),
        editedAt: null,
        isPinned: false,
        isMine: post.created_by === actor.userId,
        likeCount: 0,
        likedByMe: false,
        reactionCounts: {},
        myReaction: null,
        comments: [],
      };
    },
    async addComment(code, postId, content, displayName, expectedUserId) {
      const actor = await draftActor(expectedUserId);
      const group = await groups.get(code);
      const name = displayName ?? actor.displayName;
      const result = unwrap(
        await client
          .rpc('add_group_post_comment_v2', {
            p_group_id: group.id,
            p_post_id: postId,
            p_content: content.trim(),
            p_display_name: name,
          })
          .setHeader('Authorization', `Bearer ${actor.accessToken}`),
      ) as DbRow | DbRow[];
      const row = required(Array.isArray(result) ? result[0] : result, 'Create group comment');
      return {
        id: String(row.id),
        postId: String(row.post_id),
        createdBy: String(row.created_by ?? ''),
        displayName: String(row.display_name_snapshot ?? name ?? 'Member'),
        content: String(row.content ?? content),
        createdAt: String(row.created_at ?? ''),
        isMine: row.created_by === actor.userId,
      };
    },
    async toggleReaction(code, postId, reaction) {
      const group = await groups.get(code);
      const result = unwrap(
        await client.rpc('toggle_group_post_reaction_v2', {
          p_group_id: group.id,
          p_post_id: postId,
          p_reaction: reaction,
        }),
      ) as string;
      return result || null;
    },
    async listTasks(code) {
      const group = await groups.get(code);
      const rows = unwrap(
        await client.rpc('list_group_tasks_v3', { p_group_id: group.id, p_limit: 60 }),
      ) as DbRow[];
      return rows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        description: String(row.description ?? ''),
        taskType: String(row.task_type ?? 'challenge'),
        targetValue: Number(row.target_value ?? 0),
        targetUnit: String(row.target_unit ?? ''),
        startsAt: optionalString(row.starts_at),
        dueAt: optionalString(row.due_at),
        status: String(row.status ?? 'active'),
        createdBy: String(row.created_by ?? ''),
        displayName: String(row.display_name ?? ''),
        createdAt: String(row.created_at ?? ''),
        participantCount: Number(row.participant_count ?? 0),
        completedCount: Number(row.completed_count ?? 0),
        myProgress: Number(row.my_progress ?? 0),
        myCompleted: Boolean(row.my_completed),
        canManage: Boolean(row.can_manage),
        pointsReward: Number(row.points_reward ?? 0),
        myPointsAwarded: Boolean(row.my_points_awarded),
      }));
    },
    async createTask(code, input) {
      const group = await groups.get(code);
      unwrap(
        await client.rpc('create_group_task_v3', {
          p_group_id: group.id,
          p_title: input.title.trim(),
          p_description: input.description?.trim() ?? '',
          p_task_type: input.taskType ?? 'challenge',
          p_target_value: input.targetValue,
          p_target_unit: input.targetUnit,
          p_duration_days: input.durationDays ?? null,
          p_points_reward: Math.max(0, Math.min(1000, input.pointsReward ?? 0)),
        }),
      );
    },
    async setTaskProgress(code, taskId, progressValue) {
      const group = await groups.get(code);
      const rows = unwrap(
        await client.rpc('set_group_task_progress_v3', {
          p_group_id: group.id,
          p_task_id: taskId,
          p_progress: Math.max(0, Math.floor(progressValue)),
        }),
      ) as DbRow[];
      const row = required(rows[0], 'Update task progress');
      return Number(row.awarded_points ?? 0);
    },
    async update(code, input) {
      const group = await groups.get(code);
      unwrap(
        await client.rpc('update_group_v3_full', {
          p_group_id: group.id,
          p_name: input.name.trim(),
          p_description: input.description?.trim() ?? '',
          p_goal_type: input.goalType ?? group.goal_type,
          p_progress_unit: input.progressUnit ?? group.progress_unit,
          p_goal_period: input.goalPeriod ?? group.goal_period,
          p_goal_target: input.goalTarget === undefined ? group.goal_target : input.goalTarget,
          p_privacy: input.privacy ?? group.privacy,
          p_member_permissions:
            input.memberPermissions ?? (await groups.getMemberPermissions(code)),
        }),
      );
      return groups.get(group.code);
    },
    async getMemberPermissions(code) {
      const group = await groups.get(code);
      return unwrap(
        await client.rpc('get_group_member_permissions_v1', { p_group_id: group.id }),
      ) as GroupMemberPermissions;
    },
  };

  const notifications: NotificationService = {
    async groupPushTarget(eventId) {
      return readGroupPushTarget(client, eventId);
    },
    async loadGroupPushPreferences() {
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      const row = unwrap(
        await client
          .from('notification_preferences')
          .select('enabled,mention,reaction,announcement,invitation,join_request,update')
          .eq('user_id', user.id)
          .maybeSingle(),
      ) as Partial<NotificationPreferences> | null;
      return {
        enabled: row?.enabled ?? true,
        mention: row?.mention ?? true,
        reaction: row?.reaction ?? true,
        announcement: row?.announcement ?? true,
        invitation: row?.invitation ?? true,
        join_request: row?.join_request ?? true,
        update: row?.update ?? true,
      };
    },
    async saveGroupPushPreferences(preferences) {
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      unwrap(
        await client
          .from('notification_preferences')
          .upsert({ user_id: user.id, ...preferences }, { onConflict: 'user_id' }),
      );
    },
    async loadGroupPreferences(code) {
      const group = await groups.get(code);
      const result = unwrap(
        await client.rpc('get_group_notification_preferences_v2', { p_group_id: group.id }),
      ) as DbRow | DbRow[];
      const row = required(
        Array.isArray(result) ? result[0] : result,
        'Get group notification preferences',
      );
      return {
        level: String(row.level ?? 'all'),
        pushEnabled: Boolean(row.push_enabled ?? true),
        mutedUntil: optionalString(row.muted_until),
        updatedAt: optionalString(row.updated_at) ?? undefined,
      };
    },
    async updateGroupPreferences(code, level, pushEnabled, mutedUntil = null) {
      const group = await groups.get(code);
      const row = unwrap(
        await client.rpc('update_group_notification_preferences_v2', {
          p_group_id: group.id,
          p_level: level,
          p_push_enabled: pushEnabled,
          p_muted_until: mutedUntil,
        }),
      ) as DbRow | DbRow[];
      const data = Array.isArray(row) ? row[0] : row;
      const preference = required(data, 'Update group notification preferences');
      return {
        level: String(preference.level ?? level),
        pushEnabled: Boolean(preference.push_enabled ?? pushEnabled),
        mutedUntil: optionalString(preference.muted_until),
        updatedAt: optionalString(preference.updated_at) ?? undefined,
      };
    },
    async registerPushDevice(input: PushDeviceInput) {
      unwrap(
        await client.rpc('register_push_device_v2', {
          p_installation: input.installation,
          p_token: input.token,
          p_enabled: input.enabled,
          p_timezone: input.timezone,
          p_quiet: input.quiet,
          p_quiet_start: input.quietStart,
          p_quiet_end: input.quietEnd,
          p_language: input.language,
          p_platform: input.platform ?? 'android',
        }),
      );
    },
    async unregisterPushDevice(installation) {
      unwrap(await client.rpc('unregister_push_device_v1', { p_installation: installation }));
    },
  };

  const audio: AudioService = createAudioService(config.audioBaseUrl);
  return { auth, groups, notifications, audio, profiles };
}
