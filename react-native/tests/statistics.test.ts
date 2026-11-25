import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReadingEntry } from '../src/state/models';
import {
  statsHistoryOpening,
  statsHistoryRange,
  statsHistoryTitle,
  statsPeriodHistory,
  statsReadingBuckets,
  statsRingSegment,
  statsIsoWeek,
  statsHistoryGroups,
  statsOverview,
} from '../src/domain/statistics';
import { appReducer } from '../src/state/reducer';
import { initialState } from '../src/state/models';

const row = (
  id: number,
  type: string,
  number = 1,
  contentType = '',
  amount = 1,
  action = 'read',
  timestamp = id,
): ReadingEntry => ({
  id: String(id),
  type,
  surahId: number,
  surahName: `${type} ${number}`,
  contentType,
  amount,
  action,
  timestamp,
  dateKey: '',
  sourceKey: null,
  ownerId: '',
});

test('Kotlin drilldown contract counts registrations and retains quantities/content identity', () => {
  const buckets = statsReadingBuckets(
    [
      row(1, 'rub', 1, '', 4),
      row(2, 'rub', 1, 'juz'),
      row(3, 'surah', 1, '', 1, 'memorized'),
      row(4, 'rub'),
    ],
    'type',
  );
  assert.equal(
    buckets.reduce((sum, bucket) => sum + bucket.rows.length, 0),
    3,
  );
  assert.deepEqual(
    buckets.find((bucket) => bucket.key === 'rub')!.rows.map((row) => row.id),
    ['4', '1'],
  );
  assert.equal(buckets.find((bucket) => bucket.key === 'rub')!.rows.at(-1)!.amount, 4);
});
test('Hizb buckets include measured/content rows; top eight retain original registrations', () => {
  const buckets = statsReadingBuckets(
    [
      row(1, 'rub', 2),
      row(2, 'hizb', 2),
      row(3, 'ayah', 2, 'hizb'),
      row(4, 'surah', 2),
      row(5, 'hizb', 3),
    ],
    'hizb',
  );
  assert.deepEqual(
    buckets.find((bucket) => bucket.key === '2')!.rows.map((row) => row.id),
    ['3', '2', '1'],
  );
  const surahs = statsReadingBuckets(
    [...Array.from({ length: 10 }, (_, i) => row(i + 1, 'surah', i + 1)), row(11, 'surah', 10)],
    'surah',
  );
  assert.equal(surahs.length, 8);
  assert.equal(surahs[0]!.key, '10');
  assert.equal(surahs.flatMap((bucket) => bucket.rows).length, 9);
});
test('seven calendar days use inclusive local start and exclusive next midnight', () => {
  const now = new Date(2026, 9, 27, 12);
  const start = new Date(2026, 9, 21).getTime();
  const end = new Date(2026, 9, 28).getTime();
  const history = [
    row(1, 'surah', 1, '', 1, 'read', start - 1),
    row(2, 'surah', 1, '', 1, 'read', start),
    row(3, 'surah', 1, '', 1, 'read', end - 1),
    row(4, 'surah', 1, '', 1, 'read', end),
  ];
  assert.deepEqual(
    statsPeriodHistory(history, 'week', now).map((row) => row.id),
    ['2', '3'],
  );
  assert.deepEqual(statsPeriodHistory(history, 'all', now), history);
});
test('source ring hit testing is clockwise and rejects center/outside/empty rings', () => {
  assert.equal(statsRingSegment(50, 2, 100, 10, [1, 1]), 0);
  assert.equal(statsRingSegment(98, 50, 100, 10, [1, 1]), 0);
  assert.equal(statsRingSegment(2, 50, 100, 10, [1, 1]), 1);
  assert.equal(statsRingSegment(50, 50, 100, 10, [1, 1]), null);
  assert.equal(statsRingSegment(101, 50, 100, 10, [1, 1]), null);
  assert.equal(statsRingSegment(50, 2, 100, 10, []), null);
  assert.equal(statsRingSegment(50, 2, 100, 10, [0, 3]), 1);
});
test('exact partition ranges include partial Hizb and reject ambiguous quantities', () => {
  assert.deepEqual(statsHistoryRange(row(1, 'hizb'))?.end, { surah: 2, ayah: 74 });
  assert.deepEqual(statsHistoryRange(row(1, 'juz', 30))?.end, { surah: 114, ayah: 6 });
  assert.deepEqual(statsHistoryRange({ ...row(1, 'rub'), surahName: 'Hizb 1 (1/4)' })?.end, {
    surah: 2,
    ayah: 25,
  });
  assert.deepEqual(statsHistoryRange({ ...row(1, 'hizb'), surahName: 'Hizb 1 (1/2)' })?.start, {
    surah: 2,
    ayah: 26,
  });
  assert.equal(statsHistoryRange(row(1, 'rub')), null);
  assert.equal(statsHistoryRange(row(1, 'hizb', 0)), null);
  assert.equal(statsHistoryRange(row(1, 'hizb', 1, '', 2)), null);
});
test('history titles use content identity and Hizb rows show the common opening', () => {
  assert.equal(statsHistoryTitle(row(1, 'ayah', 6, 'juz')), 'Juz 6');
  assert.equal(
    statsHistoryTitle({ ...row(1, 'rub', 6), surahName: 'Hizb 6 (1/4) - an ayah' }),
    'Hizb 6 - Rub 1/4',
  );
  assert.equal(statsHistoryOpening(row(1, 'surah')), null);
  assert.equal(
    statsHistoryOpening(row(1, 'hizb', 3)),
    statsHistoryOpening({ ...row(1, 'rub', 3), surahName: 'Hizb 3 (1/4)' }),
  );
});

test('source clear-reading action preserves hifz, memorization, plans and settings', () => {
  const recorded = appReducer(initialState, {
    type: 'checkIn',
    kind: 'surah',
    number: 1,
    name: 'Al-Fatihah',
    requestId: 'read-1',
    now: 100,
    date: '2026-11-13',
  });
  const assessed = appReducer(recorded, {
    type: 'hifz',
    kind: 'surah',
    number: 1,
    score: 80,
    now: 110,
  });
  const cleared = appReducer(assessed, { type: 'history/clear' });
  assert.deepEqual(cleared.history, []);
  assert.equal(cleared.progress.surah_1!.readCount, 0);
  assert.equal(cleared.progress.surah_1!.isRead, false);
  assert.equal(cleared.progress.surah_1!.progress, 80);
  assert.equal(cleared.progress.surah_1!.hasHifzScore, true);
  assert.equal(cleared.progress.surah_1!.isMemorized, assessed.progress.surah_1!.isMemorized);
  assert.equal(cleared.plans, assessed.plans);
  assert.equal(cleared.preferences, assessed.preferences);
});

test('Home Juz drilldown uses the original matching registrations including measured content', () => {
  const input = [
    row(1, 'juz', 2),
    row(2, 'ayah', 2, 'juz', 207),
    row(3, 'juz', 3),
    row(4, 'hizb', 2),
    row(5, 'juz', 2, '', 1, 'memorized'),
  ];
  const buckets = statsReadingBuckets(input, 'juz');
  assert.deepEqual(
    buckets.map((bucket) => bucket.key),
    ['2', '3'],
  );
  assert.deepEqual(
    buckets[0]!.rows.map((entry) => entry.id),
    ['2', '1'],
  );
  assert.equal(buckets[0]!.rows[0], input[1]);
  assert.equal(statsHistoryRange(buckets[0]!.rows[0]!), null);
  assert.deepEqual(statsHistoryRange(buckets[0]!.rows[1]!)?.start, { surah: 2, ayah: 142 });
});

test('history day/week/month grouping retains all actions and respects ISO year boundary', () => {
  const monday = new Date(2025, 11, 29, 12).getTime();
  const january = new Date(2026, 0, 2, 12).getTime();
  assert.deepEqual(statsIsoWeek(monday), { year: 2026, week: 1 });
  const input = [
    row(1, 'surah', 1, '', 1, 'read', monday),
    row(2, 'surah', 2, '', 1, 'memorized', january),
  ];
  assert.equal(statsHistoryGroups(input, 'day').length, 2);
  assert.equal(statsHistoryGroups(input, 'month').length, 2);
  const weeks = statsHistoryGroups(input, 'week');
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0]!.key, '2026-W01');
  assert.deepEqual(
    weeks[0]!.items.map((item) => item.timestamp),
    [january, monday],
  );
});

test('history summarizes legacy Rub rows by day and Hizb, distinct quarters without changing ring counts', () => {
  const timestamp = new Date(2026, 10, 13, 12).getTime();
  const input = [1, 2, 2, 3, 4].map((quarter, index) => ({
    ...row(index + 1, 'hizb', 1, '', 1, 'read', timestamp + index),
    dateKey: '2026-11-13',
    surahName: `Hizb 1 (${['1/4', '1/2', '3/4', '1'][quarter - 1]})`,
    extraInfo: index === 1 ? 'source opening' : '',
  }));
  const nextDay = {
    ...input[0]!,
    id: 'next',
    dateKey: '2026-11-14',
    timestamp: timestamp + 86400000,
  };
  const groups = statsHistoryGroups([...input, nextDay], 'month');
  const items = groups[0]!.items;
  assert.equal(items.length, 2);
  const summary = items[1]!;
  assert.equal(summary.kind, 'hizb-day');
  if (summary.kind !== 'hizb-day') throw new Error('Expected summary');
  assert.deepEqual(summary.rubNumbers, [1, 2, 3, 4]);
  assert.equal(summary.rows.length, 5);
  assert.equal(summary.extraInfo, 'source opening');
  assert.equal(statsReadingBuckets(input, 'hizb')[0]!.rows.length, 5);
});

test('new Mushaf exact ayah range wins over page/amount and rejects corrupt or reversed bounds', () => {
  const entry = {
    ...row(1, 'page', 0, 'page', 1),
    ayahRange: { start: { surah: 2, ayah: 6 }, end: { surah: 2, ayah: 16 } },
  };
  assert.deepEqual(statsHistoryRange(entry), entry.ayahRange);
  assert.equal(
    statsHistoryRange({
      ...entry,
      ayahRange: { start: entry.ayahRange.end, end: entry.ayahRange.start },
    }),
    null,
  );
  assert.equal(
    statsHistoryRange({
      ...entry,
      ayahRange: { start: { surah: 2, ayah: 999 }, end: entry.ayahRange.end },
    }),
    null,
  );
});

test('source overview uses quantities, read+memorized streak and complete quarter progress without double counting', () => {
  const now = new Date(2026, 10, 13, 12);
  const reads = [
    row(1, 'surah', 1, '', 2, 'read', +now),
    { ...row(2, 'surah', 2, '', 1, 'memorized', +now - 86400000), dateKey: '' },
  ];
  let state = initialState;
  for (const hizb of [1, 2])
    state = appReducer(state, {
      type: 'checkIn',
      kind: 'hizb',
      number: hizb,
      name: `Hizb ${hizb}`,
      requestId: `hizb-${hizb}`,
      now: +now,
      date: '2026-11-13',
    });
  const summary = statsOverview(reads, state.progress, now);
  assert.equal(summary.readActions, 1);
  assert.equal(summary.surahReads, 2);
  assert.equal(summary.ayahs, 108);
  assert.equal(summary.points, 108);
  assert.equal(summary.pages, 11);
  assert.equal(summary.streak, 2);
  assert.equal(summary.rubDone, 8);
  assert.equal(summary.hizbDone, 2);
  assert.equal(summary.juzDone, 1);
});
