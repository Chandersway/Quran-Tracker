import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { pushDeviceKeys } from '../src/services/notifications/pushDeviceKeys';
import { localDate } from '../src/domain/localDate';
import * as notificationSystem from '../src/services/notifications/notificationSystem';
import type * as PushDevice from '../src/services/notifications/pushDevice';
import type * as PlanningPort from '../src/services/notifications/planningReminderPort';
import type { PushDeviceInput } from '../src/services/backend/types';

function module<T>(path: string, modules: Record<string, unknown>): T {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dependencies: Record<string, unknown> = {
    '@react-native-async-storage/async-storage': { __esModule: true, default: {} },
    '../../domain/localDate': { localDate },
    ...modules,
  };
  vm.runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
  });
  return exports as T;
}

function fixture(granted = true, iosStatus = 2) {
  const records = new Map<string, string>([
    [pushDeviceKeys.installation, '11111111-1111-4111-8111-111111111111'],
    [pushDeviceKeys.registered, 'registered'],
    [pushDeviceKeys.user, 'reader'],
    [pushDeviceKeys.token, 'a'.repeat(64)],
  ]);
  const calls: string[] = [];
  const registrations: PushDeviceInput[] = [];
  const local = { enabled: true, daily: true, quiet: false, quietStart: 1320, quietEnd: 420 };
  const global = { enabled: true };
  const modules = {
    'react-native': { Platform: { OS: 'ios' } },
    'expo-notifications': {
      getPermissionsAsync: async () => ({ granted, status: 'granted', ios: { status: iosStatus } }),
      requestPermissionsAsync: async () => {
        calls.push('permission prompt');
        return { granted, ios: { status: iosStatus } };
      },
      getDevicePushTokenAsync: async () => ({ type: 'ios', data: 'a'.repeat(64) }),
      registerTaskAsync: async () => {
        calls.push('task');
      },
    },
    '../storage/deviceStorage': {
      deviceStorage: {
        getItem: async (key: string) => records.get(key) ?? null,
        setItem: async (key: string, value: string) => {
          records.set(key, value);
        },
        multiSet: async (values: string[][]) => {
          values.forEach(([key, value]) => records.set(key!, value!));
        },
        multiRemove: async (keys: string[]) => {
          keys.forEach((key) => records.delete(key));
        },
      },
    },
    './pushDeviceKeys': { pushDeviceKeys },
    './groupPushPolicy': { GROUP_PUSH_CHANNEL: 'group', GROUP_PUSH_TASK: 'group-task' },
    './groupPushState': { groupPushRevision: () => 0, invalidateGroupPush: () => undefined },
    './localReminders': { loadLocalNotifications: async () => local },
    './notificationSystem': notificationSystem,
  };
  const service = module<typeof PushDevice>('src/services/notifications/pushDevice.ts', modules);
  const planning = module<typeof PlanningPort>(
    'src/services/notifications/planningReminderPort.ts',
    modules,
  );
  const backend = {
    auth: {
      getUser: async () => ({ id: 'reader' }),
      getSession: async () => ({ user: { id: 'reader' } }),
    },
    notifications: {
      loadGroupPushPreferences: async () => global,
      registerPushDevice: async (input: PushDeviceInput) => {
        registrations.push(input);
      },
      unregisterPushDevice: async () => undefined,
    },
  } as unknown as Parameters<typeof PushDevice.enablePushDevice>[0];
  return { service, planning, backend, registrations, local, global, calls };
}

test('native iOS provisional authorization schedules reminders and registers push without another prompt', async () => {
  const f = fixture(false, 3);
  assert.equal(await f.planning.hasPlanReminderPermission(), true);
  assert.equal(await f.planning.requestPlanReminderPermission(), true);
  await f.service.enablePushDevice(f.backend, 'en');
  assert.equal(f.registrations[0]?.enabled, true);
  assert.equal(f.calls.includes('permission prompt'), false);
});

function startupFixture(os = 'android', version = 37) {
  const values = new Map<string, string>();
  const app = { currentState: 'active' };
  const permission = {
    granted: false,
    canAskAgain: true,
    status: os === 'ios' ? 'undetermined' : 'denied',
  };
  const replies = { allow: false, priorDenial: false, channelEnabled: true, interrupt: false };
  const calls: string[] = [];
  const load = () =>
    module<typeof PlanningPort>('src/services/notifications/planningReminderPort.ts', {
      '@react-native-async-storage/async-storage': {
        __esModule: true,
        default: {
          getItem: async (key: string) => values.get(key) ?? null,
          setItem: async (key: string, value: string) => {
            values.set(key, value);
          },
          removeItem: async (key: string) => {
            values.delete(key);
          },
        },
      },
      'react-native': {
        Platform: { OS: os, Version: version },
        AppState: app,
        PermissionsAndroid: {
          PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
        },
        TurboModuleRegistry: {
          get: (name: string) => {
            assert.equal(name, 'PermissionsAndroid');
            return {
              shouldShowRequestPermissionRationale: async (permission: string) => {
                assert.equal(permission, 'android.permission.POST_NOTIFICATIONS');
                return replies.priorDenial;
              },
            };
          },
        },
      },
      'expo-notifications': {
        AndroidImportance: { DEFAULT: 5, NONE: 2 },
        getPermissionsAsync: async () => ({ ...permission }),
        setNotificationChannelAsync: async () => {
          calls.push('channel');
          if (replies.interrupt) app.currentState = 'background';
          return { importance: replies.channelEnabled ? 5 : 2 };
        },
        requestPermissionsAsync: async () => {
          calls.push('prompt');
          permission.granted = replies.allow;
          permission.status = replies.allow ? 'granted' : 'denied';
          return { ...permission };
        },
      },
      './notificationSystem': notificationSystem,
    });
  return { load, app, calls, replies, permission };
}

test('a fresh Android or iOS user is offered the local permission once, including after a restart', async () => {
  for (const os of ['android', 'ios']) {
    const f = startupFixture(os);
    f.app.currentState = 'background';
    assert.equal(await f.load().initialPlanReminderPermission(), false);
    assert.deepEqual(f.calls, []);
    f.app.currentState = 'active';
    assert.equal(await f.load().initialPlanReminderPermission(), false);
    assert.deepEqual(f.calls, os === 'android' ? ['channel', 'prompt'] : ['prompt']);
    assert.equal(await f.load().initialPlanReminderPermission(), false);
    f.permission.granted = true;
    f.permission.status = 'granted';
    assert.equal(await f.load().initialPlanReminderPermission(), true);
    const settingsGrant = await f.load().firstPlanReminderGrantAt();
    assert.equal(typeof settingsGrant, 'number');
    assert.equal(await f.load().firstPlanReminderGrantAt(), settingsGrant);
    assert.equal(f.calls.filter((call) => call === 'prompt').length, 1);
  }
});

test('foreground permission grant is usable immediately; losing the activity waits for a later foreground', async () => {
  const f = startupFixture();
  f.replies.allow = true;
  f.replies.interrupt = true;
  assert.equal(await f.load().initialPlanReminderPermission(), false);
  assert.deepEqual(f.calls, ['channel']);
  f.replies.interrupt = false;
  f.app.currentState = 'active';
  const service = f.load();
  const requests = await Promise.all([
    service.initialPlanReminderPermission(),
    service.initialPlanReminderPermission(),
  ]);
  assert.deepEqual(requests, [true, true]);
  const firstGrant = await service.firstPlanReminderGrantAt();
  assert.equal(typeof firstGrant, 'number');
  assert.equal(await f.load().firstPlanReminderGrantAt(), firstGrant);
  assert.equal(f.calls.filter((call) => call === 'prompt').length, 1);
});

test('startup respects earlier denials, settings revocation, blocked channels and Android before API 33', async () => {
  const deniedAndroid = startupFixture();
  deniedAndroid.replies.priorDenial = true;
  const deniedIos = startupFixture('ios');
  deniedIos.permission.status = 'denied';
  const blocked = startupFixture();
  blocked.permission.canAskAgain = false;
  const disabledChannel = startupFixture();
  disabledChannel.replies.channelEnabled = false;
  const revoked = startupFixture();
  revoked.permission.granted = true;
  revoked.permission.status = 'granted';
  assert.equal(await revoked.load().initialPlanReminderPermission(), true);
  assert.equal(
    await revoked.load().firstPlanReminderGrantAt(),
    null,
    'existing authorization has no proven first-grant day',
  );
  revoked.permission.granted = false;
  revoked.permission.status = 'denied';
  for (const f of [
    deniedAndroid,
    deniedIos,
    blocked,
    disabledChannel,
    revoked,
    startupFixture('android', 32),
  ]) {
    assert.equal(await f.load().initialPlanReminderPermission(), false);
    assert.equal(f.calls.includes('prompt'), false);
  }

  const manual = startupFixture();
  assert.equal(await manual.load().requestPlanReminderPermission(), false);
  assert.equal(await manual.load().initialPlanReminderPermission(), false);
  assert.equal(manual.calls.filter((call) => call === 'prompt').length, 1);
});

test('local reading switches never overwrite global group push or OS registration permission', async () => {
  const f = fixture();
  f.local.enabled = false;
  await f.service.enablePushDevice(f.backend, 'en');
  assert.equal(f.registrations[0]?.enabled, true);
  f.global.enabled = false;
  f.local.enabled = true;
  await f.service.syncRegisteredPushDevice(f.backend, 'en');
  assert.equal(f.registrations[1]?.enabled, false);
  const denied = fixture(false, 1);
  await denied.service.syncRegisteredPushDevice(denied.backend, 'en');
  assert.equal(denied.registrations[0]?.enabled, false);
});

test('app-wide Android notification blocking takes precedence over the raw granted bit', () => {
  assert.equal(
    notificationSystem.notificationDeliveryAllowed({ granted: true, status: 'denied' }),
    false,
  );
  assert.equal(
    notificationSystem.notificationDeliveryAllowed({ granted: true, android: { importance: 0 } }),
    false,
  );
});

test('push preference projection contains only the quiet-hour policy', async () => {
  const f = fixture();
  assert.deepEqual(JSON.parse(JSON.stringify(await f.service.localPushPreferences())), {
    quiet: false,
    quietStart: 1320,
    quietEnd: 420,
  });
});

test('Android restores a daily schedule by creating its channel first, with sound and native repetition', async () => {
  const calls: string[] = [];
  const submissions: Array<{
    identifier?: string;
    content: { sound: string; data: { kind: string } };
    trigger: { type: string; hour?: number; minute?: number; channelId: string; date?: Date };
  }> = [];
  const planning = module<typeof PlanningPort>(
    'src/services/notifications/planningReminderPort.ts',
    {
      'react-native': { Platform: { OS: 'android' } },
      'expo-notifications': {
        AndroidImportance: { DEFAULT: 3, NONE: 0 },
        SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
        getAllScheduledNotificationsAsync: async () => [
          { identifier: 'retained', content: { data: { planReminderKey: 'daily:495:nl' } } },
        ],
        setNotificationChannelAsync: async (id: string) => {
          calls.push(`channel:${id}`);
          return { importance: 3 };
        },
        scheduleNotificationAsync: async (input: (typeof submissions)[number]) => {
          assert.equal(calls[0], 'channel:reading-plans');
          calls.push('schedule');
          submissions.push(input);
          return 'daily-native';
        },
      },
      './notificationSystem': notificationSystem,
    },
  );
  await planning.expoPlanReminderPort.schedule({
    key: 'daily:480:nl',
    planId: 'daily',
    sourceId: 'daily',
    date: '',
    dueAt: new Date(2026, 10, 19, 8, 15),
    title: 'Lezen',
    body: 'Tijd om te lezen',
    repeatDaily: true,
  });
  assert.equal(submissions[0]?.trigger.type, 'daily');
  assert.equal(submissions[0]?.trigger.hour, 8);
  assert.equal(submissions[0]?.trigger.minute, 15);
  assert.equal(submissions[0]?.trigger.channelId, 'reading-plans');
  assert.equal(submissions[0]?.content.sound, 'default');
  assert.equal(submissions[0]?.content.data.kind, 'daily_reading');
  calls.splice(0);
  const retained = await planning.expoPlanReminderPort.list();
  assert.equal(retained[0]?.id, 'retained');
  assert.equal(
    calls[0],
    'channel:reading-plans',
    'retaining an old schedule also repairs its missing channel',
  );
  assert.equal(
    submissions.length,
    1,
    'repairing the channel does not duplicate the pending reminder',
  );
  const dueAt = new Date(2026, 10, 19, 15, 37, 5);
  const key = `daily-catchup:2026-11-19:480:at:${dueAt.getTime()}:nl`;
  await planning.expoPlanReminderPort.schedule({
    key,
    dueAt,
    date: '2026-11-19',
    planId: 'daily',
    sourceId: 'daily',
    firstGrantSlot: 480,
    title: 'Lezen',
    body: 'Tijd om te lezen',
  });
  assert.equal(submissions[1]?.identifier, key);
  assert.equal(submissions[1]?.trigger.type, 'date');
  assert.equal(submissions[1]?.trigger.date, dueAt);
  assert.equal(submissions[1]?.content.data.kind, 'daily_reading');
});

test('an Android reminder channel blocked by the user cannot be reported as enabled by OS app permission alone', async () => {
  let prompts = 0;
  const planning = module<typeof PlanningPort>(
    'src/services/notifications/planningReminderPort.ts',
    {
      'react-native': { Platform: { OS: 'android' } },
      'expo-notifications': {
        AndroidImportance: { DEFAULT: 3, NONE: 0 },
        setNotificationChannelAsync: async () => ({ importance: 0 }),
        getPermissionsAsync: async () => ({ granted: true }),
        requestPermissionsAsync: async () => {
          prompts++;
          return { granted: true };
        },
      },
      './notificationSystem': notificationSystem,
    },
  );
  assert.equal(await planning.requestPlanReminderPermission(), false);
  assert.equal(prompts, 0, 'a permission prompt cannot override a disabled notification channel');
  await assert.rejects(
    planning.expoPlanReminderPort.schedule({
      key: 'daily',
      planId: 'daily',
      sourceId: 'daily',
      date: '',
      dueAt: new Date(),
      title: 'Read',
      body: 'Read',
      repeatDaily: true,
    }),
    /channel is disabled/,
  );
});
