import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService } from '../src/services/auth/auth';
import type { AppleOAuth } from '../src/services/auth/appleIdentity';

function fixture() {
  let notify: (() => void) | undefined;
  let actor = 'actor-a';
  let provider = 'apple';
  let revoked = true;
  const calls: string[] = [];
  const apple: AppleOAuth = {
    isAvailable: async () => true,
    signIn: async () => null,
    watchRevocation: (callback) => {
      notify = callback;
      calls.push('listen');
      return () => calls.push('unlisten');
    },
    isCredentialRevoked: async (subject) => {
      calls.push(`state:${subject}`);
      return revoked;
    },
  };
  const client = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: actor,
            app_metadata: { provider },
            identities: [{ provider: 'apple', identity_data: { sub: 'apple-subject-a' } }],
          },
        },
        error: null,
      }),
      getSession: async () => ({ data: { session: { user: { id: actor } } }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => calls.push('unsubscribe') } },
      }),
      signOut: async () => {
        calls.push('signOut');
        return { error: null };
      },
    },
  } as unknown as SupabaseClient;
  let cleanup = async () => {
    calls.push('pushCleanup');
  };
  const auth = createAuthService(client, 'https://test.invalid', () => cleanup(), undefined, apple);
  return {
    auth,
    apple,
    calls,
    emit: () => notify?.(),
    provider: (value: string) => {
      provider = value;
    },
    revoked: (value: boolean) => {
      revoked = value;
    },
    cleanup: (value: () => Promise<void>) => {
      cleanup = value;
    },
    actor: (value: string) => {
      actor = value;
    },
  };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('native Apple revocation checks the authenticated provider subject and signs out only that current actor', async () => {
  const f = fixture();
  const stop = f.auth.onChange(() => undefined);
  f.emit();
  await settle();
  assert.deepEqual(f.calls, ['listen', 'state:apple-subject-a', 'pushCleanup', 'signOut']);
  stop();
  stop();
  assert.deepEqual(f.calls.slice(-2), ['unsubscribe', 'unlisten']);
});

test('authorized, unavailable and non-Apple credentials never force a sign-out', async () => {
  const authorized = fixture();
  authorized.revoked(false);
  const stopA = authorized.auth.onChange(() => undefined);
  authorized.emit();
  await settle();
  stopA();
  assert.equal(authorized.calls.includes('signOut'), false);
  const unavailable = fixture();
  unavailable.apple.isCredentialRevoked = async () => {
    throw new Error('simulator');
  };
  const stopU = unavailable.auth.onChange(() => undefined);
  unavailable.emit();
  await settle();
  stopU();
  assert.equal(unavailable.calls.includes('signOut'), false);
  const google = fixture();
  google.provider('google');
  const stopG = google.auth.onChange(() => undefined);
  google.emit();
  await settle();
  stopG();
  assert.equal(
    google.calls.some((call) => call.startsWith('state:')),
    false,
  );
});

test('an account switch during Apple credential checking or push cleanup preserves the new account', async () => {
  for (const duringCleanup of [false, true]) {
    const f = fixture();
    if (duringCleanup)
      f.cleanup(async () => {
        f.actor('actor-b');
      });
    else
      f.apple.isCredentialRevoked = async () => {
        f.actor('actor-b');
        return true;
      };
    const stop = f.auth.onChange(() => undefined);
    f.emit();
    await settle();
    stop();
    assert.equal(f.calls.includes('signOut'), false);
  }
});
