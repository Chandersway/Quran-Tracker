import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultDockDestinations,
  dockDestinationIds,
  normalizeDockDestinations,
  visibleDockDestinations,
} from '../src/domain/dockPreferences';
import { dockDestinations } from '../src/app/navigation/dockDestinations';
import { initialState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';

test('reading indexes remain directly reachable without changing custom pins', () => {
  const pinned = [...defaultDockDestinations];
  assert.deepEqual(visibleDockDestinations(pinned), [
    'stats',
    'mushaf',
    'groups',
    'surah',
    'hizb',
    'juz',
  ]);
  assert.deepEqual(pinned, defaultDockDestinations);
  assert.deepEqual(visibleDockDestinations(['hizb', 'notes']), ['hizb', 'notes', 'surah', 'juz']);
});

test('missing preferences keep the original three destinations; explicit empty remains empty', () => {
  const saved = JSON.parse(JSON.stringify(initialState));
  delete saved.preferences.dockDestinations;
  assert.deepEqual(decodeState(JSON.stringify(saved)).preferences.dockDestinations, [
    'stats',
    'mushaf',
    'groups',
  ]);
  saved.preferences.dockDestinations = [];
  assert.deepEqual(decodeState(JSON.stringify(saved)).preferences.dockDestinations, []);
  assert.deepEqual(normalizeDockDestinations(null), defaultDockDestinations);
});

test('load, import decoding and preference updates discard unknowns, duplicates and excess', () => {
  const damaged = ['notes', 'bogus', 'notes', 'juz', 42, 'focus', 'groups'];
  const expected = ['notes', 'juz', 'focus'];
  const state = {
    ...initialState,
    preferences: { ...initialState.preferences, dockDestinations: damaged },
  };
  assert.deepEqual(decodeState(JSON.stringify(state)).preferences.dockDestinations, expected);
  assert.deepEqual(
    appReducer(initialState, { type: 'preferences', patch: { dockDestinations: damaged as never } })
      .preferences.dockDestinations,
    expected,
  );
  const persisted = appReducer(initialState, {
    type: 'preferences',
    patch: { dockDestinations: ['quran', 'mushaf'] as never },
  });
  assert.deepEqual(decodeState(JSON.stringify(persisted)).preferences.dockDestinations, ['mushaf']);
  assert.deepEqual(
    appReducer(persisted, {
      type: 'preferences',
      patch: { dockDestinations: [...defaultDockDestinations] },
    }).preferences.dockDestinations,
    defaultDockDestinations,
  );
});

test('legacy Quran dock IDs map to the one Mushaf entrance before deduplication and the three-item limit', () => {
  for (const [saved, expected] of [
    [['quran'], ['mushaf']],
    [
      ['quran', 'mushaf', 'surah', 'library'],
      ['mushaf', 'surah', 'library'],
    ],
    [
      ['notes', 'mushaf', 'quran', 'groups', 'library'],
      ['notes', 'mushaf', 'groups'],
    ],
  ]) {
    assert.deepEqual(normalizeDockDestinations(saved), expected);
    assert.deepEqual(
      decodeState(
        JSON.stringify({
          ...initialState,
          preferences: { ...initialState.preferences, dockDestinations: saved },
        }),
      ).preferences.dockDestinations,
      expected,
    );
  }
  assert.equal(dockDestinations.filter((item) => item.label === 'app.quran').length, 0);
  assert.equal(dockDestinations.filter((item) => item.id === 'mushaf').length, 1);
  assert.ok(dockDestinations.some((item) => item.id === 'surah' && item.tab === 'Quran'));
  assert.ok(dockDestinations.some((item) => item.id === 'library'));
});

test('nonempty arrays with no known destination recover defaults instead of becoming explicit empty', () => {
  for (const damaged of [['future-destination'], [42, null, {}], ['']]) {
    assert.deepEqual(normalizeDockDestinations(damaged), defaultDockDestinations);
    const saved = {
      ...initialState,
      preferences: { ...initialState.preferences, dockDestinations: damaged },
    };
    assert.deepEqual(
      decodeState(JSON.stringify(saved)).preferences.dockDestinations,
      defaultDockDestinations,
    );
    assert.deepEqual(
      appReducer(initialState, {
        type: 'preferences',
        patch: { dockDestinations: damaged as never },
      }).preferences.dockDestinations,
      defaultDockDestinations,
    );
  }
  assert.deepEqual(normalizeDockDestinations([]), []);
  assert.deepEqual(normalizeDockDestinations(['future-destination', 'notes', null]), ['notes']);
});

test('every saved choice maps to one visible destination with correct tab identities', () => {
  assert.deepEqual(dockDestinations.map((item) => item.id).sort(), [...dockDestinationIds].sort());
  const tabs = Object.fromEntries(
    dockDestinations.filter((item) => item.tab).map((item) => [item.id, item.tab]),
  );
  assert.deepEqual(tabs, {
    stats: 'Today',
    groups: 'Circle',
    surah: 'Quran',
    hizb: 'Practice',
    juz: 'Juz',
    agenda: 'Plan',
  });
  assert.equal(dockDestinations.find((item) => item.id === 'mushaf')?.tab, undefined);
  assert.notEqual(
    dockDestinations.find((item) => item.id === 'mushaf')?.id,
    dockDestinations.find((item) => item.id === 'library')?.id,
  );
});
