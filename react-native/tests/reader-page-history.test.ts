import assert from 'node:assert/strict';
import test from 'node:test';
import { readPageMetrics } from '../src/features/quran/model/readPageMetrics';
import { mushafPageEntry, mushafPageRange } from '../src/domain/mushafReading';
import type { ReadingEntry } from '../src/state/models';

const entry = (patch: Partial<ReadingEntry>): ReadingEntry => ({
  id: 'record',
  surahId: 2,
  surahName: 'Al-Baqarah',
  type: 'ayah',
  action: 'read',
  amount: 1,
  timestamp: 1,
  dateKey: '2026-11-14',
  sourceKey: null,
  ownerId: '',
  contentType: 'ayah',
  ...patch,
});

test('page history stays edition-specific even when adjacent pages share a continued ayah', () => {
  const history = [mushafPageEntry('warsh_maknoon', 85, 'warsh', '85', 1, '2026-11-14')];
  const warsh = readPageMetrics(history, 'warsh_maknoon', 604);
  assert.deepEqual(warsh(85, 85), { read: true });
  assert.deepEqual(warsh(84, 84), { read: false });
  assert.deepEqual(warsh(85, 86), { read: false });
  const hafs = readPageMetrics(history, 'hafs', 604);
  assert.deepEqual(hafs(85, 85), { read: false });
  assert.deepEqual(readPageMetrics(history, 'hafs_indopak_15', 604)(1, 10), undefined);
  assert.deepEqual(readPageMetrics(history, 'hafs_maknoon', 604)(1, 10), { read: false });
  const originalHafs = [mushafPageEntry('hafs_maknoon', 85, 'original', '85', 1, '2026-11-14')];
  assert.deepEqual(readPageMetrics(originalHafs, 'hafs_maknoon', 604)(85, 85), { read: true });
  assert.deepEqual(readPageMetrics(originalHafs, 'hafs', 604)(85, 85), { read: false });
});

test('whole known passages combine across records, but holes and memorisation never claim reading', () => {
  const range = mushafPageRange('hafs', 3)!;
  assert.equal(range.start.surah, range.end.surah);
  const middle = Math.floor((range.start.ayah + range.end.ayah) / 2);
  const first = entry({
    ayahRange: { start: range.start, end: { surah: range.start.surah, ayah: middle } },
  });
  const second = entry({
    ayahRange: { start: { surah: range.start.surah, ayah: middle + 1 }, end: range.end },
  });
  assert.deepEqual(readPageMetrics([first, second], 'hafs', 604)(3, 3), { read: true });
  assert.deepEqual(readPageMetrics([first], 'hafs', 604)(3, 3), { read: false });
  assert.deepEqual(
    readPageMetrics([first, { ...second, action: 'memorized' }], 'hafs', 604)(3, 3),
    { read: false },
  );
  assert.deepEqual(
    readPageMetrics([entry({ amount: 12, contentType: 'page' })], 'hafs', 604)(3, 3),
    { read: false },
  );
  assert.deepEqual(
    readPageMetrics([entry({ contentType: 'surah', surahId: 1 })], 'hafs', 604)(1, 1),
    { read: true },
  );
});

test('an aggregate tick is neutral when any represented page is unmapped', () => {
  const history = [mushafPageEntry('hafs', 1, 'one', '1', 1, '2026-11-14')];
  const metric = readPageMetrics(history, 'hafs', 604);
  assert.equal(metric(0, 1), undefined);
  assert.equal(metric(604, 605), undefined);
  assert.equal(metric(2, 1), undefined);
  assert.deepEqual(metric(1, 2), { read: false });
});
