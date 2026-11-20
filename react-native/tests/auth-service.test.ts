import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService } from '../src/services/auth/auth';
import type { AuthSession } from '../src/services/auth/types';

function fixture(withProfileCleanup = false) {
  const calls: unknown[] = [];
  const user: {
    id: string;
    email: string;
    app_metadata: Record<string, unknown>;
    user_metadata: Record<string, unknown>;
  } = {
    id: 'reader',
    email: 'reader@example.test',
    app_metadata: { provider: 'Google' },
    user_metadata: { full_name: 'Reader name', picture: 'profile-photo' },
  };
  const session = { user, access_token: 'private-access', refresh_token: 'private-refresh' };
  let result = {
    data: {
      session: session as typeof session | null,
      redirectType: undefined as string | undefined,
    },
    error: null as unknown,
  };
  let authEvent: ((event: string, value: typeof session | null) => void) | undefined;
  let signedInId = user.id;
  let rpcError: unknown = null;
  const client = {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
      signInWithPassword: async (payload: unknown) => {
        calls.push(['verifyPassword', payload]);
        return { data: { user: { ...user, id: signedInId } }, error: null };
      },
      updateUser: async (payload: unknown) => {
        calls.push(['updateUser', payload]);
        return { error: null };
      },
      signOut: async () => {
        calls.push('signOut');
        return { error: null };
      },
      verifyOtp: async (payload: unknown) => {
        calls.push(['otp', payload]);
        return result;
      },
      exchangeCodeForSession: async (code: string, options: unknown) => {
        calls.push(['code', code, options]);
        return result;
      },
      setSession: async (payload: unknown) => {
        calls.push(['session', payload]);
        return result;
      },
      onAuthStateChange: (listener: typeof authEvent) => {
        authEvent = listener;
        return { data: { subscription: { unsubscribe: () => calls.push('unsubscribe') } } };
      },
      startAutoRefresh: () => calls.push('startRefresh'),
      stopAutoRefresh: () => calls.push('stopRefresh'),
    },
    rpc: async (name: string, params: unknown) => {
      calls.push([name, params]);
      return { data: 'ready', error: rpcError };
    },
  };
  const auth = createAuthService(
    client as unknown as SupabaseClient,
    'https://project.test',
    async () => {
      calls.push('revokePush');
    },
    withProfileCleanup
      ? async (accountId) => {
          calls.push(['clearProfileCache', accountId]);
        }
      : undefined,
    undefined,
    async (_session, attributes) => {
      await client.auth.updateUser(attributes);
      return { data: { user: { ...user, aud: 'authenticated', created_at: '' } }, error: null };
    },
  );
  return {
    auth,
    calls,
    user,
    session,
    emit: (event: string) => authEvent?.(event, event === 'SIGNED_OUT' ? null : session),
    result: (value: typeof result) => {
      result = value;
    },
    signedInId: (value: string) => {
      signedInId = value;
    },
    rpcError: (value: unknown) => {
      rpcError = value;
    },
  };
}

test('auth callers receive provider-neutral identity without session credentials or SDK metadata', async () => {
  const f = fixture();
  const expected = {
    user: {
      id: 'reader',
      email: 'reader@example.test',
      provider: 'google',
      displayName: 'Reader name',
      avatarUrl: 'profile-photo',
    },
  };
  assert.deepEqual(await f.auth.getSession(), expected);
  assert.deepEqual(await f.auth.getUser(), expected.user);
  let changed: AuthSession | null = null;
  const stop = f.auth.onChange((value) => {
    changed = value;
  });
  f.emit('SIGNED_IN');
  assert.deepEqual(changed, expected);
  f.emit('SIGNED_OUT');
  assert.equal(changed, null);
  stop();
  assert.deepEqual(f.calls, ['unsubscribe']);
});

test('auth identity preserves display-name and avatar metadata precedence and email fallback', async () => {
  const f = fixture();
  f.user.user_metadata = {
    display_name: 'Display',
    full_name: 'Full',
    name: 'Name',
    avatar_url: 'avatar',
    picture: 'picture',
  };
  assert.equal((await f.auth.getUser())!.displayName, 'Display');
  assert.equal((await f.auth.getUser())!.avatarUrl, 'avatar');
  f.user.user_metadata = { name: 'Name', picture: 'picture' };
  assert.equal((await f.auth.getUser())!.displayName, 'Name');
  assert.equal((await f.auth.getUser())!.avatarUrl, 'picture');
  f.user.user_metadata = {};
  f.user.app_metadata = {};
  assert.deepEqual(await f.auth.getUser(), {
    id: 'reader',
    email: 'reader@example.test',
    provider: 'email',
    displayName: 'reader',
    avatarUrl: null,
  });
});

test('callback adapter preserves PKCE flow identity and trusts verified recovery result', async () => {
  const f = fixture();
  assert.deepEqual(
    await f.auth.completeCallback({
      kind: 'code',
      code: 'server-code',
      flowId: 'flow_12345',
      recovery: true,
    }),
    { recovery: false },
  );
  assert.deepEqual(f.calls[0], ['code', 'server-code', { flowId: 'flow_12345' }]);
  f.result({ data: { session: f.session, redirectType: 'recovery' }, error: null });
  assert.deepEqual(
    await f.auth.completeCallback({ kind: 'code', code: 'server-code', recovery: false }),
    { recovery: true },
  );
  assert.deepEqual(
    await f.auth.completeCallback({
      kind: 'otp',
      tokenHash: 'hash',
      type: 'recovery',
      recovery: true,
    }),
    { recovery: true },
  );
  assert.deepEqual(f.calls[2], ['otp', { token_hash: 'hash', type: 'recovery' }]);
  assert.deepEqual(
    await f.auth.completeCallback({
      kind: 'session',
      accessToken: 'access',
      refreshToken: 'refresh',
      recovery: false,
    }),
    { recovery: false },
  );
  assert.deepEqual(f.calls[3], ['session', { access_token: 'access', refresh_token: 'refresh' }]);
  f.result({
    data: { session: f.session, redirectType: 'recovery' },
    error: { message: 'denied' },
  });
  await assert.rejects(
    f.auth.completeCallback({ kind: 'code', code: 'bad', recovery: true }),
    /Authentication failed/,
  );
  f.result({ data: { session: null, redirectType: 'recovery' }, error: null });
  await assert.rejects(
    f.auth.completeCallback({ kind: 'code', code: 'missing-session', recovery: true }),
    /Authentication failed/,
  );
});

test('native refresh and lifecycle events remain explicit and unsubscribe cleanly', () => {
  const f = fixture();
  const events: string[] = [];
  const stop = f.auth.onLifecycle((event) => events.push(event));
  f.emit('SIGNED_IN');
  f.emit('PASSWORD_RECOVERY');
  f.emit('SIGNED_OUT');
  f.auth.setRefreshActive(true);
  f.auth.setRefreshActive(false);
  stop();
  assert.deepEqual(events, ['recovery', 'signedOut']);
  assert.deepEqual(f.calls, ['startRefresh', 'stopRefresh', 'unsubscribe']);
});

test('password changes retain length and current-account verification before updating', async () => {
  const f = fixture();
  await assert.rejects(f.auth.updateUserPassword('short', 'current'), /12 to 128/);
  assert.deepEqual(f.calls, []);
  await f.auth.updateUserPassword('new-long-password', 'current', ' code ');
  assert.deepEqual(f.calls, [
    ['verifyPassword', { email: 'reader@example.test', password: 'current' }],
    ['updateUser', { password: 'new-long-password', nonce: 'code' }],
  ]);
  f.signedInId('different-account');
  await assert.rejects(
    f.auth.updateUserPassword('new-long-password', 'current'),
    /Account identity changed/,
  );
  assert.equal(f.calls.length, 3);
});

test('sign-out revokes push recipient first; deletion confirms email before remote work', async () => {
  const f = fixture();
  await f.auth.signOut();
  assert.deepEqual(f.calls, ['revokePush', 'signOut']);
  await assert.rejects(f.auth.deleteOwnAccount('someone@example.test'), /does not match/);
  assert.equal(f.calls.length, 2);
  await f.auth.deleteOwnAccount(' READER@example.test ');
  assert.deepEqual(f.calls.slice(2), [
    ['delete_my_account_v1', { confirmation_email: 'READER@example.test' }],
    'revokePush',
    'signOut',
  ]);
});

test('only successful account deletion clears the local profile; sign-out and rejected deletion retain it', async () => {
  const f = fixture(true);
  await f.auth.signOut();
  assert.deepEqual(f.calls, ['revokePush', 'signOut']);
  f.rpcError({ message: 'owns_groups' });
  await assert.rejects(f.auth.deleteOwnAccount(f.user.email), /owns_groups/);
  assert.equal(
    f.calls.some((value) => Array.isArray(value) && value[0] === 'clearProfileCache'),
    false,
  );
  f.rpcError(null);
  await f.auth.deleteOwnAccount(f.user.email);
  assert.deepEqual(f.calls.slice(-4), [
    ['delete_my_account_v1', { confirmation_email: f.user.email }],
    ['clearProfileCache', 'reader'],
    'revokePush',
    'signOut',
  ]);
});
