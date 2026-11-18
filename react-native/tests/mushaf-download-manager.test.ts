import test from 'node:test';
import assert from 'node:assert/strict';
import { createMushafDownloadManager } from '../src/services/mushaf/downloadManager';
import type { MushafDownloadPort } from '../src/services/mushaf/library';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function clock() {
  let time = 0;
  const callbacks = new Set<() => void>();
  return {
    now: () => time,
    advance(ms: number) {
      time += ms;
      callbacks.forEach((callback) => callback());
    },
    setInterval: ((callback: () => void) => {
      callbacks.add(callback);
      return callback;
    }) as unknown as typeof setInterval,
    clearInterval: ((callback: () => void) =>
      callbacks.delete(callback)) as unknown as typeof clearInterval,
  };
}
test('app download continues between subscribers and publishes stable immutable snapshots', async () => {
  const started = deferred(),
    finish = deferred();
  let saved = false;
  let signal: AbortSignal | undefined;
  const port: MushafDownloadPort = {
    has: async () => saved,
    fetch: async (_id, _url, _type, current) => {
      signal = current;
      started.resolve();
      await finish.promise;
      saved = true;
    },
  };
  const manager = createMushafDownloadManager(port);
  const unsubscribe = manager.subscribe(() => undefined);
  assert.equal(manager.start('hafs_madina_pdf'), true);
  await started.promise;
  const active = manager.getSnapshot();
  assert.strictEqual(manager.getSnapshot(), active);
  assert.ok(Object.isFrozen(active));
  assert.ok(Object.isFrozen(active.active));
  unsubscribe();
  const stopNext = manager.subscribe(() => undefined);
  assert.equal(signal?.aborted, false);
  assert.equal(
    manager.start('warsh_maknoon'),
    false,
    'another screen cannot start conflicting work',
  );
  finish.resolve();
  await manager.whenSettled();
  assert.equal(manager.getSnapshot().lastTask?.status, 'completed');
  assert.equal(manager.getSnapshot().installed.hafs_madina_pdf?.ready, true);
  assert.equal(active.active?.status, 'downloading', 'previous snapshots never change');
  stopNext();
});
test('resumed pages count cached work in completion but exclude it from ETA speed', async () => {
  const timer = clock(),
    third = deferred(),
    finish = deferred();
  const saved = new Set(Array.from({ length: 600 }, (_, index) => index + 1));
  let count = 0;
  const port: MushafDownloadPort = {
    has: async (_id, page) => saved.has(page!),
    fetch: async (_id, _url, _type, _signal, page) => {
      count++;
      timer.advance(2000);
      if (count === 3) {
        third.resolve();
        await finish.promise;
      }
      saved.add(page!);
    },
  };
  const manager = createMushafDownloadManager(port, timer);
  manager.start('hafs_maknoon');
  await third.promise;
  const active = manager.getSnapshot().active!;
  assert.equal(active.completed, 602);
  assert.equal(active.total, 604);
  assert.equal(active.remainingSeconds, 4, 'two new pages in four seconds; two pages remain');
  assert.equal(active.fraction, 602 / 604);
  finish.resolve();
  await manager.whenSettled();
});
test('PDF estimates use byte rate; unknown size and stalled progress hide ETA', async () => {
  const timer = clock(),
    started = deferred(),
    finish = deferred();
  let report: ((done: number, total: number) => void) | undefined;
  const port: MushafDownloadPort = {
    has: async () => false,
    fetch: async (_id, _url, _type, _signal, _page, onBytes) => {
      report = onBytes;
      started.resolve();
      await finish.promise;
    },
  };
  const manager = createMushafDownloadManager(port, timer);
  manager.start('hafs_madina_pdf');
  await started.promise;
  timer.advance(2000);
  report!(200, 1000);
  assert.equal(manager.getSnapshot().active?.remainingSeconds, 8);
  assert.equal(manager.getSnapshot().active?.fraction, 0.2);
  timer.advance(10000);
  assert.equal(manager.getSnapshot().active?.stalled, true);
  assert.equal(manager.getSnapshot().active?.remainingSeconds, null);
  report!(250, 0);
  assert.equal(manager.getSnapshot().active?.total, null);
  assert.equal(manager.getSnapshot().active?.fraction, null);
  assert.equal(manager.getSnapshot().active?.remainingSeconds, null);
  assert.equal(manager.getSnapshot().active?.stalled, false);
  finish.resolve();
  await manager.whenSettled();
});
test('explicit cancellation waits for cleanup then permits retry without losing partial pages', async () => {
  const started = deferred();
  const saved = new Set<number>([1, 2]);
  let calls = 0;
  const port: MushafDownloadPort = {
    has: async (_id, page) => saved.has(page!),
    fetch: async (_id, _url, _type, signal, page) => {
      calls++;
      if (calls === 1) {
        started.resolve();
        await new Promise<void>((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }),
        );
      }
      saved.add(page!);
    },
  };
  const manager = createMushafDownloadManager(port);
  manager.start('hafs_maknoon');
  await started.promise;
  manager.cancel();
  assert.equal(manager.getSnapshot().active?.status, 'cancelling');
  assert.equal(manager.start('hafs_maknoon'), false);
  await manager.whenSettled();
  assert.equal(manager.getSnapshot().lastTask?.status, 'cancelled');
  assert.equal(manager.getSnapshot().installed.hafs_maknoon?.count, 2);
  assert.equal(manager.retry(), true);
  await manager.whenSettled();
  assert.equal(manager.getSnapshot().lastTask?.status, 'completed');
  assert.equal(saved.size, 604);
});
test('failed transfer settles observably and retry can complete', async () => {
  let fail = true,
    saved = false;
  const port: MushafDownloadPort = {
    has: async () => saved,
    fetch: async () => {
      if (fail) throw new Error('No storage');
      saved = true;
    },
  };
  const manager = createMushafDownloadManager(port);
  manager.start('hafs_madina_pdf');
  await manager.whenSettled();
  assert.equal(manager.getSnapshot().lastTask?.status, 'failed');
  assert.equal(manager.getSnapshot().lastTask?.error, 'No storage');
  assert.equal(manager.getSnapshot().active, null);
  fail = false;
  manager.retry();
  await manager.whenSettled();
  assert.equal(manager.getSnapshot().lastTask?.status, 'completed');
});
test('cancellation during shared preparation never starts a fetch afterwards', async () => {
  const prepared = deferred();
  let fetches = 0;
  const manager = createMushafDownloadManager(
    {
      has: async () => false,
      fetch: async () => {
        fetches++;
      },
    },
    { prepare: () => prepared.promise },
  );
  manager.start('hafs_madina_pdf');
  manager.cancel();
  assert.equal(manager.getSnapshot().active?.status, 'cancelling');
  prepared.resolve();
  await manager.whenSettled();
  assert.equal(fetches, 0);
  assert.equal(manager.getSnapshot().lastTask?.status, 'cancelled');
});
test('refresh coalesces even when a synchronous subscriber requests refresh again', async () => {
  const prepared = deferred();
  const manager = createMushafDownloadManager(
    { has: async () => false, fetch: async () => undefined },
    { prepare: () => prepared.promise },
  );
  let nested: Promise<void> | null = null;
  manager.subscribe(() => {
    if (manager.getSnapshot().checking) nested = manager.refresh();
  });
  const outer = manager.refresh();
  assert.strictEqual(nested, outer);
  prepared.resolve();
  await outer;
  assert.equal(manager.getSnapshot().checking, false);
});
