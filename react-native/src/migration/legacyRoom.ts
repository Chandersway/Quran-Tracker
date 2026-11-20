import {
  initialState,
  type AppState,
  type LegacyAndroidSnapshot,
  type LegacyDailyGoal,
  type LegacyGoalDay,
  type LegacyPreferenceValue,
  type LegacyReadingJourney,
  type Plan,
  type Progress,
  type ReadingEntry,
} from '../state/models';
import type { ExportableNote } from '../exporting/notesExport';
import { validateNoteTarget, type NoteScope } from '../domain/quran';
import { normalizePlaybackSpeed, normalizeSkipInterval } from '../domain/audioPlayback';
import { resolveOnboardingStep } from '../domain/onboarding';
import { legacyWarshBookmarks } from '../domain/mushafBookmarks';

export type SqlRow = Record<string, unknown>;
export type LegacyRoomRows = {
  version: number;
  progress: SqlRow[];
  history: SqlRow[];
  dailyGoals: SqlRow[];
  goalDays: SqlRow[];
  plans: SqlRow[];
  journey: SqlRow[];
  notes: SqlRow[];
  checkinRequests: SqlRow[];
};
export type LegacyPreferenceFiles = Record<string, Record<string, LegacyPreferenceValue>>;
export type LegacyImportResult = {
  state: AppState;
  imported: boolean;
  sourceFound: boolean;
  sourceVersion?: number;
  warnings: string[];
};
export type ChecklistState = {
  coverage: number[];
  position: { scope: NoteScope; number: number } | null;
};

const number = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const string = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const bool = (value: unknown): boolean => value === true || value === 1 || value === '1';
const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : number(value);
const nullableString = (value: unknown): string | null =>
  value === null || value === undefined ? null : string(value);

/** Parse Android SharedPreferences XML without a general XML engine or entity expansion. */
export function parseAndroidPreferencesXml(xml: string): Record<string, LegacyPreferenceValue> {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error('Preference XML declarations are not accepted');
  const decode = (value: string) =>
    value.replace(
      /&(?:amp|lt|gt|quot|apos);/g,
      (entity) =>
        ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" })[entity]!,
    );
  const readAttribute = (attributes: string, name: string): string | undefined => {
    const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`));
    return match ? decode(match[2]!) : undefined;
  };
  const values: Record<string, LegacyPreferenceValue> = {};
  const tag = /<(string|int|long|float|boolean)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1\s*>)/g;
  for (const match of xml.matchAll(tag)) {
    const type = match[1]!;
    const attributes = match[2]!;
    const key = readAttribute(attributes, 'name');
    if (!key) continue;
    if (type === 'string') values[key] = decode(match[3] ?? '');
    else if (type === 'boolean') values[key] = readAttribute(attributes, 'value') === 'true';
    else {
      const raw = readAttribute(attributes, 'value');
      const parsed = raw === undefined ? NaN : Number(raw);
      if (Number.isFinite(parsed)) values[key] = parsed;
    }
  }
  const sets = /<set\b([^>]*)>([\s\S]*?)<\/set\s*>/g;
  for (const match of xml.matchAll(sets)) {
    const key = readAttribute(match[1]!, 'name');
    if (!key) continue;
    values[key] = [...(match[2] ?? '').matchAll(/<string\b[^>]*>([\s\S]*?)<\/string\s*>/g)].map(
      (item) => decode(item[1] ?? ''),
    );
  }
  return values;
}

/** Restrict XML migration to locally visible preference keys; cloud credentials are deliberately absent. */
export function whitelistAndroidPreferenceFiles(
  files: Record<string, Record<string, LegacyPreferenceValue>>,
): LegacyPreferenceFiles {
  const allowed: Record<string, readonly string[]> = {
    settings: [
      'app_language',
      'theme_mode',
      'mushaf_mode',
      'selected_reciter_name',
      'audio_playback_speed',
      'audio_skip_interval_seconds',
      'audio_repeat_enabled',
      'audio_autoplay_enabled',
      'arabic_font_size',
      'hifz_tint_enabled',
      'onboarding_language_stage_v1',
      'onboarding_intro_step_v1',
    ],
    reader_state: [
      'last_read_surah',
      'arabic_font_size',
      ...Array.from({ length: 114 }, (_, i) => `last_read_ayah_${i + 1}`),
    ],
    reader_bookmarks: [],
    reading_checklist_v1: ['verses', 'position_scope', 'position_number'],
    independent_reading_plan: ['target', 'unit', 'end', 'adjustment'],
    notification_preferences_v1: [
      'enabled',
      'daily',
      'dailyMinute',
      'extra',
      'extraMinute',
      'planning',
      'quiet',
      'quietStart',
      'quietEnd',
    ],
  };
  const result: LegacyPreferenceFiles = {};
  for (const [fileName, keys] of Object.entries(allowed)) {
    const source = files[fileName];
    if (!source) continue;
    const selected: Record<string, LegacyPreferenceValue> = {};
    const keySet =
      fileName === 'reader_bookmarks' ? /^(?:ayah_bookmarks|warsh_page_bookmarks)_\d+$/ : null;
    for (const [key, value] of Object.entries(source)) {
      if (keys.includes(key) || keySet?.test(key)) selected[key] = value;
    }
    result[fileName] = selected;
  }
  return result;
}

export function destinationHasUserData(state: AppState): boolean {
  return (
    state.history.length > 0 ||
    state.notes.length > 0 ||
    state.plans.length > 0 ||
    state.journeys.length > 0 ||
    Object.keys(state.progress).length > 0 ||
    state.bookmarks.length > 0 ||
    state.focusSessions.length > 0 ||
    state.goalDays.length > 0 ||
    JSON.stringify(state.goals) !== JSON.stringify(initialState.goals) ||
    JSON.stringify(state.preferences) !== JSON.stringify(initialState.preferences) ||
    JSON.stringify(state.cursor) !== JSON.stringify(initialState.cursor) ||
    JSON.stringify(state.goal) !== JSON.stringify(initialState.goal) ||
    state.legacyAndroid !== null
  );
}

/**
 * Apply the original Room 16->20 data transforms to copies, never to SQLite.
 * Keep version as the original source version for the durable migration record.
 */
export function normalizeLegacyRoomRows(rows: LegacyRoomRows): LegacyRoomRows {
  if (rows.version < 16 || rows.version >= 20) return rows;
  let normalized = { ...rows };
  if (rows.version === 16) {
    // NoteScopesMigration copies every legacy field and supplies these new columns.
    normalized = {
      ...normalized,
      notes: rows.notes.map((row) => ({
        ...row,
        scopeType: 'ayah',
        juzNumber: null,
        hizbNumber: null,
        rubNumber: null,
      })),
    };
  }
  if (rows.version <= 17) {
    const plans = normalized.plans.map((row) => ({
      ...row,
      goalId: 1,
      amount: 1,
      measurementUnit: '',
    }));
    const history = normalized.history.map((row) => {
      const expanded = { ...row, amount: 1, sourceKey: null };
      // SQL uses an exact name/date match and LIMIT 1 in the table's read order.
      const plan =
        row.type === 'khatma' &&
        typeof row.surahName === 'string' &&
        typeof row.dateKey === 'string'
          ? normalized.plans.find(
              (plan) =>
                plan.type === 'khatma' &&
                plan.displayName === row.surahName &&
                plan.date === row.dateKey,
            )
          : undefined;
      return plan
        ? {
            ...expanded,
            type: 'rub',
            amount: Math.max(1, Math.min(240, number(plan.subId) - number(plan.referenceId) + 1)),
          }
        : expanded;
    });
    normalized = { ...normalized, history, plans, goalDays: [] };
  }
  if (rows.version <= 18) {
    normalized = {
      ...normalized,
      history: normalized.history.map((row) => ({ ...row, contentType: row.type })),
    };
  }
  // Room 19->20 adds a blank local owner and a new, empty request table.
  return {
    ...normalized,
    history: normalized.history.map((row) => ({ ...row, ownerId: '' })),
    checkinRequests: [],
  };
}

function mapNote(row: SqlRow): ExportableNote {
  return {
    id: number(row.id),
    scopeType: string(row.scopeType, 'ayah'),
    juzNumber: nullableNumber(row.juzNumber),
    hizbNumber: nullableNumber(row.hizbNumber),
    rubNumber: nullableNumber(row.rubNumber),
    surahId: nullableNumber(row.surahId),
    surahName: string(row.surahName),
    ayahNumber: nullableNumber(row.ayahNumber),
    title: string(row.title),
    note: string(row.note),
    folder: string(row.folder),
    tags: string(row.tags),
    fontSize: number(row.fontSize, 16),
    headingLevel: number(row.headingLevel),
    isBold: bool(row.isBold),
    isItalic: bool(row.isItalic),
    isUnderline: bool(row.isUnderline),
    isStrike: bool(row.isStrike),
    listMode: string(row.listMode, 'none'),
    textColorKey: string(row.textColorKey, 'gold'),
    formatSpans: string(row.formatSpans),
    isPinned: bool(row.isPinned),
    updatedAt: number(row.updatedAt),
  };
}

function mapProgress(row: SqlRow): Progress {
  return {
    id: string(row.id),
    referenceId: number(row.referenceId),
    subId: number(row.subId),
    type: string(row.type) as Progress['type'],
    isRead: bool(row.isRead),
    isMemorized: bool(row.isMemorized),
    progress: number(row.progress),
    hasHifzScore: bool(row.hasHifzScore),
    isCompleted: bool(row.isCompleted),
    readCount: number(row.readCount),
    lastUpdated: number(row.lastUpdated),
  };
}

function mapHistory(row: SqlRow): ReadingEntry {
  return {
    id: String(row.id),
    surahId: number(row.surahId),
    surahName: string(row.surahName),
    type: string(row.type),
    action: string(row.action),
    amount: number(row.amount, 1),
    timestamp: number(row.timestamp),
    dateKey: string(row.dateKey),
    sourceKey: nullableString(row.sourceKey),
    ownerId: string(row.ownerId),
    contentType: string(row.contentType),
    extraInfo: string(row.extraInfo),
  };
}

function mapPlan(row: SqlRow): Plan {
  return {
    id: String(row.id),
    date: string(row.date),
    type: string(row.type) as Plan['type'],
    referenceId: number(row.referenceId),
    subId: number(row.subId),
    displayName: string(row.displayName),
    isDone: bool(row.isDone),
    historyLogged: bool(row.historyLogged),
    reminderHour: nullableNumber(row.reminderHour),
    reminderMinute: nullableNumber(row.reminderMinute),
    createdAt: number(row.createdAt),
    goalId: number(row.goalId, 1),
    amount: number(row.amount, 1),
    measurementUnit: string(row.measurementUnit),
    arabicText: string(row.arabicText),
  };
}

function mapDailyGoal(row: SqlRow): LegacyDailyGoal {
  return {
    id: number(row.id),
    unit: string(row.unit),
    target: number(row.target),
    reminderHour: number(row.reminderHour, 8),
    reminderMinute: number(row.reminderMinute),
  };
}
function mapGoalDay(row: SqlRow): LegacyGoalDay {
  return {
    goalId: number(row.goalId),
    date: string(row.date),
    unit: string(row.unit),
    target: number(row.target),
    extra: number(row.extra),
    resolution: string(row.resolution),
  };
}
function mapJourney(row: SqlRow): LegacyReadingJourney {
  return {
    id: number(row.id),
    enabled: bool(row.enabled),
    type: string(row.type),
    totalDays: number(row.totalDays),
    startDate: string(row.startDate),
    autoDailyGoal: bool(row.autoDailyGoal),
    updatedAt: number(row.updatedAt),
  };
}

function validLanguage(value: LegacyPreferenceValue | undefined): value is 'en' | 'nl' | 'ar' {
  return value === 'en' || value === 'nl' || value === 'ar';
}
function validTheme(
  value: LegacyPreferenceValue | undefined,
): value is 'light' | 'dark' | 'system' {
  return value === 'light' || value === 'dark' || value === 'system';
}
function isoDayEnd(start: string, days: number): string {
  const day = new Date(`${start}T00:00:00.000Z`);
  if (!Number.isFinite(day.getTime())) return start;
  day.setUTCDate(day.getUTCDate() + Math.max(1, days) - 1);
  return day.toISOString().slice(0, 10);
}

/** Map exact Room v20 values to app state while retaining full goals/journey/source preferences for later native UI parity. */
export function importLegacyRoomRows(
  initial: AppState,
  rows: LegacyRoomRows,
  preferences: Record<string, Record<string, LegacyPreferenceValue>> = {},
): AppState {
  if (destinationHasUserData(initial)) return initial;
  rows = normalizeLegacyRoomRows(rows);
  const p = whitelistAndroidPreferenceFiles(preferences);
  const settings = p.settings ?? {};
  const stage = settings.onboarding_language_stage_v1;
  const explicitPending = stage === 'LANGUAGE' || stage === 'INTRO_PENDING';
  const explicitComplete = stage === 'COMPLETED' || stage === 'EXISTING_USER';
  const readerState = p.reader_state ?? {};
  const storedLanguage = settings.app_language;
  const storedTheme = settings.theme_mode;
  const rawGoals = rows.dailyGoals.map(mapDailyGoal);
  const goal = rawGoals.find((item) => item.id === 1);
  const safeGoalUnits = [
    'rub',
    'hizb',
    'juz',
    'surah',
    'ayah',
    'pages',
    'page',
    'ayahs',
    'minutes',
  ] as const;
  const savedUnit = goal?.unit;
  const progress = Object.fromEntries(
    rows.progress.map((row) => {
      const item = mapProgress(row);
      return [item.id, item];
    }),
  );
  const history = rows.history.map(mapHistory).sort((a, b) => b.timestamp - a.timestamp);
  const notes = rows.notes
    .map(mapNote)
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt - a.updatedAt);
  const plans = rows.plans
    .map(mapPlan)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const journey = rows.journey[0] ? mapJourney(rows.journey[0]) : null;
  const settingsLang = validLanguage(storedLanguage) ? storedLanguage : 'nl';
  const theme = validTheme(storedTheme) ? storedTheme : 'light';
  const legacyAndroid: LegacyAndroidSnapshot = {
    databaseVersion: rows.version,
    dailyGoals: rawGoals,
    goalDays: rows.goalDays.map(mapGoalDay),
    checkinRequestIds: rows.checkinRequests.map((row) => string(row.requestId)),
    journey,
    preferences: p,
    readingChecklist: p.reading_checklist_v1
      ? {
          verses: Array.isArray(p.reading_checklist_v1.verses)
            ? p.reading_checklist_v1.verses.map(Number).filter(Number.isInteger)
            : [],
          positionScope:
            typeof p.reading_checklist_v1.position_scope === 'string'
              ? p.reading_checklist_v1.position_scope
              : null,
          positionNumber: number(p.reading_checklist_v1.position_number),
        }
      : null,
    readerBookmarks: p.reader_bookmarks as Record<string, number>,
    readerState: Object.fromEntries(
      Object.entries(readerState).filter(([, value]) => typeof value === 'number'),
    ) as Record<string, number>,
    independentReadingPlan: p.independent_reading_plan ?? {},
  };
  const cursorSurah = number(readerState.last_read_surah, initial.cursor.surah);
  const cursorAyah = number(readerState[`last_read_ayah_${cursorSurah}`], initial.cursor.ayah);
  const savedBookmarks = Object.entries(p.reader_bookmarks ?? {}).flatMap(([key, values]) => {
    const match = key.match(/^ayah_bookmarks_(\d+)$/);
    if (!match || !Array.isArray(values)) return [];
    return values
      .map((value) => ({ surah: Number(match[1]), ayah: Number(value), createdAt: 0 }))
      .filter(
        (bookmark) =>
          bookmark.surah >= 1 &&
          bookmark.surah <= 114 &&
          bookmark.ayah >= 1 &&
          bookmark.ayah <= 286,
      );
  });
  const mushafBookmarks = legacyWarshBookmarks(p.reader_bookmarks ?? {});
  const mappedJourney = journey?.enabled
    ? [
        {
          id: String(journey.id),
          name: journey.type,
          startDate: journey.startDate,
          endDate: isoDayEnd(journey.startDate, journey.totalDays),
          startRub: 1,
          endRub: 240,
        },
      ]
    : [];
  return {
    ...initial,
    preferences: {
      ...initial.preferences,
      language: settingsLang,
      theme,
      translation: settingsLang === 'nl' ? 'nl' : 'en',
      audioPlaybackSpeed: normalizePlaybackSpeed(number(settings.audio_playback_speed, 1)),
      audioSkipIntervalSeconds: normalizeSkipInterval(
        number(settings.audio_skip_interval_seconds, 10),
      ),
      audioRepeatEnabled: settings.audio_repeat_enabled === true,
      audioAutoplayEnabled: settings.audio_autoplay_enabled !== false,
      onboardingComplete: explicitPending
        ? false
        : explicitComplete ||
          rows.progress.length + rows.history.length + rows.notes.length + rows.plans.length > 0 ||
          initial.preferences.onboardingComplete,
      onboardingStep:
        stage === 'INTRO_PENDING'
          ? resolveOnboardingStep(settings.onboarding_intro_step_v1) === 'language'
            ? 'reading'
            : resolveOnboardingStep(settings.onboarding_intro_step_v1)
          : 'language',
      mushaf:
        settings.mushaf_mode === 'hafs'
          ? 'hafs_ayahinfo_1260'
          : settings.mushaf_mode === 'warsh_maknoon' ||
              settings.mushaf_mode === 'hafs_maknoon' ||
              settings.mushaf_mode === 'hafs_madina_pdf' ||
              settings.mushaf_mode === 'hafs_indopak_15' ||
              settings.mushaf_mode === 'muhammadi'
            ? settings.mushaf_mode
            : initial.preferences.mushaf,
      arabicFontSize: number(readerState.arabic_font_size, 26),
    },
    progress,
    history,
    notes,
    plans,
    goals: rawGoals,
    goalDays: legacyAndroid.goalDays,
    journeys: mappedJourney,
    readingJourney: journey ?? initial.readingJourney,
    bookmarks: savedBookmarks,
    mushafBookmarks,
    cursor: { surah: cursorSurah, ayah: cursorAyah },
    goal:
      goal && (safeGoalUnits as readonly string[]).includes(savedUnit ?? '')
        ? { unit: savedUnit as AppState['goal']['unit'], target: goal.target }
        : initial.goal,
    legacyAndroid,
  };
}

export function noLegacyDataResult(state: AppState): LegacyImportResult {
  return { state, imported: false, sourceFound: false, warnings: [] };
}

export function legacyChecklistToState(
  checklist: LegacyAndroidSnapshot['readingChecklist'],
): ChecklistState | null {
  if (!checklist) return null;
  const coverage = [
    ...new Set(
      checklist.verses.filter((verse) => Number.isInteger(verse) && verse >= 0 && verse < 6236),
    ),
  ].sort((a, b) => a - b);
  let position: ChecklistState['position'] = null;
  if (checklist.positionScope && Number.isInteger(checklist.positionNumber)) {
    const target = {
      scope: checklist.positionScope as NoteScope,
      number: checklist.positionNumber,
    };
    try {
      validateNoteTarget(target);
      position = target;
    } catch {
      /* Coverage remains valid if an old cursor is not. */
    }
  }
  return { coverage, position };
}
