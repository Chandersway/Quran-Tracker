import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeFocus, focusReducer, initialFocus } from '../src/domain/focus';

test('focus preserves four intentions, source duration limits and exact pause/resume time', () => {
  let timer = focusReducer(initialFocus('one'), { type: 'goal', goal: 'review' });
  timer = focusReducer(timer, { type: 'duration', minutes: 999, id: 'custom' });
  assert.equal(timer.minutes, 180);
  assert.equal(timer.goal, 'review');
  timer = focusReducer(timer, { type: 'duration', minutes: 1, id: 'minute' });
  timer = focusReducer(timer, { type: 'toggle', now: 10000, id: 'unused' });
  assert.equal(focusReducer(timer, { type: 'goal', goal: 'tafsir' }), timer);
  timer = focusReducer(timer, { type: 'toggle', now: 15300, id: 'unused' });
  assert.equal(timer.remaining, 55);
  assert.equal(timer.deadline, null);
  timer = focusReducer(timer, { type: 'toggle', now: 20000, id: 'unused' });
  assert.equal(timer.deadline, 75000);
  const restored = decodeFocus(JSON.stringify(timer), 'new');
  const finished = focusReducer(restored, { type: 'sample', now: 80000 });
  assert.equal(finished.finished, true);
  assert.equal(finished.goal, 'review');
  assert.equal(finished.id, 'minute');
});
test('old persisted focus timers migrate without resetting a running deadline', () => {
  const timer = decodeFocus(
    JSON.stringify({ id: 'old', total: 1500, remaining: 1234, deadline: 999999, started: true }),
    'new',
  );
  assert.equal(timer.minutes, 25);
  assert.equal(timer.remaining, 1234);
  assert.equal(timer.deadline, 999999);
  assert.equal(timer.goal, 'reading');
});
test('corrupt and future saved timers remain rejected instead of overwritten', () => {
  assert.throws(() => decodeFocus(JSON.stringify({ ...initialFocus('id'), version: 99 }), 'new'));
  assert.throws(() =>
    decodeFocus(JSON.stringify({ ...initialFocus('id'), remaining: 1.5 }), 'new'),
  );
  assert.throws(() =>
    decodeFocus(JSON.stringify({ ...initialFocus('id'), started: 'yes' }), 'new'),
  );
});
