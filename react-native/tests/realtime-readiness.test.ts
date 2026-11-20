import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertLocalQaScope } from '../scripts/local-backend-qa/scope.mjs';
import {
  publicRealtimeConfig,
  probeRealtimeTable,
  redactRealtimeError,
} from '../scripts/check-realtime-readiness.mjs';

const anonKey = (role: string) =>
  'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify({ role })).toString('base64url') +
  '.signature';

test('readiness refuses privileged keys and unintended endpoints before connecting', () => {
  const env = {
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey('anon'),
  };
  assert.equal(publicRealtimeConfig(env).url, env.EXPO_PUBLIC_SUPABASE_URL);
  for (const key of [anonKey('service_role'), anonKey('authenticated'), 'sb_secret_secret', 'bad'])
    assert.throws(() => publicRealtimeConfig({ ...env, EXPO_PUBLIC_SUPABASE_ANON_KEY: key }));
  for (const url of [
    'https://example.supabase.co.evil.test',
    'https://user:secret@example.supabase.co',
    'https://example.supabase.co/rest/v1',
    'http://127.0.0.1:55431',
  ])
    assert.throws(() => publicRealtimeConfig({ ...env, EXPO_PUBLIC_SUPABASE_URL: url }));
  assert.equal(
    publicRealtimeConfig({ ...env, EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55431' }, true).url,
    'http://127.0.0.1:55431',
  );
});

test('readiness never exposes credentials from a connection error', () => {
  const token = anonKey('anon');
  const result = redactRealtimeError(
    new Error(
      `CHANNEL_ERROR https://example.supabase.co?apikey=${token} Bearer secret sb_secret_xyz`,
    ),
    [token, 'secret'],
  );
  assert.ok(!result.includes(token));
  assert.ok(!result.includes('secret'));
  assert.ok(!result.includes('https://'));
});

test('readiness checks only INSERT/UPDATE for a nonexistent group and always closes', async () => {
  const events: Array<Record<string, unknown>> = [];
  let closed = false;
  const channel = {
    on(_type: string, filter: Record<string, unknown>) {
      events.push(filter);
    },
    subscribe(callback: (state: string, error?: Error) => void) {
      callback('CHANNEL_ERROR', new Error('RealtimeDisabledForConfiguration'));
    },
  };
  const client = {
    channel(_name: string, config: unknown) {
      assert.deepEqual(config, { config: { postgres_changes_options: { wait: true } } });
      return channel;
    },
    async removeChannel(value: unknown) {
      assert.equal(value, channel);
      closed = true;
    },
  };
  const result = await probeRealtimeTable(client, 'group_posts');
  assert.equal(result.state, 'CHANNEL_ERROR');
  assert.equal(result.payloadCount, 0);
  assert.equal(closed, true);
  assert.deepEqual(
    events.map((event) => event.event),
    ['INSERT', 'UPDATE'],
  );
  assert.ok(
    events.every((event) => event.filter === 'group_id=eq.00000000-0000-0000-0000-000000000000'),
  );
});

test('QA scope accepts a newly prepared checkout but rejects mismatched or remote metadata', () => {
  const metadata = { projectId: 'qurantracker-qa-1234567890', apiOrigin: 'http://127.0.0.1:55431' };
  const config = `project_id = "${metadata.projectId}"\n[api]\nport = 55431\n`;
  assert.doesNotThrow(() => assertLocalQaScope(metadata, config));
  assert.throws(() => assertLocalQaScope({ ...metadata, projectId: 'other-project' }, config));
  assert.throws(() =>
    assertLocalQaScope({ ...metadata, apiOrigin: 'https://example.supabase.co' }, config),
  );
  assert.throws(() => assertLocalQaScope(metadata, ''));
});
