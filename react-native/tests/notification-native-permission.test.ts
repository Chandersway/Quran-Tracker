import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { pushDeviceKeys } from '../src/services/notifications/pushDeviceKeys';
import * as notificationSystem from '../src/services/notifications/notificationSystem';
import type * as PushDevice from '../src/services/notifications/pushDevice';
import type * as PlanningPort from '../src/services/notifications/planningReminderPort';
import type { PushDeviceInput } from '../src/services/backend/types';

function module<T>(path: string, modules: Record<string, unknown>): T {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
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

test('push preference projection contains only the quiet-hour policy', async () => {
  const f = fixture();
  assert.deepEqual(JSON.parse(JSON.stringify(await f.service.localPushPreferences())), {
    quiet: false,
    quietStart: 1320,
    quietEnd: 420,
  });
});
