import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clipSeekPosition,
  clipWindow,
  normalizePlaybackSpeed,
  normalizeSkipInterval,
} from '../src/domain/audioPlayback';

test('source speed and skip preferences normalize to supported values', () => {
  assert.equal(normalizePlaybackSpeed(1.7), 1.75);
  assert.equal(normalizePlaybackSpeed(NaN), 1);
  assert.equal(normalizeSkipInterval(5), 5);
  assert.equal(normalizeSkipInterval(30), 10);
});
test('segmented audio displays and seeks relative to the selected passage', () => {
  assert.deepEqual(clipWindow(42, 60, 200), { start: 42, duration: 18 });
  assert.equal(clipSeekPosition(5, 42, 60, 200), 47);
  assert.equal(clipSeekPosition(-10, 42, 60, 200), 42);
  assert.equal(clipSeekPosition(50, 42, 60, 200), 60);
});
