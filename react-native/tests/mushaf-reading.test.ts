import test from 'node:test';
import assert from 'node:assert/strict';
import { mushafPageEntry, mushafPageRange, mushafSpread } from '../src/domain/mushafReading';
import { appReducer } from '../src/state/reducer';
import { initialState } from '../src/state/models';
import { historyAyahEquivalent } from '../src/domain/readingMetrics';

test('printed book spreads retain Arabic reading direction and page boundaries', () => {
  assert.deepEqual(mushafSpread(1, 604, true), [2, 1]);
  assert.deepEqual(mushafSpread(2, 604, true), [2, 1]);
  assert.deepEqual(mushafSpread(3, 604, true), [4, 3]);
  assert.deepEqual(mushafSpread(638, 638, false), [638]);
});
test('an explicit page check-in stores exact known references once without marking a whole surah', () => {
  const range = mushafPageRange('hafs', 1);
  assert.deepEqual(range, { start: { surah: 1, ayah: 1 }, end: { surah: 1, ayah: 7 } });
  const entry = mushafPageEntry('hafs', 1, 'page-one', 'Page 1', 100, '2026-11-13');
  const action = { type: 'history/record' as const, entry };
  const once = appReducer(initialState, action);
  assert.equal(appReducer(once, action), once);
  assert.equal(once.history.length, 1);
  assert.deepEqual(once.progress, {});
  assert.equal(historyAyahEquivalent(entry), 7);
  assert.equal(mushafPageRange('hafs_indopak_15', 1), undefined);
  assert.throws(
    () => mushafPageEntry('hafs_indopak_15', 1, 'cover', 'Cover', 100, '2026-11-13'),
    /verified Quran/,
  );
});
