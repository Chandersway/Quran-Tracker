import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, type ReadingEntry } from '../src/state/models';
import { progressForGoal, resolveGoalDay, saveGoalDefinition } from '../src/domain/goals';

test('goal progress converts reading units and separates reading, memorization and review', () => {
  const reading: ReadingEntry = {
    id: 'one',
    surahId: 1,
    surahName: 'Juz 1',
    type: 'juz',
    action: 'read',
    amount: 1,
    timestamp: 1,
    dateKey: '2026-11-13',
    sourceKey: 'one',
    ownerId: '',
    contentType: 'juz',
  };
  const day = {
    goalId: 1,
    date: reading.dateKey,
    unit: 'rub',
    target: 4,
    extra: 0,
    resolution: '',
  };
  assert.equal(progressForGoal(day, [reading]).done, 8);
  assert.equal(progressForGoal({ ...day, goalId: 2 }, [reading]).done, 0);
  assert.equal(
    progressForGoal(day, [{ ...reading, type: 'surah', surahName: 'Al-Fatihah' }]).done,
    0,
  );
});
test('spreading a missed goal carries its remainder exactly once without editing past snapshots', () => {
  const old = { goalId: 1, date: '2026-11-12', unit: 'rub', target: 5, extra: 0, resolution: '' };
  const state = { ...initialState, goalDays: [old] };
  const next = resolveGoalDay(state, 1, old.date, 'spread', '2026-11-13');
  assert.deepEqual(
    next.goalDays.filter((d) => d.date >= '2026-11-13').map((d) => d.extra),
    [2, 2, 1],
  );
  assert.equal(next.goalDays[0]!.resolution, 'spread');
  assert.equal(old.resolution, '');
  assert.equal(resolveGoalDay(next, 1, old.date, 'spread', '2026-11-13'), next);
});
test('goal edits preserve history and reject changing units with carried work', () => {
  const old = { goalId: 1, date: '2026-11-12', unit: 'rub', target: 5, extra: 0, resolution: '' };
  const state = { ...initialState, goalDays: [old, { ...old, date: '2026-11-13', extra: 2 }] };
  assert.throws(
    () => saveGoalDefinition(state, { ...state.goals[0]!, unit: 'pages' }, '2026-11-13'),
    /carried reading/,
  );
  const next = saveGoalDefinition(state, { ...state.goals[0]!, target: 7 }, '2026-11-13');
  assert.equal(next.goalDays[0]!.target, 5);
  assert.equal(next.goalDays[1]!.target, 7);
  assert.equal(next.goalDays[1]!.extra, 2);
});
