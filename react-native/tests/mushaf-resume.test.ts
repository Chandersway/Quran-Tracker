import test from 'node:test';
import assert from 'node:assert/strict';
import { mushafResume } from '../src/domain/mushafResume';
import { initialState } from '../src/state/models';

test('printed resume preserves the chosen edition and its own saved page', () => {
  const state = {
    ...initialState,
    preferences: { ...initialState.preferences, mushaf: 'muhammadi' as const },
    mushafPositions: { hafs: 11, muhammadi: 42 },
  };
  assert.deepEqual(mushafResume(state), {
    ...state.cursor,
    edition: 'muhammadi',
    page: 42,
    originalEdition: 'muhammadi',
    bookPresentation: 'original',
    selectablePage: false,
  });
});
test('legacy text default resolves to bundled Hafs without altering saved preferences', () => {
  const state = {
    ...initialState,
    preferences: { ...initialState.preferences, mushaf: 'text' as const },
    mushafPositions: { hafs: 18 },
  };
  assert.equal(mushafResume(state).edition, 'hafs');
  assert.equal(mushafResume(state).page, 1);
  assert.equal(mushafResume(state).selectablePage, true);
  assert.equal(state.mushafPositions.hafs, 18);
  assert.equal(state.preferences.mushaf, 'text');
});
