import assert from 'node:assert/strict';
import { assertLocalQaScope } from './scope.mjs';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createClient } from '@supabase/supabase-js';
import type { Backend } from '../../src/services/backend/backend';
import type { Group } from '../../src/services/backend/types';

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
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  assert.equal(url.origin, origin, 'Refused non-loopback request');
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
const bundle = new URL('typing-backend.bundle.mjs', directory);
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
const disposableUserIds: string[] = [];
const transports: Array<import('../../src/services/groups/groupTyping').GroupTypingTransport> = [];
const rawClients: ReturnType<typeof createClient>[] = [];
async function rawActor(role?: string) {
  const client = createClient(origin, credentials.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  rawClients.push(client);
  if (role)
    ok(
      await client.auth.signInWithPassword({
        email: fixture.users[role].email,
        password: fixture.users[role].password,
      }),
    );
  return client;
}
function rawChannel(client: ReturnType<typeof createClient>, topic: string, privateChannel = true) {
  const info = { state: '', events: [] as Array<Record<string, unknown>> };
  const channel = client.channel(topic, {
    config: { private: privateChannel, broadcast: { ack: true } },
  });
  channel.on('broadcast', { event: 'typing' }, (event) => info.events.push(event.payload));
  channel.subscribe((state) => {
    info.state = state;
  });
  return { info, channel };
}
async function channelSettled(raw: ReturnType<typeof rawChannel>) {
  await until(
    () => ['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(raw.info.state),
    'channel resolves',
  );
  return raw.info.state;
}
let group: Group | undefined;
let owner: Backend | undefined;
try {
  // Never sign in/out the actors currently used by the native UI: Supabase
  // signOut revokes their other sessions. Each run owns disposable auth users.
  for (const role of ['owner', 'member', 'outsider']) {
    const email = `wirdna-qa-f27-typing-${randomUUID()}-${role}@example.invalid`;
    const password = randomUUID() + randomUUID();
    const created = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    assert.ok(created.user);
    disposableUserIds.push(created.user.id);
    fixture.users[role] = { id: created.user.id, email, password };
  }
  owner = await actor('owner');
  const member = await actor('member');
  const rawOwner = await rawActor('owner');
  const rawMember = await rawActor('member');
  const rawOutsider = await rawActor('outsider');
  const rawAnon = await rawActor();
  group = await owner.groups.create({
    code: 'QTP-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    name: 'F27 LOCAL QA typing',
    privacy: 'public',
    memberPermissions: {
      canPostMessages: true,
      canShareProgress: true,
      canComment: true,
      canInviteMembers: false,
    },
  });
  assert.equal(group.owner_id, fixture.users.owner.id);
  await member.groups.join(group.code, 'Continue');
  await member.groups.updateMyProfile(group.code, 'Continue', null);
  await owner.groups.updateMyProfile(group.code, 'More', null);
  const id = group.id;
  const ownerTopic = `group-typing:v1:${id}:${fixture.users.owner.id}`;
  const memberTopic = `group-typing:v1:${id}:${fixture.users.member.id}`;
  const beforePosts = ok(await admin.from('group_posts').select('id').eq('group_id', id)).length;
  const ownerEvents: import('../../src/services/groups/groupTyping').GroupTypingSignal[] = [];
  const memberEvents: import('../../src/services/groups/groupTyping').GroupTypingSignal[] = [];
  let ownerReady = false,
    memberReady = false;
  const a = owner.groups.connectTyping(
    group.code,
    fixture.users.owner.id,
    (signal) => ownerEvents.push(signal),
    (ready) => {
      ownerReady = ready;
    },
  );
  const b = member.groups.connectTyping(
    group.code,
    fixture.users.member.id,
    (signal) => memberEvents.push(signal),
    (ready) => {
      memberReady = ready;
    },
  );
  transports.push(a, b);
  const oldMemberSocket = rawChannel(rawMember, memberTopic);
  const wireOwner = rawChannel(rawOwner, ownerTopic);
  await check('two actual backend adapters join own private recipient channels', async () => {
    await until(() => ownerReady && memberReady, 'both private typing adapters subscribed');
    assert.equal(await channelSettled(oldMemberSocket), 'SUBSCRIBED');
    assert.equal(await channelSettled(wireOwner), 'SUBSCRIBED');
  });
  await check(
    'real bidirectional typing and stop have literal aliases, server identity and expiry only',
    async () => {
      const serverBefore = Date.parse(
        ok(await rawMember.rpc('get_group_typing_channel_v1', { p_code: group!.code })).server_time,
      );
      await b.publish(true);
      await until(
        () => ownerEvents.some((event) => event.typing),
        'member typing arrives at owner',
      );
      assert.equal(ownerEvents.at(-1)!.displayName, 'Continue');
      assert.equal(ownerEvents.at(-1)!.userId, fixture.users.member.id);
      assert.equal(memberEvents.length, 0, 'author never receives own typing');
      await until(() => wireOwner.info.events.length > 0, 'wire event received');
      // Realtime adds its transport message id; the application emits only these
      // three fields, never aliases or draft contents.
      assert.deepEqual(
        Object.keys(wireOwner.info.events.at(-1)!)
          .filter((key) => key !== 'id')
          .sort(),
        ['expires_at', 'typing', 'user_id'],
      );
      const serverAfter = Date.parse(
        ok(await rawMember.rpc('get_group_typing_channel_v1', { p_code: group!.code })).server_time,
      );
      const received = ownerEvents.at(-1)!;
      // Validate the eight-second contract against the server clock itself.
      // The adapter's one midpoint sample has network/clock uncertainty; the UI
      // accepts at most two seconds of it and clamps display to eight seconds.
      assert.ok(received.order! >= serverBefore + 8_000);
      assert.ok(received.order! <= serverAfter + 8_000);
      assert.ok(received.expiresAt > Date.now() && received.expiresAt <= Date.now() + 10_000);
      await a.publish(true);
      await until(
        () => memberEvents.some((event) => event.typing),
        'owner typing arrives at member',
      );
      assert.equal(memberEvents.at(-1)!.displayName, 'More');
      await b.publish(false);
      await until(() => ownerEvents.at(-1)?.typing === false, 'explicit stop arrives');
    },
  );
  await check(
    'anonymous, outsider and another member cannot subscribe to a foreign recipient or invoke typing RPC',
    async () => {
      for (const client of [rawOutsider, rawMember, rawAnon]) {
        const probe = rawChannel(client, ownerTopic);
        assert.notEqual(await channelSettled(probe), 'SUBSCRIBED');
        await client.removeChannel(probe.channel);
      }
      for (const client of [rawOutsider, rawAnon]) {
        assert.ok((await client.rpc('get_group_typing_channel_v1', { p_code: group!.code })).error);
        assert.ok(
          (await client.rpc('publish_group_typing_v1', { p_group_id: id, p_typing: true })).error,
        );
      }
    },
  );
  await check(
    'direct private broadcast forgery is denied and public namesake cannot observe or inject',
    async () => {
      const previous = memberEvents.length;
      const forged = await oldMemberSocket.channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: fixture.users.owner.id,
          typing: true,
          expires_at: new Date(Date.now() + 8000).toISOString(),
        },
      });
      assert.notEqual(forged, 'ok');
      const publicProbe = rawChannel(rawOutsider, ownerTopic, false);
      assert.equal(await channelSettled(publicProbe), 'SUBSCRIBED');
      const ownerBefore = ownerEvents.length;
      await publicProbe.channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: fixture.users.member.id,
          typing: true,
          expires_at: new Date(Date.now() + 8000).toISOString(),
        },
      });
      await pause(400);
      assert.equal(memberEvents.length, previous);
      assert.equal(ownerEvents.length, ownerBefore);
      await b.publish(true);
      await until(
        () => ownerEvents.length > ownerBefore,
        'private traffic still reaches authorized recipient',
      );
      assert.equal(
        publicProbe.info.events.length,
        0,
        'private traffic never crosses public namesake',
      );
      await rawOutsider.removeChannel(publicProbe.channel);
    },
  );
  await check(
    'post capability and recipient read capability are enforced at each server invocation',
    async () => {
      const row = ok(
        await admin
          .from('group_members')
          .select('role_id')
          .eq('group_id', id)
          .eq('user_id', fixture.users.member.id)
          .single(),
      );
      ok(
        await admin
          .from('group_role_permissions')
          .update({ allowed: false })
          .eq('role_id', row.role_id)
          .eq('permission_key', 'post.create'),
      );
      await assert.rejects(b.publish(true), { message: 'GROUP_ACCESS_DENIED' });
      ok(
        await admin
          .from('group_role_permissions')
          .update({ allowed: true })
          .eq('role_id', row.role_id)
          .eq('permission_key', 'post.create'),
      );
      ok(
        await admin
          .from('group_role_permissions')
          .update({ allowed: false })
          .eq('role_id', row.role_id)
          .eq('permission_key', 'member.read'),
      );
      const previous = oldMemberSocket.info.events.length;
      await a.publish(true);
      await pause(500);
      assert.equal(
        oldMemberSocket.info.events.length,
        previous,
        'old authorized socket receives nothing after read revocation',
      );
      ok(
        await admin
          .from('group_role_permissions')
          .update({ allowed: true })
          .eq('role_id', row.role_id)
          .eq('permission_key', 'member.read'),
      );
    },
  );
  await check(
    'removed member with an already authorized socket gets no new activity after removal commits',
    async () => {
      await owner!.groups.removeMember(group!.code, fixture.users.member.id);
      assert.equal(
        oldMemberSocket.info.state,
        'SUBSCRIBED',
        'negative does not rely on cooperative disconnect',
      );
      const previous = oldMemberSocket.info.events.length;
      await a.publish(true);
      await a.publish(false);
      await pause(700);
      assert.equal(oldMemberSocket.info.events.length, previous);
      assert.ok(
        (await rawMember.rpc('publish_group_typing_v1', { p_group_id: id, p_typing: true })).error,
      );
      assert.ok(
        (await rawMember.rpc('get_group_typing_channel_v1', { p_code: group!.code })).error,
      );
    },
  );
  await check('typing creates no chat posts; account switch closes old transport', async () => {
    assert.equal(
      ok(await admin.from('group_posts').select('id').eq('group_id', id)).length,
      beforePosts,
    );
    await owner!.auth.signOut();
    await until(() => !ownerReady, 'typing connection closes on account sign-out');
    const previous = ownerEvents.length;
    await a.publish(true);
    await pause(200);
    assert.equal(ownerEvents.length, previous);
  });
} finally {
  for (const transport of transports) transport.close();
  for (const client of rawClients) {
    await client.removeAllChannels();
    await client.auth.signOut();
  }
  if (group) {
    assert.ok(disposableUserIds.includes(group.owner_id));
    ok(await admin.from('groups').delete().eq('id', group.id).eq('owner_id', group.owner_id));
  }
  for (const backend of backends) await backend.auth.signOut();
  for (const id of disposableUserIds) ok(await admin.auth.admin.deleteUser(id));
  await admin.removeAllChannels();
  writeFileSync(
    new URL('typing-runtime-results.json', directory),
    JSON.stringify({ localOnly: true, results }, null, 2),
  );
}
assert.equal(results.length, 7);
console.log('PASS 7 isolated typing runtime scenarios; no hosted writes');
process.exit(0);
