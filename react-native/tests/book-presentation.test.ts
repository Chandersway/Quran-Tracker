import test from 'node:test';
import assert from 'node:assert/strict';
import { mushafResume } from '../src/domain/mushafResume';
import { bookToText, textToBook } from '../src/features/quran/providers/readingModeContext';
import { initialState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';
import {
  beginBookSelection,
  bookSelectionReturnDistance,
  resolveBookEntry,
  restoreBookSelection,
} from '../src/domain/bookPresentation';

const savedPdf = {
  ...initialState,
  preferences: {
    ...initialState.preferences,
    mushaf: 'hafs_indopak_15' as const,
    bookPresentation: 'selectable' as const,
  },
  cursor: { surah: 3, ayah: 1 },
  mushafPositions: { hafs_indopak_15: 3, hafs: 18 },
};

test('normal dock and Continue Reading resolve saved PDF to selectable canonical Hafs', () => {
  // Both actual call sites use this shared resolver; no special-route escape action.
  const dock = mushafResume(savedPdf);
  const continueReading = mushafResume(savedPdf);
  for (const entry of [dock, continueReading]) {
    assert.equal(entry.edition, 'hafs');
    assert.equal(entry.page, 50);
    assert.equal(entry.selectablePage, true);
  }
  assert.equal(savedPdf.preferences.mushaf, 'hafs_indopak_15');
  assert.deepEqual(savedPdf.mushafPositions, { hafs_indopak_15: 3, hafs: 18 });
});

test('normal text-to-book toggle cannot resurrect the PDF page from its route context', () => {
  const text = bookToText(
    { surah: 3, ayah: 1, edition: 'hafs_indopak_15', page: 3 },
    { surah: 3, ayah: 1 },
    'hafs_indopak_15',
    3,
  );
  const entry = textToBook(text, { surah: 3, ayah: 1 }, savedPdf);
  assert.equal(entry.edition, 'hafs');
  assert.equal(entry.page, 50);
  assert.equal(entry.selectablePage, true);
});

test('old RN state defaults to selectable without replacing original downloads, positions or history', () => {
  const old = JSON.parse(JSON.stringify(savedPdf));
  delete old.preferences.bookPresentation;
  const restored = decodeState(JSON.stringify(old));
  assert.equal(restored.preferences.bookPresentation, 'selectable');
  assert.equal(restored.preferences.mushaf, 'hafs_indopak_15');
  assert.deepEqual(restored.mushafPositions, savedPdf.mushafPositions);
  assert.deepEqual(restored.history, savedPdf.history);
  assert.equal(mushafResume(restored).page, 50);
});

test('presentation choice survives save/reopen, and original restores only its own PDF position', () => {
  const original = appReducer(savedPdf, {
    type: 'preferences',
    patch: { bookPresentation: 'original' },
  });
  const reopened = decodeState(JSON.stringify(original));
  assert.equal(mushafResume(reopened).edition, 'hafs_indopak_15');
  assert.equal(mushafResume(reopened).page, 3);
  assert.equal(mushafResume(reopened).selectablePage, false);
  const selected = resolveBookEntry(reopened, mushafResume(reopened), 'selectable');
  assert.equal(selected.page, 50);
  assert.equal(selected.originalEdition, 'hafs_indopak_15');
  const originalAgain = resolveBookEntry(reopened, selected, 'original');
  assert.equal(originalAgain.edition, 'hafs_indopak_15');
  assert.equal(originalAgain.page, 3);
  const selectable = appReducer(reopened, {
    type: 'preferences',
    patch: { bookPresentation: 'selectable' },
  });
  assert.equal(mushafResume(decodeState(JSON.stringify(selectable))).edition, 'hafs');
});

test('an explicit library original can open while normal presentation remains selectable', () => {
  const entry = resolveBookEntry(
    savedPdf,
    { ...savedPdf.cursor, edition: 'hafs_indopak_15', page: 3 },
    'original',
  );
  assert.equal(entry.edition, 'hafs_indopak_15');
  assert.equal(entry.bookPresentation, 'original');
  assert.equal(entry.page, 3);
  assert.equal(savedPdf.preferences.bookPresentation, 'selectable');
});

test('Warsh normal and text-toggle routes cannot silently switch to Hafs', () => {
  for (const edition of ['warsh_maknoon', 'muhammadi'] as const) {
    const state = {
      ...savedPdf,
      preferences: { ...savedPdf.preferences, mushaf: edition },
      mushafPositions: { [edition]: 42 },
    };
    const entry = mushafResume(state);
    assert.equal(entry.edition, edition);
    assert.equal(entry.page, 42);
    assert.equal(entry.selectablePage, false);
    const text = bookToText(entry, state.cursor, edition, 42);
    assert.equal(textToBook(text, state.cursor, state).edition, edition);
  }
});

test('explicit selectable Warsh keeps its edition, page and reader context while Muhammadi stays original', () => {
  const state = {
    ...savedPdf,
    preferences: { ...savedPdf.preferences, mushaf: 'warsh_maknoon' as const },
    mushafPositions: { warsh_maknoon: 158 },
  };
  const context = {
    surah: 7,
    ayah: 58,
    edition: 'warsh_maknoon' as const,
    page: 158,
    bookPresentation: 'original' as const,
    planId: 'plan',
    fullscreen: true,
  };
  const original = resolveBookEntry(state, context, 'original');
  const selectable = resolveBookEntry(
    state,
    { ...original, bookPresentation: 'selectable' },
    'selectable',
  );
  assert.equal(selectable.edition, 'warsh_maknoon');
  assert.equal(selectable.page, 158);
  assert.equal(selectable.surah, 7);
  assert.equal(selectable.ayah, 58);
  assert.equal(selectable.fullscreen, true);
  assert.equal(selectable.planId, 'plan');
  assert.equal(selectable.selectablePage, true);
  const again = resolveBookEntry(state, selectable, 'original');
  assert.equal(again.edition, 'warsh_maknoon');
  assert.equal(again.page, 158);
  assert.equal(again.selectablePage, false);
  assert.equal(
    resolveBookEntry(
      state,
      { surah: 7, ayah: 58, edition: 'muhammadi', page: 158, bookPresentation: 'selectable' },
      'selectable',
    ).bookPresentation,
    'original',
  );
});

test('verified Hafs page is preserved; stale or out-of-range pages and PDF indices are rejected', () => {
  const state = {
    ...savedPdf,
    cursor: { surah: 2, ayah: 255 },
    mushafPositions: { hafs: 42, hafs_indopak_15: 3 },
  };
  assert.equal(mushafResume(state).page, 42);
  for (const page of [3, 605, NaN]) {
    const entry = resolveBookEntry(state, { surah: 2, ayah: 255, edition: 'hafs', page });
    assert.equal(entry.page, 42);
  }
  assert.equal(
    resolveBookEntry(state, { surah: 3, ayah: 1, edition: 'hafs_indopak_15', page: 50 }).page,
    50,
  );
  assert.equal(
    resolveBookEntry(state, { surah: 2, ayah: 255, edition: 'hafs_indopak_15', page: 50 }).page,
    42,
  );
});

test('text scrolling clears an old book page while preserving plan and reading range', () => {
  const context = {
    surah: 2,
    ayah: 255,
    edition: 'hafs' as const,
    page: 42,
    bookPresentation: 'selectable' as const,
    originalEdition: 'hafs_indopak_15' as const,
    planId: 'local-plan',
    endSurah: 3,
    endAyah: 8,
    readingTarget: { kind: 'hizb' as const, number: 3, name: 'Hizb 3' },
  };
  const entry = textToBook(context, { surah: 3, ayah: 1 }, savedPdf);
  assert.equal(entry.page, 50);
  assert.equal(entry.originalEdition, 'hafs_indopak_15');
  assert.equal(entry.planId, 'local-plan');
  assert.equal(entry.endSurah, 3);
  assert.deepEqual(entry.readingTarget, context.readingTarget);
});

test('PDF selection keeps an exact live original snapshot across renderer and text detours', () => {
  const origin = {
    surah: 3,
    ayah: 1,
    edition: 'hafs_indopak_15' as const,
    originalEdition: 'hafs_indopak_15' as const,
    bookPresentation: 'original' as const,
    page: 73,
    fullscreen: true,
    bookView: { zoom: 2.25, horizontalOffset: 0, verticalAnchor: 0 },
    planId: 'plan73',
    endSurah: 3,
    endAyah: 8,
  };
  const stateBefore = JSON.stringify(savedPdf);
  const temporary = beginBookSelection(savedPdf, origin, 'pdf-route');
  assert.equal(temporary.edition, 'hafs');
  assert.equal(temporary.page, 50, 'PDF index73 must never become canonical Hafs page73');
  assert.equal(temporary.selectionOrigin?.page, 73);
  assert.equal(temporary.selectionOrigin?.bookView?.zoom, 2.25);
  const text = bookToText(temporary, { surah: 3, ayah: 2 }, 'hafs', 50);
  const book = textToBook(text, { surah: 3, ayah: 5 }, savedPdf);
  const restored = restoreBookSelection(book);
  assert.equal(restored.edition, origin.edition);
  assert.equal(restored.bookPresentation, 'original');
  assert.equal(restored.page, 73);
  assert.deepEqual(restored.bookView, origin.bookView);
  assert.equal(restored.surah, 3);
  assert.equal(restored.ayah, 1);
  assert.equal(restored.planId, 'plan73');
  assert.equal(restored.endAyah, 8);
  assert.equal(restored.selectionOrigin, undefined);
  assert.equal(
    JSON.stringify(savedPdf),
    stateBefore,
    'temporary selection never mutates preferences or downloads',
  );
  const routes = [
    { key: 'main', name: 'Main' },
    { key: 'pdf-route', name: 'Mushaf' },
    { key: 'text-route', name: 'Reader' },
  ];
  assert.equal(bookSelectionReturnDistance(book, routes, 2), 1);
  assert.equal(bookSelectionReturnDistance(book, routes, 1), 0);
  assert.equal(
    bookSelectionReturnDistance(book, [{ key: 'pdf-route', name: 'Lexicon' }, routes[2]!], 1),
    0,
  );
  assert.equal(bookSelectionReturnDistance(book, [routes[0]!, routes[2]!], 1), 0);
});

test('an explicit original book survives a text roundtrip despite a different global presentation preference', () => {
  const original = resolveBookEntry(
    savedPdf,
    {
      surah: 3,
      ayah: 1,
      edition: 'hafs_indopak_15',
      page: 73,
      bookView: { zoom: 2, horizontalOffset: 0, verticalAnchor: 0 },
    },
    'original',
  );
  const text = bookToText(original, { surah: 3, ayah: 1 }, 'hafs_indopak_15', 73);
  const restored = textToBook(text, { surah: 3, ayah: 1 }, savedPdf);
  assert.equal(restored.edition, 'hafs_indopak_15');
  assert.equal(restored.page, 73);
  assert.equal(restored.bookPresentation, 'original');
  assert.deepEqual(restored.bookView, original.bookView);
  assert.equal(savedPdf.preferences.bookPresentation, 'selectable');
});
