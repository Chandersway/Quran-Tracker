import { deviceTransientKeys } from '../notifications/pushDeviceKeys';

type StoragePort = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};
type DeviceValue = { version: 1; value: string | null };
const allowed = new Set<string>(deviceTransientKeys);

/** Fixed ASCII keys become SecureStore-compatible names without collisions. */
export function secureDeviceKey(key: string): string {
  if (!allowed.has(key)) throw new Error('Unsupported device-transient storage key');
  return `device.${Array.from(key, (char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('')}`;
}

/** Secure commit precedes legacy cleanup; tombstones prevent revoked values reappearing. */
export function createDeviceStorage(legacy: StoragePort, secure: StoragePort) {
  const queues = new Map<string, Promise<unknown>>();
  function serial<T>(key: string, work: (secureKey: string) => Promise<T>): Promise<T> {
    let secureKey: string;
    try {
      secureKey = secureDeviceKey(key);
    } catch (error) {
      return Promise.reject(error);
    }
    const task = (queues.get(key) ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => work(secureKey));
    queues.set(key, task);
    void task
      .finally(() => {
        if (queues.get(key) === task) queues.delete(key);
      })
      .catch(() => undefined);
    return task;
  }
  function decode(raw: string): DeviceValue {
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error('Device registration storage is invalid');
    }
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('value' in value) ||
      (value.value !== null && typeof value.value !== 'string')
    )
      throw new Error('Device registration storage is invalid');
    return value as DeviceValue;
  }
  const storage = {
    getItem(key: string): Promise<string | null> {
      return serial(key, async (secureKey) => {
        const raw = await secure.getItem(secureKey);
        if (raw !== null) {
          const saved = decode(raw);
          await legacy.removeItem(key);
          return saved.value;
        }
        const value = await legacy.getItem(key);
        await secure.setItem(secureKey, JSON.stringify({ version: 1, value }));
        await legacy.removeItem(key);
        return value;
      });
    },
    setItem(key: string, value: string): Promise<void> {
      return serial(key, async (secureKey) => {
        await secure.setItem(secureKey, JSON.stringify({ version: 1, value }));
        await legacy.removeItem(key);
      });
    },
    removeItem(key: string): Promise<void> {
      return serial(key, async (secureKey) => {
        await secure.setItem(secureKey, JSON.stringify({ version: 1, value: null }));
        await legacy.removeItem(key);
      });
    },
    async multiSet(entries: readonly (readonly [string, string])[]): Promise<void> {
      entries.forEach(([key]) => secureDeviceKey(key));
      // Keep token/user writes ahead of the registration gate, matching caller order.
      for (const [key, value] of entries) await storage.setItem(key, value);
    },
    async multiRemove(keys: readonly string[]): Promise<void> {
      keys.forEach(secureDeviceKey);
      for (const key of keys) await storage.removeItem(key);
    },
    async migrate(): Promise<void> {
      await Promise.all(deviceTransientKeys.map((key) => storage.getItem(key)));
    },
  };
  return storage;
}
