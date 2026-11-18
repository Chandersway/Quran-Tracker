import assert from 'node:assert/strict';
import { assertLocalQaScope } from './scope.mjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  createGroupFeedReader,
  feedCursorFilter,
  type FeedRow,
} from '../../src/services/groups/groupFeedReader';
import { createGroupFeedSubscription } from '../../src/services/groups/groupFeedSubscription';
import { GroupFeedController } from '../../src/services/groups/groupFeedController';
import { captureDraftActor } from '../../src/services/groups/draftActor';
import type { Group, GroupFeedPost, GroupFeedService } from '../../src/services/backend/types';

const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const metadata = JSON.parse(readFileSync(new URL('metadata.json', directory), 'utf8'));
assertLocalQaScope(metadata, readFileSync(new URL('supabase/config.toml', directory), 'utf8'));
assert.equal(metadata.apiOrigin, 'http://127.0.0.1:55431');
const credentials = JSON.parse(readFileSync(new URL('credentials.json', directory), 'utf8'));
assert.equal(new URL(credentials.API_URL).origin, metadata.apiOrigin);
const fixture = JSON.parse(readFileSync(new URL('fixtures.credentials.json', directory), 'utf8'));
assert.equal(fixture.apiUrl, metadata.apiOrigin);
const guardedFetch: typeof fetch = (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  assert.equal(url.origin, metadata.apiOrigin, 'Refused non-local API request');
  return fetch(input, { ...init, redirect: 'error' });
};
const client = (key: string) =>
  createClient(credentials.API_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: guardedFetch },
  });
const admin = client(credentials.SERVICE_ROLE_KEY);
const actor = async (role: string) => {
  const api = client(credentials.ANON_KEY);
  const user = fixture.users[role];
  assert.match(user.email, /^wirdna-qa-.*@example\.invalid$/);
  ok(await api.auth.signInWithPassword({ email: user.email, password: user.password }));
  return api;
};
function ok<T>(response: { data: T; error: { message: string } | null }): T {
  if (response.error) throw new Error(response.error.message);
  return response.data;
}
const one = <T,>(data: T | T[]) => (Array.isArray(data) ? data[0]! : data);
const rpc = async <T,>(api: SupabaseClient, name: string, params: Record<string, unknown>) =>
  ok(await api.rpc(name, params)) as T;
const session = async (api: SupabaseClient) => {
  const { data, error } = await api.auth.getSession();
  if (error) throw error;
  return data.session;
};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check: () => boolean, label: string, timeout = 10000) {
  const end = Date.now() + timeout;
  while (!check() && Date.now() < end) await delay(75);
  assert.ok(check(), label);
}
const results: { label: string; passed: boolean; error?: string }[] = [];
async function check(label: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ label, passed: true });
    console.log('PASS ' + label);
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).replace(
      /[A-Za-z0-9_-]{40,}/g,
      '<REDACTED>',
    );
    results.push({ label, passed: false, error: message });
    console.log('FAIL ' + label + ': ' + message);
  }
}
const container = 'supabase_db_' + metadata.projectId;
const sql = (input: string) => {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
    ],
    { input, encoding: 'utf8', timeout: 30000 },
  );
  if (result.status !== 0)
    throw new Error(String(result.stderr).replace(/[A-Za-z0-9_-]{40,}/g, '<REDACTED>'));
  return result.stdout.trim();
};
const clients: SupabaseClient[] = [admin];
let privatePath: string | undefined;
let outsiderId: string | undefined;
const createdPosts: string[] = [];
try {
  await check(
    'reviewed publication migration applies twice only to isolated local project',
    async () => {
      const source = readFileSync(
        new URL('supabase/migrations/20261114120000_group_feed_realtime.sql', directory),
        'utf8',
      );
      assert.doesNotMatch(source, /https?:\/\/|net\.http|delete\s+from|drop\s+/i);
      sql(source);
      sql(source);
      assert.equal(
        sql(
          "SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename IN ('group_posts','post_comments','post_reactions','group_media','post_attachments');",
        ),
        '5',
      );
    },
  );
  const owner = await actor('owner');
  const member = await actor('member');
  const other = await actor('otherOwner');
  clients.push(owner, member, other);
  const outsider = client(credentials.ANON_KEY);
  clients.push(outsider);
  const password = randomBytes(24).toString('base64url');
  const email = `wirdna-qa-${Date.now()}-realtime-outsider@example.invalid`;
  const created = ok(
    await admin.auth.admin.createUser({ email, password, email_confirm: true }),
  ).user!;
  outsiderId = created.id;
  ok(await outsider.auth.signInWithPassword({ email, password }));
  const group = one(
    await rpc<Group | Group[]>(owner, 'get_group_detail_v3', { p_code: fixture.groupCode }),
  );
  const second = one(
    await rpc<Group | Group[]>(other, 'get_group_detail_v3', { p_code: fixture.secondCode }),
  );
  const makeReader = (api: SupabaseClient) =>
    createGroupFeedReader({
      groupId: async (code) =>
        one(await rpc<Group | Group[]>(api, 'get_group_detail_v3', { p_code: code })).id,
      async read(input) {
        let query = api
          .from('group_posts')
          .select('*')
          .eq('group_id', input.groupId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
        if (input.cursor) query = query.or(feedCursorFilter(input.cursor));
        if (input.postId) query = query.eq('id', input.postId);
        if (input.pinnedOnly) {
          query = query.not('pinned_at', 'is', null);
          const rows: FeedRow[] = [];
          for (let offset = 0; ; offset += 500) {
            const batch = ok(await query.range(offset, offset + 499));
            rows.push(...batch);
            if (batch.length < 500) return rows;
          }
        }
        return ok(await query.limit(input.limit));
      },
      async hydrate(_code, rows) {
        return rows.map(
          (row): GroupFeedPost => ({
            id: String(row.id),
            createdAt: String(row.created_at),
            createdBy: String(row.created_by),
            displayName: 'Fake QA fixture',
            content: String(row.content),
            isMine: false,
            isPinned: !!row.pinned_at,
            type: 'text',
            editedAt: null,
            comments: [],
            likeCount: 0,
            likedByMe: false,
            reactionCounts: {},
            myReaction: null,
          }),
        );
      },
    });
  const timestamp = new Date().toISOString();
  const rows = Array.from({ length: 91 }, (_, index) => ({
    id: randomUUID(),
    group_id: group.id,
    created_by: fixture.users.owner.id,
    content: `Runtime review ${index}`,
    created_at: timestamp,
  }));
  const oldPin = {
    id: randomUUID(),
    group_id: group.id,
    created_by: fixture.users.owner.id,
    content: 'Runtime review old pin',
    created_at: '2020-01-01T00:00:00Z',
    pinned_at: timestamp,
    pinned_by: fixture.users.owner.id,
  };
  createdPosts.push(...rows.map((row) => row.id), oldPin.id);
  ok(await admin.from('group_posts').insert([...rows, oldPin]));
  const reader = makeReader(member);
  await check(
    'actual PostgREST cursors cover 91 equal-timestamp posts without skipping or duplicate IDs and retain old pins',
    async () => {
      const seen = new Set<string>();
      let cursor;
      for (let pageIndex = 0; pageIndex < 30; pageIndex++) {
        const page = await reader(group.code, { cursor, limit: 30 });
        assert.ok(page.pinnedPosts.some((post) => post.id === oldPin.id));
        for (const post of page.posts) {
          assert.ok(!seen.has(post.id));
          seen.add(post.id);
        }
        if (!page.nextCursor) break;
        cursor = page.nextCursor;
      }
      for (const row of rows) assert.ok(seen.has(row.id));
      assert.ok(seen.has(oldPin.id));
    },
  );
  await check(
    'authenticated outsider cannot query scoped feed; focused reads exclude unrelated pins',
    async () => {
      await assert.rejects(makeReader(outsider)(group.code));
      const focused = await reader(group.code, { postId: rows[0]!.id });
      assert.deepEqual(
        focused.posts.map((post) => post.id),
        [rows[0]!.id],
      );
      assert.deepEqual(focused.pinnedPosts, []);
    },
  );
  const seen = { ownerA: 0, memberA: 0, ownerB: 0, outsiderA: 0 };
  const channelStates = new Map<string, string>();
  const subscribe = (api: SupabaseClient, groupId: string, label: keyof typeof seen) =>
    createGroupFeedSubscription({
      groupId: async () => groupId,
      open(id, change, status) {
        const channel = api.channel(`qa-runtime-${label}-${randomUUID()}`, {
          config: { postgres_changes_options: { wait: true } },
        });
        for (const table of [
          'group_posts',
          'post_comments',
          'post_reactions',
          'group_media',
          'post_attachments',
        ])
          for (const event of ['INSERT', 'UPDATE'] as const)
            channel.on(
              'postgres_changes',
              { event, schema: 'public', table, filter: `group_id=eq.${id}` },
              (payload) => {
                if ('group_id' in payload.new && payload.new.group_id === id) change();
              },
            );
        channel.subscribe((state, error) => {
          channelStates.set(label, state);
          if (error)
            console.log(
              'DIAGNOSTIC subscription ' +
                label +
                ': ' +
                String(error.message).replace(/[A-Za-z0-9_-]{40,}/g, '<REDACTED>'),
            );
          status(state === 'SUBSCRIBED' ? 'live' : 'polling');
        });
        return () => {
          void api.removeChannel(channel);
        };
      },
    })(
      group.code,
      () => {
        seen[label]++;
      },
      () => {},
    );
  const close = [
    subscribe(owner, group.id, 'ownerA'),
    subscribe(member, group.id, 'memberA'),
    subscribe(other, second.id, 'ownerB'),
    subscribe(outsider, group.id, 'outsiderA'),
  ];
  await check(
    'local realtime delivers authorized group INSERT/UPDATE invalidations and excludes different group/outsider',
    async () => {
      await until(
        () =>
          ['ownerA', 'memberA', 'ownerB'].every(
            (label) => channelStates.get(label) === 'SUBSCRIBED',
          ),
        'authorized subscriptions did not connect',
        22000,
      );
      const id = randomUUID();
      createdPosts.push(id);
      ok(
        await admin.from('group_posts').insert({
          id,
          group_id: group.id,
          created_by: fixture.users.owner.id,
          content: 'Realtime first',
        }),
      );
      await until(() => seen.ownerA >= 1 && seen.memberA >= 1, 'authorized insert event missing');
      ok(await admin.from('group_posts').update({ content: 'Realtime edited' }).eq('id', id));
      await until(() => seen.ownerA >= 2 && seen.memberA >= 2, 'authorized update event missing');
      await delay(350);
      assert.equal(seen.ownerB, 0);
      assert.equal(seen.outsiderA, 0);
    },
  );
  await check('closed subscriptions stop callbacks and remove all local SDK channels', async () => {
    close.forEach((stop) => stop());
    await until(
      () => [owner, member, other, outsider].every((api) => !api.getChannels().length),
      'channel cleanup pending',
    );
    const before = { ...seen };
    ok(await admin.from('group_posts').update({ content: 'After cleanup' }).eq('id', rows[0]!.id));
    await delay(350);
    assert.deepEqual(seen, before);
  });
  await check(
    'polling reconciles actual hard deletes while retaining loaded older pages',
    async () => {
      let poll = () => {};
      const service: GroupFeedService = {
        listFeedPage: reader,
        subscribeFeed: (_code, _change, status) => {
          status('polling');
          return () => {};
        },
      };
      const controller = new GroupFeedController(service, group.code, undefined, {
        every(callback) {
          poll = callback;
          return () => {
            poll = () => {};
          };
        },
      });
      controller.start();
      await until(
        () => !controller.snapshot().busy && controller.snapshot().posts.length > 0,
        'initial snapshot missing',
      );
      await controller.loadOlder();
      const chosen = controller
        .snapshot()
        .posts.find((post) => rows.some((row) => row.id === post.id))!;
      ok(await admin.from('group_posts').delete().eq('id', chosen.id));
      poll();
      // Background reconciliation deliberately leaves `busy` false. Wait for its
      // observable snapshot, not the foreground loading indicator.
      await until(
        () => !controller.snapshot().posts.some((post) => post.id === chosen.id),
        'poll refresh did not reconcile the deleted post',
      );
      assert.ok(!controller.snapshot().posts.some((post) => post.id === chosen.id));
      assert.ok(controller.snapshot().posts.length >= 60);
      controller.stop();
    },
  );
  await check(
    'private signed image has CORS support and no CORP header; unauthorized signing is denied',
    async () => {
      privatePath = `${group.id}/${fixture.users.owner.id}/${randomUUID()}.png`;
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO/a4xoAAAAASUVORK5CYII=',
        'base64',
      );
      ok(
        await owner.storage
          .from('group-media')
          .upload(privatePath, png, { contentType: 'image/png' }),
      );
      const signed = ok(
        await owner.storage.from('group-media').createSignedUrl(privatePath, 180),
      ).signedUrl;
      const response = await guardedFetch(signed, { headers: { Origin: 'http://127.0.0.1:9119' } });
      assert.equal(response.status, 200);
      assert.ok(response.headers.get('access-control-allow-origin'));
      assert.equal(response.headers.get('cross-origin-resource-policy'), null);
      const denied = await outsider.storage.from('group-media').createSignedUrl(privatePath, 180);
      assert.ok(denied.error);
      writeFileSync(
        new URL('private-image-browser-fixture.json', directory),
        JSON.stringify({ url: signed, bytes: png.length, expiresInSeconds: 180 }),
      );
    },
  );
  await check(
    'draft RPC pins the original actor through a real shared-client account switch',
    async () => {
      const actor = await captureDraftActor(async () => session(owner), fixture.users.owner.id);
      ok(
        await owner.auth.signInWithPassword({
          email: fixture.users.member.email,
          password: fixture.users.member.password,
        }),
      );
      await assert.rejects(
        captureDraftActor(async () => session(owner), fixture.users.owner.id),
        /AUTH_REQUIRED/,
      );
      const result = one(
        ok(
          await owner
            .rpc('create_group_text_post_v2', {
              p_group_id: group.id,
              p_content: 'Pinned fake actor test',
              p_display_name: null,
            })
            .setHeader('Authorization', `Bearer ${actor.accessToken}`),
        ) as { id: string; created_by: string } | { id: string; created_by: string }[],
      );
      createdPosts.push(result.id);
      assert.equal(result.created_by, fixture.users.owner.id);
    },
  );
} finally {
  await Promise.all(clients.map((api) => api.removeAllChannels()));
  for (const api of clients) api.realtime.disconnect();
  if (createdPosts.length) ok(await admin.from('group_posts').delete().in('id', createdPosts));
  // Keep the fabricated, short-lived signed-image fixture for the adjacent browser check.
  if (outsiderId) ok(await admin.auth.admin.deleteUser(outsiderId));
  const report = {
    target: 'isolated-localhost',
    projectId: metadata.projectId,
    passed: results.filter((row) => row.passed).length,
    failed: results.filter((row) => !row.passed).length,
    results,
  };
  writeFileSync(
    new URL('community-runtime-results.json', directory),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed }));
  process.exitCode = report.failed ? 1 : 0;
}
