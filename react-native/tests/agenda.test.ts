import assert from 'node:assert/strict';
import test from 'node:test';
import {
  agendaDayStatus,
  agendaWeekDates,
  moveAgendaPeriod,
  orderedAgendaPlans,
} from '../src/domain/agenda';
import type { Plan, ReadingEntry } from '../src/state/models';
import { initialState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';

const plan = (changes: Partial<Plan> = {}): Plan => ({
  id: '1',
  date: '2026-09-08',
  type: 'surah',
  referenceId: 1,
  subId: 0,
  displayName: 'Al-Fatihah',
  isDone: false,
  historyLogged: false,
  reminderHour: 20,
  reminderMinute: 0,
  createdAt: 1,
  goalId: 1,
  amount: 1,
  measurementUnit: 'surah',
  ...changes,
});
test('source Agenda weeks are Monday-first across year and month boundaries', () => {
  assert.deepEqual(agendaWeekDates('2026-01-04'), [
    '2025-12-29',
    '2025-12-30',
    '2025-12-31',
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
  ]);
  assert.equal(agendaWeekDates('2026-01-05')[0], '2026-01-05');
  assert.equal(moveAgendaPeriod('2026-09-29', 1, false), '2026-10-06');
  assert.equal(moveAgendaPeriod('2026-01-31', 1, true), '2026-02-28');
});
test('Agenda status shows actual today completion, partial and missed planning', () => {
  const today = '2026-09-08';
  const pending = plan();
  assert.equal(agendaDayStatus(today, [], today), 'Empty');
  assert.equal(agendaDayStatus(today, [pending], today), 'Planned');
  assert.equal(
    agendaDayStatus(today, [pending, plan({ id: '2', isDone: true })], today),
    'Partial',
  );
  assert.equal(agendaDayStatus(today, [plan({ isDone: true })], today), 'Completed');
  assert.equal(agendaDayStatus(today, [pending], '2026-09-09'), 'Missed');
});
test('selected day ordering prioritizes unfinished sessions then reminder time', () => {
  assert.deepEqual(
    orderedAgendaPlans(
      [
        plan({ id: 'done', isDone: true }),
        plan({ id: 'late' }),
        plan({ id: 'early', reminderHour: 8 }),
        plan({ id: 'none', reminderHour: null }),
      ],
      '2026-09-08',
    ).map((row) => row.id),
    ['early', 'late', 'none', 'done'],
  );
});
test('goal session links the exact Agenda plan once and clears its reminder', () => {
  const state = { ...initialState, plans: [plan({ goalId: 2 })] };
  const entry: ReadingEntry = {
    id: 'memory',
    type: 'surah',
    contentType: 'surah',
    surahId: 1,
    surahName: 'Al-Fatihah',
    action: 'memorized',
    amount: 1,
    timestamp: 100,
    dateKey: '2026-09-08',
    sourceKey: 'plan:1',
    ownerId: '',
  };
  const next = appReducer(state, { type: 'goals/record', entry, planId: '1' });
  assert.equal(next.plans[0]!.isDone, true);
  assert.equal(next.plans[0]!.historyLogged, true);
  assert.equal(next.plans[0]!.reminderHour, null);
  assert.equal(next.history.length, 1);
  assert.equal(appReducer(next, { type: 'goals/record', entry, planId: '1' }), next);
  assert.throws(() =>
    appReducer(state, { type: 'goals/record', entry: { ...entry, amount: 2 }, planId: '1' }),
  );
  assert.throws(() =>
    appReducer(state, { type: 'goals/record', entry: { ...entry, action: 'read' }, planId: '1' }),
  );
  assert.equal(state.plans[0]!.isDone, false);
  assert.equal(state.history.length, 0);
});
