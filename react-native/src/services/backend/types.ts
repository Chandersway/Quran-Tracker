export type { AuthService, AuthSession, AuthUser } from '../auth/types';
import type { GroupMedia, GroupOperations } from '../groups/groupTypes';
import type { GroupChatService } from '../groups/groupChat';

export type BackendConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Optional static origin for a mirrored audio bucket or VPS. */
  audioBaseUrl?: string;
};

export type GroupPushPreferences = {
  level: string;
  pushEnabled: boolean;
  mutedUntil: string | null;
  updatedAt?: string;
};
export type NotificationPreferences = {
  enabled: boolean;
  mention: boolean;
  reaction: boolean;
  announcement: boolean;
  invitation: boolean;
  join_request: boolean;
  update: boolean;
};
export type PushDeviceInput = {
  installation: string;
  token: string;
  enabled: boolean;
  timezone: string;
  quiet: boolean;
  quietStart: number;
  quietEnd: number;
  language: string;
  platform: 'android' | 'ios';
};
export type NotificationService = {
  groupPushTarget(eventId: string): Promise<{ groupCode: string; postId: string } | null>;
  loadGroupPushPreferences(): Promise<NotificationPreferences>;
  saveGroupPushPreferences(preferences: NotificationPreferences): Promise<void>;
  loadGroupPreferences(code: string): Promise<GroupPushPreferences>;
  updateGroupPreferences(
    code: string,
    level: string,
    pushEnabled: boolean,
    mutedUntil?: string | null,
  ): Promise<GroupPushPreferences>;
  registerPushDevice(input: PushDeviceInput): Promise<void>;
  unregisterPushDevice(installation: string): Promise<void>;
};

export type Group = {
  id: string;
  code: string;
  name: string;
  description: string;
  goal_type: string;
  progress_unit: string;
  goal_period: string;
  goal_target: number | null;
  privacy: string;
  language_code: string;
  owner_id: string;
  created_at: string;
  viewer_role?: string | null;
  member_count?: number;
  permissions?: string[];
  join_request_status?: string | null;
  unread_notification_count?: number;
  active_rules_version?: number | null;
};
export type GroupMemberPermissions = {
  canPostMessages: boolean;
  canShareProgress: boolean;
  canComment: boolean;
  canInviteMembers: boolean;
};

export type GroupMember = {
  groupCode: string;
  userId: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  joinedAt: string;
  isCurrentUser: boolean;
};
export type GroupComment = {
  id: string;
  postId: string;
  createdBy: string;
  displayName: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  avatarUrl?: string | null;
};
export type GroupFeedPost = {
  id: string;
  createdBy: string;
  displayName: string;
  type: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  isPinned: boolean;
  isMine: boolean;
  likeCount: number;
  likedByMe: boolean;
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  comments: GroupComment[];
  avatarUrl?: string | null;
  media?: GroupMedia | null;
};
/** Opaque to screens; both values are needed when posts share a timestamp. */
export type GroupFeedCursor = { createdAt: string; id: string };
export type GroupFeedRequest = { cursor?: GroupFeedCursor; limit?: number; postId?: string };
export type GroupFeedPage = {
  posts: GroupFeedPost[];
  pinnedPosts: GroupFeedPost[];
  nextCursor: GroupFeedCursor | null;
};
export type GroupFeedConnection = 'connecting' | 'live' | 'polling' | 'offline';
export type GroupFeedService = {
  listFeedPage(code: string, request?: GroupFeedRequest): Promise<GroupFeedPage>;
  /** Invalidations, never message payloads. Consumers re-read through authorized queries. */
  subscribeFeed(
    code: string,
    onChange: () => void,
    onStatus: (status: GroupFeedConnection) => void,
  ): () => void;
};
export type GroupTask = {
  id: string;
  title: string;
  description: string;
  taskType: string;
  targetValue: number;
  targetUnit: string;
  startsAt: string | null;
  dueAt: string | null;
  status: string;
  createdBy: string;
  displayName: string;
  createdAt: string;
  participantCount: number;
  completedCount: number;
  myProgress: number;
  myCompleted: boolean;
  canManage: boolean;
  pointsReward: number;
  myPointsAwarded: boolean;
};
export type GroupTaskInput = {
  title: string;
  description?: string;
  taskType?: string;
  targetValue: number;
  targetUnit: string;
  durationDays?: number | null;
  pointsReward?: number;
};
export type GroupUpdateInput = {
  name: string;
  description?: string;
  goalType?: string;
  progressUnit?: string;
  goalPeriod?: string;
  goalTarget?: number | null;
  privacy?: string;
  memberPermissions?: Record<string, boolean>;
};

export type GroupService = import('../groups/groupTyping').GroupTypingService &
  GroupChatService &
  GroupOperations &
  GroupFeedService & {
    list(): Promise<Group[]>;
    get(code: string): Promise<Group>;
    create(input: {
      name: string;
      description?: string;
      goalType?: string;
      progressUnit?: string;
      goalPeriod?: string;
      goalTarget?: number | null;
      privacy?: string;
      code: string;
      memberPermissions?: Record<string, boolean>;
    }): Promise<Group>;
    join(code: string, displayName?: string): Promise<Group>;
    listMembers(code: string): Promise<GroupMember[]>;
    listFeed(code: string, postId?: string): Promise<GroupFeedPost[]>;
    createTextPost(
      code: string,
      content: string,
      displayName?: string,
      expectedUserId?: string,
    ): Promise<GroupFeedPost>;
    addComment(
      code: string,
      postId: string,
      content: string,
      displayName?: string,
      expectedUserId?: string,
    ): Promise<GroupComment>;
    toggleReaction(code: string, postId: string, reaction: string): Promise<string | null>;
    listTasks(code: string): Promise<GroupTask[]>;
    createTask(code: string, input: GroupTaskInput): Promise<void>;
    setTaskProgress(code: string, taskId: string, progress: number): Promise<number>;
    update(code: string, input: GroupUpdateInput): Promise<Group>;
    getMemberPermissions(code: string): Promise<GroupMemberPermissions>;
  };

export type Note = {
  id?: string;
  surah_id?: number | null;
  surah_name: string;
  ayah_number?: number | null;
  scope_type: 'ayah' | 'juz' | 'hizb' | 'rub' | 'surah';
  juz_number?: number | null;
  hizb_number?: number | null;
  rub_number?: number | null;
  title: string;
  note: string;
  folder: string;
  tags: string;
  font_size: number;
  heading_level: number;
  is_bold: boolean;
  is_italic: boolean;
  is_underline: boolean;
  is_strike: boolean;
  list_mode: string;
  text_color_key: string;
  format_spans: string;
  is_pinned: boolean;
  updated_at: string;
};

export type PlanItem = {
  id: string;
  date: string;
  type: string;
  reference_id: number;
  sub_id: number;
  display_name: string;
  arabic_text: string;
  is_done: boolean;
  history_logged: boolean;
  created_at: string;
  goal_id: number;
  amount: number;
  measurement_unit: string;
};

export type ProgressRow = {
  id: string;
  type: string;
  reference_id: number;
  sub_id: number;
  is_read: boolean;
  is_memorized: boolean;
  progress: number;
  has_hifz_score: boolean;
  is_completed: boolean;
  read_count: number;
  last_updated: string;
};

export type NotesService = {
  list(): Promise<Note[]>;
  save(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
};
export type PlanningService = {
  list(fromDate?: string): Promise<PlanItem[]>;
  add(item: Omit<PlanItem, 'id' | 'is_done' | 'history_logged' | 'created_at'>): Promise<PlanItem>;
  toggleDone(id: string, done: boolean): Promise<void>;
  delete(id: string): Promise<void>;
};
export type ProgressService = {
  list(): Promise<ProgressRow[]>;
  checkIn(
    type: 'surah' | 'juz' | 'hizb' | 'rub',
    numbers: number[],
    subNumber?: number,
    requestId?: string,
  ): Promise<void>;
  updateHifz(type: 'juz' | 'hizb' | 'surah', number: number, score: number): Promise<void>;
};

export type AudioTrack = {
  surah: number;
  /** Recording verse index (printed for timed Warsh, canonical for per-ayah files). */
  ayah?: number;
  reciterId: number;
  /** Stable key for external ayah reciters whose identifiers are not MP3Quran numeric catalog IDs. */
  reciterKey?: string;
  reciterName: string;
  riwaya: string;
  sourceUrl: string;
  url: string;
  /** Exact storage key for a mirrored object; absent for verse clips or unknown corpus files. */
  objectPath?: string;
  localUri?: string;
  /** Optional playback segment in seconds, used for ayah repeats from a surah recording. */
  startSeconds?: number;
  endSeconds?: number;
};
export type AyahTiming = { ayah: number; start: number; end: number };
export type AudioService = {
  listSurah(surah: number): Promise<AudioTrack[]>;
  getAyahTimings(surah: number, readId: number, expectedAyahs: number): Promise<AyahTiming[]>;
  resolve(track: AudioTrack): string;
  getDownloadedUri(track: AudioTrack): string | null;
  download(track: AudioTrack): Promise<string>;
};
