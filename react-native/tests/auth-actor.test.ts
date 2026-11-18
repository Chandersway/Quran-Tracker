import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService } from '../src/services/auth/auth';

function switchedAccount() {
  const first = {
    id: 'original-reader',
    email: 'original@example.test',
    app_metadata: { provider: 'email' },
    user_metadata: {},
  };
  const second = { ...first, id: 'next-reader', email: 'next@example.test' };
  let current = first;
  const mutations: string[] = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: current }, error: null }),
      getSession: async () => ({
        data: { session: { user: current, access_token: `${current.id}-token` } },
        error: null,
      }),
      signInWithPassword: async () => {
        // Another sign-in callback can finish between verification and the
        // caller's later updateUser invocation. The verification still belongs to A.
        queueMicrotask(() => {
          current = second;
        });
        return { data: { user: first }, error: null };
      },
      updateUser: async () => {
        // The real SDK awaits initialization before rereading the active session.
        current = second;
        mutations.push(current.id);
        return { data: { user: current }, error: null };
      },
    },
  };
  return {
    auth: createAuthService(
      client as unknown as SupabaseClient,
      'https://example.supabase.co',
      async () => undefined,
      undefined,
      undefined,
      async (session) => {
        mutations.push(session.user.id);
        return { data: { user: session.user }, error: null };
      },
    ),
    mutations,
  };
}

test('password verification for a previous account cannot update the next account', async () => {
  const { auth, mutations } = switchedAccount();
  await assert.rejects(
    auth.updateUserPassword('new-password-for-original', 'original-password'),
    /identity|account|session/i,
  );
  assert.deepEqual(mutations, []);
});

test('email verification for a previous account cannot update the next account', async () => {
  const { auth, mutations } = switchedAccount();
  await assert.rejects(
    auth.updateUserEmail('edited-original@example.test', 'original-password'),
    /identity|account|session/i,
  );
  assert.deepEqual(mutations, []);
});

test('password recovery also uses the captured account instead of a later SDK session', async () => {
  const { auth, mutations } = switchedAccount();
  await auth.completePasswordRecovery('new-password-for-original');
  assert.deepEqual(mutations, ['original-reader']);
});
