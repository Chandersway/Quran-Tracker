import assert from 'node:assert/strict';
import test from 'node:test';
import { nextAudioQueueCursor } from '../src/services/audio/audio-queue';

test('queue plays each item once before completing', () => {
  let cursor = { index: 0, round: 1, rounds: 1 };
  cursor = nextAudioQueueCursor(cursor, 3)!;
  assert.deepEqual(cursor, { index: 1, round: 1, rounds: 1 });
  cursor = nextAudioQueueCursor(cursor, 3)!;
  assert.deepEqual(cursor, { index: 2, round: 1, rounds: 1 });
  assert.equal(nextAudioQueueCursor(cursor, 3), null);
});

test('finite rounds loop to the first item and continuous rounds never complete', () => {
  assert.deepEqual(nextAudioQueueCursor({ index: 1, round: 1, rounds: 2 }, 2), {
    index: 0,
    round: 2,
    rounds: 2,
  });
  assert.deepEqual(nextAudioQueueCursor({ index: 1, round: 80, rounds: 0 }, 2), {
    index: 0,
    round: 81,
    rounds: 0,
  });
});

test('empty and exhausted queues complete; malformed cursors are rejected', () => {
  assert.equal(nextAudioQueueCursor({ index: 0, round: 1, rounds: 1 }, 0), null);
  assert.equal(nextAudioQueueCursor({ index: 3, round: 1, rounds: 1 }, 2), null);
  assert.throws(() => nextAudioQueueCursor({ index: 0, round: 0, rounds: 1 }, 2), RangeError);
});
