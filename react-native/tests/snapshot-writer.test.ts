import assert from 'node:assert/strict';
import test from 'node:test';
import { createSnapshotWriter } from '../src/state/persistence/snapshotWriter';

function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('commit waits for actual persistence and coalesces changes from one event turn', async () => {
  const writing = gate();
  const writes: number[] = [];
  const writer = createSnapshotWriter(async (snapshot: number) => {
    writes.push(snapshot);
    await writing.promise;
  });
  let confirmed = false;
  const first = writer.save(1).then(() => {
    confirmed = true;
  });
  const second = writer.save(2);
  await Promise.resolve();
  assert.deepEqual(writes, [2]);
  assert.equal(confirmed, false);
  writing.resolve();
  await Promise.all([first, second]);
  assert.equal(confirmed, true);
});

test('new snapshots never overtake an in-flight write', async () => {
  const writing = gate();
  const writes: number[] = [];
  const writer = createSnapshotWriter(async (snapshot: number) => {
    writes.push(snapshot);
    if (snapshot === 1) await writing.promise;
  });
  const first = writer.save(1);
  await Promise.resolve();
  const second = writer.save(2);
  const third = writer.save(3);
  await Promise.resolve();
  assert.deepEqual(writes, [1]);
  writing.resolve();
  await Promise.all([first, second, third]);
  assert.deepEqual(writes, [1, 3]);
});

test('failed saves reject every affected caller and a retry restores the full snapshot', async () => {
  let fail = true;
  let stored = '';
  const status: Array<Error | null> = [];
  const writer = createSnapshotWriter(
    async (snapshot: string) => {
      if (fail) throw new Error('Disk full');
      stored = snapshot;
    },
    (error) => status.push(error),
  );
  const results = await Promise.allSettled([writer.save('first'), writer.save('latest')]);
  assert.ok(results.every((result) => result.status === 'rejected'));
  assert.equal(stored, '');
  assert.equal(status[0]?.message, 'Disk full');
  fail = false;
  await writer.save('latest');
  assert.equal(stored, 'latest');
  assert.equal(status.at(-1), null);
});
