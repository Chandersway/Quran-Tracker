import assert from 'node:assert/strict';
import test from 'node:test';
import { appReducer } from '../src/state/reducer';
import { initialState, type Plan, type ReadingEntry } from '../src/state/models';
import { averageAssessmentScore, explicitAssessments, reviewDue } from '../src/domain/hifz';
import { hifzCardColors } from '../src/domain/hifzPresentation';
import { goalRegistrationTimestamp } from '../src/domain/goalRegistration';
import { localDate } from '../src/domain/localDate';
import { agendaReminderPreset } from '../src/domain/agenda';
import { statsReadingBuckets, weeklyHistoryActivity } from '../src/domain/statistics';
import { desiredPlanReminders } from '../src/services/notifications/planningReminders';

const date = '2026-11-17';
const now = new Date(2026, 10, 17, 18, 25, 13, 123).getTime();
const plan: Plan = {
  id: 'reading',
  date,
  type: 'hizb',
  referenceId: 1,
  subId: 0,
  displayName: 'Hizb 1',
  isDone: false,
  historyLogged: false,
  reminderHour: 20,
  reminderMinute: 0,
  reminderNotificationId: 'notification',
  createdAt: now,
  goalId: 1,
  amount: 1,
  measurementUnit: 'hizb',
};

test('planning retains three intentions for the same content and deduplicates only the same intention', () => {
  const state = appReducer(initialState, {
    type: 'plan/add',
    plans: [plan, { ...plan, id: 'hifz', goalId: 2 }, { ...plan, id: 'review', goalId: 3 }],
  });
  assert.deepEqual(
    state.plans.map((row) => row.goalId),
    [1, 2, 3],
  );
  const duplicate = appReducer(state, { type: 'plan/add', plans: [{ ...plan, id: 'again' }] });
  assert.equal(duplicate.plans.length, 3);
});

test('plain reads and read removals preserve a Surah or Juz assessment date and review advice', () => {
  for (const kind of ['surah', 'juz'] as const) {
    const assessedAt = now - 3 * 86_400_000;
    const assessed = appReducer(initialState, {
      type: 'hifz',
      kind,
      number: 1,
      score: 30,
      now: assessedAt,
    });
    const read = appReducer(assessed, {
      type: 'checkIn',
      kind,
      number: 1,
      name: 'One',
      requestId: kind,
      now,
      date,
    });
    const assessment = explicitAssessments(read.progress)[0]!;
    assert.equal(assessment.assessedAt, assessedAt);
    assert.equal(assessment.score, 30);
    assert.equal(reviewDue(assessment, now), -2);
    const removed = appReducer(read, { type: 'read/unmark', kind, number: 1, now, date });
    assert.equal(explicitAssessments(removed.progress)[0]!.assessedAt, assessedAt);
  }
});

test('direct Agenda completion clears its reminder so undo cannot restore it', () => {
  const state = appReducer(initialState, { type: 'plan/add', plans: [plan] });
  const done = appReducer(state, { type: 'plan/toggle', id: plan.id, completed: true, now, date });
  assert.equal(done.plans[0]!.reminderHour, null);
  assert.equal(done.plans[0]!.reminderMinute, null);
  assert.equal(done.plans[0]!.reminderNotificationId, null);
  assert.equal(done.plans[0]!.reminderDueAt, null);
  const undone = appReducer(done, {
    type: 'plan/toggle',
    id: plan.id,
    completed: false,
    now,
    date,
  });
  assert.equal(undone.history.length, 0);
  assert.equal(desiredPlanReminders(undone.plans, new Date(now)).length, 0);
});

test('goal timestamps keep the real clock on today and valid backdated local dates', () => {
  assert.equal(goalRegistrationTimestamp(date, now), now);
  const backdated = new Date(goalRegistrationTimestamp('2026-11-01', now));
  assert.equal(localDate(backdated), '2026-11-01');
  assert.equal(backdated.getHours(), 18);
  assert.equal(backdated.getMinutes(), 25);
  assert.equal(backdated.getSeconds(), 13);
  assert.equal(backdated.getMilliseconds(), 123);
  assert.throws(() => goalRegistrationTimestamp('2026-02-30', now));
});

test('Home combines explicit category scores and tint preference restores neutral styling', () => {
  let state = initialState;
  for (const [kind, score] of [
    ['surah', 30],
    ['hizb', 50],
    ['juz', 90],
  ] as const)
    state = appReducer(state, { type: 'hifz', kind, number: 1, score, now });
  state = appReducer(state, { type: 'hifz', kind: 'surah', number: 2, score: 0, now });
  assert.equal(averageAssessmentScore(explicitAssessments(state.progress)), 57);
  assert.equal(hifzCardColors(state.progress.surah_1, false), undefined);
  assert.equal(hifzCardColors(state.progress.surah_2, true), undefined);
  assert.equal(hifzCardColors(state.progress.surah_1, true)?.borderColor, '#F06A1C');
  assert.equal(hifzCardColors(state.progress.juz_1, true)?.borderColor, '#4FBF4A');
  assert.equal(hifzCardColors({ hasHifzScore: true, progress: 100 }, true)?.borderColor, '#2FAE5F');
});

test('weekly activity counts all history actions after the rolling cutoff while rings count reads', () => {
  const entry = (id: string, action: string, timestamp = now, dateKey = date): ReadingEntry => ({
    id,
    sourceKey: id,
    surahId: 1,
    surahName: 'Hizb 1',
    type: 'hizb',
    contentType: 'hizb',
    amount: 1,
    ownerId: '',
    action,
    timestamp,
    dateKey,
  });
  const history = [
    entry('read', 'read'),
    entry('memory', 'memorized'),
    entry('review', 'review'),
    entry('border', 'review', now - 7 * 86_400_000, '2026-11-10'),
    entry('recent-border', 'review', now - 7 * 86_400_000 + 1, '2026-11-10'),
  ];
  assert.deepEqual(weeklyHistoryActivity(history, now), [
    { date: '2026-11-10', count: 1 },
    { date, count: 3 },
  ]);
  assert.equal(statsReadingBuckets(history, 'type').flatMap((bucket) => bucket.rows).length, 1);
});

test('Agenda presets and an exact Now timestamp retain normal completion cancellation', () => {
  assert.deepEqual(agendaReminderPreset('now', new Date(now)), { hour: 18, minute: 25 });
  assert.deepEqual(agendaReminderPreset('plusThirtyMinutes', new Date(2026, 10, 17, 23, 45)), {
    hour: 0,
    minute: 15,
  });
  assert.deepEqual(agendaReminderPreset('tonight', new Date(now)), { hour: 20, minute: 0 });
  const pending = appReducer(
    { ...initialState, plans: [plan] },
    {
      type: 'plan/reminder',
      id: plan.id,
      hour: 18,
      minute: 25,
      dueAt: now + 5_000,
    },
  );
  const desired = desiredPlanReminders(pending.plans, new Date(now));
  assert.equal(desired.length, 1);
  assert.equal(desired[0]!.dueAt.getTime(), now + 5_000);
  const completed = appReducer(pending, {
    type: 'plan/toggle',
    id: plan.id,
    completed: true,
    now,
    date,
  });
  assert.equal(completed.plans[0]!.reminderDueAt, null);
  assert.equal(desiredPlanReminders(completed.plans, new Date(now)).length, 0);
  const changedClock = appReducer(pending, {
    type: 'plan/reminder',
    id: plan.id,
    hour: 22,
    minute: 0,
  });
  assert.equal(changedClock.plans[0]!.reminderDueAt, null);
});
