import { initialState, type AppState } from '../models';
import { defaultReadingJourney } from '../../domain/readingJourney';
import { legacyWarshBookmarks } from '../../domain/mushafBookmarks';
import { normalizeBookPresentation } from '../../domain/bookPresentation';
import { normalizeDockDestinations } from '../../domain/dockPreferences';
import { restoreSurahPositions } from './readerPositions';
import { normalizedRepeatReciter, normalizedRepeatRounds } from '../../domain/repeat';
import { normalizeThemeMode } from '../../domain/themePreferences';

type Check = (value: unknown) => boolean;
const string: Check = (value) => typeof value === 'string';
const number: Check = (value) => typeof value === 'number' && Number.isFinite(value);
const boolean: Check = (value) => typeof value === 'boolean';
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const optional =
  (check: Check): Check =>
  (value) =>
    value === undefined || check(value);
const nullable =
  (check: Check): Check =>
  (value) =>
    value === null || check(value);
const array =
  (check: Check): Check =>
  (value) =>
    Array.isArray(value) && value.every(check);
const record =
  (check: Check): Check =>
  (value) =>
    object(value) && Object.values(value).every(check);
const fields =
  (shape: Record<string, Check>): Check =>
  (value) =>
    object(value) && Object.entries(shape).every(([key, check]) => check(value[key]));

// Validate the stored representation, not today's input-form constraints. Legacy Room
// uses free-form strings and can retain zero quantities, empty dates and source fields.
// Unknown fields are retained; damaged records reject the whole snapshot rather than
// dropping personal data and later persisting an apparently successful partial load.
const progress = fields({
  id: string,
  referenceId: number,
  subId: number,
  type: string,
  isRead: boolean,
  isMemorized: boolean,
  progress: number,
  hasHifzScore: boolean,
  isCompleted: boolean,
  readCount: number,
  lastUpdated: number,
});
const position = fields({ surah: number, ayah: number });
const history = fields({
  id: string,
  surahId: number,
  surahName: string,
  type: string,
  action: string,
  amount: number,
  timestamp: number,
  dateKey: string,
  sourceKey: nullable(string),
  ownerId: string,
  contentType: string,
  extraInfo: optional(string),
  ayahRange: optional(fields({ start: position, end: position })),
  mushafPage: optional(
    fields({
      edition: string,
      page: number,
      bookPresentation: optional((value) => value === 'original' || value === 'selectable'),
    }),
  ),
});
const note = fields({
  id: number,
  scopeType: string,
  juzNumber: nullable(number),
  hizbNumber: nullable(number),
  rubNumber: nullable(number),
  surahId: nullable(number),
  surahName: string,
  ayahNumber: nullable(number),
  title: string,
  note: string,
  folder: string,
  tags: string,
  fontSize: number,
  headingLevel: number,
  isBold: boolean,
  isItalic: boolean,
  isUnderline: boolean,
  isStrike: boolean,
  listMode: string,
  textColorKey: string,
  formatSpans: string,
  isPinned: boolean,
  updatedAt: number,
});
const plan = fields({
  id: string,
  date: string,
  type: string,
  referenceId: number,
  subId: number,
  displayName: string,
  isDone: boolean,
  historyLogged: boolean,
  reminderHour: nullable(number),
  reminderMinute: nullable(number),
  createdAt: number,
  reminderNotificationId: optional(nullable(string)),
  reminderDueAt: optional(nullable((value) => number(value) && (value as number) >= 0)),
  goalId: number,
  amount: number,
  measurementUnit: string,
  arabicText: optional(string),
});
const dailyGoal = fields({
  id: number,
  unit: string,
  target: number,
  reminderHour: number,
  reminderMinute: number,
});
const goalDay = fields({
  goalId: number,
  date: string,
  unit: string,
  target: number,
  extra: number,
  resolution: string,
});
const journey = fields({
  id: string,
  name: string,
  startDate: string,
  endDate: string,
  startRub: number,
  endRub: number,
});
const readingJourney = fields({
  enabled: boolean,
  startDate: string,
  totalDays: number,
  autoDailyGoal: boolean,
  updatedAt: number,
});
const legacyPreference: Check = (value) =>
  string(value) || number(value) || boolean(value) || array(string)(value);
const legacyAndroid = fields({
  databaseVersion: number,
  dailyGoals: array(dailyGoal),
  goalDays: array(goalDay),
  checkinRequestIds: array(string),
  preferences: record(record(legacyPreference)),
  journey: optional(
    nullable(
      fields({
        id: number,
        type: string,
        enabled: boolean,
        startDate: string,
        totalDays: number,
        autoDailyGoal: boolean,
        updatedAt: number,
      }),
    ),
  ),
  readingChecklist: optional(
    nullable(
      fields({
        verses: array(number),
        positionScope: nullable(string),
        positionNumber: number,
      }),
    ),
  ),
  // Some older migration snapshots omit these when the preference file did not exist.
  readerBookmarks: optional(record(legacyPreference)),
  readerState: optional(record(number)),
  independentReadingPlan: optional(record(legacyPreference)),
});
const preferences = fields(
  Object.fromEntries(
    Object.entries({
      language: string,
      theme: string,
      translation: string,
      arabicFontSize: number,
      reciterId: number,
      audioPlaybackSpeed: number,
      audioSkipIntervalSeconds: number,
      audioRepeatEnabled: boolean,
      audioAutoplayEnabled: boolean,
      audioRepeatHafsReciter: string,
      audioRepeatWarshReciter: string,
      audioRepeatRounds: number,
      mushaf: string,
      onboardingComplete: boolean,
      onboardingStep: string,
      reminderEnabled: boolean,
      reminderHour: number,
      reminderMinute: number,
      displayName: string,
      // Presentation preferences below normalize missing/invalid values safely.
    }).map(([key, check]) => [key, optional(check)]),
  ),
);

/** Read version 1 atomically; callers must keep the original storage value on failure. */
export function decodeState(raw: string): AppState {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Saved data could not be read. Your data has been kept.');
  }
  if (!object(value) || value.version !== 1)
    throw new Error('Unsupported saved data version. Your data has been kept.');
  const checks: Record<string, Check> = {
    history: array(history),
    notes: array(note),
    noteFolders: optional(array(string)),
    plans: array(plan),
    journeys: array(journey),
    bookmarks: array(fields({ surah: number, ayah: number, createdAt: number })),
    focusSessions: array(fields({ id: string, durationSeconds: number, finishedAt: number })),
    progress: record(progress),
    preferences,
    cursor: position,
    goal: fields({ unit: string, target: number }),
    goals: optional(array(dailyGoal)),
    goalDays: optional(array(goalDay)),
    mushafBookmarks: optional(
      array(
        fields({
          edition: string,
          surah: number,
          page: number,
          bookPresentation: optional((mode) => mode === 'original' || mode === 'selectable'),
        }),
      ),
    ),
    mushafPositions: optional(record(number)),
    mushafPositionPresentations: optional(
      record((mode) => mode === 'original' || mode === 'selectable'),
    ),
    surahPositions: optional(record(number)),
    readingJourney: optional(nullable(readingJourney)),
    legacyAndroid: optional(nullable(legacyAndroid)),
  };
  for (const [key, check] of Object.entries(checks)) {
    if (!check(value[key]))
      throw new Error(`Saved ${key} data could not be read. Your data has been kept.`);
  }
  const s = value as AppState;
  return {
    ...initialState,
    ...s,
    surahPositions: restoreSurahPositions(s.surahPositions, s.legacyAndroid?.readerState, s.cursor),
    mushafBookmarks:
      s.mushafBookmarks ?? legacyWarshBookmarks(s.legacyAndroid?.readerBookmarks ?? {}),
    readingJourney: s.readingJourney ?? s.legacyAndroid?.journey ?? defaultReadingJourney,
    preferences: {
      ...initialState.preferences,
      ...s.preferences,
      audioRepeatHafsReciter: normalizedRepeatReciter(s.preferences.audioRepeatHafsReciter, false),
      audioRepeatWarshReciter: normalizedRepeatReciter(s.preferences.audioRepeatWarshReciter, true),
      audioRepeatRounds: normalizedRepeatRounds(s.preferences.audioRepeatRounds),
      theme: normalizeThemeMode(s.preferences.theme),
      cardPatterns:
        typeof s.preferences.cardPatterns === 'boolean' ? s.preferences.cardPatterns : true,
      hifzColorsEnabled:
        typeof s.preferences.hifzColorsEnabled === 'boolean'
          ? s.preferences.hifzColorsEnabled
          : typeof s.legacyAndroid?.preferences.settings?.hifz_tint_enabled === 'boolean'
            ? s.legacyAndroid.preferences.settings.hifz_tint_enabled
            : true,
      bookPresentation: normalizeBookPresentation(s.preferences.bookPresentation),
      dockDestinations: normalizeDockDestinations(s.preferences.dockDestinations),
    },
  };
}
