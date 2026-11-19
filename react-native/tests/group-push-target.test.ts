import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readGroupPushTarget } from '../src/services/backend/notificationTargets';

type Response = { data: unknown; error: { code: string; message: string } | null };
function fixture(responses: Response[]) {
  const calls: string[] = [];
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push(name);
      assert.deepEqual(args, { p_event: 'event' });
      assert.ok(responses.length, 'unexpected fallback');
      return responses.shift()!;
    },
  } as unknown as Pick<SupabaseClient, 'rpc'>;
  return { client, calls };
}
test('the authenticated v2 target supplies the trusted post category', async () => {
  const f = fixture([
    { data: [{ group_code: 'GROUP', post_id: 'post', kind: 'group_post' }], error: null },
  ]);
  assert.deepEqual(await readGroupPushTarget(f.client, 'event'), {
    groupCode: 'GROUP',
    postId: 'post',
    kind: 'group_post',
  });
  assert.deepEqual(f.calls, ['get_group_push_target_v2']);
});
test('only a missing v2 RPC falls back to the legacy reply-only contract', async () => {
  for (const code of ['PGRST202', '42883']) {
    const f = fixture([
      { data: null, error: { code, message: 'missing function' } },
      { data: [{ group_code: 'GROUP', post_id: 'post' }], error: null },
    ]);
    assert.deepEqual(await readGroupPushTarget(f.client, 'event'), {
      groupCode: 'GROUP',
      postId: 'post',
    });
    assert.deepEqual(f.calls, ['get_group_push_target_v2', 'get_group_push_target_v1']);
  }
  const f = fixture([{ data: null, error: { code: '42501', message: 'permission denied' } }]);
  await assert.rejects(readGroupPushTarget(f.client, 'event'), /permission denied/);
  assert.equal(f.calls.length, 1);
});
test('missing, malformed and unknown-kind events fail closed without legacy escalation', async () => {
  for (const data of [
    [],
    null,
    {},
    [{ group_code: 'GROUP', post_id: 'post' }],
    [{ group_code: 'GROUP', post_id: 'post', kind: 'unknown' }],
  ]) {
    const f = fixture([{ data, error: null }]);
    assert.equal(await readGroupPushTarget(f.client, 'event'), null);
    assert.equal(f.calls.length, 1);
  }
});
