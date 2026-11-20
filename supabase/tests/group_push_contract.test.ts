import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApnsRequest } from '../functions/group-push/apns-contract';
import { curatedGroupPushText } from '../functions/group-push/notification-copy';

const delivery = { token: 'local-token', event_id: 'event', recipient: 'recipient', group_code: 'LOCAL-1', post_id: 'post', language: 'en' };
const auth = { token: 'local-auth', topic: 'test.app', host: 'https://api.push.apple.com' };

test('new post APNs carries validated kind and generic copy; legacy deliveries remain replies', () => {
  const post = buildApnsRequest({ ...delivery, kind: 'group_post' }, auth);
  assert.equal(post.body.kind, 'group_post');
  assert.equal(post.body.aps.alert.title, 'New group post');
  assert.equal(post.body.recipient, delivery.recipient);
  assert.equal(buildApnsRequest(delivery, auth).body.kind, 'group_reply');
  assert.equal(buildApnsRequest(delivery, auth).body.aps.alert.title, 'New group reply');
});

test('generic posts support all existing push locales and deterministic unknown locale fallback', () => {
  for (const locale of ['nl', 'en', 'ar', 'fr']) {
    const copy = curatedGroupPushText('group_post', locale);
    assert.ok(copy.title.length > 0 && copy.body.length > 0);
    assert.ok(!copy.body.includes('LOCAL-1'));
  }
  assert.deepEqual(curatedGroupPushText('group_post', 'unknown'), curatedGroupPushText('group_post', 'nl'));
});

test('worker claims v3 and rejects unknown kinds before any provider request', async () => {
  const previousFetch = globalThis.fetch;
  const globals = globalThis as typeof globalThis & { Deno?: unknown };
  const previousDeno = globals.Deno;
  let handler: (request: Request) => Promise<Response>;
  const calls: string[] = [];
  globals.Deno = {
    env: { get: (key: string) => key === 'SUPABASE_URL' ? 'http://127.0.0.1:55431' : 'local-test-only' },
    serve: (callback: typeof handler) => { handler = callback; },
  };
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    assert.ok(url.startsWith('http://127.0.0.1:55431/rest/v1/rpc/'), 'No provider or hosted traffic');
    const rpc = url.split('/').at(-1)!;
    calls.push(rpc);
    if (rpc === 'verify_group_push_dispatcher_v1') return Response.json(true);
    if (rpc === 'claim_group_push_v3') return Response.json([{ delivery_id: 'delivery', claim: 'claim', kind: 'invalid' }]);
    if (rpc === 'finish_group_push_v1') {
      assert.equal(JSON.parse(String(options?.body)).p_result, 'failed');
      return Response.json(null);
    }
    throw new Error(`Unexpected RPC ${rpc}`);
  };
  try {
    await import('../functions/group-push/index');
    const response = await handler!(new Request('http://127.0.0.1/local-test', {
      method: 'POST', headers: { Authorization: `Bearer ${'x'.repeat(40)}` },
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(calls, ['verify_group_push_dispatcher_v1', 'claim_group_push_v3', 'finish_group_push_v1']);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousDeno === undefined) delete globals.Deno;
    else globals.Deno = previousDeno;
  }
});
