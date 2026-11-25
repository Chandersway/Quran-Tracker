import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeHizbCounts,
  countHizbReadings,
  hizbDateBounds,
  hizbDateRange,
} from '../src/domain/hizbAnalytics';
import type { ReadingEntry } from '../src/state/models';

test('source Hizb periods use inclusive calendar dates and clamp month ends', () => {
  assert.equal(hizbDateRange('Week', '2026-09-26').from, '2026-09-20');
  assert.equal(hizbDateRange('Month', '2026-09-26').from, '2026-08-27');
  assert.equal(hizbDateRange('Year', '2026-09-26').from, '2025-09-27');
  assert.equal(hizbDateRange('Month', '2026-03-31').from, '2026-03-01');
  assert.equal(hizbDateRange('Year', '2024-02-29').from, '2023-03-01');
});
test('zero filling returns exactly sixty numerically ordered Hizbs', () => {
  const counts = completeHizbCounts([{ hizbNumber: 33, count: 3 }]);
  assert.deepEqual(
    counts.map((row) => row.hizbNumber),
    Array.from({ length: 60 }, (_, index) => index + 1),
  );
  assert.equal(counts[32]!.count, 3);
  assert.equal(counts[59]!.count, 0);
  assert.throws(() => hizbDateBounds({ from: '2026-09-27', through: '2026-09-26' }));
});
test('source SQL counts owner-scoped Hizb registrations, not amount or contentType', () => {
  const range = { from: '2026-11-13', through: '2026-11-13' };
  const [start, end] = hizbDateBounds(range);
  const row = (id: string, changes: Partial<ReadingEntry> = {}): ReadingEntry => ({
    id,
    type: 'hizb',
    contentType: 'hizb',
    surahId: 2,
    surahName: 'Hizb 2',
    action: 'read',
    amount: 5,
    ownerId: 'guest',
    timestamp: start,
    dateKey: '2026-11-13',
    sourceKey: null,
    ...changes,
  });
  const history = [
    row('start'),
    row('end', { timestamp: end }),
    row('before', { timestamp: start - 1 }),
    row('other-owner', { ownerId: 'other' }),
    row('rub', { type: 'rub' }),
    row('content-only', { type: 'ayah' }),
    row('review', { action: 'review' }),
    row('outside', { surahId: 61 }),
    row('rn-guest', { ownerId: '' }),
  ];
  assert.equal(countHizbReadings(history, range, 'guest')[1]!.count, 2);
  assert.equal(countHizbReadings(history, range, 'other')[1]!.count, 1);
});
test('source chart retains local-midnight calendar bounds across DST', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Amsterdam';
  try {
    const [start, end] = hizbDateBounds({ from: '2026-03-29', through: '2026-03-29' });
    assert.equal(end - start, 23 * 60 * 60 * 1000);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
