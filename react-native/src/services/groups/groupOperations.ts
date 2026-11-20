import type { Group } from '../backend/types';
import type {
  GroupAuditEntry,
  GroupEvent,
  GroupInvitation,
  GroupJoinRequest,
  GroupMedia,
  GroupNotice,
  GroupOperationPort,
  GroupOperations,
  GroupPointTotal,
  GroupProfile,
  GroupProgressEntry,
  GroupReport,
  GroupRole,
  GroupRule,
  GroupUpload,
} from './groupTypes';
import { groupLeaderboard } from './groupMetrics';
import { canShareGroupProgress } from './groupProgress';

const single = <T>(value: T | T[]): T => {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) throw new Error('No record returned');
  return row;
};
const text = (value: string, maximum: number, minimum = 1) => {
  const clean = value.trim();
  if (clean.length < minimum || clean.length > maximum) throw new RangeError('Invalid text length');
  return clean;
};
const integer = (value: number, minimum: number, maximum: number) => {
  if (!Number.isInteger(value) || value < minimum || value > maximum)
    throw new RangeError('Invalid amount');
  return value;
};
const imageExtension = (mime: string, media = false) => {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    ...(media ? { 'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif' } : {}),
  };
  const extension = extensions[mime.toLowerCase().trim()];
  if (!extension) throw new RangeError('Unsupported image type');
  return extension;
};
const checkUpload = (upload: GroupUpload, maximum: number, media = false) => {
  integer(upload.bytes.byteLength, 1, maximum);
  return imageExtension(upload.mimeType, media);
};

/** Exact Kotlin GroupV2Repository RPC contracts; authorization remains enforced by the server. */
export function createGroupOperations(port: GroupOperationPort): GroupOperations {
  const scoped = async <T>(
    code: string,
    name: string,
    params: Record<string, unknown> = {},
  ): Promise<T> => {
    const group = await port.group(code);
    return port.rpc<T>(name, { p_group_id: group.id, ...params });
  };
  const userId = async () => {
    const user = await port.userId();
    if (!user) throw new Error('AUTH_REQUIRED');
    return user;
  };
  const mediaWithUrl = async (row: GroupMedia): Promise<GroupMedia> => ({
    ...row,
    signedUrl: await port.signedUrl('group-media', row.storage_path, 7200),
  });
  const postAfter = async (code: string, postId: string) => single(await port.feed(code, postId));
  return {
    async deleteGroup(code) {
      await scoped(code, 'soft_delete_group_v2');
    },
    listRoles: (code) => scoped<GroupRole[]>(code, 'list_group_roles_v2'),
    async setMemberRole(code, memberId, role) {
      await scoped(code, 'set_group_member_role_v2', { p_user_id: memberId, p_role_key: role });
    },
    async removeMember(code, memberId, block = false) {
      await scoped(code, 'remove_group_member_v2', { p_user_id: memberId, p_block: block });
    },
    async getMyProfile(code) {
      return single(await scoped<GroupProfile | GroupProfile[]>(code, 'get_my_group_profile_v2'));
    },
    async updateMyProfile(code, name, avatar) {
      return single(
        await scoped<GroupProfile | GroupProfile[]>(code, 'update_my_group_profile_v2', {
          p_display_name: name?.trim() || null,
          p_avatar_url: avatar?.trim() || null,
        }),
      );
    },
    async uploadProfileAvatar(code, upload) {
      const extension = checkUpload(upload, 5 * 1024 * 1024);
      const group = await port.group(code);
      const user = await userId();
      const path = `${user.toLowerCase()}/groups/${group.id.toLowerCase()}/avatar.${extension}`;
      await port.upload('avatars', path, upload.bytes, upload.mimeType.toLowerCase().trim(), true);
      return `${port.publicUrl('avatars', path)}?v=${Date.now()}`;
    },
    async getLogo(code) {
      const result = single(
        await port.rpc<{ logo_path: string | null } | { logo_path: string | null }[]>(
          'get_group_logo_v1',
          { p_code: code.trim().toUpperCase() },
        ),
      );
      return result.logo_path ? port.signedUrl('group-logos', result.logo_path, 3600) : null;
    },
    async setLogo(code, upload) {
      const extension = upload ? checkUpload(upload, 5 * 1024 * 1024) : '';
      const group = await port.group(code);
      const path = upload ? `${group.id}/${port.uuid()}.${extension}` : null;
      if (upload && path)
        await port.upload('group-logos', path, upload.bytes, upload.mimeType.toLowerCase().trim());
      try {
        await port.rpc('set_group_logo_v1', { p_group_id: group.id, p_logo_path: path });
      } catch (error) {
        if (path) await port.remove('group-logos', path).catch(() => undefined);
        throw error;
      }
    },
    async createInvitation(code, email, expiresDays = 7, maxUses = 10) {
      return single(
        await scoped<GroupInvitation | GroupInvitation[]>(code, 'create_group_invitation_v2', {
          p_invited_email: email?.trim() || null,
          p_expires_days: integer(expiresDays, 1, 30),
          p_max_uses: integer(maxUses, 1, 100),
        }),
      );
    },
    listInvitations: (code) => scoped<GroupInvitation[]>(code, 'list_group_invitations_v2'),
    async revokeInvitation(code, id) {
      await scoped(code, 'revoke_group_invitation_v2', { p_invitation_id: id });
    },
    async acceptInvitation(token, name) {
      return single(
        await port.rpc<Group | Group[]>('accept_group_invitation_v2', {
          p_token: text(token, 500),
          p_display_name: name?.trim() || null,
        }),
      );
    },
    async requestAccess(code, message) {
      await port.rpc('create_group_join_request_v2', {
        p_code: code.trim().toUpperCase(),
        p_message: message.trim().slice(0, 500),
      });
    },
    listJoinRequests: (code) => scoped<GroupJoinRequest[]>(code, 'list_group_join_requests_v2'),
    async reviewJoinRequest(code, id, approve) {
      await scoped(code, 'review_group_join_request_v2', { p_request_id: id, p_approve: approve });
    },
    async listMedia(code, before) {
      return Promise.all(
        (
          await scoped<GroupMedia[]>(code, 'list_group_media_v2', {
            p_limit: 60,
            p_before: before ?? null,
          })
        ).map(mediaWithUrl),
      );
    },
    async uploadMedia(code, upload) {
      const extension = checkUpload(upload, 10 * 1024 * 1024, true);
      const caption = upload.caption?.trim() ?? '';
      if (caption.length > 1000) throw new RangeError('Invalid caption length');
      const group = await port.group(code);
      const user = await userId();
      const path = `${group.id.toLowerCase()}/${user.toLowerCase()}/${port.uuid()}.${extension}`;
      await port.upload('group-media', path, upload.bytes, upload.mimeType.toLowerCase().trim());
      let registered: GroupMedia;
      try {
        registered = single(
          await port.rpc<GroupMedia | GroupMedia[]>('register_group_media_v2', {
            p_group_id: group.id,
            p_storage_path: path,
            p_mime_type: upload.mimeType.toLowerCase().trim(),
            p_file_name:
              upload.fileName.trim().replace(/[/\\]/g, '_').slice(0, 255) ||
              `groepsfoto.${extension}`,
            p_byte_size: upload.bytes.byteLength,
            p_caption: caption,
            p_width: upload.width ?? null,
            p_height: upload.height ?? null,
          }),
        );
      } catch (error) {
        await port.remove('group-media', path).catch(() => undefined);
        throw error;
      }
      // Once metadata exists, keep its object even if URL signing fails; refreshing can recover it.
      return mediaWithUrl(registered);
    },
    async deleteMedia(code, id) {
      const path = await scoped<string>(code, 'delete_group_media_v2', { p_media_id: id });
      if (path) await port.remove('group-media', path).catch(() => undefined);
    },
    listEvents: (code) => scoped<GroupEvent[]>(code, 'list_group_events_v2', { p_limit: 50 }),
    async createEvent(code, input) {
      const start = Date.parse(input.startsAt);
      const end = input.endsAt ? Date.parse(input.endsAt) : null;
      if (!Number.isFinite(start) || (end !== null && (!Number.isFinite(end) || end <= start)))
        throw new RangeError('Invalid event dates');
      await scoped(code, 'create_group_event_v2', {
        p_title: text(input.title, 120, 3),
        p_description: input.description?.trim() ?? '',
        p_starts_at: new Date(start).toISOString(),
        p_ends_at: end === null ? null : new Date(end).toISOString(),
        p_timezone: text(input.timezone, 64),
        p_location: input.location?.trim() || null,
      });
    },
    async respondToEvent(code, id, response) {
      await scoped(code, 'respond_group_event_v2', { p_event_id: id, p_response: response });
    },
    async setEventStatus(code, id, status) {
      await scoped(code, 'set_group_event_status_v2', { p_event_id: id, p_status: status });
    },
    async setTaskStatus(code, id, status) {
      await scoped(code, 'set_group_task_status_v2', { p_task_id: id, p_status: status });
    },
    async getRules(code) {
      const rows = await scoped<GroupRule[]>(code, 'get_group_rules_v2');
      return rows[0] ?? null;
    },
    async publishRules(code, content) {
      return single(
        await scoped<GroupRule | GroupRule[]>(code, 'publish_group_rules_v2', {
          p_content: text(content, 10000),
        }),
      );
    },
    listNotices: (code, cursor) =>
      scoped<GroupNotice[]>(code, 'list_group_notifications_v2', {
        p_limit: 30,
        p_before_created_at: cursor?.createdAt ?? null,
        p_before_id: cursor?.id ?? null,
      }),
    markNoticeRead: (code, id, read = true) =>
      scoped<number>(code, 'mark_group_notification_read_v2', {
        p_notification_id: id ?? null,
        p_read: read,
      }),
    sendNotice: (code, title, body, type = 'important') =>
      scoped<number>(code, 'send_group_notification_v2', {
        p_title: text(title, 160),
        p_body: body.trim().slice(0, 1000),
        p_type: type,
        p_entity_type: null,
        p_entity_id: null,
      }),
    listReports: (code, status, cursor) =>
      scoped<GroupReport[]>(code, 'list_group_moderation_reports_v2', {
        p_status: status ?? null,
        p_limit: 30,
        p_before_created_at: cursor?.createdAt ?? null,
        p_before_id: cursor?.id ?? null,
      }),
    async reviewReport(code, id, status, note) {
      await scoped(code, 'review_group_moderation_report_v2', {
        p_report_id: id,
        p_status: status,
        p_resolution_note: note?.trim().slice(0, 2000) || null,
      });
    },
    listAudit: (code, beforeId) =>
      scoped<GroupAuditEntry[]>(code, 'list_group_audit_log_v2', {
        p_limit: 30,
        p_before_id: beforeId ?? null,
      }),
    async recordProgress(code, unit, amount, source = 'manual', share = false, message) {
      const group = await port.group(code);
      if (!group.permissions?.includes('progress.create'))
        throw new Error('GROUP_PROGRESS_FORBIDDEN');
      if (share && !canShareGroupProgress(group)) throw new Error('GROUP_POST_FORBIDDEN');
      // One RPC retains the server's atomic progress + post transaction. Never retry a
      // rejected share as a private save: that would change the user's requested action.
      await port.rpc('record_group_progress_v2', {
        p_group_id: group.id,
        p_unit: unit,
        p_amount: integer(amount, 1, 10000),
        p_source: source,
        p_share_to_feed: share,
        p_feed_message: share ? message?.trim() || null : null,
        p_display_name: null,
      });
    },
    async listLeaderboard(code) {
      const group = await port.group(code);
      const [members, entries, awards] = await Promise.all([
        port.members(code),
        port.select<GroupProgressEntry>('group_progress_entries', group.id),
        port.rpc<GroupPointTotal[]>('list_group_point_totals_v2', { p_group_id: group.id }),
      ]);
      return groupLeaderboard(members, entries, awards);
    },
    async updatePost(code, id, content) {
      await scoped(code, 'update_group_post_v2', {
        p_post_id: id,
        p_content: text(content, 10000),
      });
      return postAfter(code, id);
    },
    async pinPost(code, id, pinned) {
      await scoped(code, 'set_group_post_pinned_v2', { p_post_id: id, p_pinned: pinned });
      return postAfter(code, id);
    },
    async deletePost(code, id) {
      await scoped(code, 'delete_group_post_v2', { p_post_id: id });
    },
    async deleteComment(code, postId, id) {
      await scoped(code, 'delete_group_post_comment_v2', { p_post_id: postId, p_comment_id: id });
    },
    async reportPost(code, id, reason, details = '') {
      await scoped(code, 'report_group_post_v2', {
        p_post_id: id,
        p_reason: reason,
        p_details: details.trim().slice(0, 2000),
      });
    },
  };
}
