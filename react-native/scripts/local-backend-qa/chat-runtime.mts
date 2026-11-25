import assert from 'node:assert/strict';
import { assertLocalQaScope } from './scope.mjs';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createClient } from '@supabase/supabase-js';
import type { Backend } from '../../src/services/backend/backend';
import type { Group } from '../../src/services/backend/types';
import { chatFeedService } from '../../src/services/groups/groupChat';
import { GroupFeedController } from '../../src/services/groups/groupFeedController';
import { GroupDraftStore } from '../../src/services/groups/groupDrafts';

const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const metadata = JSON.parse(readFileSync(new URL('metadata.json', directory), 'utf8'));
const credentials = JSON.parse(readFileSync(new URL('credentials.json', directory), 'utf8'));
const fixture = JSON.parse(readFileSync(new URL('fixtures.credentials.json', directory), 'utf8'));
const origin = 'http://127.0.0.1:55431';
assertLocalQaScope(metadata, readFileSync(new URL('supabase/config.toml', directory), 'utf8'));
assert.equal(metadata.apiOrigin, origin);
assert.equal(credentials.API_URL, origin);
assert.equal(fixture.apiUrl, origin);
const originalFetch = globalThis.fetch;
let offline = false;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  assert.equal(url.origin, origin, 'Refused non-loopback request');
  if (offline) throw new Error('QA network unavailable before request');
  return originalFetch(input, { ...init, redirect: 'error' });
};
const NativeWebSocket = globalThis.WebSocket;
globalThis.WebSocket = class LocalSocket extends NativeWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    assert.equal(new URL(url).origin, 'ws://127.0.0.1:55431', 'Refused non-loopback socket');
    super(url, protocols);
  }
};

// Only platform plumbing is replaced. The shipped backend, auth, RPC/query adapters,
// draft actor guard, subscriptions, chat service and controller are executed unchanged.
const bundle = new URL('chat-backend.bundle.mjs', directory);
await build({
  entryPoints: [fileURLToPath(new URL('../../src/services/backend/backend.ts', import.meta.url))],
  outfile: fileURLToPath(bundle),
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  plugins: [
    {
      name: 'native-boundaries-only',
      setup(builder) {
        builder.onResolve(
          { filter: /(?:storage\/sessionStorage|notifications\/pushDevice|audio\/audio)$/ },
          (args) => ({ path: args.path, namespace: 'qa-native' }),
        );
        builder.onLoad({ filter: /.*/, namespace: 'qa-native' }, (args) => ({
          contents: args.path.endsWith('sessionStorage')
            ? 'const values = new Map(); export const sessionStorage = {getItem: async k => values.get(k) ?? null, setItem: async (k,v) => {values.set(k,v)}, removeItem: async k => {values.delete(k)}};'
            : args.path.endsWith('pushDevice')
              ? 'export const unregisterPushDevice = async () => {};'
              : 'export const createAudioService = () => ({});',
          loader: 'js',
        }));
      },
    },
  ],
});
const config = { supabaseUrl: origin, supabaseAnonKey: credentials.ANON_KEY };
const backends: Backend[] = [];
async function actor(role?: string) {
  // Fresh bundled module gives every fabricated actor its own private session store.
  const module = await import(bundle.href + '?actor=' + randomUUID());
  const backend: Backend = module.createBackend(config);
  backends.push(backend);
  if (role) {
    const user = fixture.users[role];
    assert.match(user.email, /^wirdna-qa-.*@example\.invalid$/);
    const actual = await backend.auth.signIn(user.email, user.password);
    assert.equal(actual.id, user.id);
  }
  return backend;
}
const admin = createClient(origin, credentials.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const outsiderApi = createClient(origin, credentials.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ok = <T,>(result: { data: T; error: { message: string } | null }) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check: () => boolean, label: string, timeout = 18000) {
  const end = Date.now() + timeout;
  while (!check() && Date.now() < end) await pause(60);
  assert.ok(check(), label);
}
const results: { label: string; passed: boolean; ms: number }[] = [];
async function check(label: string, run: () => Promise<void>) {
  const start = Date.now();
  await run();
  results.push({ label, passed: true, ms: Date.now() - start });
  console.log('PASS ' + label);
}
const controllers: GroupFeedController[] = [];
const stops: (() => void)[] = [];
let group: Group | undefined;
let owner: Backend | undefined;
try {
  owner = await actor('owner');
  const member = await actor('member');
  const outsider = await actor('outsider');
  const anonymous = await actor();
  ok(
    await outsiderApi.auth.signInWithPassword({
      email: fixture.users.outsider.email,
      password: fixture.users.outsider.password,
    }),
  );
  const permissions = {
    canPostMessages: true,
    canShareProgress: true,
    canComment: true,
    canInviteMembers: false,
  };
  group = await owner.groups.create({
    code: 'QCH-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    name: 'F26 LOCAL QA live chat',
    description: 'Fabricated loopback-only chat acceptance',
    privacy: 'restricted',
  });
  const code = group.code;
  const groupId = group.id;
  assert.equal(group.owner_id, fixture.users.owner.id);
  assert.deepEqual(await owner.groups.getMemberPermissions(code), permissions);
  await member.groups.join(code, 'Continue');
  await member.groups.updateMyProfile(code, 'Continue', null);
  await owner.groups.updateMyProfile(code, 'More', null);
  const ownerController = new GroupFeedController(chatFeedService(owner.groups), code);
  const memberController = new GroupFeedController(chatFeedService(member.groups), code);
  controllers.push(ownerController, memberController);
  let outsiderEvents = 0;
  const outsiderChannel = outsiderApi
    .channel('qa-chat-outsider-' + randomUUID(), {
      config: { postgres_changes_options: { wait: true } },
    })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_posts', filter: `group_id=eq.${groupId}` },
      () => {
        outsiderEvents++;
      },
    )
    .subscribe();
  stops.push(() => {
    void outsiderApi.removeChannel(outsiderChannel);
  });
  ownerController.start();
  memberController.start();
  await check(
    'actual shipped adapters connect two isolated actors to authorized realtime',
    async () => {
      await until(
        () =>
          controllers.every(
            (entry) => entry.snapshot().connection === 'live' && !entry.snapshot().busy,
          ),
        'two actor subscriptions did not become live',
        25000,
      );
    },
  );
  await check(
    'member sends; owner receives automatically before polling and retains literal group alias',
    async () => {
      const sent = await member.groups.sendChatMessage(
        code,
        'F26 LOCAL QA member live\nContinue',
        fixture.users.member.id,
      );
      assert.equal(sent.createdBy, fixture.users.member.id);
      assert.equal(sent.displayName, 'Continue');
      await until(
        () => ownerController.snapshot().posts.some((post) => post.id === sent.id),
        'owner did not receive member message',
        15000,
      );
      const received = ownerController.snapshot().posts.find((post) => post.id === sent.id)!;
      assert.equal(received.content, sent.content);
      assert.equal(received.isMine, false);
      assert.equal(received.displayName, 'Continue');
    },
  );
  await check(
    'owner replies; member receives automatically and group text stays available in original feed',
    async () => {
      const sent = await owner!.groups.sendChatMessage(
        code,
        'F26 LOCAL QA owner response\nMore',
        fixture.users.owner.id,
      );
      await until(
        () => memberController.snapshot().posts.some((post) => post.id === sent.id),
        'member did not receive owner message',
        15000,
      );
      const received = memberController.snapshot().posts.find((post) => post.id === sent.id)!;
      assert.equal(received.createdBy, fixture.users.owner.id);
      assert.equal(received.displayName, 'More');
      assert.equal(received.isMine, false);
      assert.equal((await member.groups.listFeed(code, sent.id))[0].id, sent.id);
    },
  );
  await check(
    'outsider, anonymous, forged author and foreign-group access are denied; outsider receives no socket payload',
    async () => {
      await assert.rejects(outsider.groups.listChatPage(code));
      await assert.rejects(
        outsider.groups.sendChatMessage(code, 'Denied outsider', fixture.users.outsider.id),
      );
      await assert.rejects(anonymous.groups.listChatPage(code));
      await assert.rejects(
        anonymous.groups.sendChatMessage(code, 'Denied anonymous', fixture.users.member.id),
      );
      await assert.rejects(
        member.groups.sendChatMessage(code, 'Forged owner', fixture.users.owner.id),
        /AUTH_REQUIRED/,
      );
      await assert.rejects(member.groups.listChatPage(fixture.secondCode));
      assert.deepEqual(
        ok(await outsiderApi.from('group_posts').select('id').eq('group_id', groupId)),
        [],
      );
      const forged = await outsiderApi.from('group_posts').insert({
        group_id: groupId,
        created_by: fixture.users.owner.id,
        content: 'Forged direct row',
      });
      assert.ok(forged.error);
      await pause(300);
      assert.equal(outsiderEvents, 0);
    },
  );
  controllers.forEach((entry) => entry.stop());
  await check(
    '73 equal-time text messages paginate exactly once; system posts and pin order stay out of chat',
    async () => {
      const timestamp = '2021-01-01T12:00:00.000Z';
      const rows = Array.from({ length: 73 }, (_, index) => ({
        id: randomUUID(),
        group_id: groupId,
        created_by: fixture.users.owner.id,
        display_name_snapshot: 'More',
        content: `F26 LOCAL QA older ${String(index + 1).padStart(3, '0')}`,
        created_at: timestamp,
        type: 'text',
      }));
      rows.sort((a, b) => a.id.localeCompare(b.id));
      ok(
        await admin.from('group_posts').insert([
          ...rows,
          {
            id: randomUUID(),
            group_id: groupId,
            created_by: fixture.users.owner.id,
            content: 'F26 LOCAL QA system, feed only',
            created_at: timestamp,
            type: 'system',
          },
        ]),
      );
      await owner!.groups.pinPost(code, rows[0].id, true);
      const ids: string[] = [];
      let cursor;
      do {
        const page = await member.groups.listChatPage(code, { cursor, limit: 19 });
        assert.deepEqual(page.pinnedPosts, []);
        assert.ok(page.posts.every((post) => post.type === 'text' && !post.isPinned));
        ids.push(...page.posts.map((post) => post.id));
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      assert.equal(new Set(ids).size, ids.length);
      assert.deepEqual(
        ids.filter((id) => rows.some((row) => row.id === id)),
        [...rows].reverse().map((row) => row.id),
      );
      assert.ok(
        (await owner!.groups.listFeedPage(code)).pinnedPosts.some((post) => post.id === rows[0].id),
      );
    },
  );
  await check(
    'actual failed request keeps exact draft; manual retry receives one acknowledged member row',
    async () => {
      const draft = new GroupDraftStore(fixture.users.member.id);
      const text = '  F26 LOCAL QA offline draft\nContinue  ';
      draft.set(text);
      offline = true;
      try {
        assert.equal(
          await draft.send((content, actorId) =>
            member.groups.sendChatMessage(code, content, actorId!),
          ),
          false,
        );
      } finally {
        offline = false;
      }
      assert.deepEqual(draft.snapshot().post, { text, status: 'failed' });
      assert.equal(
        await draft.send((content, actorId) =>
          member.groups.sendChatMessage(code, content, actorId!),
        ),
        true,
      );
      assert.deepEqual(draft.snapshot().post, { text: '', status: 'sent' });
      const rows = ok(
        await admin
          .from('group_posts')
          .select('created_by')
          .eq('group_id', groupId)
          .eq('content', text.trim()),
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].created_by, fixture.users.member.id);
    },
  );
  await check(
    'in-flight chat send pins original token across account change; stale actor is refused afterward',
    async () => {
      const get = member.groups.get;
      let entered!: () => void;
      let release!: () => void;
      const ready = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const barrier = new Promise<void>((resolve) => {
        release = resolve;
      });
      member.groups.get = async (target) => {
        entered();
        await barrier;
        return get(target);
      };
      const request = member.groups.sendChatMessage(
        code,
        'F26 LOCAL QA pinned actor',
        fixture.users.member.id,
      );
      await ready;
      try {
        await member.auth.signIn(fixture.users.owner.email, fixture.users.owner.password);
        release();
        const sent = await request;
        assert.equal(sent.createdBy, fixture.users.member.id);
        await assert.rejects(
          member.groups.sendChatMessage(
            code,
            'F26 LOCAL QA stale actor denied',
            fixture.users.member.id,
          ),
          /AUTH_REQUIRED/,
        );
      } finally {
        release();
        member.groups.get = get;
        await member.auth.signIn(fixture.users.member.email, fixture.users.member.password);
      }
    },
  );
  await check(
    'revoked post capability and removed membership are enforced by existing server policies',
    async () => {
      await owner!.groups.update(code, {
        name: group!.name,
        memberPermissions: { ...permissions, canPostMessages: false },
      });
      const detail = await member.groups.get(code);
      assert.ok(!detail.permissions?.includes('post.create'));
      await assert.rejects(
        member.groups.sendChatMessage(
          code,
          'F26 LOCAL QA revoked post denied',
          fixture.users.member.id,
        ),
      );
      assert.ok((await member.groups.listChatPage(code)).posts.length);
      await owner!.groups.removeMember(code, fixture.users.member.id);
      await assert.rejects(member.groups.listChatPage(code));
      await assert.rejects(
        member.groups.sendChatMessage(
          code,
          'F26 LOCAL QA removed member denied',
          fixture.users.member.id,
        ),
      );
    },
  );
  writeFileSync(
    new URL('chat-runtime-results.json', directory),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        scope: 'localhost only; shipped backend and real Realtime; no native acceptance implied',
        results,
      },
      null,
      2,
    ),
  );
  console.log(`Passed ${results.length}/${results.length} isolated chat runtime scenarios.`);
} catch (error) {
  console.error(
    'FAIL chat runtime: ' +
      String(error instanceof Error ? error.message : error).replace(
        /[A-Za-z0-9_-]{35,}/g,
        '<REDACTED>',
      ),
  );
  process.exitCode = 1;
} finally {
  offline = false;
  controllers.forEach((entry) => entry.stop());
  stops.forEach((stop) => stop());
  if (group && owner) await owner.groups.deleteGroup(group.code).catch(() => undefined);
  await Promise.allSettled(backends.map((backend) => backend.auth.signOut()));
  await outsiderApi.removeAllChannels();
  await outsiderApi.auth.signOut();
  await admin.removeAllChannels();
  globalThis.fetch = originalFetch;
  globalThis.WebSocket = NativeWebSocket;
}
// The shipped adapter owns SDK auth refresh timers for the app's lifetime.
// All CLI requests, channels and sign-outs have finished at this point.
process.exit(process.exitCode ?? 0);
