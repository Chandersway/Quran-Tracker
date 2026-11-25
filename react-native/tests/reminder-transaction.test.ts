import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceReminder } from '../src/services/notifications/reminderTransaction';

test('a failed reminder replacement leaves the existing reminder scheduled', async () => {
  const scheduled = new Set(['working']);
  await assert.rejects(
    replaceReminder({
      existingIds: async () => [...scheduled],
      create: async () => {
        throw new Error('Permission changed');
      },
      cancel: async (id) => {
        scheduled.delete(id);
      },
    }),
  );
  assert.deepEqual([...scheduled], ['working']);
});
test('a new reminder exists before cleanup and failed cleanup is reported', async () => {
  const scheduled = new Set(['old']);
  const result = await replaceReminder({
    existingIds: async () => [...scheduled],
    create: async () => {
      scheduled.add('new');
      return 'new';
    },
    cancel: async () => {
      assert.ok(scheduled.has('new'));
      throw new Error('Native cancellation failed');
    },
  });
  assert.equal(result.cleanupFailures, 1);
  assert.ok(scheduled.has('new'));
});
