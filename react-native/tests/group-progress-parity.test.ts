import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupDashboard,
  groupGoalProgress,
  groupLeaderboard,
  groupReadingTotals,
} from '../src/services/groups/groupMetrics';
import { canShareGroupProgress, groupProgressInput } from '../src/services/groups/groupProgress';
import { groupLanguageLabel, groupReadingLabel } from '../src/features/groups/groupProgressCopy';
import type { GroupProgressEntry } from '../src/services/groups/groupTypes';

const today = new Date(2026, 10, 17, 12);
const entries: GroupProgressEntry[] = [
  {
    user_id: 'one',
    unit: 'surah',
    amount: 1,
    source: 'group_manual:surah:1',
    occurred_on: '2026-11-17',
  },
  { user_id: 'one', unit: 'page', amount: 3, source: 'manual', occurred_on: '2026-11-16' },
  { user_id: 'two', unit: 'juz', amount: 2, source: 'manual', occurred_on: '2026-11-10' },
  { user_id: 'two', unit: 'hizb', amount: 1, source: 'manual', occurred_on: '2026-09-01' },
];
const rows = groupLeaderboard(
  [],
  entries,
  [{ user_id: 'two', total_points: 2000, weekly_points: 30, monthly_points: 70 }],
  today,
);

test('dashboard restores actual unit totals, active readers, recent entries and independent week/month leaders', () => {
  const dashboard = groupDashboard(rows);
  assert.equal(dashboard.readings, 4);
  assert.equal(dashboard.surah, 1);
  assert.equal(dashboard.juz, 2);
  assert.equal(dashboard.hizb, 1);
  assert.equal(dashboard.activeToday, 1);
  assert.equal(dashboard.totalAyahs, 554);
  assert.equal(dashboard.points, 2554);
  assert.equal(dashboard.bestWeek?.userId, 'one');
  assert.equal(dashboard.bestMonth?.userId, 'two');
  assert.equal(dashboard.recent[0]?.member.userId, 'one');
  assert.equal(dashboard.recent[0]?.entry.source, 'group_manual:surah:1');
  assert.equal(rows.find((row) => row.userId === 'one')?.streak, 2);
  assert.deepEqual(groupReadingTotals(entries).manualPages, 3);
});

test('goal progress uses reading equivalents, respects its period and keeps the achieved count above target', () => {
  assert.deepEqual(
    groupGoalProgress(
      rows,
      { progress_unit: 'page', goal_target: 50, goal_period: 'total' },
      today,
    ),
    { achieved: 55, target: 50, fraction: 1 },
  );
  assert.deepEqual(
    groupGoalProgress(
      rows,
      { progress_unit: 'page', goal_target: 50, goal_period: 'weekly' },
      today,
    ),
    { achieved: 3, target: 50, fraction: 0.06 },
  );
  assert.equal(
    groupGoalProgress(rows, { progress_unit: 'ayah', goal_target: 20, goal_period: 'daily' }, today)
      .achieved,
    7,
  );
  assert.equal(
    groupGoalProgress(rows, { progress_unit: 'surah', goal_target: 3, goal_period: 'total' }, today)
      .achieved,
    1,
  );
  assert.equal(
    groupGoalProgress(rows, { progress_unit: 'page', goal_target: 50, goal_period: 'none' }, today)
      .target,
    null,
  );
  assert.equal(
    groupGoalProgress([], { progress_unit: 'page', goal_target: 50, goal_period: 'total' }, today)
      .achieved,
    0,
  );
});

test('progress sharing requires both independent permissions and form values respect the server contract', () => {
  for (const permissions of [[], ['post.create'], ['progress.create']])
    assert.equal(canShareGroupProgress({ permissions }), false);
  assert.equal(canShareGroupProgress({ permissions: ['progress.create', 'post.create'] }), true);
  assert.deepEqual(groupProgressInput('juz', '1', '30'), {
    unit: 'juz',
    amount: 1,
    source: 'group_manual:juz:30',
  });
  assert.equal(groupProgressInput('juz', '2', '30').source, 'manual');
  for (const amount of ['', '0', '1.5', '10001', 'NaN'])
    assert.throws(() => groupProgressInput('page', amount, ''));
  assert.throws(() => groupProgressInput('juz', '1', '31'));
  assert.throws(() => groupProgressInput('not-a-unit', '1', ''));
});

test('reading descriptions retain numbered Quran references and stored language metadata', () => {
  const label = groupReadingLabel(
    entries[0]!,
    'ar',
    (key) => key,
    (key, ...args) => `${key}:${args.join(',')}`,
  );
  assert.equal(label, 'common.surahNumber:١');
  assert.equal(groupLanguageLabel('ar', 'nl'), 'Arabisch');
  assert.equal(groupLanguageLabel('fr', 'en'), 'French');
  assert.equal(groupLanguageLabel('ur', 'en'), 'ur');
});

test('group today and streak use SQL UTC dates across Berlin local midnight', () => {
  const now = new Date('2026-11-18T00:30:00+01:00');
  const entries: GroupProgressEntry[] = ['2026-11-16', '2026-11-17'].map((occurred_on) => ({
    user_id: 'reader',
    unit: 'page',
    amount: 1,
    source: 'manual',
    occurred_on,
  }));
  const rows = groupLeaderboard([], entries, [], now);
  assert.equal(rows[0]?.activeToday, true);
  assert.equal(rows[0]?.streak, 2);
  assert.equal(
    groupGoalProgress(rows, { progress_unit: 'page', goal_period: 'daily', goal_target: 1 }, now)
      .achieved,
    1,
  );
  const afterUtcMidnight = new Date('2026-11-18T01:01:00+01:00');
  const after = groupLeaderboard([], entries, [], afterUtcMidnight);
  assert.equal(after[0]?.activeToday, false);
  assert.equal(after[0]?.streak, 2, 'Yesterday can end an ongoing streak');
  assert.equal(
    groupGoalProgress(
      after,
      { progress_unit: 'page', goal_period: 'daily', goal_target: 1 },
      afterUtcMidnight,
    ).achieved,
    0,
  );
});

test('UTC group windows cross year and leap-month boundaries and exclude future dates', () => {
  const entries = (dates: string[]): GroupProgressEntry[] =>
    dates.map((occurred_on) => ({
      user_id: 'reader',
      unit: 'ayah',
      amount: 1,
      source: 'manual',
      occurred_on,
    }));
  const now = new Date('2026-12-31T16:15:00-08:00'); // 1 January in the server calendar.
  const rows = groupLeaderboard(
    [],
    entries([
      '2026-12-02',
      '2026-12-03',
      '2026-12-25',
      '2026-12-26',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]),
    [],
    now,
  );
  assert.equal(rows[0]?.activeToday, true);
  assert.equal(rows[0]?.streak, 2);
  assert.equal(rows[0]?.weeklyPoints, 3);
  assert.equal(rows[0]?.monthlyPoints, 5);
  assert.equal(
    groupGoalProgress(rows, { progress_unit: 'ayah', goal_period: 'weekly', goal_target: 20 }, now)
      .achieved,
    3,
  );
  assert.equal(
    groupGoalProgress(rows, { progress_unit: 'ayah', goal_period: 'monthly', goal_target: 20 }, now)
      .achieved,
    5,
  );
  const leapNow = new Date('2028-03-01T00:05:00Z');
  const leap = groupLeaderboard(
    [],
    entries(['2028-01-31', '2028-02-01', '2028-02-29', '2028-03-01']),
    [],
    leapNow,
  );
  assert.equal(leap[0]?.monthlyPoints, 3);
  assert.equal(leap[0]?.streak, 2);
  assert.equal(
    groupGoalProgress(
      leap,
      { progress_unit: 'ayah', goal_period: 'monthly', goal_target: 20 },
      leapNow,
    ).achieved,
    3,
  );
});
