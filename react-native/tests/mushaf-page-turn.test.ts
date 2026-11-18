import assert from 'node:assert/strict';
import test from 'node:test';
import { createReleasedMushafTurn } from '../src/features/quran/gestures/mushafPageTurn';

test('a native swipe waits for the JS release/cancel dispatch before changing the page', async () => {
  const turns: number[] = [];
  const gesture = createReleasedMushafTurn((direction) => turns.push(direction));
  gesture.begin();
  gesture.request(1);
  await Promise.resolve();
  assert.deepEqual(turns, [], 'a queued native UP alone cannot unmount the active word responder');
  gesture.release();
  assert.deepEqual(turns, [], 'release listeners finish before navigation');
  await Promise.resolve();
  assert.deepEqual(turns, [1]);
});

test('native UP after an already-dispatched JS cancel still turns once and dispose cancels queued work', async () => {
  const turns: number[] = [];
  const gesture = createReleasedMushafTurn((direction) => turns.push(direction));
  gesture.begin();
  gesture.release();
  gesture.request(-1);
  await Promise.resolve();
  assert.deepEqual(turns, [-1]);
  gesture.begin();
  gesture.request(1);
  gesture.release();
  gesture.dispose();
  await Promise.resolve();
  assert.deepEqual(turns, [-1]);
});

test('native and raw page results fulfill once regardless of delivery order or late duplicates', async () => {
  for (const nativeFirst of [true, false]) {
    const turns: number[] = [];
    const gesture = createReleasedMushafTurn((direction) => turns.push(direction));
    gesture.begin();
    if (nativeFirst) gesture.request(1);
    gesture.request(1); // Raw page classification at JS END.
    gesture.release();
    assert.deepEqual(turns, []);
    if (!nativeFirst) gesture.request(1);
    await Promise.resolve();
    gesture.request(1); // Native bridge delivery can arrive after the JS microtask.
    gesture.release();
    await Promise.resolve();
    assert.deepEqual(turns, [1]);
    gesture.begin();
    gesture.request(-1);
    gesture.release();
    await Promise.resolve();
    assert.deepEqual(turns, [1, -1], 'deduplication resets for a new actual touch');
  }
});
