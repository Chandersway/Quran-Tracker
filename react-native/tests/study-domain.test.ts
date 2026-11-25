import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../src/content/quran';
import { absoluteAyahId, absoluteAyahLocation } from '../src/domain/study';

test('absolute mutashabihat ayah references map across surah boundaries and round-trip', () => {
  assert.deepEqual(absoluteAyahLocation(7, chapters), { absolute: 7, surah: 1, ayah: 7 });
  assert.deepEqual(absoluteAyahLocation(8, chapters), { absolute: 8, surah: 2, ayah: 1 });
  assert.deepEqual(absoluteAyahLocation(6236, chapters), { absolute: 6236, surah: 114, ayah: 6 });
  assert.equal(absoluteAyahId(2, 1, chapters), 8);
  assert.equal(absoluteAyahId(114, 6, chapters), 6236);
  assert.equal(absoluteAyahId(114, 7, chapters), null);
  assert.equal(absoluteAyahLocation(6237, chapters), null);
});
