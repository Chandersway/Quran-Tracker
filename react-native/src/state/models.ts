import type { ExportableNote } from '../exporting/notesExport';
import type { TranslationChoice } from '../content/translations';
import type { QuranProgressKind } from '../domain/quran';
import type { ThemeMode } from '../domain/themePreferences';
import { defaultReadingJourney, type ReadingJourneyConfiguration } from '../domain/readingJourney';
import { defaultDockDestinations, type DockDestinationId } from '../domain/dockPreferences';

export type Language = 'en' | 'nl' | 'ar';
export type BookPresentation = 'selectable' | 'original';
export type Preferences = {
  language: Language;
  theme: ThemeMode;
  cardPatterns: boolean;
  hifzColorsEnabled: boolean;
  translation: TranslationChoice;
  arabicFontSize: number;
  reciterId: number;
  audioPlaybackSpeed: number;
  audioSkipIntervalSeconds: 5 | 10;
  audioRepeatEnabled: boolean;
  audioAutoplayEnabled: boolean;
  audioRepeatHafsReciter: string;
  audioRepeatWarshReciter: string;
  audioRepeatRounds: number;
  bookPresentation: BookPresentation;
  mushaf:
    | 'text'
    | 'hafs_ayahinfo_1260'
    | 'warsh_maknoon'
    | 'muhammadi'
    | 'hafs_maknoon'
    | 'hafs_madina_pdf'
    | 'hafs_indopak_15';
  onboardingComplete: boolean;
  onboardingStep: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  displayName: string;
  dockDestinations: DockDestinationId[];
};
export type Progress = {
  id: string;
  referenceId: number;
  subId: number;
  type: QuranProgressKind;
  isRead: boolean;
  isMemorized: boolean;
  progress: number;
  hasHifzScore: boolean;
  isCompleted: boolean;
  readCount: number;
  lastUpdated: number;
};
export type ReadingEntry = {
  id: string;
  surahId: number;
  surahName: string;
  type: string;
  action: string;
  amount: number;
  timestamp: number;
  dateKey: string;
  sourceKey: string | null;
  ownerId: string;
  contentType: string;
  extraInfo?: string;
  ayahRange?: { start: { surah: number; ayah: number }; end: { surah: number; ayah: number } };
  mushafPage?: { edition: MushafEdition; page: number; bookPresentation?: BookPresentation };
};
export type Plan = {
  id: string;
  date: string;
  type: QuranProgressKind | 'khatma';
  referenceId: number;
  subId: number;
  displayName: string;
  isDone: boolean;
  historyLogged: boolean;
  reminderHour: number | null;
  reminderMinute: number | null;
  createdAt: number;
  reminderNotificationId?: string | null;
  /** Exact scheduled instant for quick reminders such as "Now". */
  reminderDueAt?: number | null;
  goalId: number;
  amount: number;
  measurementUnit: string;
  arabicText?: string;
};
export type Journey = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startRub: number;
  endRub: number;
};
export type DailyGoal = {
  id: number;
  unit: string;
  target: number;
  reminderHour: number;
  reminderMinute: number;
};
export type GoalDay = {
  goalId: number;
  date: string;
  unit: string;
  target: number;
  extra: number;
  resolution: string;
};
export type LegacyDailyGoal = DailyGoal;
export type LegacyGoalDay = GoalDay;
export type LegacyReadingJourney = {
  id: number;
  enabled: boolean;
  type: string;
  totalDays: number;
  startDate: string;
  autoDailyGoal: boolean;
  updatedAt: number;
};
export type LegacyPreferenceValue = string | number | boolean | string[];
export type LegacyAndroidSnapshot = {
  databaseVersion: number;
  dailyGoals: LegacyDailyGoal[];
  goalDays: LegacyGoalDay[];
  checkinRequestIds: string[];
  journey: LegacyReadingJourney | null;
  /** Whitelisted UI preferences only; auth tokens and transient push/navigation stores are excluded. */
  preferences: Record<string, Record<string, LegacyPreferenceValue>>;
  readingChecklist: {
    verses: number[];
    positionScope: string | null;
    positionNumber: number;
  } | null;
  readerBookmarks: Record<string, LegacyPreferenceValue>;
  readerState: Record<string, number>;
  independentReadingPlan: Record<string, LegacyPreferenceValue>;
};
export type Bookmark = { surah: number; ayah: number; createdAt: number };
export type MushafEdition =
  | 'hafs'
  | 'hafs_maknoon'
  | 'warsh_maknoon'
  | 'muhammadi'
  | 'hafs_madina_pdf'
  | 'hafs_indopak_15';
export type MushafBookmark = {
  edition: MushafEdition;
  surah: number;
  page: number;
  bookPresentation?: BookPresentation;
};
export type FocusSession = { id: string; durationSeconds: number; finishedAt: number };
export type AppState = {
  version: 1;
  preferences: Preferences;
  progress: Record<string, Progress>;
  history: ReadingEntry[];
  notes: ExportableNote[];
  noteFolders: string[];
  plans: Plan[];
  goals: DailyGoal[];
  goalDays: GoalDay[];
  journeys: Journey[];
  readingJourney: ReadingJourneyConfiguration;
  bookmarks: Bookmark[];
  mushafBookmarks: MushafBookmark[];
  mushafPositions: Partial<Record<MushafEdition, number>>;
  mushafPositionPresentations?: Partial<Record<MushafEdition, BookPresentation>>;
  surahPositions: Record<string, number>;
  focusSessions: FocusSession[];
  cursor: { surah: number; ayah: number };
  goal: {
    unit: 'rub' | 'hizb' | 'juz' | 'surah' | 'ayah' | 'pages' | 'page' | 'ayahs' | 'minutes';
    target: number;
  };
  legacyAndroid: LegacyAndroidSnapshot | null;
};
export const initialState: AppState = {
  version: 1,
  preferences: {
    language: 'nl',
    theme: 'system',
    cardPatterns: true,
    hifzColorsEnabled: true,
    translation: 'nl',
    arabicFontSize: 30,
    reciterId: 1,
    audioPlaybackSpeed: 1,
    audioSkipIntervalSeconds: 10,
    audioRepeatEnabled: false,
    audioAutoplayEnabled: true,
    audioRepeatHafsReciter: 'alafasy',
    audioRepeatWarshReciter: 'aldosari_warsh',
    audioRepeatRounds: 2,
    bookPresentation: 'selectable',
    mushaf: 'hafs_ayahinfo_1260',
    onboardingComplete: false,
    onboardingStep: 'language',
    reminderEnabled: false,
    reminderHour: 20,
    reminderMinute: 0,
    displayName: '',
    dockDestinations: [...defaultDockDestinations],
  },
  progress: {},
  history: [],
  notes: [],
  noteFolders: [],
  plans: [],
  goals: [
    { id: 1, unit: 'rub', target: 4, reminderHour: 8, reminderMinute: 0 },
    { id: 2, unit: 'ayahs', target: 0, reminderHour: 8, reminderMinute: 0 },
    { id: 3, unit: 'hizb', target: 0, reminderHour: 8, reminderMinute: 0 },
  ],
  goalDays: [],
  journeys: [],
  readingJourney: defaultReadingJourney,
  bookmarks: [],
  mushafBookmarks: [],
  mushafPositions: {},
  mushafPositionPresentations: {},
  surahPositions: {},
  focusSessions: [],
  cursor: { surah: 1, ayah: 1 },
  goal: { unit: 'rub', target: 4 },
  legacyAndroid: null,
};
