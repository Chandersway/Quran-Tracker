import type { Group, GroupFeedPost, GroupMember } from '../backend/types';

export type GroupRole = { key: string; name: string; rank: number };
export type GroupInvitation = {
  id: string;
  token: string | null;
  invited_email: string | null;
  status: string;
  max_uses: number;
  use_count: number;
  expires_at: string;
  created_at: string;
};
export type GroupJoinRequest = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  message: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};
export type GroupProfile = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  custom_display_name: string | null;
  custom_avatar_url: string | null;
};
export type GroupMedia = {
  id: string;
  attachment_id: string;
  source_post_id: string | null;
  storage_path: string;
  mime_type: string;
  file_name: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  created_by: string;
  display_name: string;
  avatar_url: string | null;
  caption: string;
  created_at: string;
  can_delete: boolean;
  signedUrl: string;
};
export type GroupUpload = {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  caption?: string;
  width?: number;
  height?: number;
};
export type GroupEvent = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location: string | null;
  status: string;
  created_by: string;
  display_name: string;
  created_at: string;
  going_count: number;
  maybe_count: number;
  declined_count: number;
  my_response: string | null;
  can_manage: boolean;
};
export type GroupEventInput = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string | null;
  timezone: string;
  location?: string;
};
export type GroupRule = {
  id: string;
  version: number;
  content: string;
  updated_at: string;
  created_by: string;
  display_name: string;
};
export type GroupNotice = {
  id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};
export type GroupReport = {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: string;
  target_id: string | null;
  reason: string;
  details: string;
  status: string;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};
export type GroupAuditEntry = {
  id: number;
  actor_id: string | null;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type GroupProgressEntry = {
  user_id: string;
  unit: string;
  amount: number;
  source: string;
  occurred_on: string;
};
export type GroupPointTotal = {
  user_id: string;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
};
export type GroupLeaderboardRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  totalAyahs: number;
  pages: number;
  streak: number;
  activeToday: boolean;
  entries: GroupProgressEntry[];
};
export type GroupCursor = { createdAt?: string | null; id?: string | null };

export type GroupOperations = {
  deleteGroup(code: string): Promise<void>;
  listRoles(code: string): Promise<GroupRole[]>;
  setMemberRole(code: string, userId: string, role: string): Promise<void>;
  removeMember(code: string, userId: string, block?: boolean): Promise<void>;
  getMyProfile(code: string): Promise<GroupProfile>;
  updateMyProfile(
    code: string,
    displayName: string | null,
    avatarUrl: string | null,
  ): Promise<GroupProfile>;
  uploadProfileAvatar(code: string, upload: GroupUpload): Promise<string>;
  getLogo(code: string): Promise<string | null>;
  setLogo(code: string, upload: GroupUpload | null): Promise<void>;
  createInvitation(
    code: string,
    email?: string,
    expiresDays?: number,
    maxUses?: number,
  ): Promise<GroupInvitation>;
  listInvitations(code: string): Promise<GroupInvitation[]>;
  revokeInvitation(code: string, invitationId: string): Promise<void>;
  acceptInvitation(token: string, displayName?: string): Promise<Group>;
  requestAccess(code: string, message: string): Promise<void>;
  listJoinRequests(code: string): Promise<GroupJoinRequest[]>;
  reviewJoinRequest(code: string, requestId: string, approve: boolean): Promise<void>;
  listMedia(code: string, before?: string): Promise<GroupMedia[]>;
  uploadMedia(code: string, upload: GroupUpload): Promise<GroupMedia>;
  deleteMedia(code: string, mediaId: string): Promise<void>;
  listEvents(code: string): Promise<GroupEvent[]>;
  createEvent(code: string, input: GroupEventInput): Promise<void>;
  respondToEvent(
    code: string,
    eventId: string,
    response: 'going' | 'maybe' | 'declined',
  ): Promise<void>;
  setEventStatus(
    code: string,
    eventId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'deleted',
  ): Promise<void>;
  setTaskStatus(
    code: string,
    taskId: string,
    status: 'active' | 'completed' | 'cancelled' | 'deleted',
  ): Promise<void>;
  getRules(code: string): Promise<GroupRule | null>;
  publishRules(code: string, content: string): Promise<GroupRule>;
  listNotices(code: string, cursor?: GroupCursor): Promise<GroupNotice[]>;
  markNoticeRead(code: string, noticeId?: string, read?: boolean): Promise<number>;
  sendNotice(code: string, title: string, body: string, type?: string): Promise<number>;
  listReports(code: string, status?: string, cursor?: GroupCursor): Promise<GroupReport[]>;
  reviewReport(code: string, reportId: string, status: string, note?: string): Promise<void>;
  listAudit(code: string, beforeId?: number): Promise<GroupAuditEntry[]>;
  recordProgress(
    code: string,
    unit: string,
    amount: number,
    source?: string,
    shareToFeed?: boolean,
    message?: string,
  ): Promise<void>;
  listLeaderboard(code: string): Promise<GroupLeaderboardRow[]>;
  updatePost(code: string, postId: string, content: string): Promise<GroupFeedPost>;
  pinPost(code: string, postId: string, pinned: boolean): Promise<GroupFeedPost>;
  deletePost(code: string, postId: string): Promise<void>;
  deleteComment(code: string, postId: string, commentId: string): Promise<void>;
  reportPost(code: string, postId: string, reason: string, details?: string): Promise<void>;
};

/** The transport is intentionally small enough to run contract tests without native modules or live accounts. */
export type GroupOperationPort = {
  rpc<T>(name: string, params?: Record<string, unknown>): Promise<T>;
  select<T>(table: string, groupId: string): Promise<T[]>;
  userId(): Promise<string | null>;
  group(code: string): Promise<Group>;
  members(code: string): Promise<GroupMember[]>;
  feed(code: string, postId: string): Promise<GroupFeedPost[]>;
  upload(
    bucket: string,
    path: string,
    bytes: Uint8Array,
    mime: string,
    upsert?: boolean,
  ): Promise<void>;
  remove(bucket: string, path: string): Promise<void>;
  signedUrl(bucket: string, path: string, seconds: number): Promise<string>;
  publicUrl(bucket: string, path: string): string;
  uuid(): string;
};
