import assert from 'node:assert/strict';
import { assertLocalQaScope } from './scope.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Companion only: never drive an emulator or revoke the native fixture session.
const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const metadata = JSON.parse(readFileSync(new URL('metadata.json', directory), 'utf8'));
const credentials = JSON.parse(readFileSync(new URL('credentials.json', directory), 'utf8'));
const fixture = JSON.parse(readFileSync(new URL('fixtures.credentials.json', directory), 'utf8'));
const origin = 'http://127.0.0.1:55431';
assertLocalQaScope(metadata, readFileSync(new URL('supabase/config.toml', directory), 'utf8'));
assert.equal(metadata.apiOrigin, origin);
assert.equal(credentials.API_URL, origin);
assert.equal(fixture.apiUrl, origin);
const mode = process.argv[2];
assert.ok(
  mode === 'listen' || mode === 'pulse' || mode === 'expire',
  'Choose listen, pulse or expire',
);
const seconds = Number(process.argv[3] ?? '30');
assert.ok(Number.isInteger(seconds) && seconds >= 5 && seconds <= 40);
const hardDeadline = Date.now() + 40_000;
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  assert.equal(url.origin, origin);
  const timeout = AbortSignal.timeout(Math.max(1, Math.min(5_000, hardDeadline - Date.now())));
  return nativeFetch(input, {
    ...init,
    redirect: 'error',
    signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
};
const NativeWebSocket = globalThis.WebSocket;
globalThis.WebSocket = class LocalSocket extends NativeWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    assert.equal(new URL(url).origin, 'ws://127.0.0.1:55431');
    super(url, protocols);
  }
};
const api = createClient(origin, credentials.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const hardStop = setTimeout(
  () => {
    api.realtime.disconnect();
    console.log(JSON.stringify({ typingCompanionTimeLimit: true, mode }));
    process.exit(1);
  },
  Math.max(1, hardDeadline - Date.now()),
);
const ok = <T,>(result: { data: T; error: { message: string } | null }) => {
  if (result.error) throw new Error('Local typing companion request failed');
  return result.data;
};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const observed: Array<{ typing: boolean; receivedAt: number }> = [];
let groupId: string | undefined;
try {
  assert.match(fixture.users.owner.email, /^wirdna-qa-.*@example\.invalid$/);
  ok(
    await api.auth.signInWithPassword({
      email: fixture.users.owner.email,
      password: fixture.users.owner.password,
    }),
  );
  const result = ok(await api.rpc('get_group_detail_v3', { p_code: fixture.groupCode }));
  const group = Array.isArray(result) ? result[0] : result;
  assert.equal(group.id, fixture.groupId);
  assert.equal(group.owner_id, fixture.users.owner.id);
  assert.match(group.name, /^QA circle /);
  groupId = group.id;
  const scope = ok(await api.rpc('get_group_typing_channel_v1', { p_code: fixture.groupCode }));
  assert.equal(scope.topic, `group-typing:v1:${groupId}:${fixture.users.owner.id}`);
  let ready = false;
  const channel = api.channel(scope.topic, { config: { private: true } });
  channel.on('broadcast', { event: 'typing' }, (event) => {
    if (
      event.payload.user_id !== fixture.users.member.id ||
      typeof event.payload.typing !== 'boolean'
    )
      return;
    const record = { typing: event.payload.typing as boolean, receivedAt: Date.now() };
    observed.push(record);
    console.log(
      JSON.stringify({ nativeMemberTyping: record.typing, receivedAt: record.receivedAt }),
    );
  });
  channel.subscribe((state) => {
    ready = state === 'SUBSCRIBED';
  });
  const deadline = Date.now() + 15_000;
  while (!ready && Date.now() < deadline) await delay(100);
  assert.ok(ready, 'Private companion channel failed to subscribe');
  console.log(JSON.stringify({ typingCompanionReady: true, mode, seconds }));
  if (mode === 'expire') {
    ok(await api.rpc('publish_group_typing_v1', { p_group_id: groupId, p_typing: true }));
    console.log(
      JSON.stringify({
        ownerTypingPublished: true,
        at: Date.now(),
        stopWillBeSent: false,
        uiExpirySeconds: 8,
      }),
    );
  }
  const end = Math.min(Date.now() + seconds * 1000, hardDeadline - 2_000);
  while (Date.now() < end) {
    if (mode === 'pulse') {
      ok(await api.rpc('publish_group_typing_v1', { p_group_id: groupId, p_typing: true }));
      console.log(JSON.stringify({ ownerTypingPublished: true, at: Date.now() }));
    }
    await delay(Math.min(mode === 'pulse' ? 3_000 : 200, Math.max(0, end - Date.now())));
  }
} finally {
  if (mode === 'pulse' && groupId) {
    await api.rpc('publish_group_typing_v1', { p_group_id: groupId, p_typing: false });
    console.log(JSON.stringify({ ownerTypingPublished: false, at: Date.now() }));
  }
  await api.removeAllChannels();
  // No signOut at all: the concurrent native fixture session must remain intact.
  api.realtime.disconnect();
  clearTimeout(hardStop);
  writeFileSync(
    new URL(`f27-typing-native-${mode}.json`, directory),
    JSON.stringify({ localOnly: true, mode, observed }, null, 2),
  );
}
console.log(JSON.stringify({ typingCompanionFinished: true, mode, events: observed.length }));
process.exit(0);
