import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeviceStorage, secureDeviceKey } from '../src/services/storage/deviceStorageCore';
import { deviceTransientKeys, pushDeviceKeys } from '../src/services/notifications/pushDeviceKeys';

function memory(seed: [string, string][] = []) {
  const values = new Map(seed);
  const reads: string[] = [];
  const writes: string[] = [];
  let failSet = false,
    failRemove = false;
  return {
    values,
    reads,
    writes,
    set failSet(value: boolean) {
      failSet = value;
    },
    set failRemove(value: boolean) {
      failRemove = value;
    },
    async getItem(key: string) {
      reads.push(key);
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      if (failSet) throw new Error('write interrupted');
      writes.push(key);
      values.set(key, value);
    },
    async removeItem(key: string) {
      if (failRemove) throw new Error('cleanup interrupted');
      values.delete(key);
    },
  };
}

test('only five device-transient keys migrate; personal state/preferences and reminders remain portable', async () => {
  const personal = [
    ['wirdna:state:v1', 'reading history'],
    [pushDeviceKeys.local, 'personal reminders'],
    ['wirdna:checklist:v1', 'checkmarks'],
  ] as [string, string][];
  const seed = deviceTransientKeys.map(
    (key, index) => [key, `original-${index}`] as [string, string],
  );
  const legacy = memory([...personal, ...seed]),
    secure = memory();
  const storage = createDeviceStorage(legacy, secure);
  await storage.migrate();
  assert.equal(deviceTransientKeys.length, 5);
  assert.ok(!deviceTransientKeys.some((key) => key === (pushDeviceKeys.local as string)));
  assert.deepEqual([...legacy.values], personal);
  for (const [key, value] of seed) assert.equal(await storage.getItem(key), value);
  assert.ok(legacy.reads.every((key) => deviceTransientKeys.some((allowed) => allowed === key)));
  assert.equal(new Set(deviceTransientKeys.map(secureDeviceKey)).size, 5);
  assert.ok(deviceTransientKeys.map(secureDeviceKey).every((key) => /^[\w.-]+$/.test(key)));
});

test('failed secure commit leaves the original value untouched and allows retry', async () => {
  const legacy = memory([[pushDeviceKeys.token, 'original token']]),
    secure = memory();
  secure.failSet = true;
  const storage = createDeviceStorage(legacy, secure);
  await assert.rejects(storage.getItem(pushDeviceKeys.token), /write interrupted/);
  assert.equal(legacy.values.get(pushDeviceKeys.token), 'original token');
  assert.equal(secure.values.size, 0);
  secure.failSet = false;
  assert.equal(await storage.getItem(pushDeviceKeys.token), 'original token');
  assert.equal(legacy.values.has(pushDeviceKeys.token), false);
});

test('secure data survives interrupted legacy cleanup and takes precedence on restart', async () => {
  const legacy = memory([[pushDeviceKeys.token, 'original token']]),
    secure = memory();
  legacy.failRemove = true;
  await assert.rejects(
    createDeviceStorage(legacy, secure).setItem(pushDeviceKeys.token, 'updated token'),
    /cleanup interrupted/,
  );
  assert.equal(legacy.values.get(pushDeviceKeys.token), 'original token');
  legacy.failRemove = false;
  assert.equal(
    await createDeviceStorage(legacy, secure).getItem(pushDeviceKeys.token),
    'updated token',
  );
  assert.equal(legacy.values.has(pushDeviceKeys.token), false);
});

test('durable removal tombstone prevents old opt-in resurrection after cleanup failure', async () => {
  const legacy = memory([[pushDeviceKeys.registered, 'registered']]),
    secure = memory();
  legacy.failRemove = true;
  await assert.rejects(
    createDeviceStorage(legacy, secure).removeItem(pushDeviceKeys.registered),
    /cleanup interrupted/,
  );
  assert.equal(legacy.values.get(pushDeviceKeys.registered), 'registered');
  legacy.failRemove = false;
  assert.equal(await createDeviceStorage(legacy, secure).getItem(pushDeviceKeys.registered), null);
  assert.equal(legacy.reads.length, 0);
  assert.equal(legacy.values.has(pushDeviceKeys.registered), false);
});

test('concurrent migration/write is serialized and the registration gate is published last', async () => {
  const legacy = memory([[pushDeviceKeys.token, 'old']]),
    secure = memory();
  const storage = createDeviceStorage(legacy, secure);
  await Promise.all([
    storage.getItem(pushDeviceKeys.token),
    storage.setItem(pushDeviceKeys.token, 'new'),
  ]);
  assert.equal(await storage.getItem(pushDeviceKeys.token), 'new');
  secure.writes.length = 0;
  await storage.multiSet([
    [pushDeviceKeys.token, 'newer'],
    [pushDeviceKeys.user, 'owner'],
    [pushDeviceKeys.registered, 'registered'],
  ]);
  assert.deepEqual(
    secure.writes,
    [pushDeviceKeys.token, pushDeviceKeys.user, pushDeviceKeys.registered].map(secureDeviceKey),
  );
  await storage.multiRemove([pushDeviceKeys.registered, pushDeviceKeys.user, pushDeviceKeys.token]);
  assert.equal(await storage.getItem(pushDeviceKeys.registered), null);
});

test('unknown personal keys and malformed secure values fail closed without deleting originals', async () => {
  const legacy = memory([[pushDeviceKeys.token, 'legacy']]),
    secure = memory();
  const storage = createDeviceStorage(legacy, secure);
  await assert.rejects(storage.setItem(pushDeviceKeys.local, 'do not move'), /Unsupported/);
  assert.equal(secure.values.size, 0);
  assert.equal(legacy.reads.length, 0);
  secure.values.set(secureDeviceKey(pushDeviceKeys.token), 'malformed private value');
  await assert.rejects(
    storage.getItem(pushDeviceKeys.token),
    /^Error: Device registration storage is invalid$/,
  );
  assert.equal(legacy.values.get(pushDeviceKeys.token), 'legacy');
  assert.equal(legacy.reads.length, 0);
});
