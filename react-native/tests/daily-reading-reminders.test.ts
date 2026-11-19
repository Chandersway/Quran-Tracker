import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState, type AppState, type ReadingEntry } from '../src/state/models';
import { needsDailyReadingReminder } from '../src/domain/dailyReadingGoal';
import { localDate } from '../src/domain/localDate';
import {
  localNotificationDefaults,
  decodeNotificationPreferences,
} from '../src/domain/notificationPreferences';
import {
  dailyReadingReminders,
  reminderWindow,
  pendingReminderCapacity,
} from '../src/services/notifications/dailyReadingReminders';
import type { DesiredPlanReminder } from '../src/services/notifications/planningReminders';

const now = new Date(2026, 10, 19, 7);
const date = localDate(now);
const state = (): AppState => ({
  ...initialState,
  goals: [{ ...initialState.goals[0]!, id: 1, unit: 'rub', target: 1 }],
  goalDays: [],
  history: [],
});
const entry = (action: ReadingEntry['action'] = 'read'): ReadingEntry => ({
  id: action,
  sourceKey: action,
  ownerId: '',
  type: 'rub',
  contentType: 'rub',
  amount: 1,
  action,
  surahId: 1,
  surahName: 'Rub 1',
  timestamp: now.getTime(),
  dateKey: date,
});

test('only a completed reading goal pauses today; review, hifz and reading-plan data stay independent', () => {
  const s = state();
  assert.equal(needsDailyReadingReminder(s, date), true);
  s.history = [entry('memorized'), entry('review')];
  assert.equal(needsDailyReadingReminder(s, date), true);
  s.history = [entry()];
  assert.equal(needsDailyReadingReminder(s, date), false);
  s.goalDays = [{ goalId: 1, date, unit: 'rub', target: 1, extra: 1, resolution: '' }];
  assert.equal(needsDailyReadingReminder(s, date), true, 'carried reading remains unfinished');
  s.history = [{ ...entry(), amount: 2 }];
  assert.equal(needsDailyReadingReminder(s, date), false);
  s.history = [];
  assert.equal(
    needsDailyReadingReminder(s, date),
    true,
    'unmark/delete restores the unfinished goal',
  );
});

test('native DATE forecasts contain both configured times and retain tomorrow after completion today', () => {
  const s = state();
  const all = dailyReadingReminders(s, localNotificationDefaults, now);
  assert.equal(all.length, 28);
  assert.deepEqual(
    all.filter((r) => r.date === date).map((r) => r.dueAt.getHours()),
    [8, 21],
  );
  assert.ok(all.every((r) => r.repeatDaily === false));
  s.history = [entry()];
  const completed = dailyReadingReminders(s, localNotificationDefaults, now);
  assert.equal(completed.length, 26);
  assert.equal(
    completed.some((r) => r.date === date),
    false,
  );
  assert.equal(completed.filter((r) => r.date === '2026-11-20').length, 2);
});

test('explicit local opt-outs survive decoding, and equal configured slots remain one alarm', () => {
  const s = state();
  const imported = decodeNotificationPreferences({ daily: true, extra: false, dailyMinute: 600 });
  assert.equal(imported.extra, false);
  assert.equal(dailyReadingReminders(s, imported, now).length, 14);
  assert.equal(
    dailyReadingReminders(s, { ...localNotificationDefaults, enabled: false }, now).length,
    0,
  );
  assert.equal(
    dailyReadingReminders(s, { ...localNotificationDefaults, daily: false, extra: false }, now)
      .length,
    0,
  );
  assert.equal(
    dailyReadingReminders(s, { ...localNotificationDefaults, extraMinute: 480 }, now).length,
    14,
  );
  s.goals = [{ ...s.goals[0]!, target: 0 }];
  assert.equal(dailyReadingReminders(s, localNotificationDefaults, now).length, 0);
});

test('the pending budget leaves replacement space and reserves nearby calendar reminders', () => {
  const daily = dailyReadingReminders(state(), localNotificationDefaults, now);
  const agenda: DesiredPlanReminder[] = Array.from({ length: 40 }, (_, i) => ({
    key: `plan:${i}`,
    sourceId: `plan:${i}`,
    planId: `${i}`,
    date,
    dueAt: new Date(now.getTime() + (i + 1) * 60000),
    title: 'Plan',
    body: 'Read',
  }));
  const window = reminderWindow(daily, agenda, now);
  assert.equal(window.length, 30);
  assert.equal(window.filter((r) => r.sourceId !== 'daily').length, 14);
  assert.equal(window.filter((r) => r.sourceId === 'daily').length, 16);
  for (let count = 0; count <= 64; count++) {
    const capacity = pendingReminderCapacity(count);
    assert.ok(capacity * 2 + count <= 64);
    assert.ok(reminderWindow(daily, agenda, now, capacity).length <= capacity);
  }
  assert.equal(pendingReminderCapacity(65), 0);
});
