export interface SecureDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
type Index = { version: 1; generation: string; chunks: number };
function parseIndex(raw: string | null): Index | null {
  if (raw === null) return null;
  const index = JSON.parse(raw) as Index;
  if (
    index.version !== 1 ||
    !/^[a-z0-9-]+$/.test(index.generation) ||
    !Number.isInteger(index.chunks) ||
    index.chunks < 1 ||
    index.chunks > 1000
  )
    throw new Error('The secure session index is invalid.');
  return index;
}

/** Generation keys make session writes atomic even if a process dies mid-write. */
export function createSecureSessionStorage(driver: SecureDriver) {
  const queues = new Map<string, Promise<unknown>>();
  function serial<T>(key: string, work: () => Promise<T>): Promise<T> {
    if (!/^[\w.-]+$/.test(key)) return Promise.reject(new Error('Unsupported secure storage key.'));
    const task = (queues.get(key) ?? Promise.resolve()).catch(() => undefined).then(work);
    queues.set(key, task);
    return task;
  }
  const chunkKey = (key: string, index: Index, chunk: number) =>
    `wirdna.${key}.${index.generation}.${chunk}`;
  return {
    getItem(key: string): Promise<string | null> {
      return serial(key, async () => {
        const index = parseIndex(await driver.get(`wirdna.${key}`));
        if (!index) return null;
        const chunks = await Promise.all(
          Array.from({ length: index.chunks }, (_, i) => driver.get(chunkKey(key, index, i))),
        );
        if (chunks.some((chunk) => chunk === null))
          throw new Error('The secure session is incomplete. Please sign in again.');
        return chunks.join('');
      });
    },
    setItem(key: string, value: string): Promise<void> {
      return serial(key, async () => {
        // 400 UTF-16 units stay below historical 2KB Keychain limits, including Unicode.
        const chunks: string[] = [];
        let chunk = '',
          symbols = 0;
        for (const symbol of value) {
          if (symbols === 400) {
            chunks.push(chunk);
            chunk = '';
            symbols = 0;
          }
          chunk += symbol;
          symbols++;
        }
        if (chunk || chunks.length === 0) chunks.push(chunk);
        if (chunks.length > 1000) throw new Error('The secure session is too large to store.');
        const previous = parseIndex(await driver.get(`wirdna.${key}`));
        const next: Index = {
          version: 1,
          generation: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
          chunks: chunks.length,
        };
        try {
          for (let i = 0; i < chunks.length; i++)
            await driver.set(chunkKey(key, next, i), chunks[i]!);
          await driver.set(`wirdna.${key}`, JSON.stringify(next));
        } catch (error) {
          await Promise.allSettled(chunks.map((_, i) => driver.remove(chunkKey(key, next, i))));
          throw error;
        }
        if (previous)
          await Promise.allSettled(
            Array.from({ length: previous.chunks }, (_, i) =>
              driver.remove(chunkKey(key, previous, i)),
            ),
          );
      });
    },
    removeItem(key: string): Promise<void> {
      return serial(key, async () => {
        const index = parseIndex(await driver.get(`wirdna.${key}`));
        await driver.remove(`wirdna.${key}`);
        if (index)
          await Promise.allSettled(
            Array.from({ length: index.chunks }, (_, i) => driver.remove(chunkKey(key, index, i))),
          );
      });
    },
  };
}
