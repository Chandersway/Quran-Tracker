import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService } from '../src/services/auth/auth';

test('confirmation resend uses signup API and app callback, propagating rejection', async () => {
  const calls: unknown[] = [];
  const rejected = { code: 'over_email_send_rate_limit' };
  let reject = false;
  const client = {
    auth: {
      resend: async (payload: unknown) => {
        calls.push(payload);
        return { error: reject ? rejected : null };
      },
      signUp: async (payload: unknown) => {
        calls.push(payload);
        return { data: { user: null }, error: null };
      },
    },
  };
  const auth = createAuthService(
    client as unknown as SupabaseClient,
    'https://project.test',
    async () => undefined,
  );
  assert.equal(calls.length, 0);
  await auth.resendSignUpConfirmation(' reader@example.test ');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
    type: 'signup',
    email: 'reader@example.test',
    options: { emailRedirectTo: 'qurantracker://auth' },
  });
  reject = true;
  await assert.rejects(
    auth.resendSignUpConfirmation('reader@example.test'),
    (error) => error === rejected,
  );
  await auth.signUp('reader@example.test', 'fixture-password', 'Reader');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2])), {
    email: 'reader@example.test',
    password: 'fixture-password',
    options: { data: { display_name: 'Reader' }, emailRedirectTo: 'qurantracker://auth' },
  });
});
