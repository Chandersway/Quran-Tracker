import test from 'node:test';
import assert from 'node:assert/strict';
import { mushafResume, savedMushafPage } from '../src/domain/mushafResume';
import { initialState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';

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

test('saved Hafs positions retain their layout and crossing layouts resumes from the canonical verse', () => {
  const position = { type: 'mushaf/position' as const, edition: 'hafs' as const, page: 120 };
  const printed = decodeState(
    JSON.stringify(
      appReducer(
        {
          ...initialState,
          preferences: {
            ...initialState.preferences,
            mushaf: 'hafs_ayahinfo_1260',
            bookPresentation: 'original',
          },
          cursor: { surah: 5, ayah: 77 },
        },
        { ...position, bookPresentation: 'original' },
      ),
    ),
  );
  assert.equal(mushafResume(printed).page, 120);
  assert.equal(savedMushafPage(printed, 'hafs', 'selectable'), undefined);
  const switched = appReducer(printed, {
    type: 'preferences',
    patch: { bookPresentation: 'selectable' },
  });
  assert.equal(mushafResume(switched).page, 121);
  assert.deepEqual(switched.mushafPositions, { hafs: 120 });
  const sameNumberOtherLayout = appReducer(switched, {
    ...position,
    bookPresentation: 'selectable',
  });
  assert.equal(savedMushafPage(sameNumberOtherLayout, 'hafs', 'selectable'), 120);
  assert.equal(savedMushafPage(sameNumberOtherLayout, 'hafs', 'original'), undefined);

  const legacy = JSON.parse(JSON.stringify(printed));
  delete legacy.mushafPositionPresentations;
  const restored = decodeState(JSON.stringify(legacy));
  assert.equal(restored.mushafPositions.hafs, 120);
  assert.equal(savedMushafPage(restored, 'hafs', 'original'), undefined);
  assert.throws(() =>
    decodeState(JSON.stringify({ ...legacy, mushafPositionPresentations: { hafs: 'bad' } })),
  );
});
