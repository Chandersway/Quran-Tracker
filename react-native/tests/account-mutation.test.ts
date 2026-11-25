import assert from 'node:assert/strict';
import test from 'node:test';
import type { Session } from '@supabase/supabase-js';
import { createAccountMutation } from '../src/services/auth/accountMutation';

function fixture() {
  const storageKey = 'sb-example-auth-token';
  const currentSession = JSON.stringify({
    user: { id: 'next-reader' },
    access_token: 'next-token',
  });
  const values = new Map([[storageKey, currentSession]]);
  const writes: string[] = [];
  const requests: { url: URL; headers: Headers; body: Record<string, unknown> }[] = [];
  const session: Session = {
    access_token: 'original-reader-token',
    refresh_token: 'original-reader-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'original-reader',
      aud: 'authenticated',
      email: 'original@example.test',
      created_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email' },
      user_metadata: {},
    },
  };
  let status = 200;
  const mutate = createAccountMutation({
    backendUrl: 'https://example.supabase.co',
    publicKey: 'sb_publishable_test',
    storageKey,
    storage: {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => {
        values.set(key, value);
        writes.push(key);
      },
      removeItem: async (key) => {
        values.delete(key);
        writes.push(key);
      },
    },
    fetcher: async (url, init) => {
      requests.push({
        url: new URL(String(url)),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)),
      });
      return new Response(
        JSON.stringify(status === 200 ? session.user : { msg: 'Request denied' }),
        { status, headers: { 'Content-Type': 'application/json' } },
      );
    },
  });
  return {
    mutate,
    session,
    storageKey,
    currentSession,
    values,
    writes,
    requests,
    status: (next: number) => {
      status = next;
    },
  };
}

test('account edits use the captured bearer without replacing a later signed-in account', async () => {
  const f = fixture();
  const pending = f.mutate(f.session, { password: 'new-password-for-original', nonce: 'code' });
  f.session.access_token = 'next-reader-token';
  const result = await pending;
  assert.equal(result.error, null);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0]!.headers.get('Authorization'), 'Bearer original-reader-token');
  assert.equal(f.requests[0]!.headers.get('apikey'), 'sb_publishable_test');
  assert.equal(f.requests[0]!.body.nonce, 'code');
  assert.equal(f.values.get(f.storageKey), f.currentSession);
  assert.deepEqual(f.writes, []);
});

test('email edits retain callback-compatible PKCE state but never persist their private session', async () => {
  const f = fixture();
  const result = await f.mutate(
    f.session,
    { email: 'edited@example.test' },
    {
      emailRedirectTo: 'qurantracker://auth',
    },
  );
  assert.equal(result.error, null);
  const request = f.requests[0]!;
  const callback = new URL(request.url.searchParams.get('redirect_to')!);
  const flowId = callback.searchParams.get('sb_flow_id');
  assert.ok(flowId);
  assert.equal(callback.protocol, 'qurantracker:');
  assert.equal(typeof request.body.code_challenge, 'string');
  assert.ok(String(request.body.code_challenge).length >= 43);
  assert.ok(f.values.get(`${f.storageKey}-flow-${flowId}-code-verifier`));
  assert.ok(
    f.writes.every((key) => key.startsWith(`${f.storageKey}-`) && key.endsWith('-code-verifier')),
  );
  assert.equal(f.values.get(f.storageKey), f.currentSession);
});

test('rejected email edits remove their PKCE verifier and preserve the current account', async () => {
  const f = fixture();
  f.status(422);
  const result = await f.mutate(f.session, { email: 'edited@example.test' });
  assert.ok(result.error);
  assert.equal(f.values.get(f.storageKey), f.currentSession);
  assert.equal(
    [...f.values.keys()].some((key) => key.includes('-flow-')),
    false,
  );
});

test('an expired captured account cannot rotate refresh tokens or send a mutation', async () => {
  const f = fixture();
  const unrelatedVerifier = `${f.storageKey}-code-verifier`;
  f.values.set(unrelatedVerifier, 'pending-google-sign-in');
  f.session.expires_at = Math.floor(Date.now() / 1000) - 1;
  const result = await f.mutate(f.session, { password: 'new-password-for-original' });
  assert.match(result.error?.message ?? '', /Account session expired/);
  assert.deepEqual(f.requests, []);
  assert.equal(f.values.get(f.storageKey), f.currentSession);
  assert.equal(f.values.get(unrelatedVerifier), 'pending-google-sign-in');
});
