import test from 'node:test';
import assert from 'node:assert/strict';
import { quickCheckTargets } from '../src/domain/quickCheckIn';
import { appReducer } from '../src/state/reducer';
import { initialState } from '../src/state/models';

test('quick check validates every selected Hizb before creating sorted, unique targets', () => {
  const draft = { kind: 'hizb' as const, number: 1, quarter: 1, multiple: true, selected: [4, 2] };
  assert.deepEqual(quickCheckTargets(draft), [
    { kind: 'hizb', number: 2 },
    { kind: 'hizb', number: 4 },
  ]);
  for (const selected of [[], [2, 2], [2, 61]])
    assert.throws(() => quickCheckTargets({ ...draft, selected }));
});
test('multi-Hizb and exact Rub check-ins log distinct source entries and preserve independent scores', () => {
  const now = 1700000000000;
  const date = '2023-11-14';
  let state = appReducer(initialState, { type: 'hifz', kind: 'hizb', number: 2, score: 35, now });
  for (const target of quickCheckTargets({
    kind: 'hizb',
    number: 1,
    quarter: 1,
    multiple: true,
    selected: [2, 4],
  }))
    state = appReducer(state, {
      type: 'checkIn',
      ...target,
      name: `Hizb ${target.number}`,
      requestId: `qa:${target.number}`,
      now,
      date,
    });
  assert.equal(state.history.length, 2);
  for (const n of [2, 4])
    for (let q = 1; q <= 4; q++) assert.equal(state.progress[`rub_${n}_${q}`]?.readCount, 1);
  assert.equal(state.progress.hizb_2?.progress, 35);
  const [rub] = quickCheckTargets({
    kind: 'rub',
    number: 3,
    quarter: 2,
    multiple: false,
    selected: [],
  });
  state = appReducer(state, {
    type: 'checkIn',
    ...rub!,
    name: 'ignored',
    requestId: 'qa:rub',
    now,
    date,
  });
  assert.equal(state.progress.rub_3_2?.readCount, 1);
  assert.equal(state.progress.rub_3_1, undefined);
  assert.equal(state.history[0]?.surahName, 'Hizb 3 (1/2)');
  assert.throws(() =>
    quickCheckTargets({ kind: 'rub', number: 3, quarter: 5, multiple: false, selected: [] }),
  );
});
