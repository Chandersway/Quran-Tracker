import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  AUTH_REDIRECT_URL,
  parseAuthCallback,
  trustedGoogleOAuthUrl,
  verifiedAuthRecovery,
} from '../src/services/auth/authCallback';
import { googleOAuthUrl } from '../src/services/auth/googleOAuth';

test('auth callbacks accept only exact authority and no credentials, port or path', () => {
  assert.deepEqual(parseAuthCallback('https://example.test/?code=a'), { kind: 'ignored' });
  for (const raw of [
    'qurantracker://auth:443?code=a',
    'qurantracker://person@auth?code=a',
    'qurantracker://auth/?code=a',
    'qurantracker://auth/../?code=a',
    'qurantracker://auth/%2f?code=a',
    'qurantracker://auth?code=a\n',
  ])
    assert.equal(parseAuthCallback(raw).kind, 'invalid');
  assert.deepEqual(parseAuthCallback(`${AUTH_REDIRECT_URL}?code=valid&sb_flow_id=flow_12345`), {
    kind: 'code',
    code: 'valid',
    flowId: 'flow_12345',
    recovery: false,
  });
});

test('duplicate, encoded duplicate and conflicting callback credentials are rejected', () => {
  for (const suffix of [
    'code=a&code=b',
    'code=a#code=b',
    'code=a&%63ode=b',
    'code=a&token_hash=b&type=signup',
    'access_token=a',
    'refresh_token=a',
    'code=',
    'code=a&sb_flow_id=../../oops',
    'token_hash=a&type=sms',
    'error=denied&code=a',
    'code=a&state=%00',
  ])
    assert.equal(parseAuthCallback(`${AUTH_REDIRECT_URL}?${suffix}`).kind, 'invalid', suffix);
});

test('recovery is a successful credential candidate, never an error response', () => {
  assert.deepEqual(
    parseAuthCallback(
      `${AUTH_REDIRECT_URL}#access_token=access&refresh_token=refresh&type=recovery`,
    ),
    { kind: 'session', accessToken: 'access', refreshToken: 'refresh', recovery: true },
  );
  assert.deepEqual(parseAuthCallback(`${AUTH_REDIRECT_URL}?token_hash=hash&type=recovery`), {
    kind: 'otp',
    tokenHash: 'hash',
    type: 'recovery',
    recovery: true,
  });
  assert.deepEqual(
    parseAuthCallback(
      `${AUTH_REDIRECT_URL}?error=access_denied&error_description=private&type=recovery`,
    ),
    { kind: 'failure' },
  );
});

test('real Supabase OAuth builds S256 challenge from persisted verifier without network', async () => {
  const values = new Map<string, string>();
  let networkCalls = 0;
  const client = createClient('https://project.supabase.co', 'public-test-key', {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          values.set(key, value);
        },
        removeItem: (key) => {
          values.delete(key);
        },
      },
    },
    global: {
      fetch: async () => {
        networkCalls++;
        throw new Error('Network forbidden in contract test');
      },
    },
  });
  const url = new URL(await googleOAuthUrl(client.auth, 'https://project.supabase.co'));
  assert.equal(url.pathname, '/auth/v1/authorize');
  assert.equal(url.searchParams.get('provider'), 'google');
  assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  const redirect = new URL(url.searchParams.get('redirect_to')!);
  assert.equal(`${redirect.protocol}//${redirect.host}${redirect.pathname}`, AUTH_REDIRECT_URL);
  const flowId = redirect.searchParams.get('sb_flow_id');
  const stored = [...values].find(([key]) =>
    flowId
      ? key.includes(`-flow-${flowId}-code-verifier`)
      : key.endsWith('-code-verifier') &&
        !key.includes('-flow-') &&
        !key.endsWith('-flows-code-verifier'),
  );
  assert.ok(stored);
  const verifier = JSON.parse(stored[1]) as string;
  assert.match(verifier, /^[A-Za-z0-9._~-]{43,128}$/);
  assert.equal(
    url.searchParams.get('code_challenge'),
    createHash('sha256').update(verifier).digest('base64url'),
  );
  assert.equal(networkCalls, 0);
  assert.equal(
    parseAuthCallback(`${redirect.toString()}${redirect.search ? '&' : '?'}code=server-code`).kind,
    'code',
  );
  await client.auth.stopAutoRefresh();
});

test('OAuth launch rejects alternate authorities, implicit/plain flows and duplicate redirects', () => {
  const valid = `https://project.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(AUTH_REDIRECT_URL)}&code_challenge=${'A'.repeat(43)}&code_challenge_method=s256`;
  assert.equal(trustedGoogleOAuthUrl(valid, 'https://project.supabase.co'), valid);
  for (const raw of [
    valid.replace('project.supabase.co', 'attacker.test'),
    valid.replace('s256', 'plain'),
    valid.replace('/authorize?', '/authorize/extra?'),
    `${valid}&redirect_to=${encodeURIComponent(AUTH_REDIRECT_URL)}`,
    valid.replace(
      encodeURIComponent(AUTH_REDIRECT_URL),
      encodeURIComponent('qurantracker://auth/other'),
    ),
  ])
    assert.throws(() => trustedGoogleOAuthUrl(raw, 'https://project.supabase.co'));
});

test('PKCE recovery trusts the secure verifier result and ignores callback type metadata', () => {
  const forgedMetadata = parseAuthCallback('qurantracker://auth?code=oauth-code&type=recovery');
  assert.equal(verifiedAuthRecovery(forgedMetadata, null), false);
  assert.equal(verifiedAuthRecovery(forgedMetadata, undefined), false);
  assert.equal(verifiedAuthRecovery(forgedMetadata, 'signup'), false);
  const genuineRecovery = parseAuthCallback('qurantracker://auth?code=recovery-code');
  assert.equal(verifiedAuthRecovery(genuineRecovery, 'recovery'), true);
  assert.equal(verifiedAuthRecovery({ kind: 'failure' }, 'recovery'), false);
  assert.equal(
    verifiedAuthRecovery(parseAuthCallback('qurantracker://auth?token_hash=hash&type=recovery')),
    true,
  );
});
