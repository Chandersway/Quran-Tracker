import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState } from '../src/state/models';
import type { Action } from '../src/state/reducer';
import { localNotificationDefaults } from '../src/domain/notificationPreferences';
import { light } from '../src/shared/theme/colors';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

function fixture(permission = true) {
  const hooks = componentHarness();
  const pending: { action: Action; resolve: () => void; reject: (error: Error) => void }[] = [];
  let changed = 0;
  let permissionRequests = 0;
  let reminderSaves = 0;
  const { LocalRemindersPanel } = loadComponentModule<{ LocalRemindersPanel: () => TestElement }>(
    new URL('../src/features/account/components/LocalRemindersPanel.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { Platform: { OS: 'ios' }, Switch: 'Switch', View: 'View' },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => light },
      '../../../state/store': {
        useAppStore: () => ({
          state: initialState,
          dispatch: () => {
            throw new Error('Settings must await durable commit');
          },
          commit: (action: Action) =>
            new Promise<void>((resolve, reject) => pending.push({ action, resolve, reject })),
        }),
      },
      '../../../domain/localDate': { localDate: () => '2026-11-18' },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key }) },
      '../../../domain/notificationPreferences': { localNotificationDefaults },
      '../../../services/notifications/localReminders': {
        loadLocalNotifications: async () => ({
          ...localNotificationDefaults,
          daily: true,
          dailyMinute: 480,
        }),
        saveLocalNotifications: async () => {
          reminderSaves++;
        },
      },
      '../../../services/notifications/planningReminderPort': {
        requestPlanReminderPermission: async () => {
          permissionRequests++;
          return permission;
        },
      },
      '../../../services/notifications/notificationPreferenceEvents': {
        notifyNotificationPreferencesChanged: () => {
          changed++;
        },
        onNotificationPreferencesChanged: () => () => undefined,
      },
      '../../../services/notifications/pushDevice': {
        syncRegisteredPushDevice: async () => undefined,
      },
      '../../../config/runtime': { getBackend: () => null },
    },
  );
  const render = () => hooks.render(LocalRemindersPanel);
  async function edit() {
    render();
    await new Promise(setImmediate);
    let tree = render();
    const dailyTime = findElement(tree, 'Row', 'title', 'notifications.time').props
      .trailing as TestElement;
    assert.equal(dailyTime.props.title, '08:00');
    press(dailyTime);
    tree = render();
    (
      findElement(tree, 'Field', 'label', 'notifications.hours').props.onChangeText as (
        value: string,
      ) => void
    )('15');
    (
      findElement(tree, 'Field', 'label', 'notifications.minutesLabel').props.onChangeText as (
        value: string,
      ) => void
    )('37');
    tree = render();
    press(findElement(tree, 'Button', 'title', 'notifications.save'));
    await new Promise(setImmediate);
  }
  return {
    render,
    edit,
    pending,
    changes: () => changed,
    permissionRequests: () => permissionRequests,
    reminderSaves: () => reminderSaves,
  };
}

test('editing an enabled reminder time requests permission and cannot claim success when blocked', async () => {
  const f = fixture(false);
  await f.edit();
  assert.equal(f.permissionRequests(), 1);
  assert.equal(f.reminderSaves(), 0);
  assert.equal(f.pending.length, 0);
  const tree = f.render();
  const sheet = findElement(tree, 'Sheet', 'visible', true);
  assert.ok(findElement(sheet, 'Notice', 'message', 'notifications.blocked'));
  assert.equal(
    elements(tree, 'Notice').some((item) => item.props.message === 'notifications.saved'),
    false,
  );
});

test('reminder success waits for both the canonical goal and snapshot preferences', async () => {
  const f = fixture();
  await f.edit();
  assert.equal(f.pending[0]?.action.type, 'goals/save');
  assert.equal(f.pending.length, 1);
  assert.equal(
    elements(f.render(), 'Notice').some((item) => item.props.message === 'notifications.saved'),
    false,
  );
  f.pending[0]!.resolve();
  await new Promise(setImmediate);
  assert.equal(f.pending[1]?.action.type, 'preferences');
  assert.equal(f.changes(), 0);
  assert.equal(elements(f.render(), 'Sheet')[0]?.props.visible, true);
  f.pending[1]!.resolve();
  await new Promise(setImmediate);
  const tree = f.render();
  assert.equal(elements(tree, 'Sheet')[0]?.props.visible, false);
  assert.ok(findElement(tree, 'Notice', 'message', 'notifications.saved'));
  assert.equal(f.changes(), 1);
});

for (const failureAt of [0, 1]) {
  test(`reminder snapshot failure ${failureAt + 1} preserves the time editor without claiming success`, async () => {
    const f = fixture();
    await f.edit();
    if (failureAt === 1) {
      f.pending[0]!.resolve();
      await new Promise(setImmediate);
    }
    f.pending[failureAt]!.reject(new Error('storage full'));
    await new Promise(setImmediate);
    const tree = f.render();
    const sheet = findElement(tree, 'Sheet', 'visible', true);
    assert.ok(findElement(sheet, 'Notice', 'message', 'notifications.error'));
    assert.equal(
      elements(tree, 'Notice').some((item) => item.props.message === 'notifications.saved'),
      false,
    );
    assert.equal(elements(tree, 'Sheet')[0]?.props.visible, true);
    assert.equal(findElement(tree, 'Field', 'label', 'notifications.hours').props.value, '15');
    assert.equal(
      findElement(tree, 'Field', 'label', 'notifications.minutesLabel').props.value,
      '37',
    );
    assert.equal(findElement(tree, 'Button', 'title', 'notifications.save').props.loading, false);
    assert.equal(f.changes(), 0);
  });
}
