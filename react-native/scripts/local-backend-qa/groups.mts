import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createGroupOperations } from '../../src/services/groups/groupOperations';
import type { GroupOperationPort } from '../../src/services/groups/groupTypes';
import type { Group, GroupFeedPost } from '../../src/services/backend/types';

const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const status = JSON.parse(readFileSync(new URL('credentials.json', directory), 'utf8'));
const apiUrl = status.API_URL ?? status.api_url;
assert.equal(
  new URL(apiUrl).origin,
  'http://127.0.0.1:55431',
  'Refuse every hosted or alternate endpoint',
);
const publicKey = status.ANON_KEY ?? status.anon_key ?? status.PUBLISHABLE_KEY;
const serviceKey = status.SERVICE_ROLE_KEY ?? status.service_role_key ?? status.SECRET_KEY;
assert.ok(publicKey && serviceKey, 'Local status credentials required');
const guardedFetch: typeof fetch = (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  assert.equal(url.origin, 'http://127.0.0.1:55431', 'Refuse non-local request');
  return fetch(input, { ...init, redirect: 'error' });
};
const client = (key: string) =>
  createClient(apiUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: guardedFetch },
  });
const admin = client(serviceKey);
const rows = <T,>(result: {
  data: T;
  error: { message: string; code?: string; details?: string } | null;
}): T => {
  if (result.error)
    throw new Error(
      [result.error.code, result.error.message, result.error.details].filter(Boolean).join(': '),
    );
  return result.data;
};
const one = <T,>(data: T | T[]): T => (Array.isArray(data) ? data[0]! : data);
const rpc = async <T,>(actor: SupabaseClient, name: string, params: Record<string, unknown> = {}) =>
  rows(await actor.rpc(name, params)) as T;
const report: { label: string; passed: boolean; error?: string }[] = [];
async function check(label: string, action: () => Promise<void>) {
  try {
    await action();
    report.push({ label, passed: true });
    console.log('PASS ' + label);
  } catch (error) {
    const text = String(error instanceof Error ? error.message : error).replace(
      /[A-Za-z0-9_-]{40,}/g,
      '<REDACTED>',
    );
    report.push({ label, passed: false, error: text });
    console.log('FAIL ' + label + ': ' + text);
  }
}
const nonce = Date.now().toString(36) + randomBytes(3).toString('hex');
const accounts: Record<
  string,
  { id: string; email: string; password: string; client: SupabaseClient }
> = {};
const fixtures: Record<string, unknown> = { nonce, apiUrl, users: {} };

try {
  for (const role of ['owner', 'member', 'outsider', 'otherOwner']) {
    const email = `wirdna-qa-${nonce}-${role.toLowerCase()}@example.invalid`;
    const password = randomBytes(24).toString('base64url');
    const created = rows(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: 'QA ' + role },
      }),
    ).user!;
    const actor = client(publicKey);
    rows(await actor.auth.signInWithPassword({ email, password }));
    rows(
      await admin
        .from('profiles')
        .insert({ id: created.id, display_name: 'QA ' + role, avatar_url: null }),
    );
    accounts[role] = { id: created.id, email, password, client: actor };
    (fixtures.users as Record<string, unknown>)[role] = { id: created.id, email, password };
  }
  writeFileSync(new URL('fixtures.credentials.json', directory), JSON.stringify(fixtures, null, 2));
  const owner = accounts.owner!.client,
    member = accounts.member!.client,
    outsider = accounts.outsider!.client,
    other = accounts.otherOwner!.client;
  const permissions = {
    canPostMessages: true,
    canShareProgress: true,
    canComment: true,
    canInviteMembers: false,
  };
  const create = async (actor: SupabaseClient, prefix: string) =>
    one(
      await rpc<Group | Group[]>(actor, 'create_group_v3_full', {
        p_code: prefix + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        p_name: 'QA circle ' + nonce,
        p_description: 'Fabricated localhost fixture',
        p_goal_type: 'free_reading',
        p_progress_unit: 'page',
        p_goal_period: 'none',
        p_goal_target: null,
        p_privacy: 'restricted',
        p_member_permissions: permissions,
      }),
    );
  const group = await create(owner, 'QAA'),
    second = await create(other, 'QAB');
  Object.assign(fixtures, {
    groupCode: group.code,
    groupId: group.id,
    secondCode: second.code,
    secondId: second.id,
  });
  writeFileSync(new URL('fixtures.credentials.json', directory), JSON.stringify(fixtures, null, 2));
  await rpc(member, 'join_group_v2_by_code', { p_code: group.code, p_display_name: 'QA member' });
  const detail = async (actor: SupabaseClient, code: string) =>
    one(await rpc<Group | Group[]>(actor, 'get_group_detail_v3', { p_code: code }));
  const operations = (actor: SupabaseClient, id: string) => {
    const port: GroupOperationPort = {
      rpc: <T,>(name: string, params?: Record<string, unknown>) => rpc<T>(actor, name, params),
      group: (code) => detail(actor, code),
      userId: async () => id,
      select: async <T,>(table: string, groupId: string) =>
        rows(await actor.from(table).select('*').eq('group_id', groupId)) as T[],
      members: async (code) => {
        const group = await detail(actor, code);
        return (
          await rpc<Record<string, unknown>[]>(actor, 'list_group_members_v3', {
            p_group_id: group.id,
          })
        ).map((row) => ({
          groupCode: code,
          userId: String(row.user_id),
          displayName: String(row.display_name),
          role: String(row.role),
          avatarUrl: null,
          joinedAt: String(row.joined_at),
          isCurrentUser: row.user_id === id,
        }));
      },
      feed: async (code, postId) => {
        const group = await detail(actor, code);
        let query = actor
          .from('group_posts')
          .select('*')
          .eq('group_id', group.id)
          .eq('status', 'published');
        if (postId) query = query.eq('id', postId);
        return rows(await query).map(
          (row) =>
            ({
              id: row.id,
              content: row.content,
              isPinned: Boolean(row.pinned_at),
              type: row.type,
            }) as GroupFeedPost,
        );
      },
      upload: async (bucket, path, bytes, mime, upsert) => {
        rows(await actor.storage.from(bucket).upload(path, bytes, { contentType: mime, upsert }));
      },
      remove: async (bucket, path) => {
        rows(await actor.storage.from(bucket).remove([path]));
      },
      signedUrl: async (bucket, path, seconds) =>
        rows(await actor.storage.from(bucket).createSignedUrl(path, seconds)).signedUrl,
      publicUrl: (bucket, path) => actor.storage.from(bucket).getPublicUrl(path).data.publicUrl,
      uuid: () => globalThis.crypto.randomUUID(),
    };
    return createGroupOperations(port);
  };
  const ownerOps = operations(owner, accounts.owner!.id),
    memberOps = operations(member, accounts.member!.id),
    outsiderOps = operations(outsider, accounts.outsider!.id);
  const post = one(
    await rpc<Record<string, unknown> | Record<string, unknown>[]>(
      owner,
      'create_group_text_post_v2',
      { p_group_id: group.id, p_content: 'Group A fixture', p_display_name: 'QA owner' },
    ),
  );
  const otherPost = one(
    await rpc<Record<string, unknown> | Record<string, unknown>[]>(
      other,
      'create_group_text_post_v2',
      { p_group_id: second.id, p_content: 'Group B fixture', p_display_name: 'QA other' },
    ),
  );
  await check('own groups and capabilities come from authenticated RPC', async () => {
    const mine = await rpc<Group[]>(member, 'list_my_groups_v2');
    assert.ok(mine.some((row) => row.id === group.id));
    assert.ok(!mine.some((row) => row.id === second.id));
    const d = await detail(member, group.code);
    assert.equal(d.viewer_role, 'member');
    assert.ok(d.permissions?.includes('post.create'));
    assert.ok(!d.permissions?.includes('post.pin'));
  });
  await check('published feed SELECT is isolated by membership and group', async () => {
    assert.equal(
      rows(await member.from('group_posts').select('*').eq('group_id', group.id)).length,
      1,
    );
    assert.equal(
      rows(await member.from('group_posts').select('*').eq('id', otherPost.id)).length,
      0,
    );
    assert.equal(
      rows(await outsider.from('group_posts').select('*').eq('group_id', group.id)).length,
      0,
    );
    await assert.rejects(detail(outsider, group.code));
  });
  await check('server rejects forged cross-group posts and reactions', async () => {
    await assert.rejects(
      rpc(member, 'create_group_text_post_v2', { p_group_id: second.id, p_content: 'forged' }),
    );
    await assert.rejects(
      rpc(member, 'toggle_group_post_reaction_v2', {
        p_group_id: group.id,
        p_post_id: otherPost.id,
        p_reaction: 'like',
      }),
    );
  });
  await check('typed operations edit/pin posts while member moderation is denied', async () => {
    assert.equal(
      (await ownerOps.updatePost(group.code, String(post.id), 'Edited group A')).content,
      'Edited group A',
    );
    assert.equal((await ownerOps.pinPost(group.code, String(post.id), true)).isPinned, true);
    await assert.rejects(memberOps.pinPost(group.code, String(post.id), false));
    await assert.rejects(memberOps.updatePost(group.code, String(post.id), 'forged edit'));
  });
  await check('comment RPC is group-scoped and typed delete redacts it', async () => {
    const comment = one(
      await rpc<Record<string, unknown> | Record<string, unknown>[]>(
        member,
        'add_group_post_comment_v2',
        {
          p_group_id: group.id,
          p_post_id: post.id,
          p_content: 'Local test reply',
          p_display_name: 'QA member',
        },
      ),
    );
    await assert.rejects(
      rpc(member, 'add_group_post_comment_v2', {
        p_group_id: second.id,
        p_post_id: post.id,
        p_content: 'forged',
      }),
    );
    await ownerOps.deleteComment(group.code, String(post.id), String(comment.id));
    const stored = rows(
      await admin.from('post_comments').select('status,content').eq('id', comment.id).single(),
    );
    assert.equal(stored.status, 'deleted');
    assert.equal(stored.content, '');
  });
  await check('all four reactions toggle on the authenticated post', async () => {
    for (const reaction of ['like', 'love', 'dua', 'insightful'])
      assert.equal(
        await rpc(member, 'toggle_group_post_reaction_v2', {
          p_group_id: group.id,
          p_post_id: post.id,
          p_reaction: reaction,
        }),
        reaction,
      );
    assert.equal(
      (await rpc(member, 'toggle_group_post_reaction_v2', {
        p_group_id: group.id,
        p_post_id: post.id,
        p_reaction: 'insightful',
      })) || null,
      null,
    );
  });
  await check('member permission revocation is authoritative for post/comment RPCs', async () => {
    await rpc(owner, 'set_group_member_permissions_v1', {
      p_group_id: group.id,
      p_member_permissions: { ...permissions, canPostMessages: false, canComment: false },
    });
    await assert.rejects(
      rpc(member, 'create_group_text_post_v2', { p_group_id: group.id, p_content: 'blocked' }),
    );
    await assert.rejects(
      rpc(member, 'add_group_post_comment_v2', {
        p_group_id: group.id,
        p_post_id: post.id,
        p_content: 'blocked',
      }),
    );
    await rpc(owner, 'set_group_member_permissions_v1', {
      p_group_id: group.id,
      p_member_permissions: permissions,
    });
  });
  await check(
    'private media uploads, signs, downloads and deletes with group authorization',
    async () => {
      const bytes = new Uint8Array(
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7V8AAAAASUVORK5CYII=',
          'base64',
        ),
      );
      const media = await ownerOps.uploadMedia(group.code, {
        bytes,
        mimeType: 'image/png',
        fileName: 'local-qa.png',
        caption: 'Fabricated local image',
        width: 1,
        height: 1,
      });
      assert.deepEqual(
        new Uint8Array(await (await guardedFetch(media.signedUrl)).arrayBuffer()),
        bytes,
      );
      assert.ok((await memberOps.listMedia(group.code)).some((row) => row.id === media.id));
      await assert.rejects(outsiderOps.listMedia(group.code));
      await ownerOps.deleteMedia(group.code, media.id);
      assert.ok(!(await ownerOps.listMedia(group.code)).some((row) => row.id === media.id));
    },
  );
  await check('secure invitation acceptance is idempotent and revocation enforced', async () => {
    const invitation = await ownerOps.createInvitation(group.code, undefined, 7, 3);
    assert.ok(invitation.token);
    await outsiderOps.acceptInvitation(invitation.token!);
    await outsiderOps.acceptInvitation(invitation.token!);
    const list = await ownerOps.listInvitations(group.code);
    assert.equal(list.find((row) => row.id === invitation.id)?.use_count, 1);
    const revoked = await ownerOps.createInvitation(group.code, undefined, 7, 3);
    await ownerOps.revokeInvitation(group.code, revoked.id);
    await assert.rejects(
      operations(other, accounts.otherOwner!.id).acceptInvitation(revoked.token!),
    );
  });
  await check('join requests require review before membership exists', async () => {
    const otherOps = operations(other, accounts.otherOwner!.id);
    await otherOps.requestAccess(group.code, 'QA access request');
    const requests = await ownerOps.listJoinRequests(group.code);
    const request = requests.find((row) => row.user_id === accounts.otherOwner!.id)!;
    assert.ok(request);
    await ownerOps.reviewJoinRequest(group.code, request.id, true);
    assert.equal((await detail(other, group.code)).viewer_role, 'member');
  });
  await check('role RPC forbids self management and assignment of owner', async () => {
    await assert.rejects(ownerOps.setMemberRole(group.code, accounts.owner!.id, 'member'));
    await assert.rejects(ownerOps.setMemberRole(group.code, accounts.member!.id, 'owner'));
    await ownerOps.setMemberRole(group.code, accounts.member!.id, 'moderator');
    assert.equal((await detail(member, group.code)).viewer_role, 'moderator');
    await ownerOps.setMemberRole(group.code, accounts.member!.id, 'member');
  });
  await check('group profile override is retained in member identity', async () => {
    await memberOps.updateMyProfile(group.code, 'QA group alias', null);
    assert.equal((await memberOps.getMyProfile(group.code)).display_name, 'QA group alias');
    assert.equal(
      (await ownerOps.listLeaderboard(group.code)).find((row) => row.userId === accounts.member!.id)
        ?.displayName,
      'QA group alias',
    );
  });
  await check('events support member RSVP and manager-only status transitions', async () => {
    const title = 'Local event ' + nonce;
    await ownerOps.createEvent(group.code, {
      title,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 90000000).toISOString(),
      timezone: 'Europe/Amsterdam',
    });
    const event = (await memberOps.listEvents(group.code)).find((row) => row.title === title)!;
    assert.ok(event);
    await memberOps.respondToEvent(group.code, event.id, 'going');
    assert.equal(
      (await memberOps.listEvents(group.code)).find((row) => row.id === event.id)?.my_response,
      'going',
    );
    await assert.rejects(memberOps.setEventStatus(group.code, event.id, 'cancelled'));
    await ownerOps.setEventStatus(group.code, event.id, 'completed');
    assert.equal(
      (await ownerOps.listEvents(group.code)).find((row) => row.id === event.id)?.status,
      'completed',
    );
  });
  await check('progress, rules, notice and audit typed RPCs work on local schema', async () => {
    await memberOps.recordProgress(group.code, 'page', 2, 'manual', false);
    assert.ok(
      (await ownerOps.listLeaderboard(group.code)).some(
        (row) => row.userId === accounts.member!.id && row.totalAyahs > 0,
      ),
    );
    await ownerOps.publishRules(group.code, 'Fabricated local QA rules');
    assert.equal((await memberOps.getRules(group.code))?.content, 'Fabricated local QA rules');
    await ownerOps.sendNotice(group.code, 'Local QA notice', 'Local body');
    const notices = await memberOps.listNotices(group.code);
    assert.ok(notices.some((row) => row.title === 'Local QA notice'));
    await memberOps.markNoticeRead(group.code);
    assert.ok((await memberOps.listNotices(group.code)).every((row) => row.read_at));
    assert.ok((await ownerOps.listAudit(group.code)).length > 0);
  });
} catch (error) {
  const text = String(error instanceof Error ? error.message : error).replace(
    /[A-Za-z0-9_-]{40,}/g,
    '<REDACTED>',
  );
  report.push({ label: 'local fixture setup', passed: false, error: text });
  console.log('FAIL local fixture setup: ' + text);
} finally {
  writeFileSync(
    new URL('rpc-rls-results.json', directory),
    JSON.stringify(
      {
        target: 'isolated-localhost',
        results: report,
        passed: report.filter((row) => row.passed).length,
        failed: report.filter((row) => !row.passed).length,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      passed: report.filter((row) => row.passed).length,
      failed: report.filter((row) => !row.passed).length,
    }),
  );
  process.exitCode = report.some((row) => !row.passed) ? 1 : 0;
}
