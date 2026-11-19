import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as policy from '../src/services/notifications/groupPushPolicy';
import * as destinations from '../src/services/notifications/notificationDestinations';
import { pushDeviceKeys } from '../src/services/notifications/pushDeviceKeys';

test('a cold-start group-post notification opens the authenticated group, never a payload URL or another account', async () => {
  for (const authorized of [true, false]) {
    const urls: string[] = [];
    const effects: Array<() => unknown> = [];
    const event = '00000000-0000-4000-8000-000000000001';
    const recipient = '00000000-0000-4000-8000-000000000002';
    const backend = {
      auth: {
        getSession: async () => ({ user: { id: authorized ? recipient : 'another-account' } }),
        onChange: () => () => undefined,
      },
      notifications: {
        groupPushTarget: async () => ({
          groupCode: 'SAFE GROUP',
          postId: 'safe-post',
          kind: 'group_post',
        }),
      },
    };
    const sub = () => ({ remove: () => undefined });
    const modules: Record<string, unknown> = {
      react: {
        useEffect: (effect: () => unknown) => effects.push(effect),
        useRef: (current: unknown) => ({ current }),
      },
      'react-native': {
        Platform: { OS: 'android' },
        AppState: { addEventListener: sub },
        Linking: {
          addEventListener: sub,
          getInitialURL: async () => null,
          openURL: async (url: string) => {
            urls.push(url);
          },
        },
      },
      'expo-notifications': {
        DEFAULT_ACTION_IDENTIFIER: 'default',
        addPushTokenListener: sub,
        addNotificationResponseReceivedListener: sub,
        clearLastNotificationResponseAsync: async () => undefined,
        getLastNotificationResponseAsync: async () => ({
          actionIdentifier: 'default',
          notification: {
            request: {
              content: {
                data: {
                  kind: 'group_post',
                  event_id: event,
                  recipient,
                  group_code: 'UNTRUSTED',
                  url: 'https://untrusted.invalid',
                },
              },
            },
          },
        }),
      },
      '../../../state/store': {
        useAppStore: () => ({
          state: { preferences: { language: 'nl', onboardingComplete: true }, plans: [] },
        }),
      },
      '../../../services/storage/deviceStorage': { deviceStorage: { getItem: async () => null } },
      '../../../services/notifications/pushDeviceKeys': { pushDeviceKeys },
      '../../../config/runtime': { getBackend: () => backend },
      '../../../services/notifications/groupPushPolicy': policy,
      '../../../services/notifications/groupPushState': { invalidateGroupPush: () => undefined },
      '../../../services/notifications/groupPushRuntime': {
        initializeGroupPushHandler: () => undefined,
      },
      '../../../services/notifications/notificationDestinations': destinations,
      '../../../services/notifications/pushDevice': {
        syncRegisteredPushDevice: async () => undefined,
        unregisterPushDevice: async () => undefined,
      },
    };
    const exports: Record<string, () => unknown> = {};
    vm.runInNewContext(
      ts.transpileModule(
        readFileSync('src/features/account/components/PushNotificationHandler.tsx', 'utf8'),
        { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
      ).outputText,
      {
        exports,
        URL,
        setTimeout: () => 0,
        clearTimeout: () => undefined,
        require: (key: string) => {
          assert.ok(key in modules, key);
          return modules[key];
        },
      },
    );
    exports.PushNotificationHandler!();
    effects.forEach((effect) => effect());
    for (let i = 0; i < 5; i++) await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(
      urls,
      authorized ? ['qurantracker://group/SAFE%20GROUP?postId=safe-post'] : [],
    );
  }
});
