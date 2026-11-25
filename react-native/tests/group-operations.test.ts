import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGroupOperations } from '../src/services/groups/groupOperations';
import { groupLeaderboard } from '../src/services/groups/groupMetrics';
import type {
  GroupOperationPort,
  GroupMedia,
  GroupProgressEntry,
} from '../src/services/groups/groupTypes';
import type { Group } from '../src/services/backend/types';

const group: Group = {
  id: 'group-id',
  code: 'QUR-1234',
  name: 'Group',
  description: '',
  goal_type: 'free_reading',
  progress_unit: 'page',
  goal_period: 'none',
  goal_target: null,
  privacy: 'restricted',
  language_code: 'nl',
  owner_id: 'user-id',
  created_at: '',
  permissions: [],
};
function fixture(responses: Record<string, unknown> = {}) {
  const calls: Array<{ name: string; params?: Record<string, unknown> }> = [];
  const objects: string[] = [];
  const removed: string[] = [];
  const port: GroupOperationPort = {
    rpc: async <T>(name: string, params?: Record<string, unknown>) => {
      calls.push({ name, params });
      const value = responses[name];
      if (value instanceof Error) throw value;
      return (value ?? []) as T;
    },
    select: async <T>() => [] as T[],
    userId: async () => 'user-id',
    group: async () => group,
    members: async () => [],
    feed: async () => [],
    upload: async (bucket, path) => {
      objects.push(`${bucket}/${path}`);
    },
    remove: async (bucket, path) => {
      removed.push(`${bucket}/${path}`);
    },
    signedUrl: async (_bucket, path) => `https://signed.invalid/${path}`,
    publicUrl: (_bucket, path) => `https://public.invalid/${path}`,
    uuid: () => 'object-id',
  };
  return { api: createGroupOperations(port), port, calls, objects, removed };
}

test('member, access-review and invitation operations use exact scoped Kotlin RPC contracts', async () => {
  const f = fixture({
    create_group_invitation_v2: [{ id: 'invite-id', token: 'secure' }],
    accept_group_invitation_v2: group,
  });
  await f.api.listRoles(group.code);
  await f.api.setMemberRole(group.code, 'member-id', 'moderator');
  await f.api.removeMember(group.code, 'member-id', true);
  await f.api.createInvitation(group.code, ' reader@example.invalid ', 7, 3);
  await f.api.revokeInvitation(group.code, 'invite-id');
  await f.api.reviewJoinRequest(group.code, 'request-id', false);
  for (const call of f.calls) assert.equal(call.params?.p_group_id, group.id);
  assert.deepEqual(f.calls[1], {
    name: 'set_group_member_role_v2',
    params: { p_group_id: group.id, p_user_id: 'member-id', p_role_key: 'moderator' },
  });
  assert.equal(f.calls[3]?.params?.p_invited_email, 'reader@example.invalid');
  await f.api.requestAccess(' qur-1234 ', ' Please approve ');
  assert.deepEqual(f.calls.at(-1), {
    name: 'create_group_join_request_v2',
    params: { p_code: 'QUR-1234', p_message: 'Please approve' },
  });
  assert.equal((await f.api.acceptInvitation(' secure ')).id, group.id);
});

test('media upload cleans orphaned objects when metadata registration fails', async () => {
  const f = fixture({ register_group_media_v2: new Error('registration failed') });
  await assert.rejects(
    f.api.uploadMedia(group.code, {
      bytes: new Uint8Array([1, 2]),
      mimeType: 'image/png',
      fileName: '../photo.png',
    }),
    /registration failed/,
  );
  assert.deepEqual(f.objects, ['group-media/group-id/user-id/object-id.png']);
  assert.deepEqual(f.removed, f.objects);
  assert.equal(f.calls[0]?.params?.p_file_name, '.._photo.png');
  assert.equal(f.calls[0]?.params?.p_byte_size, 2);
});

test('a signing failure retains an already registered media object for refresh recovery', async () => {
  const media = { id: 'media-id', storage_path: 'group-id/user-id/object-id.png' } as GroupMedia;
  const f = fixture({ register_group_media_v2: media });
  f.port.signedUrl = async () => {
    throw new Error('signing failed');
  };
  await assert.rejects(
    f.api.uploadMedia(group.code, {
      bytes: new Uint8Array([1]),
      mimeType: 'image/png',
      fileName: 'photo.png',
    }),
    /signing failed/,
  );
  assert.deepEqual(f.removed, []);
});

test('invalid images and event dates cannot make mutations', async () => {
  const f = fixture();
  await assert.rejects(
    f.api.uploadMedia(group.code, {
      bytes: new Uint8Array([1]),
      mimeType: 'application/pdf',
      fileName: 'bad.pdf',
    }),
    /Unsupported/,
  );
  await assert.rejects(
    f.api.createEvent(group.code, { title: 'Reading', startsAt: 'invalid', timezone: 'UTC' }),
    /Invalid event dates/,
  );
  await assert.rejects(
    f.api.createEvent(group.code, {
      title: 'Reading',
      startsAt: '2026-11-20T10:00:00Z',
      endsAt: '2026-11-20T09:00:00Z',
      timezone: 'UTC',
    }),
    /Invalid event dates/,
  );
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.objects, []);
});

test('notice and moderation pagination preserves both cursor fields and optional audit ID', async () => {
  const f = fixture();
  await f.api.listNotices(group.code, { createdAt: 'date', id: 'notice-id' });
  await f.api.listReports(group.code, 'open', { createdAt: 'date', id: 'report-id' });
  await f.api.listAudit(group.code, 21);
  assert.equal(f.calls[0]?.params?.p_before_created_at, 'date');
  assert.equal(f.calls[0]?.params?.p_before_id, 'notice-id');
  assert.equal(f.calls[1]?.params?.p_status, 'open');
  assert.equal(f.calls[1]?.params?.p_before_id, 'report-id');
  assert.equal(f.calls[2]?.params?.p_before_id, 21);
});

test('leaderboard combines exact reading equivalents, task awards and period/streak values', () => {
  const entries: GroupProgressEntry[] = [
    {
      user_id: 'user',
      unit: 'surah',
      amount: 1,
      source: 'group_manual:surah:1',
      occurred_on: '2026-11-13',
    },
    { user_id: 'user', unit: 'page', amount: 2, source: 'manual', occurred_on: '2026-11-12' },
    { user_id: 'user', unit: 'hizb', amount: 1, source: 'manual', occurred_on: '2026-01-01' },
  ];
  const result = groupLeaderboard(
    [],
    entries,
    [{ user_id: 'user', total_points: 10, weekly_points: 4, monthly_points: 6 }],
    new Date(2026, 10, 13, 12),
  );
  assert.equal(result[0]?.totalAyahs, 130);
  assert.equal(result[0]?.totalPoints, 140);
  assert.equal(result[0]?.weeklyPoints, 31);
  assert.equal(result[0]?.monthlyPoints, 33);
  assert.equal(result[0]?.pages, 13);
  assert.equal(result[0]?.streak, 2);
  assert.equal(result[0]?.activeToday, true);
});

test('progress uses one atomic RPC and refuses a share without both current group permissions', async () => {
  const f = fixture();
  f.port.group = async () => ({ ...group, permissions: ['progress.create'] });
  await assert.rejects(
    f.api.recordProgress(group.code, 'page', 2, 'manual', true, 'Read two pages'),
    /GROUP_POST_FORBIDDEN/,
  );
  assert.equal(f.calls.length, 0);
  await f.api.recordProgress(group.code, 'page', 2, 'manual', false, 'Unsent message');
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0]?.params?.p_share_to_feed, false);
  assert.equal(f.calls[0]?.params?.p_feed_message, null);
  f.port.group = async () => ({ ...group, permissions: ['progress.create', 'post.create'] });
  await f.api.recordProgress(group.code, 'juz', 1, 'group_manual:juz:1', true, ' Read Juz 1. ');
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1]?.name, 'record_group_progress_v2');
  assert.equal(f.calls[1]?.params?.p_share_to_feed, true);
  assert.equal(f.calls[1]?.params?.p_feed_message, 'Read Juz 1.');
  f.port.group = async () => ({ ...group, permissions: ['post.create'] });
  await assert.rejects(f.api.recordProgress(group.code, 'page', 1), /GROUP_PROGRESS_FORBIDDEN/);
  assert.equal(f.calls.length, 2);
});

test('a server share refusal is propagated without a second private-save transaction', async () => {
  const f = fixture({ record_group_progress_v2: new Error('GROUP_POST_FORBIDDEN') });
  f.port.group = async () => ({ ...group, permissions: ['progress.create', 'post.create'] });
  await assert.rejects(
    f.api.recordProgress(group.code, 'page', 1, 'manual', true, 'Read one page.'),
    /GROUP_POST_FORBIDDEN/,
  );
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0]?.params?.p_share_to_feed, true);
});
