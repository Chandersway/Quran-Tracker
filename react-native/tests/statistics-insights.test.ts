import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dailyGoalSuccess,
  hizbCoverage,
  khatmaForecast,
  longestStreak,
  readingBars,
  readingHeatmap,
} from '../src/domain/statisticsInsights';
import { groupContribution } from '../src/services/groups/groupMetrics';
import type { GroupLeaderboardRow } from '../src/services/groups/groupTypes';
import { initialState, type Progress, type ReadingEntry } from '../src/state/models';
import { appReducer } from '../src/state/reducer';

const read = (dateKey: string, amount = 1, type = 'pages', action = 'read'): ReadingEntry => ({
  id: `${dateKey}-${type}-${amount}-${action}`,
  surahId: 1,
  surahName: '',
  type,
  action,
  amount,
  timestamp: new Date(`${dateKey}T10:00:00`).getTime(),
  dateKey,
  sourceKey: null,
  ownerId: '',
  contentType: '',
});

const mark = (id: string, type: Progress['type'], referenceId: number, extra: Partial<Progress>) =>
  ({
    id,
    type,
    referenceId,
    subId: 0,
    isRead: false,
    isMemorized: false,
    progress: 0,
    hasHifzScore: false,
    isCompleted: false,
    readCount: 0,
    lastUpdated: 0,
    ...extra,
  }) as Progress;

test('longest streak finds the best run of consecutive active days, across month ends', () => {
  const history = [
    read('2026-10-30'),
    read('2026-10-31'),
    read('2026-11-01'),
    read('2026-11-02', 1, 'hizb', 'memorized'),
    read('2026-11-05'),
    read('2026-11-06'),
    read('2026-11-06'),
  ];
  assert.equal(longestStreak(history), 4);
  assert.equal(longestStreak([]), 0);
});

test('heatmap has Monday-first week columns ending this week, levels relative to the busiest day', () => {
  const today = '2026-11-22'; // Sunday
  const columns = readingHeatmap([read('2026-11-22', 8), read('2026-11-20', 1)], 4, today);
  assert.equal(columns.length, 4);
  assert.ok(columns.every((column) => column.length === 7));
  assert.equal(columns[3]![0]!.date, '2026-11-16');
  assert.equal(columns[3]![6]!.date, today);
  assert.equal(columns[3]![6]!.level, 4);
  assert.equal(columns[3]![4]!.level, 1);
  assert.equal(columns[0]![0]!.level, 0);
  const midweek = readingHeatmap([], 2, '2026-11-18');
  assert.equal(midweek[1]![6]!.future, true);
  assert.equal(midweek[1]![2]!.future, false);
});

test('reading bars total pages per day, ISO week and month and flag the current bucket', () => {
  const today = '2026-11-22';
  const history = [
    read('2026-11-22', 3),
    read('2026-11-17', 2),
    read('2026-11-10', 4),
    read('2026-10-02', 5),
    read('2026-11-22', 1, 'hizb', 'memorized'),
  ];
  const days = readingBars(history, 'day', today);
  assert.equal(days.length, 14);
  assert.deepEqual(days.at(-1), { key: today, start: today, pages: 3, current: true });
  const weeks = readingBars(history, 'week', today);
  assert.equal(weeks.length, 12);
  assert.equal(weeks.at(-1)!.pages, 5);
  assert.equal(weeks.at(-2)!.pages, 4);
  assert.equal(weeks.at(-1)!.current, true);
  const months = readingBars(history, 'month', today);
  assert.equal(months.length, 12);
  assert.equal(months.at(-1)!.pages, 9);
  assert.equal(months.at(-2)!.pages, 5);
  assert.equal(months.at(-2)!.start, '2026-10-01');
});

test('daily goal success counts finished days only, and a day needs every goal met', () => {
  const today = '2026-11-22';
  const goalDays = [
    { goalId: 1, date: '2026-11-20', unit: 'pages', target: 2, extra: 0, resolution: '' },
    { goalId: 1, date: '2026-11-21', unit: 'pages', target: 2, extra: 0, resolution: '' },
    { goalId: 1, date: today, unit: 'pages', target: 2, extra: 0, resolution: '' },
    { goalId: 3, date: '2026-11-20', unit: 'hizb', target: 0, extra: 0, resolution: '' },
  ];
  const history = [read('2026-11-20', 2), read('2026-11-21', 1), read(today, 5)];
  assert.deepEqual(dailyGoalSuccess(goalDays, history, 30, today), {
    met: 1,
    total: 2,
    fraction: 0.5,
  });
  assert.deepEqual(dailyGoalSuccess([], history, 30, today), { met: 0, total: 0, fraction: 0 });
});

test('coverage combines Rub marks and whole-Hizb marks; memorisation needs a Hizb or all four Rub', () => {
  const progress: Record<string, Progress> = {
    rub_1_1: mark('rub_1_1', 'rub', 1, { isRead: true }),
    rub_1_2: mark('rub_1_2', 'rub', 1, { isRead: true }),
    hizb_2: mark('hizb_2', 'hizb', 2, { isRead: true, isMemorized: true }),
  };
  for (const q of [1, 2, 3, 4])
    progress[`rub_3_${q}`] = mark(`rub_3_${q}`, 'rub', 3, { isMemorized: true });
  const rows = hizbCoverage(progress);
  assert.equal(rows.length, 60);
  assert.deepEqual(rows[0], { hizb: 1, rubsRead: 2, read: false, memorized: false });
  assert.deepEqual(rows[1], { hizb: 2, rubsRead: 4, read: true, memorized: true });
  assert.equal(rows[2]!.memorized, true);
});

test('khatma forecast projects the unmarked Rub at the 30-day pace', () => {
  const today = '2026-11-22';
  assert.deepEqual(khatmaForecast([], {}, 30, today), { kind: 'none' });
  const forecast = khatmaForecast([read('2026-11-20', 60)], {}, 30, today);
  assert.deepEqual(forecast, {
    kind: 'forecast',
    remainingPages: 604,
    pagesPerDay: 2,
    days: 302,
    date: '2027-09-20',
  });
  const all: Record<string, Progress> = {};
  for (let h = 1; h <= 60; h++) all[`hizb_${h}`] = mark(`hizb_${h}`, 'hizb', h, { isRead: true });
  assert.deepEqual(khatmaForecast([], all, 30, today), { kind: 'done' });
});

test('stats reset clears history, read marks and focus time but keeps Hifz scores and notes', () => {
  const state = {
    ...initialState,
    history: [read('2026-11-20')],
    focusSessions: [{ id: 'f', durationSeconds: 600, finishedAt: 1 }],
    progress: {
      hizb_1: mark('hizb_1', 'hizb', 1, { isRead: true, progress: 70, hasHifzScore: true }),
    },
    notes: initialState.notes,
  };
  const cleared = appReducer(state, { type: 'stats/clear' });
  assert.deepEqual(cleared.history, []);
  assert.deepEqual(cleared.focusSessions, []);
  assert.equal(cleared.progress.hizb_1!.isRead, false);
  assert.equal(cleared.progress.hizb_1!.progress, 70);
  assert.equal(cleared.notes, state.notes);
  assert.equal(cleared.plans, state.plans);
});

test('group contribution reports the viewer share, rank and goal', () => {
  const row = (userId: string, totalAyahs: number, points: number): GroupLeaderboardRow => ({
    userId,
    displayName: userId,
    avatarUrl: null,
    totalPoints: points,
    weeklyPoints: points,
    monthlyPoints: points,
    totalAyahs,
    pages: Math.ceil(totalAyahs / 10),
    streak: 2,
    activeToday: false,
    entries: [],
  });
  const rows = [row('a', 300, 300), row('me', 100, 100)];
  const group = {
    code: 'G',
    name: 'Groep',
    progress_unit: 'page',
    goal_target: 50,
    goal_period: 'weekly',
  };
  const result = groupContribution(group, rows, 'me');
  assert.equal(result.share, 0.25);
  assert.equal(result.myPages, 10);
  assert.equal(result.groupPages, 40);
  assert.equal(result.rank, 2);
  assert.equal(result.members, 2);
  assert.equal(result.goal.target, 50);
  assert.equal(groupContribution(group, rows, 'stranger').rank, null);
});
