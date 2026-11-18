import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState, type AppState } from '../src/state/models';
import { decodeState } from '../src/state/persistence/decodeState';
import { appReducer } from '../src/state/reducer';
import {
  hydrateState,
  legacyMigrationKey,
  stateStorageKey,
} from '../src/state/persistence/hydrateState';
import {
  importLegacyRoomRows,
  noLegacyDataResult,
  type LegacyRoomRows,
} from '../src/migration/legacyRoom';

function memoryStorage(raw: string | null = null) {
  const values = new Map<string, string>(raw === null ? [] : [[stateStorageKey, raw]]);
  const writes: string[] = [];
  return {
    values,
    writes,
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      writes.push(key);
      values.set(key, value);
    },
  };
}

test('invalid records reject an entire snapshot instead of dropping personal data', () => {
  const corruptions = {
    notes: [null],
    history: [null],
    plans: [null],
    journeys: [null],
    bookmarks: [null],
    focusSessions: [null],
    progress: { surah_1: null },
    goals: [null],
    goalDays: [null],
    mushafBookmarks: [null],
    mushafPositions: { hafs: '42' },
    preferences: [],
    cursor: { surah: 1, ayah: '1' },
    goal: { unit: 'rub', target: null },
    readingJourney: { enabled: true },
  };
  for (const [key, value] of Object.entries(corruptions)) {
    const raw = JSON.stringify({ ...initialState, [key]: value });
    assert.throws(() => decodeState(raw), new RegExp(`Saved ${key} data.*kept`), key);
  }
});

test('invalid JSON, future versions and damaged records never write or rerun migration; retry reads raw again', async () => {
  for (const raw of [
    '',
    '{bad',
    JSON.stringify({ version: 2 }),
    JSON.stringify({ ...initialState, notes: [null] }),
  ]) {
    const storage = memoryStorage(raw);
    let imports = 0;
    const importLegacy = async (state: AppState) => {
      imports++;
      return noLegacyDataResult(state);
    };
    await assert.rejects(hydrateState(storage, importLegacy), /data.*kept/);
    assert.equal(storage.values.get(stateStorageKey), raw);
    assert.deepEqual(storage.writes, []);
    assert.equal(imports, 0);
    storage.values.set(stateStorageKey, JSON.stringify(initialState));
    assert.deepEqual(await hydrateState(storage, importLegacy), initialState);
    assert.deepEqual(storage.writes, []);
  }
});

test('older version 1 defaults preserve existing fields and explicit empty collections', () => {
  const old = JSON.parse(JSON.stringify(initialState));
  for (const key of [
    'goals',
    'goalDays',
    'mushafBookmarks',
    'mushafPositions',
    'readingJourney',
    'legacyAndroid',
  ])
    delete old[key];
  old.preferences = { language: 'en', displayName: 'Saved name' };
  old.bookmarks = [{ surah: 2, ayah: 255, createdAt: 123 }];
  old.extension = { retained: true };
  const restored = decodeState(JSON.stringify(old));
  assert.equal(restored.preferences.language, 'en');
  assert.equal(restored.preferences.displayName, 'Saved name');
  assert.equal(restored.preferences.audioAutoplayEnabled, true);
  assert.deepEqual(restored.bookmarks, old.bookmarks);
  assert.deepEqual(restored.goals, initialState.goals);
  assert.deepEqual(restored.readingJourney, initialState.readingJourney);
  assert.deepEqual((restored as AppState & { extension: unknown }).extension, old.extension);
  assert.deepEqual(decodeState(JSON.stringify({ ...old, goals: [] })).goals, []);
});

test('card patterns default on for old or invalid values without losing other saved data', () => {
  assert.equal(initialState.preferences.cardPatterns, true);
  for (const cardPatterns of [undefined, null, 'false', 'true', 0, 1, [], {}]) {
    const saved = {
      ...initialState,
      preferences: { ...initialState.preferences, cardPatterns, displayName: 'Retained name' },
      bookmarks: [{ surah: 2, ayah: 255, createdAt: 123 }],
    };
    const decoded = decodeState(JSON.stringify(saved));
    assert.equal(decoded.preferences.cardPatterns, true);
    assert.equal(decoded.preferences.displayName, saved.preferences.displayName);
    assert.deepEqual(decoded.bookmarks, saved.bookmarks);
  }
});

test('the existing preferences action preserves card patterns off across serialization and hydration', async () => {
  const off = appReducer(initialState, { type: 'preferences', patch: { cardPatterns: false } });
  const storage = memoryStorage(JSON.stringify(off));
  const restored = await hydrateState(storage, async () => {
    throw new Error('Existing preferences must not rerun import');
  });
  assert.equal(restored.preferences.cardPatterns, false);
  assert.deepEqual(restored, off);
  const on = appReducer(restored, { type: 'preferences', patch: { cardPatterns: true } });
  assert.equal(decodeState(JSON.stringify(on)).preferences.cardPatterns, true);
});

const emptyRoom: LegacyRoomRows = {
  version: 20,
  progress: [],
  history: [],
  dailyGoals: [],
  goalDays: [],
  plans: [],
  journey: [],
  notes: [],
  checkinRequests: [],
};

test('an existing empty Room installation skips first-run onboarding unless its saved stage is explicitly pending', async () => {
  for (const stage of [undefined, 'LANGUAGE', 'INTRO_PENDING']) {
    const imported = importLegacyRoomRows(
      initialState,
      emptyRoom,
      stage ? { settings: { onboarding_language_stage_v1: stage } } : {},
    );
    const restored = await hydrateState(memoryStorage(), async () => ({
      state: imported,
      sourceFound: true,
      imported: true,
      sourceVersion: 20,
      warnings: [],
    }));
    assert.equal(restored.preferences.onboardingComplete, stage === undefined);
  }
});
const migrated = importLegacyRoomRows(initialState, emptyRoom, {
  reading_checklist_v1: { verses: ['4', '7'], position_scope: 'rub', position_number: 5 },
});
const migration = async () => ({
  state: migrated,
  imported: true,
  sourceFound: true,
  sourceVersion: 20,
  warnings: [],
});

test('migration writes durable state, checklist and marker in order and recovers interrupted sidecars without Room', async () => {
  const storage = memoryStorage();
  const setItem = storage.setItem;
  let fail = true;
  storage.setItem = async (key, value) => {
    if (key === 'wirdna:checklist:v1' && fail) {
      fail = false;
      throw new Error('Disk full');
    }
    await setItem(key, value);
  };
  await assert.rejects(hydrateState(storage, migration), /Disk full/);
  assert.deepEqual(storage.writes, [stateStorageKey]);
  assert.equal(storage.values.has(legacyMigrationKey), false);
  const durable = storage.values.get(stateStorageKey);
  await hydrateState(storage, async () => {
    throw new Error('Room must not be read twice');
  });
  assert.deepEqual(storage.writes, [stateStorageKey, 'wirdna:checklist:v1', legacyMigrationKey]);
  assert.equal(storage.values.get(stateStorageKey), durable);
  assert.deepEqual(JSON.parse(storage.values.get('wirdna:checklist:v1')!), {
    coverage: [4, 7],
    position: { scope: 'rub', number: 5 },
  });
  assert.equal(JSON.parse(storage.values.get(legacyMigrationKey)!).databaseVersion, 20);
});

test('migration retains an existing checklist and refuses unsafe imports before writing', async () => {
  const storage = memoryStorage();
  storage.values.set('wirdna:checklist:v1', 'existing checklist');
  await hydrateState(storage, migration);
  assert.deepEqual(storage.writes, [stateStorageKey, legacyMigrationKey]);
  assert.equal(storage.values.get('wirdna:checklist:v1'), 'existing checklist');
  for (const result of [
    { ...(await migration()), warnings: ['Unreadable legacy notes'] },
    { ...(await migration()), imported: false },
  ]) {
    const empty = memoryStorage();
    await assert.rejects(
      hydrateState(empty, async () => result),
      /Legacy local data/,
    );
    assert.deepEqual(empty.writes, []);
  }
});

test('hydration activates preserved reader positions and hifz tint without altering the import snapshot', async () => {
  const imported = importLegacyRoomRows(initialState, emptyRoom, {
    settings: { hifz_tint_enabled: false },
    reader_state: { last_read_surah: 2, last_read_ayah_1: 5, last_read_ayah_2: 255 },
  });
  const before = JSON.stringify(imported);
  const storage = memoryStorage();
  const hydrated = await hydrateState(storage, async () => ({
    state: imported,
    imported: true,
    sourceFound: true,
    sourceVersion: 20,
    warnings: [],
  }));
  assert.equal(hydrated.preferences.hifzColorsEnabled, false);
  assert.deepEqual(hydrated.surahPositions, { 1: 5, 2: 255 });
  assert.equal(JSON.stringify(imported), before);
  assert.equal(
    JSON.parse(storage.values.get(stateStorageKey)!).preferences.hifzColorsEnabled,
    false,
  );
});

test('nested invalid history, notes and legacy snapshots fail before recovery writes', async () => {
  const imported = importLegacyRoomRows(initialState, {
    ...emptyRoom,
    notes: [{ id: 1, note: 'Retained note', tags: 'study' }],
    history: [{ id: 1, surahName: 'Saved history' }],
    progress: [{ id: 'surah_1' }],
    plans: [{ id: 1 }],
  });
  assert.deepEqual(decodeState(JSON.stringify(imported)), JSON.parse(JSON.stringify(imported)));
  const corruptions = [
    { ...imported, notes: [{ ...imported.notes[0], tags: [] }] },
    { ...imported, history: [{ ...imported.history[0], ayahRange: { start: null, end: null } }] },
    {
      ...imported,
      legacyAndroid: { ...imported.legacyAndroid, readingChecklist: { verses: [null] } },
    },
    { ...imported, legacyAndroid: { ...imported.legacyAndroid, preferences: { settings: null } } },
  ];
  for (const snapshot of corruptions) {
    const raw = JSON.stringify(snapshot);
    const storage = memoryStorage(raw);
    await assert.rejects(hydrateState(storage, migration), /could not be read.*kept/);
    assert.equal(storage.values.get(stateStorageKey), raw);
    assert.deepEqual(storage.writes, []);
  }
});
