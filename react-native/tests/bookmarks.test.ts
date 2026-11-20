import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState, type AppState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';
import { savedBookmarks, savedBookmarkTarget } from '../src/features/bookmarks/bookmarks';
import * as bookmarks from '../src/features/bookmarks/bookmarks';
import * as copy from '../src/features/bookmarks/bookmarkCopy';
import * as quran from '../src/content/quran';
import { resolveBookEntry } from '../src/domain/bookPresentation';
import type { MushafReadingContext } from '../src/domain/readingContext';
import { matchesMushafBookmarkPage } from '../src/domain/mushafBookmarks';
import {
  componentHarness,
  elements,
  loadComponentModule,
  press,
  sharedComponents,
} from './helpers/componentHarness';

test('saved bookmark screen combines current ayah and page bookmarks and opens exact edition/page or verse', () => {
  const hooks = componentHarness();
  let state: AppState = structuredClone(initialState);
  state = appReducer(state, { type: 'bookmark', surah: 2, ayah: 255, now: 100 });
  state = appReducer(state, {
    type: 'mushaf/bookmark',
    edition: 'warsh_maknoon',
    surah: 2,
    page: 42,
  });
  state = decodeState(JSON.stringify(state));
  const navigations: unknown[][] = [];
  const { BookmarksScreen } = loadComponentModule<{ BookmarksScreen: () => unknown }>(
    new URL('../src/features/bookmarks/screens/BookmarksScreen.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { FlatList: 'FlatList', View: 'View' },
      '../../../content/quran': quran,
      '../../../state/store': { useAppStore: () => ({ state }) },
      '../../../app/navigation/types': {
        useAppNavigation: () => ({ navigate: (...args: unknown[]) => navigations.push(args) }),
      },
      '../../../shared/components': sharedComponents,
      '../../../i18n': { useI18n: () => ({ locale: 'nl' }) },
      '../bookmarkCopy': copy,
      '../bookmarks': bookmarks,
    },
  );
  const render = () => hooks.render(BookmarksScreen);
  let rows = elements(render(), 'Row');
  assert.equal(rows.length, 2);
  rows.forEach(press);
  assert.deepEqual(navigations, [
    ['Mushaf', { surah: 2, ayah: 255, fullscreen: true }],
    [
      'Mushaf',
      {
        surah: 2,
        page: 42,
        edition: 'warsh_maknoon',
        originalEdition: 'warsh_maknoon',
        bookPresentation: 'original',
        fullscreen: true,
      },
    ],
  ]);
  // No stale cached copy: a new bookmark appears on the next render, and toggling removes it.
  state = appReducer(state, { type: 'bookmark', surah: 1, ayah: 1, now: 200 });
  rows = elements(render(), 'Row');
  assert.equal(rows.length, 3);
  assert.equal(rows[0]!.props.subtitle, '1:1');
  state = appReducer(state, { type: 'bookmark', surah: 1, ayah: 1, now: 300 });
  assert.equal(elements(render(), 'Row').length, 2);
});

test('sorting bookmarks does not invent page dates, lose references or mutate stored arrays', () => {
  const state = {
    bookmarks: [
      { surah: 2, ayah: 20, createdAt: 100 },
      { surah: 1, ayah: 1, createdAt: 200 },
    ],
    mushafBookmarks: [
      { edition: 'hafs' as const, surah: 2, page: 40 },
      { edition: 'hafs_madina_pdf' as const, surah: 2, page: 4 },
    ],
  };
  const before = JSON.stringify(state);
  assert.deepEqual(
    savedBookmarks(state, 'quran').map((item) => item.key),
    ['ayah:1:1', 'ayah:2:20', 'page:hafs_madina_pdf:2:4', 'page:hafs:2:40'],
  );
  assert.deepEqual(
    savedBookmarks(state, 'recent').map((item) => item.key),
    ['ayah:1:1', 'ayah:2:20', 'page:hafs_madina_pdf:2:4', 'page:hafs:2:40'],
  );
  const named = savedBookmarks(state, 'name');
  assert.equal(named.length, 4);
  assert.deepEqual(
    named
      .map(savedBookmarkTarget)
      .filter((target) => 'page' in target)
      .map((target) => target.page)
      .sort((a, b) => a! - b!),
    [4, 40],
  );
  assert.equal(JSON.stringify(state), before);
});

test('the Surah index Saved tab also opens a bookmarked page in its original edition', () => {
  const hooks = componentHarness();
  const state: AppState = {
    ...initialState,
    preferences: {
      ...initialState.preferences,
      mushaf: 'hafs_ayahinfo_1260',
      bookPresentation: 'selectable',
    },
    mushafBookmarks: [{ edition: 'hafs_maknoon', surah: 2, page: 42 }],
  };
  const opened: MushafReadingContext[] = [];
  const { QuranScreen } = loadComponentModule<{ QuranScreen: () => unknown }>(
    new URL('../src/features/quran/screens/QuranScreen.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { FlatList: 'FlatList', Pressable: 'Pressable', View: 'View' },
      '../../../content/quran': quran,
      '../../../shared/components': { ...sharedComponents, s: {} },
      '../../../shared/theme': { usePalette: () => ({}) },
      '../../../state/store': { useAppStore: () => ({ state }) },
      '../../../app/navigation/types': {
        useAppNavigation: () => ({
          navigate: (route: string, target: MushafReadingContext) => {
            assert.equal(route, 'Mushaf');
            opened.push(target);
          },
        }),
      },
      '../../../i18n': {
        useI18n: () => ({ locale: 'nl', t: (key: string) => key, format: (key: string) => key }),
      },
      '../components/SurahActionsSheet': {},
      '../components/HizbOpeningPreview': {},
      '../components/PartActionsSheet': {},
      '../components/AyahSearchResults': { quranSearchCopy: { nl: { placeholder: 'Zoeken' } } },
      '../../../domain/quranNavigation': {},
      '../../../domain/hifzPresentation': { hifzCardColors: () => undefined },
      '../../notes/components/NoteCountButton': {},
      '../../bookmarks/bookmarks': bookmarks,
    },
  );
  const tabs = elements(hooks.render(QuranScreen), 'Segments')[0]!;
  assert.equal(tabs.props.layout, 'wrap');
  (tabs.props.onChange as (value: string) => void)('saved');
  press(elements(hooks.render(QuranScreen), 'Pressable')[0]!);
  const entry = resolveBookEntry(state, opened[0]!);
  assert.equal(entry.edition, 'hafs_maknoon');
  assert.equal(entry.bookPresentation, 'original');
  assert.equal(entry.page, 42);
});

test('printed and selectable Hafs bookmarks for the same page coexist, reopen and toggle independently', () => {
  const page = { edition: 'hafs' as const, surah: 2, page: 42 };
  const saved = { ...initialState, mushafBookmarks: [page] };
  const state = decodeState(
    JSON.stringify(
      appReducer(saved, {
        type: 'mushaf/bookmark',
        ...page,
        bookPresentation: 'selectable',
      }),
    ),
  );
  const entries = savedBookmarks(state, 'quran');
  assert.equal(new Set(entries.map((entry) => entry.key)).size, 2);
  assert.deepEqual(state.mushafBookmarks.map(bookmarks.bookmarkEditionName), [
    'Hafs · Medina',
    'Hafs · QPC V1',
  ]);
  const printed = savedBookmarkTarget(entries[0]!);
  const selectable = savedBookmarkTarget(entries[1]!);
  assert.equal(printed.bookPresentation, 'original');
  assert.equal(selectable.bookPresentation, 'selectable');
  assert.equal(selectable.page, 42);
  assert.equal(selectable.ayah, undefined);
  assert.equal(resolveBookEntry(state, printed).page, 42);
  assert.equal(resolveBookEntry(state, selectable).page, 42);
  assert.equal(matchesMushafBookmarkPage(page, 'hafs', 42, 'selectable'), false);
  assert.equal(matchesMushafBookmarkPage(page, 'hafs', 42, 'original'), true);
  const withoutPrinted = appReducer(state, {
    type: 'mushaf/bookmark',
    ...page,
    bookPresentation: 'original',
  });
  assert.equal(withoutPrinted.mushafBookmarks.length, 1);
  assert.equal(withoutPrinted.mushafBookmarks[0]!.bookPresentation, 'selectable');
  assert.equal(
    appReducer(withoutPrinted, { type: 'mushaf/bookmark', ...page, bookPresentation: 'selectable' })
      .mushafBookmarks.length,
    0,
  );
  assert.throws(() =>
    decodeState(
      JSON.stringify({ ...state, mushafBookmarks: [{ ...page, bookPresentation: 'invalid' }] }),
    ),
  );
});
