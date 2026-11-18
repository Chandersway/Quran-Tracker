import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeNotificationPreferences,
  localNotificationDefaults,
  nextAllowedReminder,
} from '../src/domain/notificationPreferences';

test('notification preferences preserve source defaults and reject corrupt values', () => {
  assert.deepEqual(decodeNotificationPreferences({ quiet: true }), {
    ...localNotificationDefaults,
    quiet: true,
  });
  assert.throws(() => decodeNotificationPreferences({ daily: 'false' }));
  assert.throws(() => decodeNotificationPreferences({ extraMinute: 1440 }));
});
test('quiet hours defer to end in device-local time and equal endpoints disable deferral', () => {
  const preferences = { ...localNotificationDefaults, quiet: true };
  const evening = new Date(2026, 10, 13, 23, 30);
  assert.equal(+nextAllowedReminder(evening, preferences), +new Date(2026, 10, 14, 7));
  assert.equal(
    +nextAllowedReminder(new Date(2026, 10, 14, 6), preferences),
    +new Date(2026, 10, 14, 7),
  );
  assert.equal(nextAllowedReminder(evening, { ...preferences, quietEnd: 1320 }), evening);
  const daytime = { ...preferences, quietStart: 600, quietEnd: 720 };
  assert.equal(
    +nextAllowedReminder(new Date(2026, 10, 13, 11), daytime),
    +new Date(2026, 10, 13, 12),
  );
});
