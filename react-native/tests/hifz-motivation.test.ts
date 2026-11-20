import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate } from '../src/domain/localDate';
import { appReducer } from '../src/state/reducer';
import { initialState, type ReadingEntry } from '../src/state/models';
import {
  explicitAssessments,
  inconsistentJuz,
  reviewDue,
  reviewIntervalDays,
} from '../src/domain/hifz';
import { motivationBonusPoints, motivationLevel, motivationStats } from '../src/domain/motivation';
import { historyAyahEquivalent, pageEquivalent } from '../src/domain/readingMetrics';

test('Hifz excludes zero, preserves independent Juz scores and advises at exactly 20 points', () => {
  let state = initialState;
  for (const [kind, number, score] of [
    ['hizb', 1, 60],
    ['hizb', 2, 79],
    ['juz', 1, 80],
    ['surah', 2, 0],
  ] as const)
    state = appReducer(state, { type: 'hifz', kind, number, score, now: 1000 });
  const items = explicitAssessments(state.progress);
  assert.equal(items.length, 3);
  assert.deepEqual(inconsistentJuz(items), [1]);
  assert.equal(state.progress.hizb_1?.progress, 60);
  const memorized = {
    ...state,
    progress: { ...state.progress, surah_2: { ...state.progress.surah_2!, isMemorized: true } },
  };
  assert.equal(
    appReducer(memorized, { type: 'hifz', kind: 'surah', number: 2, score: 0, now: 5 }).progress
      .surah_2?.isMemorized,
    true,
  );
  assert.equal(
    appReducer(state, { type: 'hifz', kind: 'surah', number: 1, score: 100, now: 5 }).progress
      .surah_1?.isMemorized,
    false,
  );
  assert.deepEqual(inconsistentJuz(items.filter((item) => item.number !== 2)), []);
  assert.deepEqual(
    [30, 31, 50, 51, 70, 71, 85, 86].map(reviewIntervalDays),
    [1, 2, 2, 4, 4, 7, 7, 14],
  );
  assert.equal(
    reviewDue({ kind: 'surah', number: 1, score: 30, assessedAt: 1000 }, 1000 + 86_400_000 * 3),
    -2,
  );
});
test('Motivation follows source integer equivalents, bonus thresholds and Monday boundary', () => {
  const now = new Date(2026, 10, 13, 12);
  const entry = (id: string, type: string, day: number, surahName = ''): ReadingEntry => ({
    id,
    type,
    amount: 1,
    action: 'read',
    surahId: 1,
    surahName,
    timestamp: +new Date(2026, 10, day, 10),
    dateKey: localDate(new Date(2026, 10, day)),
    sourceKey: id,
    ownerId: '',
    contentType: type,
  });
  const history = [
    entry('one', 'surah', 13),
    entry('two', 'hizb', 12),
    entry('three', 'hizb', 11, 'Hizb 1 (1/4)'),
    entry('old', 'juz', 8),
  ];
  assert.equal(historyAyahEquivalent(history[2]!), 25);
  assert.equal(pageEquivalent(11), 2);
  const stats = motivationStats(history, true, now);
  assert.equal(stats.total, 7 + 103 + 25 + 207 + 15);
  assert.equal(stats.week, 7 + 103 + 25 + 15);
  assert.equal(stats.streak, 3);
  assert.equal(stats.today, 17);
  assert.equal(motivationBonusPoints(false, 30), 50);
  assert.equal(motivationLevel(250).key, 'home.motivation.level3');
});
