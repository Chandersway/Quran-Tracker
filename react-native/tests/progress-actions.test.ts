import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';

test('source Surah memory marking logs separately and preserves reading and hifz assessments', () => {
  const read = appReducer(initialState, {
    type: 'checkIn',
    kind: 'surah',
    number: 1,
    name: 'Al-Fatihah',
    requestId: 'read',
    now: 10,
    date: '2026-11-13',
  });
  const assessed = appReducer(read, { type: 'hifz', kind: 'surah', number: 1, score: 65, now: 20 });
  const marked = appReducer(assessed, {
    type: 'surah/memorized',
    number: 1,
    name: 'Al-Fatihah',
    marked: true,
    requestId: 'memory',
    now: 30,
    date: '2026-11-13',
    ownerId: 'user',
  });
  assert.equal(marked.progress.surah_1!.isMemorized, true);
  assert.equal(marked.progress.surah_1!.readCount, 1);
  assert.equal(marked.progress.surah_1!.progress, 65);
  assert.equal(marked.progress.surah_1!.lastUpdated, 20);
  assert.equal(marked.history[0]!.action, 'memorized');
  assert.equal(marked.history[0]!.ownerId, 'user');
  const removed = appReducer(marked, {
    type: 'surah/memorized',
    number: 1,
    name: '',
    marked: false,
    requestId: '',
    now: 40,
    date: '2026-11-13',
  });
  assert.equal(removed.progress.surah_1!.isMemorized, false);
  assert.equal(removed.progress.surah_1!.progress, 65);
  assert.equal(removed.history, marked.history);
});
test('source Juz/Surah read removal resets read marks and counts without erasing history or scores', () => {
  for (const kind of ['juz', 'surah'] as const) {
    const recorded = appReducer(initialState, {
      type: 'checkIn',
      kind,
      number: 1,
      name: '',
      requestId: kind,
      now: 1,
      date: '2026-11-13',
    });
    const assessed = appReducer(recorded, { type: 'hifz', kind, number: 1, score: 77, now: 2 });
    const removed = appReducer(assessed, {
      type: 'read/unmark',
      kind,
      number: 1,
      now: 3,
      date: '2026-11-13',
    });
    assert.equal(removed.progress[`${kind}_1`]!.isRead, false);
    assert.equal(removed.progress[`${kind}_1`]!.readCount, 0);
    assert.equal(removed.progress[`${kind}_1`]!.progress, 77);
    assert.equal(removed.history, assessed.history);
  }
});
test('source Rub removal resets its row and removes only matching quarter histories today', () => {
  let state = appReducer(initialState, {
    type: 'checkIn',
    kind: 'rub',
    number: 1,
    subId: 1,
    name: 'Rub 1',
    requestId: 'old',
    now: 1,
    date: '2026-11-12',
  });
  state = appReducer(state, {
    type: 'checkIn',
    kind: 'rub',
    number: 1,
    subId: 1,
    name: 'Rub 1',
    requestId: 'today',
    now: 2,
    date: '2026-11-13',
  });
  state = appReducer(state, {
    type: 'checkIn',
    kind: 'rub',
    number: 1,
    subId: 2,
    name: 'Rub 2',
    requestId: 'other-quarter',
    now: 3,
    date: '2026-11-13',
  });
  assert.equal(state.history.find((row) => row.id === 'today')!.surahName, 'Hizb 1 (1/4)');
  const removed = appReducer(state, {
    type: 'read/unmark',
    kind: 'rub',
    number: 1,
    subId: 1,
    now: 4,
    date: '2026-11-13',
  });
  assert.deepEqual(
    removed.history.map((row) => row.id),
    ['other-quarter', 'old'],
  );
  assert.equal(removed.progress.rub_1_1!.isRead, false);
  assert.equal(removed.progress.rub_1_1!.readCount, 0);
  assert.equal(removed.progress.rub_1_2!.readCount, 1);
});
