import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildGroupCode,
  createPendingGroupStore,
  PENDING_GROUP_TTL_MS,
  parseGroupJoinInput,
  groupShareUrl,
} from '../src/services/groups/groupJoin';
import { groupErrorKey, requiresGroupAccessRequest } from '../src/services/groups/groupErrors';

const token = 'a'.repeat(64);
test('outgoing shares preserve configured HTTPS fallback, language and exact encoded invitation', () => {
  const invitation = 'a'.repeat(32) + '+/&?=مرحبا';
  for (const language of ['nl', 'en', 'ar']) {
    const link = groupShareUrl({ code: 'ABC-1234', token: invitation }, language);
    const url = new URL(link);
    assert.equal(url.origin, 'https://qurantracker-8f775.web.app');
    assert.equal(url.pathname, '/group/ABC-1234');
    assert.equal(url.searchParams.get('lang'), language);
    assert.deepEqual(parseGroupJoinInput(link), { code: 'ABC-1234', token: invitation });
  }
  assert.deepEqual(parseGroupJoinInput(groupShareUrl({ code: 'ABC-1234', token: null }, 'en')), {
    code: 'ABC-1234',
    token: null,
  });
  assert.throws(() => groupShareUrl({ code: '../ABC-1234', token }, 'en'));
});
test('trusted group links validate host, path, userinfo, port and exactly one secure invitation', () => {
  assert.deepEqual(
    parseGroupJoinInput(`https://qurantracker-8f775.web.app/group/abc-1234?invite=${token}`),
    { code: 'ABC-1234', token },
  );
  assert.deepEqual(parseGroupJoinInput('abc1234'), { code: 'ABC-1234', token: null });
  for (const raw of [
    'https://evil.invalid/group/ABC-1234',
    'qurantracker:opaque',
    'qurantracker://group/ABC-1234/extra',
    'https://user@qurantracker-8f775.web.app/group/ABC-1234',
    'https://qurantracker-8f775.web.app:443/group/ABC-1234',
    'https://qurantracker-8f775.web.app.evil/group/ABC-1234',
    'qurantracker://group/ABC-1234?invite=short',
    `qurantracker://group/ABC-1234?invite=${token}&invite=${token}`,
    'ABC-12345',
  ])
    assert.equal(parseGroupJoinInput(raw), null, raw);
});
test('pending invitation survives auth and recreation, and stale completion cannot discard a newer link', async () => {
  const values = new Map<string, string>();
  const driver = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: async (key: string) => {
      values.delete(key);
    },
  };
  const first = createPendingGroupStore(driver);
  await first.receive(`qurantracker://group/ABC-1234?invite=${token}`);
  await first.receive('qurantracker://auth?code=auth-code');
  await first.receive('qurantracker://group/ABC-9999?invite=short');
  const recreated = createPendingGroupStore(driver);
  assert.deepEqual(await recreated.load(), { code: 'ABC-1234', token });
  await recreated.receive('qurantracker://group/NEW-1234');
  await recreated.consume({ code: 'ABC-1234', token });
  assert.equal((await recreated.load())?.code, 'NEW-1234');
  await recreated.consume({ code: 'NEW-1234', token: null });
  assert.equal(await recreated.load(), null);
});
test('only a plain-code invitation refusal offers an access request; unrelated and nested errors stay distinct', () => {
  assert.equal(
    requiresGroupAccessRequest(
      new Error('RPC failed', { cause: new Error('GROUP_INVITATION_REQUIRED') }),
      false,
    ),
    true,
  );
  assert.equal(requiresGroupAccessRequest(new Error('GROUP_INVITATION_REQUIRED'), true), false);
  for (const message of [
    'NOT_GROUP_INVITATION_REQUIRED',
    'GROUP_NOT_FOUND',
    'GROUP_MEMBER_BLOCKED',
    'AUTH_REQUIRED',
    'Network unavailable',
  ])
    assert.equal(requiresGroupAccessRequest(new Error(message), false), false);
  assert.equal(
    groupErrorKey(new Error('RPC failed', { cause: new Error('INVITATION_EMAIL_MISMATCH') })),
    'groups.error.wrongAccount',
  );
  for (const message of ['secret token abc', 'duplicate key', 'NOT_GROUP_NOT_FOUND', ''])
    assert.equal(groupErrorKey(new Error(message)), null);
});
test('generated group codes retain the source shape for every supported writing system', () => {
  for (const name of ['Reading circle', 'Leesgroep', 'حلقة القرآن'])
    assert.match(buildGroupCode(name, 1000), /^[A-Z0-9]{3}-[0-9]{4}$/);
});

test('the observed private-group refusal is permission feedback, including wrapped RPC errors', () => {
  const refusal = {
    code: '42501',
    message: 'Je hebt geen toegang tot deze groep.',
    details: 'GROUP_NOT_VISIBLE',
    hint: null,
  };
  assert.equal(groupErrorKey(refusal), 'groups.error.permission');
  assert.equal(
    groupErrorKey(new Error(`${refusal.message}\n${refusal.details}`)),
    'groups.error.permission',
  );
  assert.equal(
    groupErrorKey(new Error('RPC failed', { cause: refusal })),
    'groups.error.permission',
  );
  assert.equal(groupErrorKey({ details: 'NOT_GROUP_NOT_VISIBLE' }), null);
});

test('a pending invitation expires after a day and legacy rows without a timestamp are dropped', async () => {
  const values = new Map<string, string>();
  const driver = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => void values.set(key, value),
    removeItem: async (key: string) => void values.delete(key),
  };
  let clock = 1_000_000;
  const store = createPendingGroupStore(driver, () => clock);
  await store.receive('qurantracker://group/ABC-1234');
  clock += PENDING_GROUP_TTL_MS;
  assert.equal((await store.load())?.code, 'ABC-1234');
  clock += 1;
  assert.equal(await store.load(), null);
  assert.equal(values.size, 0, 'An expired invitation is removed, not only hidden');
  values.set('pending-group-invitation-v1', JSON.stringify({ code: 'ABC-1234', token: null }));
  assert.equal(await store.load(), null);
  assert.equal(values.size, 0);
});
