import assert from 'node:assert/strict';
import test from 'node:test';
import { appReducer } from '../src/state/reducer';
import { initialState, type Plan } from '../src/state/models';

test('a repeated request id is idempotent for history and read counts', () => {
  const action = {
    type: 'checkIn' as const,
    kind: 'surah' as const,
    number: 2,
    name: 'Al-Baqarah',
    requestId: 'checkin-a',
    now: 10,
    date: '2026-11-13',
  };
  const first = appReducer(initialState, action);
  const duplicate = appReducer(first, action);
  assert.equal(duplicate, first);
  assert.equal(duplicate.history.length, 1);
  assert.equal(duplicate.progress.surah_2?.readCount, 1);
});

test('a Hizb check-in advances each of its four rub markers once', () => {
  const state = appReducer(initialState, {
    type: 'checkIn',
    kind: 'hizb',
    number: 4,
    name: 'Hizb 4',
    requestId: 'hizb-a',
    now: 10,
    date: '2026-11-13',
  });
  assert.equal(state.history.length, 1);
  assert.equal(state.progress.hizb_4, undefined);
  for (let quarter = 1; quarter <= 4; quarter++)
    assert.equal(state.progress[`rub_4_${quarter}`]?.readCount, 1);
  const duplicate = appReducer(state, {
    type: 'checkIn',
    kind: 'hizb',
    number: 4,
    name: 'Hizb 4',
    requestId: 'hizb-a',
    now: 10,
    date: '2026-11-13',
  });
  assert.deepEqual(duplicate.progress, state.progress);
});

test('plan completion logs an idempotent history row without changing read progress', () => {
  const plan: Plan = {
    id: 'plan-1',
    date: '2026-11-13',
    type: 'juz',
    referenceId: 3,
    subId: 0,
    displayName: 'Juz 3',
    isDone: false,
    historyLogged: false,
    reminderHour: null,
    reminderMinute: null,
    createdAt: 1,
    goalId: 1,
    amount: 1,
    measurementUnit: 'juz',
  };
  const state = { ...initialState, plans: [plan] };
  const action = {
    type: 'plan/toggle' as const,
    id: plan.id,
    completed: true,
    date: '2026-11-13',
    now: 20,
  };
  const done = appReducer(state, action);
  assert.equal(done.plans[0]?.isDone, true);
  assert.equal(done.history.length, 1);
  assert.equal(done.progress.juz_3, undefined);
  assert.equal(appReducer(done, action), done);
  const undone = appReducer(done, { ...action, completed: false });
  assert.equal(undone.history.length, 0);
  assert.deepEqual(undone.progress, done.progress);
});

test('saving a recall score of zero clears the score flag', () => {
  const scored = appReducer(initialState, {
    type: 'hifz',
    kind: 'surah',
    number: 1,
    score: 75,
    now: 1,
  });
  const cleared = appReducer(scored, { type: 'hifz', kind: 'surah', number: 1, score: 0, now: 2 });
  assert.equal(cleared.progress.surah_1?.hasHifzScore, false);
  assert.equal(cleared.progress.surah_1?.isMemorized, false);
});
