import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  authorizeGroupReply,
  isGroupReplyMessage,
  parseGroupReply,
  quietHoursActive,
  resolveGroupReplyNavigation,
  type GroupReplyGate,
} from '../src/services/notifications/groupPushPolicy';

const event = '00000000-0000-4000-8000-000000000001';
const recipient = '00000000-0000-4000-8000-000000000002';
const postId = '00000000-0000-4000-8000-000000000003';
const payload = { kind: 'group_reply', event_id: event, recipient };
const target = { groupCode: 'QUR-1234', postId };
function gate(patch: Partial<GroupReplyGate> = {}): GroupReplyGate {
  return {
    account: async () => recipient,
    local: async () => ({
      registeredUser: recipient,
      permission: true,
      quiet: false,
      quietStart: 1320,
      quietEnd: 420,
    }),
    target: async () => target,
    preferences: async () => ({ enabled: true, reaction: true }),
    groupPreferences: async () => ({ pushEnabled: true, level: 'all', mutedUntil: null }),
    ...patch,
  };
}

test('accepts unchanged Android v1 raw FCM data and Expo foreground/response envelopes', () => {
  for (const value of [
    payload,
    { data: payload, notification: null },
    { data: { dataString: JSON.stringify(payload) } },
    { notification: { request: { content: { data: payload } } } },
  ]) {
    assert.deepEqual(parseGroupReply(value), { eventId: event, recipient });
  }
  for (const value of [
    null,
    { ...payload, recipient: 'wrong' },
    { ...payload, event_id: 'wrong' },
    { ...payload, kind: 'invitation' },
    { data: { dataString: 'invalid json' } },
  ]) {
    assert.equal(parseGroupReply(value), null);
  }
  assert.equal(
    isGroupReplyMessage({
      request: { content: { data: { kind: 'group_reply', recipient: 'invalid' } } },
    }),
    true,
  );
});

test('never fetches an event for another account or an unregistered installation', async () => {
  let lookups = 0;
  const denied = gate({
    target: async () => {
      lookups++;
      return target;
    },
    account: async () => null,
  });
  assert.equal(await authorizeGroupReply(parseGroupReply(payload)!, denied), null);
  assert.equal(
    await authorizeGroupReply(
      parseGroupReply(payload)!,
      gate({
        local: async () => ({
          registeredUser: null,
          permission: true,
          quiet: false,
          quietStart: 0,
          quietEnd: 0,
        }),
        target: denied.target,
      }),
    ),
    null,
  );
  assert.equal(lookups, 0);
});

test('membership and post access come from the authenticated RPC, not push group fields', async () => {
  assert.equal(
    await authorizeGroupReply(
      parseGroupReply({ ...payload, group_code: 'ATTACKER' })!,
      gate({ target: async () => null }),
    ),
    null,
  );
  assert.deepEqual(await authorizeGroupReply(parseGroupReply(payload)!, gate()), target);
});

test('checks global category, per-group mute and OS permission before display', async () => {
  const reply = parseGroupReply(payload)!;
  for (const preferences of [
    { enabled: false, reaction: true },
    { enabled: true, reaction: false },
  ]) {
    assert.equal(
      await authorizeGroupReply(reply, gate({ preferences: async () => preferences })),
      null,
    );
  }
  for (const group of [
    { pushEnabled: false, level: 'all', mutedUntil: null },
    { pushEnabled: true, level: 'muted', mutedUntil: null },
    { pushEnabled: true, level: 'mentions', mutedUntil: null },
    { pushEnabled: true, level: 'all', mutedUntil: '2099-01-01T00:00:00Z' },
  ]) {
    assert.equal(
      await authorizeGroupReply(reply, gate({ groupPreferences: async () => group })),
      null,
    );
  }
  assert.equal(
    await authorizeGroupReply(
      reply,
      gate({
        local: async () => ({
          registeredUser: recipient,
          permission: false,
          quiet: false,
          quietStart: 0,
          quietEnd: 0,
        }),
      }),
    ),
    null,
  );
});

test('rechecks account identity and local preferences after network requests', async () => {
  let accountCalls = 0;
  assert.equal(
    await authorizeGroupReply(
      parseGroupReply(payload)!,
      gate({ account: async () => (++accountCalls === 1 ? recipient : null) }),
    ),
    null,
  );
  let preferenceCalls = 0;
  assert.equal(
    await authorizeGroupReply(
      parseGroupReply(payload)!,
      gate({
        local: async () => ({
          registeredUser: recipient,
          permission: ++preferenceCalls === 1,
          quiet: false,
          quietStart: 0,
          quietEnd: 0,
        }),
      }),
    ),
    null,
  );
});

test('quiet hours preserve Kotlin overnight, daytime and equal-endpoint behavior', () => {
  const overnight = { quiet: true, quietStart: 1320, quietEnd: 420 };
  assert.equal(quietHoursActive(overnight, new Date(2026, 10, 13, 23, 0)), true);
  assert.equal(quietHoursActive(overnight, new Date(2026, 10, 14, 6, 59)), true);
  assert.equal(quietHoursActive(overnight, new Date(2026, 10, 14, 7, 0)), false);
  assert.equal(
    quietHoursActive(
      { quiet: true, quietStart: 540, quietEnd: 1020 },
      new Date(2026, 10, 14, 12, 0),
    ),
    true,
  );
  assert.equal(quietHoursActive({ quiet: true, quietStart: 0, quietEnd: 0 }, new Date()), false);
});

test('notification taps never open another recipient account and recheck identity after lookup', async () => {
  let lookups = 0;
  assert.equal(
    await resolveGroupReplyNavigation(
      { eventId: event, recipient: postId },
      gate({
        target: async () => {
          lookups++;
          return target;
        },
      }),
    ),
    null,
  );
  assert.equal(lookups, 0);
  let calls = 0;
  assert.equal(
    await resolveGroupReplyNavigation(
      { eventId: event, recipient },
      gate({ account: async () => (++calls === 1 ? recipient : null) }),
    ),
    null,
  );
  assert.deepEqual(await resolveGroupReplyNavigation({ eventId: event }, gate()), target);
});
