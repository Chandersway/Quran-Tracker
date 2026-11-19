import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as policy from '../src/services/notifications/groupPushPolicy';
import * as pushState from '../src/services/notifications/groupPushState';
import * as system from '../src/services/notifications/notificationSystem';
import { pushDeviceKeys } from '../src/services/notifications/pushDeviceKeys';
import type * as Runtime from '../src/services/notifications/groupPushRuntime';

const event = '00000000-0000-4000-8000-000000000001';
const recipient = '00000000-0000-4000-8000-000000000002';
const postId = '00000000-0000-4000-8000-000000000003';
const payload = { kind: 'group_post', event_id: event, recipient };
const target = { groupCode: 'QUR-1234', postId, kind: 'group_post' as const };
function gate(patch: Partial<policy.GroupReplyGate> = {}): policy.GroupReplyGate {
  return {
    account: async () => recipient,
    local: async () => ({
      registeredUser: recipient,
      permission: true,
      quiet: false,
      quietStart: 0,
      quietEnd: 0,
    }),
    target: async () => target,
    preferences: async () => ({ enabled: true, reaction: false, update: true }),
    groupPreferences: async () => ({ pushEnabled: true, level: 'all', mutedUntil: null }),
    ...patch,
  };
}

test('new posts use the update category and authenticated event kind, never the reaction switch', async () => {
  const post = policy.parseGroupPush({ data: { dataString: JSON.stringify(payload) } })!;
  assert.equal(post.kind, 'group_post');
  assert.equal(policy.parseGroupReply(payload), null);
  assert.deepEqual(await policy.authorizeGroupPush(post, gate()), target);
  for (const patch of [
    { preferences: async () => ({ enabled: true, reaction: true, update: false }) },
    { preferences: async () => ({ enabled: false, reaction: true, update: true }) },
    { target: async () => ({ ...target, kind: 'group_reply' as const }) },
    { target: async () => ({ groupCode: target.groupCode, postId }) },
  ])
    assert.equal(await policy.authorizeGroupPush(post, gate(patch)), null);
});

test('new posts respect all group mute levels, disabled devices and future mute deadlines', async () => {
  const post = policy.parseGroupPush(payload)!;
  for (const group of [
    { pushEnabled: true, level: 'muted', mutedUntil: null },
    { pushEnabled: true, level: 'mentions', mutedUntil: null },
    { pushEnabled: true, level: 'important', mutedUntil: null },
    { pushEnabled: false, level: 'all', mutedUntil: null },
    { pushEnabled: true, level: 'all', mutedUntil: '2099-01-01T00:00:00Z' },
  ])
    assert.equal(
      await policy.authorizeGroupPush(post, gate({ groupPreferences: async () => group })),
      null,
    );
  assert.equal(await policy.authorizeGroupPush(post, gate({ account: async () => null })), null);
});

test('native receive path displays a generic new-post alert once and suppresses raw foreground payloads', async () => {
  const values = new Map<string, string>([
    [pushDeviceKeys.user, recipient],
    [pushDeviceKeys.registered, 'registered'],
    ['wirdna:state:v1', JSON.stringify({ preferences: { language: 'nl' } })],
  ]);
  const submitted: Array<{
    identifier: string;
    content: { title: string; body: string; data: Record<string, unknown> };
  }> = [];
  let handler:
    | { handleNotification(value: unknown): Promise<{ shouldShowBanner: boolean }> }
    | undefined;
  const store = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const backend = {
    auth: { getSession: async () => ({ user: { id: recipient } }) },
    notifications: {
      groupPushTarget: async () => target,
      loadGroupPushPreferences: gate().preferences,
      loadGroupPreferences: gate().groupPreferences,
    },
  };
  const modules: Record<string, unknown> = {
    '@react-native-async-storage/async-storage': { __esModule: true, default: store },
    '../storage/deviceStorage': { deviceStorage: store },
    './pushDeviceKeys': { pushDeviceKeys },
    'react-native': { Platform: { OS: 'android' } },
    '../../config/runtime': { getBackend: () => backend },
    './pushDevice': {
      localPushPreferences: async () => ({ quiet: false, quietStart: 0, quietEnd: 0 }),
    },
    './groupPushPolicy': policy,
    './groupPushState': pushState,
    './notificationSystem': system,
    'expo-notifications': {
      getPermissionsAsync: async () => ({ granted: true }),
      scheduleNotificationAsync: async (value: (typeof submitted)[number]) => {
        submitted.push(value);
      },
      setNotificationHandler: (value: typeof handler) => {
        handler = value;
      },
    },
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync('src/services/notifications/groupPushRuntime.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      require: (key: string) => {
        assert.ok(key in modules, key);
        return modules[key];
      },
      setTimeout: () => 0,
    },
  );
  const runtime = exports as typeof Runtime;
  runtime.initializeGroupPushHandler();
  const raw = { request: { identifier: 'provider', content: { data: payload } } };
  assert.equal((await handler!.handleNotification(raw)).shouldShowBanner, false);
  // The handler deliberately queues network authorization and returns immediately.
  await pushState.withGroupPushLock(async () => undefined);
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0]!.content.title, 'Nieuw groepsbericht');
  assert.equal(submitted[0]!.content.data.kind, 'group_post');
  assert.equal(
    (
      await handler!.handleNotification({
        request: {
          identifier: submitted[0]!.identifier,
          content: { data: submitted[0]!.content.data },
        },
      })
    ).shouldShowBanner,
    true,
  );
  await runtime.receiveGroupReply(payload);
  assert.equal(submitted.length, 1);
});
