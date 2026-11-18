import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, type AppState } from '../src/state/models';
import { decodeState } from '../src/state/persistence/decodeState';
import {
  destinationHasUserData,
  importLegacyRoomRows,
  normalizeLegacyRoomRows,
  legacyChecklistToState,
  parseAndroidPreferencesXml,
  whitelistAndroidPreferenceFiles,
  type LegacyRoomRows,
} from '../src/migration/legacyRoom';

test('SharedPreferences XML reads typed values and string sets with only predefined entity decoding', () => {
  const values = parseAndroidPreferencesXml(`<?xml version="1.0"?><map>
    <string name="app_language">nl</string><string name="selected_reciter_name">A &amp; B</string>
    <boolean name="audio_repeat_enabled" value="true"/><int name="audio_skip_interval_seconds" value="10"/>
    <set name="verses"><string>3</string><string>4</string></set>
  </map>`);
  assert.deepEqual(values, {
    app_language: 'nl',
    selected_reciter_name: 'A & B',
    audio_repeat_enabled: true,
    audio_skip_interval_seconds: 10,
    verses: ['3', '4'],
  });
  assert.throws(
    () => parseAndroidPreferencesXml('<!DOCTYPE map [<!ENTITY secret "x">]><map/>'),
    /declarations/,
  );
});

test('preference allowlist retains device UI state while excluding account and transient secrets', () => {
  const selected = whitelistAndroidPreferenceFiles({
    settings: {
      app_language: 'ar',
      theme_mode: 'dark',
      access_token: 'secret',
      mushroom: 'ignored',
    },
    reader_bookmarks: {
      ayah_bookmarks_2: ['3', '4'],
      warsh_page_bookmarks_2: ['8'],
      auth_token: 'secret',
    },
    firebase_device: { token: 'secret' },
    pending_navigation: { group_code: 'secret' },
  });
  assert.deepEqual(selected, {
    settings: { app_language: 'ar', theme_mode: 'dark' },
    reader_bookmarks: { ayah_bookmarks_2: ['3', '4'], warsh_page_bookmarks_2: ['8'] },
  });
});

const rows: LegacyRoomRows = {
  version: 20,
  progress: [
    {
      id: 'rub_1_2',
      referenceId: 1,
      subId: 2,
      type: 'rub',
      isRead: 1,
      isMemorized: 0,
      progress: 75,
      hasHifzScore: 1,
      isCompleted: 0,
      readCount: 3,
      lastUpdated: 123,
    },
  ],
  history: [
    {
      id: 8,
      surahId: 1,
      surahName: 'Al-Fatihah',
      type: 'rub',
      action: 'read',
      extraInfo: 'start text',
      timestamp: 200,
      dateKey: '2026-11-12',
      amount: 2,
      sourceKey: 'plan:7',
      contentType: 'rub',
      ownerId: 'local-owner',
    },
  ],
  dailyGoals: [
    { id: 1, unit: 'rub', target: 4, reminderHour: 8, reminderMinute: 15 },
    { id: 2, unit: 'ayahs', target: 0, reminderHour: 8, reminderMinute: 0 },
  ],
  goalDays: [
    { goalId: 1, date: '2026-11-12', unit: 'rub', target: 4, extra: 2, resolution: 'carry' },
  ],
  plans: [
    {
      id: 7,
      date: '2026-11-12',
      type: 'rub',
      referenceId: 1,
      subId: 2,
      displayName: 'Rub 1/2',
      arabicText: 'الآية',
      isDone: true,
      historyLogged: true,
      reminderHour: null,
      reminderMinute: null,
      createdAt: 130,
      goalId: 2,
      amount: 1,
      measurementUnit: 'rub',
    },
  ],
  journey: [
    {
      id: 1,
      enabled: true,
      type: 'quran',
      totalDays: 30,
      startDate: '2026-11-01',
      autoDailyGoal: true,
      updatedAt: 100,
    },
  ],
  notes: [
    {
      id: 5,
      surahId: null,
      surahName: '',
      ayahNumber: null,
      scopeType: 'juz',
      juzNumber: 2,
      hizbNumber: null,
      rubNumber: null,
      title: '',
      note: 'Text',
      folder: 'Study',
      tags: 'A,b',
      fontSize: 17,
      headingLevel: 2,
      isBold: 1,
      isItalic: 0,
      isUnderline: 1,
      isStrike: 0,
      listMode: 'bullet',
      textColorKey: 'gold',
      formatSpans: '[]',
      isPinned: 1,
      updatedAt: 300,
    },
  ],
  checkinRequests: [{ requestId: 'request-3' }],
};

test('explicit legacy onboarding stage overrides existing rows and restores the stable step', () => {
  const selected = whitelistAndroidPreferenceFiles({
    settings: {
      onboarding_language_stage_v1: 'INTRO_PENDING',
      onboarding_intro_step_v1: 'planning',
    },
  });
  const pending = importLegacyRoomRows(initialState, rows, selected);
  assert.equal(pending.preferences.onboardingComplete, false);
  assert.equal(pending.preferences.onboardingStep, 'planning');
  const language = importLegacyRoomRows(initialState, rows, {
    settings: { onboarding_language_stage_v1: 'LANGUAGE' },
  });
  assert.equal(language.preferences.onboardingComplete, false);
  assert.equal(language.preferences.onboardingStep, 'language');
  const complete = importLegacyRoomRows(initialState, rows, {
    settings: { onboarding_language_stage_v1: 'COMPLETED' },
  });
  assert.equal(complete.preferences.onboardingComplete, true);
  const unknown = importLegacyRoomRows(initialState, rows, {
    settings: {
      onboarding_language_stage_v1: 'INTRO_PENDING',
      onboarding_intro_step_v1: 'unknown',
    },
  });
  assert.equal(unknown.preferences.onboardingStep, 'reading');
});

test('Room rows map without losing note scope/format, source IDs, history metadata, plans or goal snapshots', () => {
  const state = importLegacyRoomRows(initialState, rows, {
    settings: { app_language: 'nl', theme_mode: 'dark', mushaf_mode: 'warsh_maknoon' },
    reader_state: { last_read_surah: 2, last_read_ayah_2: 255, arabic_font_size: 28 },
    reader_bookmarks: { ayah_bookmarks_1: ['1', '7'], warsh_page_bookmarks_1: ['3'] },
    reading_checklist_v1: { verses: ['4', '7'], position_scope: 'rub', position_number: 5 },
  });
  assert.equal(state.progress.rub_1_2?.progress, 75);
  assert.equal(state.progress.rub_1_2?.hasHifzScore, true);
  assert.equal(state.history[0]?.id, '8');
  assert.equal(state.history[0]?.extraInfo, 'start text');
  assert.equal(state.history[0]?.ownerId, 'local-owner');
  assert.equal(state.notes[0]?.scopeType, 'juz');
  assert.equal(state.notes[0]?.juzNumber, 2);
  assert.equal(state.notes[0]?.formatSpans, '[]');
  assert.equal(state.notes[0]?.isPinned, true);
  assert.equal(state.plans[0]?.id, '7');
  assert.equal(state.plans[0]?.arabicText, 'الآية');
  assert.deepEqual(state.goal, { unit: 'rub', target: 4 });
  assert.equal(state.preferences.language, 'nl');
  assert.equal(state.preferences.theme, 'dark');
  assert.equal(state.preferences.arabicFontSize, 28);
  assert.deepEqual(
    state.bookmarks.map(({ surah, ayah }) => [surah, ayah]),
    [
      [1, 1],
      [1, 7],
    ],
  );
  assert.equal(state.cursor.surah, 2);
  assert.equal(state.cursor.ayah, 255);
  assert.equal(state.legacyAndroid?.dailyGoals.length, 2);
  assert.equal(state.legacyAndroid?.goalDays[0]?.extra, 2);
  assert.equal(state.legacyAndroid?.journey?.totalDays, 30);
  assert.deepEqual(state.legacyAndroid?.checkinRequestIds, ['request-3']);
  assert.deepEqual(state.legacyAndroid?.readerBookmarks.warsh_page_bookmarks_1, ['3']);
  assert.deepEqual(state.legacyAndroid?.readingChecklist?.verses, [4, 7]);
});

test('migration returns existing RN user state untouched instead of overwriting it', () => {
  const existing = { ...initialState, notes: [{ id: 101 } as AppState['notes'][number]] };
  assert.equal(destinationHasUserData(existing), true);
  assert.equal(importLegacyRoomRows(existing, rows), existing);
});

test('legacy checklist coverage and saved stopping place map to the current persisted checklist shape', () => {
  assert.deepEqual(
    legacyChecklistToState({
      verses: [2, 1, 2, -1, 6236],
      positionScope: 'rub',
      positionNumber: 4,
    }),
    {
      coverage: [1, 2],
      position: { scope: 'rub', number: 4 },
    },
  );
  assert.deepEqual(
    legacyChecklistToState({ verses: [], positionScope: 'surah', positionNumber: 115 }),
    { coverage: [], position: null },
  );
  assert.equal(legacyChecklistToState(null), null);
});

function legacyFixture(version: number): LegacyRoomRows {
  const fixture = structuredClone(rows);
  fixture.version = version;
  if (version < 20) {
    fixture.checkinRequests = [];
    fixture.history.forEach((row) => {
      delete row.ownerId;
    });
  }
  if (version < 19)
    fixture.history.forEach((row) => {
      delete row.contentType;
    });
  if (version < 18) {
    fixture.goalDays = [];
    fixture.history.forEach((row) => {
      delete row.amount;
      delete row.sourceKey;
    });
    fixture.plans.forEach((row) => {
      delete row.goalId;
      delete row.amount;
      delete row.measurementUnit;
    });
  }
  if (version < 17)
    fixture.notes.forEach((row) => {
      delete row.scopeType;
      delete row.juzNumber;
      delete row.hizbNumber;
      delete row.rubNumber;
      row.surahId = 2;
      row.surahName = 'Al-Baqarah';
      row.ayahNumber = 255;
    });
  return fixture;
}

test('Room16 through Room20 snapshots reopen without losing migrated content or optional source preferences', () => {
  for (const version of [16, 17, 18, 19, 20]) {
    const mapped = importLegacyRoomRows(initialState, legacyFixture(version));
    const wire = JSON.stringify(mapped);
    assert.deepEqual(decodeState(wire), JSON.parse(wire), `Room ${version}`);
    const withBookmarks = importLegacyRoomRows(initialState, legacyFixture(version), {
      reader_bookmarks: { warsh_page_bookmarks_2: ['8'] },
    });
    const olderRn = JSON.parse(JSON.stringify(withBookmarks));
    delete olderRn.mushafBookmarks;
    delete olderRn.readingJourney;
    const restored = decodeState(JSON.stringify(olderRn));
    assert.deepEqual(restored.mushafBookmarks, [{ edition: 'muhammadi', surah: 2, page: 8 }]);
    assert.deepEqual(restored.readingJourney, withBookmarks.legacyAndroid?.journey);
    assert.deepEqual(restored.notes, withBookmarks.notes);
  }
});

test('Room16 applies the complete original chain in memory while preserving note content and source rows', () => {
  const fixture = legacyFixture(16);
  const before = structuredClone(fixture);
  fixture.history[0]!.type = 'khatma';
  fixture.history[0]!.surahName = 'Day one';
  fixture.plans[0]!.type = 'khatma';
  fixture.plans[0]!.displayName = 'Day one';
  fixture.plans[0]!.date = fixture.history[0]!.dateKey;
  fixture.plans[0]!.referenceId = 5;
  fixture.plans[0]!.subId = 8;
  const original = structuredClone(fixture);
  const mapped = importLegacyRoomRows(initialState, fixture);
  assert.equal(mapped.legacyAndroid?.databaseVersion, 16);
  assert.equal(mapped.notes[0]!.scopeType, 'ayah');
  assert.equal(mapped.notes[0]!.juzNumber, null);
  assert.equal(mapped.notes[0]!.hizbNumber, null);
  assert.equal(mapped.notes[0]!.rubNumber, null);
  assert.equal(mapped.notes[0]!.surahId, 2);
  assert.equal(mapped.notes[0]!.ayahNumber, 255);
  assert.equal(mapped.notes[0]!.note, before.notes[0]!.note);
  assert.equal(mapped.notes[0]!.formatSpans, before.notes[0]!.formatSpans);
  assert.equal(mapped.notes[0]!.updatedAt, before.notes[0]!.updatedAt);
  assert.equal(mapped.history[0]!.type, 'rub');
  assert.equal(mapped.history[0]!.amount, 4);
  assert.equal(mapped.history[0]!.contentType, 'rub');
  assert.equal(mapped.history[0]!.ownerId, '');
  assert.equal(mapped.plans[0]!.goalId, 1);
  assert.equal(mapped.plans[0]!.amount, 1);
  assert.equal(mapped.plans[0]!.measurementUnit, '');
  assert.deepEqual(mapped.goalDays, []);
  assert.deepEqual(mapped.legacyAndroid?.checkinRequestIds, []);
  assert.deepEqual(fixture, original);
});

test('Room17 khatma conversion follows exact SQL name/date matching, first match and clamped inclusive quantity', () => {
  const fixture = legacyFixture(17);
  fixture.history = ['Normal', 'Large', 'Reversed', 'Different date', 'normal'].map(
    (name, index) => ({
      id: index + 1,
      surahId: 1,
      surahName: name,
      type: 'khatma',
      action: 'read',
      timestamp: index,
      dateKey: '2026-11-12',
      extraInfo: '',
    }),
  );
  fixture.plans = [
    { type: 'khatma', displayName: 'Normal', date: '2026-11-12', referenceId: 5, subId: 8 },
    { type: 'khatma', displayName: 'Normal', date: '2026-11-12', referenceId: 5, subId: 12 },
    { type: 'khatma', displayName: 'Large', date: '2026-11-12', referenceId: 1, subId: 999 },
    { type: 'khatma', displayName: 'Reversed', date: '2026-11-12', referenceId: 8, subId: 2 },
    { type: 'khatma', displayName: 'Different date', date: '2026-11-13', referenceId: 1, subId: 4 },
  ];
  const before = structuredClone(fixture);
  const normalized = normalizeLegacyRoomRows(fixture);
  assert.deepEqual(
    normalized.history.map((row) => [
      row.type,
      row.amount,
      row.contentType,
      row.sourceKey,
      row.ownerId,
    ]),
    [
      ['rub', 4, 'rub', null, ''],
      ['rub', 240, 'rub', null, ''],
      ['rub', 1, 'rub', null, ''],
      ['khatma', 1, 'khatma', null, ''],
      ['khatma', 1, 'khatma', null, ''],
    ],
  );
  assert.deepEqual(fixture, before);
});

test('Room18 keeps existing quantities/source keys and initializes content type before owner', () => {
  const fixture = legacyFixture(18);
  const before = structuredClone(fixture);
  const normalized = normalizeLegacyRoomRows(fixture);
  assert.equal(normalized.history[0]!.amount, 2);
  assert.equal(normalized.history[0]!.sourceKey, 'plan:7');
  assert.equal(normalized.history[0]!.contentType, 'rub');
  assert.equal(normalized.history[0]!.ownerId, '');
  assert.equal(normalized.goalDays[0]!.extra, 2);
  assert.equal(normalized.plans[0]!.goalId, 2);
  assert.deepEqual(fixture, before);
});

test('Room19 preserves content identity and initializes only the new owner/request fields', () => {
  const fixture = legacyFixture(19);
  fixture.history[0]!.contentType = 'hizb';
  const before = structuredClone(fixture);
  const normalized = normalizeLegacyRoomRows(fixture);
  assert.equal(normalized.history[0]!.contentType, 'hizb');
  assert.equal(normalized.history[0]!.ownerId, '');
  assert.equal(normalized.history[0]!.amount, 2);
  assert.equal(normalized.history[0]!.sourceKey, 'plan:7');
  assert.deepEqual(normalized.checkinRequests, []);
  assert.deepEqual(fixture, before);
});

test('Room20 normalization is an exact no-op, retaining owner, content type, request IDs and source values', () => {
  const fixture = legacyFixture(20);
  const before = structuredClone(fixture);
  assert.equal(normalizeLegacyRoomRows(fixture), fixture);
  assert.deepEqual(fixture, before);
  const mapped = importLegacyRoomRows(initialState, fixture);
  assert.equal(mapped.history[0]!.ownerId, 'local-owner');
  assert.equal(mapped.history[0]!.amount, 2);
  assert.equal(mapped.history[0]!.contentType, 'rub');
  assert.deepEqual(mapped.legacyAndroid?.checkinRequestIds, ['request-3']);
});
