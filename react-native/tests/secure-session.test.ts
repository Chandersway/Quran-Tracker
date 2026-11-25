import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSecureSessionStorage,
  type SecureDriver,
} from '../src/services/storage/secureStorageCore';

test('large Unicode sessions survive chunking and concurrent updates remain serialized', async () => {
  const values = new Map<string, string>();
  const driver: SecureDriver = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      values.set(key, Buffer.from(value, 'utf8').toString('utf8'));
    },
    remove: async (key) => {
      values.delete(key);
    },
  };
  const storage = createSecureSessionStorage(driver);
  const large = JSON.stringify({ test: 'سورة😀'.repeat(1500) });
  await storage.setItem('session', large);
  assert.equal(await storage.getItem('session'), large);
  await Promise.all([storage.setItem('session', 'first'), storage.setItem('session', 'last')]);
  assert.equal(await storage.getItem('session'), 'last');
  await storage.removeItem('session');
  assert.equal(await storage.getItem('session'), null);
  assert.equal(values.size, 0);
});
test('an interrupted secure write leaves the previous session readable', async () => {
  const values = new Map<string, string>();
  let writes = 0;
  let fail = false;
  const storage = createSecureSessionStorage({
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      if (fail && ++writes === 2) throw new Error('Simulated device storage interruption');
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
  });
  await storage.setItem('session', 'original');
  fail = true;
  await assert.rejects(storage.setItem('session', 'x'.repeat(1000)));
  assert.equal(await storage.getItem('session'), 'original');
});
