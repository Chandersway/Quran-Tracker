import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteAppleAccount } from '../src/services/auth/appleAccountDeletion';
import { createAuthService } from '../src/services/auth/auth';
import type { AppleOAuth } from '../src/services/auth/appleIdentity';
import {
  AppleDeletionError,
  createAppleDeletionHandler,
  type AppleDeletionPorts,
} from '../../supabase/functions/apple-account-delete/handler';

function serverFixture() {
  const calls: string[] = [];
  const ports: AppleDeletionPorts = {
    configured: () => true,
    actor: async () => {
      calls.push('actor');
      return { id: 'actor-a', email: 'a@example.test', appleSubjects: ['apple-a'] };
    },
    preflight: async (bearer) => {
      calls.push(`preflight:${bearer}`);
      return 'ready';
    },
    verifyIdentity: async (token) => {
      calls.push(`verify:${token}`);
      return { subject: 'apple-a' };
    },
    exchangeCode: async () => {
      calls.push('exchange');
      return { identityToken: 'exchanged-token', refreshToken: 'private-refresh' };
    },
    authenticate: async () => {
      calls.push('authenticate');
      return { id: 'actor-a', bearer: 'fresh-session' };
    },
    revoke: async () => {
      calls.push('revoke');
    },
    deleteAccount: async (bearer, email) => {
      calls.push(`delete:${bearer}:${email}`);
    },
    closeSession: async (bearer) => {
      calls.push(`close:${bearer}`);
    },
  };
  const body = {
    accountId: 'actor-a',
    confirmationEmail: ' a@example.test ',
    identityToken: 'native-identity-token',
    authorizationCode: 'fresh-code',
    nonce: 'ab'.repeat(32),
  };
  const handler = createAppleDeletionHandler(ports);
  const run = (patch = {}, authorization = 'Bearer active-session') =>
    handler(
      new Request('https://test.invalid', {
        method: 'POST',
        headers: { Authorization: authorization },
        body: JSON.stringify({ ...body, ...patch }),
      }),
    );
  return { ports, body, calls, handler, run };
}

test('Apple deletion verifies both identities, checks dependencies, revokes then runs existing guarded RPC as same actor', async () => {
  const f = serverFixture();
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { deleted: true, accountId: 'actor-a' });
  assert.deepEqual(f.calls, [
    'actor',
    'verify:native-identity-token',
    'preflight:active-session',
    'exchange',
    'verify:exchanged-token',
    'authenticate',
    'revoke',
    'delete:fresh-session:a@example.test',
    'close:fresh-session',
  ]);
});

test('missing auth, wrong account/email and malformed nonce cannot reach Apple or delete anything', async () => {
  for (const patch of [
    { accountId: 'actor-b' },
    { confirmationEmail: 'b@example.test' },
    { nonce: 'short' },
    { authorizationCode: '' },
  ]) {
    const f = serverFixture();
    assert.equal((await f.run(patch)).status, 400);
    assert.deepEqual(f.calls, ['actor']);
  }
  const f = serverFixture();
  assert.equal((await f.run({}, '')).status, 401);
  assert.deepEqual(f.calls, []);
  assert.equal((await f.handler(new Request('https://test.invalid'))).status, 405);
});

test('disabled configuration, invalid JWT and wrong Apple identity fail closed before revocation', async () => {
  const unconfigured = serverFixture();
  unconfigured.ports.configured = () => false;
  assert.equal((await unconfigured.run()).status, 503);
  assert.deepEqual(unconfigured.calls, ['actor']);
  const invalid = serverFixture();
  invalid.ports.verifyIdentity = async () => {
    throw new AppleDeletionError('APPLE_DELETE_IDENTITY_MISMATCH', 403);
  };
  assert.equal((await invalid.run()).status, 403);
  assert.equal(invalid.calls.includes('exchange'), false);
  const other = serverFixture();
  other.ports.verifyIdentity = async () => ({ subject: 'apple-b' });
  assert.equal((await other.run()).status, 403);
  assert.equal(other.calls.includes('exchange'), false);
});

test('group ownership and restrictive dependencies are checked before exchanging or revoking Apple grants', async () => {
  for (const status of ['owns_groups', 'linked_data']) {
    const f = serverFixture();
    f.ports.preflight = async () => status;
    const result = await f.run();
    assert.equal(result.status, 409);
    assert.deepEqual(await result.json(), { code: status });
    assert.equal(f.calls.includes('exchange'), false);
  }
});

test('a code for a different Apple subject and Supabase actor changes cannot revoke or delete another account', async () => {
  const wrongCode = serverFixture();
  wrongCode.ports.verifyIdentity = async (token) => ({
    subject: token === 'exchanged-token' ? 'apple-b' : 'apple-a',
  });
  assert.equal((await wrongCode.run()).status, 403);
  assert.equal(wrongCode.calls.includes('authenticate'), false);
  const changed = serverFixture();
  changed.ports.authenticate = async () => ({ id: 'actor-b', bearer: 'wrong-actor-session' });
  assert.equal((await changed.run()).status, 403);
  assert.equal(changed.calls.includes('revoke'), false);
  assert.equal(changed.calls.at(-1), 'close:wrong-actor-session');
});

test('provider failures never delete; a later SQL dependency rejection is reported and temporary sessions close', async () => {
  const rejected = serverFixture();
  rejected.ports.revoke = async () => {
    throw new AppleDeletionError('APPLE_REVOKE_FAILED', 502);
  };
  assert.equal((await rejected.run()).status, 502);
  assert.equal(
    rejected.calls.some((value) => value.startsWith('delete:')),
    false,
  );
  assert.equal(rejected.calls.at(-1), 'close:fresh-session');
  const race = serverFixture();
  race.ports.deleteAccount = async () => {
    throw new AppleDeletionError('linked_data', 409);
  };
  const response = await race.run();
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { code: 'linked_data' });
  assert.equal(race.calls.at(-1), 'close:fresh-session');
});

test('unexpected provider errors never echo secrets to the caller', async () => {
  const f = serverFixture();
  f.ports.exchangeCode = async () => {
    throw new Error('private-token-and-secret');
  };
  const response = await f.run();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: 'APPLE_DELETE_UNAVAILABLE' });
  assert.equal(f.calls.includes('revoke'), false);
});

function clientFixture() {
  const calls: unknown[] = [];
  let actor = 'actor-a';
  const user = {
    id: 'actor-a',
    email: 'a@example.test',
    app_metadata: { provider: 'apple' },
    user_metadata: {},
    identities: [{ provider: 'apple', identity_data: { sub: 'apple-a' } }],
  };
  let rpcError: unknown = null;
  let functionError: unknown = null;
  let credential: Awaited<ReturnType<AppleOAuth['signIn']>> = {
    identityToken: 'private-native-token',
    nonce: 'ab'.repeat(32),
    authorizationCode: 'private-code',
    firstSignInName: null,
  };
  const apple: AppleOAuth = {
    isAvailable: async () => true,
    signIn: async () => {
      calls.push('prompt');
      return credential;
    },
  };
  const client = {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({
        data: { session: { user: { ...user, id: actor }, access_token: `session-${actor}` } },
        error: null,
      }),
      signOut: async () => {
        calls.push('signOut');
        return { error: null };
      },
    },
    rpc: (name: string, payload: unknown) => ({
      setHeader: async (header: string, value: string) => {
        calls.push([name, payload, header, value]);
        return { data: name === 'account_deletion_status_v1' ? 'ready' : null, error: rpcError };
      },
    }),
    functions: {
      invoke: async (name: string, options: unknown) => {
        calls.push([name, options]);
        return { data: { deleted: true, accountId: 'actor-a' }, error: functionError };
      },
    },
  } as unknown as SupabaseClient;
  return {
    client,
    apple,
    calls,
    user,
    setActor: (id: string) => {
      actor = id;
    },
    setCredential: (value: typeof credential) => {
      credential = value;
    },
    rpcError: (value: unknown) => {
      rpcError = value;
    },
    functionError: (value: unknown) => {
      functionError = value;
    },
  };
}

test('native deletion binds the server request to the captured Supabase actor and never invokes the direct deletion RPC', async () => {
  const f = clientFixture();
  assert.deepEqual(await deleteAppleAccount(f.client, f.apple, 'actor-a', ' a@example.test '), {
    manualAppleRevocation: false,
  });
  const request = f.calls.find(
    (value) => Array.isArray(value) && value[0] === 'apple-account-delete',
  ) as [string, { headers: unknown; body: Record<string, string> }];
  assert.deepEqual(request[1].headers, { Authorization: 'Bearer session-actor-a' });
  assert.equal(request[1].body.accountId, 'actor-a');
  assert.equal(request[1].body.authorizationCode, 'private-code');
  assert.equal(
    f.calls.some((value) => Array.isArray(value) && value[0] === 'delete_my_account_v1'),
    false,
  );
});

test('only unavailable native credentials use the guarded SQL deletion with explicit manual revocation result', async () => {
  for (const unavailable of [true, false]) {
    const f = clientFixture();
    if (unavailable) f.apple.isAvailable = async () => false;
    else
      f.setCredential({
        identityToken: 'token',
        nonce: 'ab'.repeat(32),
        authorizationCode: null,
        providerUserId: 'apple-a',
        firstSignInName: null,
      });
    assert.deepEqual(await deleteAppleAccount(f.client, f.apple, 'actor-a', 'a@example.test'), {
      manualAppleRevocation: true,
    });
    assert.ok(
      f.calls.some(
        (value) =>
          Array.isArray(value) &&
          value[0] === 'delete_my_account_v1' &&
          value[3] === 'Bearer session-actor-a',
      ),
    );
    assert.equal(
      f.calls.some((value) => Array.isArray(value) && value[0] === 'apple-account-delete'),
      false,
    );
  }
});

test('cancellation, native validation failure, actor switches, server errors and recent-login rejection never silently bypass revocation', async () => {
  const canceled = clientFixture();
  canceled.setCredential(null);
  await assert.rejects(
    deleteAppleAccount(canceled.client, canceled.apple, 'actor-a', 'a@example.test'),
    /APPLE_REQUEST_CANCELED/,
  );
  const mismatch = clientFixture();
  mismatch.apple.signIn = async () => {
    throw new Error('APPLE_STATE_MISMATCH');
  };
  await assert.rejects(
    deleteAppleAccount(mismatch.client, mismatch.apple, 'actor-a', 'a@example.test'),
    /APPLE_STATE_MISMATCH/,
  );
  const switched = clientFixture();
  switched.apple.signIn = async () => {
    switched.setActor('actor-b');
    return {
      identityToken: 'token',
      nonce: 'ab'.repeat(32),
      authorizationCode: 'code',
      firstSignInName: null,
    };
  };
  await assert.rejects(
    deleteAppleAccount(switched.client, switched.apple, 'actor-a', 'a@example.test'),
    /Account identity changed/,
  );
  const failed = clientFixture();
  failed.functionError({ context: Response.json({ code: 'APPLE_DELETE_NOT_CONFIGURED' }) });
  await assert.rejects(
    deleteAppleAccount(failed.client, failed.apple, 'actor-a', 'a@example.test'),
    /APPLE_DELETE_NOT_CONFIGURED/,
  );
  const noCodeOtherApple = clientFixture();
  noCodeOtherApple.setCredential({
    identityToken: 'token-b',
    nonce: 'ab'.repeat(32),
    authorizationCode: null,
    providerUserId: 'apple-b',
    firstSignInName: null,
  });
  await assert.rejects(
    deleteAppleAccount(
      noCodeOtherApple.client,
      noCodeOtherApple.apple,
      'actor-a',
      'a@example.test',
    ),
    /APPLE_DELETE_IDENTITY_MISMATCH/,
  );
  for (const f of [canceled, mismatch, switched, failed, noCodeOtherApple])
    assert.equal(
      f.calls.some((value) => Array.isArray(value) && value[0] === 'delete_my_account_v1'),
      false,
    );
  const old = clientFixture();
  old.apple.isAvailable = async () => false;
  old.rpcError(new Error('recent_login_required'));
  await assert.rejects(
    deleteAppleAccount(old.client, old.apple, 'actor-a', 'a@example.test'),
    /recent_login_required/,
  );
});

test('successful Apple deletion clears only that profile and preserves an account switched during push cleanup', async () => {
  const f = clientFixture();
  const auth = createAuthService(
    f.client,
    'https://test.invalid',
    async () => {
      f.calls.push('revokePush');
      f.setActor('actor-b');
    },
    async (id) => {
      f.calls.push(`clear:${id}`);
    },
    f.apple,
  );
  assert.deepEqual(await auth.deleteOwnAccount('a@example.test'), { manualAppleRevocation: false });
  assert.ok(f.calls.includes('clear:actor-a'));
  assert.ok(f.calls.includes('revokePush'));
  assert.equal(f.calls.includes('signOut'), false);
});
