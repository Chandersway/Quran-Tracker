import assert from 'node:assert/strict';
import test from 'node:test';
import {
  observeNotificationSystem,
  openNotificationSettings,
  readNotificationSystem,
  type NotificationSystemPort,
  type NotificationSystemStatus,
} from '../src/services/notifications/notificationSystem';

function fixture(platform = 'android') {
  const calls: string[] = [];
  let resumed = () => {};
  const port: NotificationSystemPort = {
    platform,
    permission: async () => ({ granted: true, status: 'granted' }),
    channels: async () => [
      { id: 'reading-plans', state: 'enabled' },
      { id: 'firebase_messages_v1', state: 'blocked' },
    ],
    openAndroidSettings: async () => {
      calls.push('android');
    },
    openSettings: async () => {
      calls.push('fallback');
    },
    onResume(callback) {
      resumed = callback;
      return () => {
        calls.push('unsubscribe');
      };
    },
  };
  return { port, calls, resume: () => resumed() };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('status distinguishes OS permission from blocked or not-created Android channels', async () => {
  const f = fixture();
  assert.deepEqual(await readNotificationSystem(f.port), {
    permission: 'allowed',
    channels: [
      { id: 'reading-plans', state: 'enabled' },
      { id: 'firebase_messages_v1', state: 'blocked' },
    ],
  });
  f.port.permission = async () => ({ granted: true, status: 'granted', androidImportance: 0 });
  assert.equal((await readNotificationSystem(f.port)).permission, 'blocked');
  f.port.permission = async () => ({ granted: false, status: 'undetermined' });
  assert.equal((await readNotificationSystem(f.port)).permission, 'undetermined');
  f.port.platform = 'ios';
  f.port.permission = async () => ({ granted: false, status: 'granted', iosStatus: 3 });
  assert.deepEqual(await readNotificationSystem(f.port), {
    permission: 'provisional',
    channels: [],
  });
  f.port.platform = 'web';
  f.port.permission = async () => {
    throw new Error('Native API must not be called');
  };
  assert.equal((await readNotificationSystem(f.port)).permission, 'unavailable');
});

test('resuming rereads permission and channels; stale reads and disposed listeners cannot overwrite them', async () => {
  const f = fixture();
  const updates: NotificationSystemStatus[] = [];
  let failures = 0;
  let resolveFirst!: (value: { granted: boolean; status: string }) => void;
  f.port.permission = () =>
    new Promise((resolve) => {
      resolveFirst = resolve;
    });
  const observer = observeNotificationSystem(
    f.port,
    (value) => updates.push(value),
    () => {
      failures++;
    },
  );
  f.port.permission = async () => ({ granted: false, status: 'denied' });
  f.port.channels = async () => [{ id: 'reading-plans', state: 'notCreated' }];
  f.resume();
  await settle();
  assert.equal(updates[0]?.permission, 'blocked');
  resolveFirst({ granted: true, status: 'granted' });
  await settle();
  assert.equal(updates.length, 1);
  f.port.permission = async () => {
    throw new Error('OS read failed');
  };
  f.resume();
  await settle();
  assert.equal(failures, 1);
  observer.dispose();
  f.resume();
  await settle();
  assert.equal(failures, 1);
  assert.deepEqual(f.calls, ['unsubscribe']);
});

test('settings opens Android notification settings first, with an OEM fallback and native iOS settings', async () => {
  const f = fixture();
  await openNotificationSettings(f.port);
  assert.deepEqual(f.calls, ['android']);
  f.port.openAndroidSettings = async () => {
    throw new Error('Unsupported intent');
  };
  await openNotificationSettings(f.port);
  f.port.platform = 'ios';
  await openNotificationSettings(f.port);
  f.port.platform = 'web';
  await openNotificationSettings(f.port);
  assert.deepEqual(f.calls, ['android', 'fallback', 'fallback']);
});
