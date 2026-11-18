import { normalizeDockDestinations } from '../domain/dockPreferences';
import { setMushafPageMarks, type MushafPageMarkChange } from '../domain/mushafReading';
import {
  recordGoalSession,
  refreshGoalDays,
  resolveGoalDay,
  saveGoalDefinition,
} from '../domain/goals';
import { markSurahMemorized, removeReadMark, sourceRubName } from '../domain/progressActions';
import { planIdentity } from '../domain/planning';
import { verseCounts, type QuranProgressKind } from '../domain/quran';
import {
  saveReadingJourneyConfiguration,
  type ReadingJourneyConfiguration,
} from '../domain/readingJourney';
import type { ExportableNote } from '../exporting/notesExport';
import type { DailyGoal } from './models';
import {
  initialState,
  type AppState,
  type Journey,
  type MushafEdition,
  type Plan,
  type Preferences,
  type ReadingEntry,
} from './models';
export const newId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export type CheckInAction = {
  type: 'checkIn';
  kind: QuranProgressKind;
  number: number;
  subId?: number;
  name: string;
  requestId: string;
  now: number;
  date: string;
  amount?: number;
  ownerId?: string;
};
export type Action =
  | { type: 'preferences'; patch: Partial<Preferences> }
  | { type: 'cursor'; surah: number; ayah: number }
  | { type: 'goal'; unit: AppState['goal']['unit']; target: number }
  | { type: 'goals/refresh'; date: string }
  | { type: 'goals/save'; goal: DailyGoal; date: string }
  | {
      type: 'goals/resolve';
      goalId: number;
      date: string;
      mode: 'carry' | 'spread' | 'skip';
      today: string;
    }
  | { type: 'goals/record'; entry: ReadingEntry; planId?: string }
  | { type: 'history/record'; entry: ReadingEntry }
  | ({ type: 'mushaf/readMark' } & MushafPageMarkChange)
  | CheckInAction
  | { type: 'checkIn/batch'; entries: CheckInAction[] }
  | {
      type: 'hifz';
      kind: QuranProgressKind;
      number: number;
      subId?: number;
      score: number;
      now: number;
    }
  | {
      type: 'read/unmark';
      kind: 'juz' | 'surah' | 'rub';
      number: number;
      subId?: number;
      date: string;
      now: number;
    }
  | {
      type: 'surah/memorized';
      number: number;
      name: string;
      marked: boolean;
      requestId: string;
      now: number;
      date: string;
      ownerId?: string;
    }
  | { type: 'note/save'; note: ExportableNote }
  | { type: 'note/delete'; id: number }
  | { type: 'bookmark'; surah: number; ayah: number; now: number }
  | { type: 'mushaf/bookmark'; edition: MushafEdition; surah: number; page: number }
  | { type: 'mushaf/position'; edition: MushafEdition; page: number }
  | { type: 'plan/add'; plans: Plan[] }
  | {
      type: 'plan/toggle';
      id: string;
      now: number;
      date: string;
      completed?: boolean;
      ownerId?: string;
    }
  | { type: 'plan/delete'; id: string }
  | {
      type: 'plan/reminder';
      id: string;
      hour: number | null;
      minute: number | null;
      notificationId?: string | null;
      dueAt?: number | null;
    }
  | { type: 'journey/add'; journey: Journey; plans: Plan[] }
  | {
      type: 'readingJourney/save';
      journey: ReadingJourneyConfiguration;
      goal?: DailyGoal;
      date: string;
    }
  | { type: 'focus/finish'; id: string; seconds: number; now: number }
  | { type: 'history/delete'; id: string }
  | { type: 'history/clear' }
  | { type: 'reset' };

export const progressKey = (type: QuranProgressKind, number: number, subId = 0): string =>
  type === 'rub' ? `rub_${number}_${subId}` : `${type}_${number}`;

function validMushafPage(edition: MushafEdition, page: number): boolean {
  const limits: Record<MushafEdition, number> = {
    hafs: 604,
    hafs_maknoon: 604,
    warsh_maknoon: 604,
    muhammadi: 638,
    hafs_madina_pdf: 10000,
    hafs_indopak_15: 10000,
  };
  return Number.isInteger(page) && page >= 1 && page <= limits[edition];
}

function checkIn(state: AppState, a: Extract<Action, { type: 'checkIn' }>): AppState {
  if (
    !a.requestId.trim() ||
    !Number.isInteger(a.number) ||
    a.number < 1 ||
    !Number.isFinite(a.now) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(a.date)
  )
    return state;
  if (state.history.some((h) => h.sourceKey === a.requestId)) return state;
  const amount = Math.max(1, Math.floor(a.amount ?? 1));
  const key = progressKey(a.kind, a.number, a.subId);
  const prev = state.progress[key];
  const entry: ReadingEntry = {
    id: a.requestId,
    surahId: a.number,
    surahName: a.kind === 'rub' ? sourceRubName(a.number, a.subId ?? 1) : a.name,
    type: a.kind,
    action: 'read',
    amount,
    timestamp: a.now,
    dateKey: a.date,
    sourceKey: a.requestId,
    ownerId: a.ownerId ?? '',
    contentType: a.kind,
  };
  const progress = { ...state.progress };
  // A Hizb quick check-in is represented by its four rub markers. Android
  // records one Hizb history row, but does not create a Hizb read-progress row.
  if (a.kind !== 'hizb')
    progress[key] = {
      id: key,
      referenceId: a.number,
      subId: a.subId ?? 0,
      type: a.kind,
      isRead: true,
      isMemorized: prev?.isMemorized ?? false,
      progress: prev?.progress ?? 0,
      hasHifzScore: prev?.hasHifzScore ?? false,
      isCompleted: prev?.isCompleted ?? false,
      readCount: (prev?.readCount ?? 0) + 1,
      // This timestamp belongs to the assessment, not the reading counter.
      lastUpdated: prev?.lastUpdated ?? a.now,
    };
  // Android stores a Hizb check-in as one history row and advances all four rub markers.
  if (a.kind === 'hizb') {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const rubKey = progressKey('rub', a.number, quarter);
      const rub = state.progress[rubKey];
      progress[rubKey] = {
        id: rubKey,
        referenceId: a.number,
        subId: quarter,
        type: 'rub',
        isRead: true,
        isMemorized: rub?.isMemorized ?? false,
        progress: rub?.progress ?? 0,
        hasHifzScore: rub?.hasHifzScore ?? false,
        isCompleted: rub?.isCompleted ?? false,
        readCount: (rub?.readCount ?? 0) + 1,
        lastUpdated: rub?.lastUpdated ?? a.now,
      };
    }
  }
  return {
    ...state,
    progress,
    history: [entry, ...state.history],
  };
}

function completePlan(
  state: AppState,
  action: Extract<Action, { type: 'plan/toggle' }>,
  plan: Plan,
  completed: boolean,
): AppState {
  const sourceKey = `plan:${plan.id}`;
  const plans = state.plans.map((item) =>
    item.id === plan.id
      ? {
          ...item,
          isDone: completed,
          historyLogged: completed,
          ...(completed && {
            reminderHour: null,
            reminderMinute: null,
            reminderNotificationId: null,
            reminderDueAt: null,
          }),
        }
      : item,
  );
  if (!completed)
    return {
      ...state,
      plans,
      history: state.history.filter((entry) => entry.sourceKey !== sourceKey),
    };
  if (state.history.some((entry) => entry.sourceKey === sourceKey)) return { ...state, plans };
  const amount =
    plan.type === 'khatma'
      ? Math.max(1, Math.min(240, plan.subId - plan.referenceId + 1))
      : Math.max(1, Math.floor(plan.amount));
  const entry: ReadingEntry = {
    id: sourceKey,
    surahId: plan.referenceId,
    surahName: plan.displayName,
    type: plan.measurementUnit || (plan.type === 'khatma' ? 'rub' : plan.type),
    action: plan.goalId === 2 ? 'memorized' : plan.goalId === 3 ? 'review' : 'read',
    amount,
    timestamp: action.now,
    dateKey: action.date,
    sourceKey,
    ownerId: action.ownerId ?? '',
    contentType: plan.type,
  };
  return { ...state, plans, history: [entry, ...state.history] };
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'preferences':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.patch,
          ...(action.patch.dockDestinations !== undefined && {
            dockDestinations: normalizeDockDestinations(action.patch.dockDestinations),
          }),
        },
      };
    case 'cursor': {
      if (
        !Number.isInteger(action.surah) ||
        !Number.isInteger(action.ayah) ||
        action.surah < 1 ||
        action.surah > 114 ||
        action.ayah < 1 ||
        action.ayah > verseCounts[action.surah - 1]!
      )
        return state;
      return {
        ...state,
        cursor: { surah: action.surah, ayah: action.ayah },
        surahPositions: { ...state.surahPositions, [action.surah]: action.ayah },
      };
    }
    case 'goal':
      return {
        ...state,
        goal: { unit: action.unit, target: Math.max(1, Math.floor(action.target)) },
      };
    case 'goals/refresh':
      return refreshGoalDays(state, action.date);
    case 'goals/save':
      return saveGoalDefinition(state, action.goal, action.date);
    case 'goals/resolve':
      return resolveGoalDay(state, action.goalId, action.date, action.mode, action.today);
    case 'goals/record':
      return recordGoalSession(state, action.entry, action.planId);
    case 'mushaf/readMark': {
      const history = setMushafPageMarks(state.history, action);
      return history === state.history ? state : { ...state, history };
    }
    case 'history/record': {
      if (
        !action.entry.sourceKey ||
        !Number.isFinite(action.entry.timestamp) ||
        !Number.isInteger(action.entry.amount) ||
        action.entry.amount <= 0
      )
        return state;
      return state.history.some((row) => row.sourceKey === action.entry.sourceKey)
        ? state
        : { ...state, history: [action.entry, ...state.history] };
    }
    case 'checkIn':
      return checkIn(state, action);
    case 'checkIn/batch':
      return action.entries.reduce(checkIn, state);
    case 'read/unmark':
      return removeReadMark(
        state,
        action.kind,
        action.number,
        action.subId ?? 0,
        action.date,
        action.now,
      );
    case 'surah/memorized':
      return markSurahMemorized(state, action);
    case 'hifz': {
      const limit =
        action.kind === 'surah'
          ? 114
          : action.kind === 'hizb'
            ? 60
            : action.kind === 'juz'
              ? 30
              : 0;
      if (
        !Number.isInteger(action.number) ||
        action.number < 1 ||
        action.number > limit ||
        !Number.isFinite(action.score) ||
        !Number.isFinite(action.now)
      )
        return state;
      const key = progressKey(action.kind, action.number, action.subId);
      const score = Math.min(100, Math.max(0, Math.round(action.score)));
      return {
        ...state,
        progress: {
          ...state.progress,
          [key]: {
            id: key,
            referenceId: action.number,
            subId: action.subId ?? 0,
            type: action.kind,
            isRead: false,
            isCompleted: false,
            isMemorized: false,
            readCount: 0,
            ...state.progress[key],
            progress: score,
            hasHifzScore: score > 0,
            lastUpdated: action.now,
          },
        },
      };
    }
    case 'note/save':
      return {
        ...state,
        notes: [action.note, ...state.notes.filter((n) => n.id !== action.note.id)],
      };
    case 'note/delete':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
    case 'mushaf/position': {
      if (
        !validMushafPage(action.edition, action.page) ||
        state.mushafPositions[action.edition] === action.page
      )
        return state;
      return {
        ...state,
        mushafPositions: { ...state.mushafPositions, [action.edition]: action.page },
      };
    }
    case 'mushaf/bookmark': {
      if (
        !validMushafPage(action.edition, action.page) ||
        !Number.isInteger(action.surah) ||
        action.surah < 1 ||
        action.surah > 114
      )
        return state;
      const existing = state.mushafBookmarks.some(
        (b) => b.edition === action.edition && b.surah === action.surah && b.page === action.page,
      );
      return {
        ...state,
        mushafBookmarks: existing
          ? state.mushafBookmarks.filter(
              (b) =>
                !(
                  b.edition === action.edition &&
                  b.surah === action.surah &&
                  b.page === action.page
                ),
            )
          : [
              ...state.mushafBookmarks,
              { edition: action.edition, surah: action.surah, page: action.page },
            ],
      };
    }
    case 'bookmark': {
      const exists = state.bookmarks.some(
        (b) => b.surah === action.surah && b.ayah === action.ayah,
      );
      return {
        ...state,
        bookmarks: exists
          ? state.bookmarks.filter((b) => b.surah !== action.surah || b.ayah !== action.ayah)
          : [...state.bookmarks, { surah: action.surah, ayah: action.ayah, createdAt: action.now }],
      };
    }
    case 'plan/add': {
      const seen = new Set(state.plans.map(planIdentity));
      const fresh = action.plans.filter((p) => {
        const key = planIdentity(p);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return {
        ...state,
        plans: [...state.plans, ...fresh].sort(
          (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
        ),
      };
    }
    case 'plan/toggle': {
      const plan = state.plans.find((p) => p.id === action.id);
      if (!plan) return state;
      const completed = action.completed ?? !plan.isDone;
      if (completed === plan.isDone) return state;
      return completePlan(state, action, plan, completed);
    }
    case 'plan/delete':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };
    case 'plan/reminder': {
      if ((action.hour === null) !== (action.minute === null)) return state;
      if (action.dueAt != null && (!Number.isFinite(action.dueAt) || action.dueAt < 0))
        return state;
      if (
        action.hour !== null &&
        (!Number.isInteger(action.hour) ||
          action.hour < 0 ||
          action.hour > 23 ||
          !Number.isInteger(action.minute) ||
          action.minute! < 0 ||
          action.minute! > 59)
      )
        return state;
      if (!state.plans.some((plan) => plan.id === action.id)) return state;
      return {
        ...state,
        plans: state.plans.map((plan) =>
          plan.id === action.id
            ? {
                ...plan,
                reminderHour: action.hour,
                reminderMinute: action.minute,
                reminderDueAt: action.hour === null ? null : (action.dueAt ?? null),
                reminderNotificationId:
                  action.notificationId === undefined ? null : action.notificationId,
              }
            : plan,
        ),
      };
    }
    case 'journey/add':
      return appReducer(
        { ...state, journeys: [...state.journeys, action.journey] },
        { type: 'plan/add', plans: action.plans },
      );
    case 'readingJourney/save':
      return saveReadingJourneyConfiguration(state, action.journey, action.goal, action.date);
    case 'focus/finish':
      return state.focusSessions.some((s) => s.id === action.id)
        ? state
        : {
            ...state,
            focusSessions: [
              { id: action.id, durationSeconds: action.seconds, finishedAt: action.now },
              ...state.focusSessions,
            ],
          };
    case 'history/delete':
      return { ...state, history: state.history.filter((h) => h.id !== action.id) };
    case 'history/clear':
      return {
        ...state,
        history: [],
        progress: Object.fromEntries(
          Object.entries(state.progress).map(([key, row]) => [
            key,
            { ...row, isRead: false, readCount: 0 },
          ]),
        ),
        legacyAndroid: state.legacyAndroid
          ? { ...state.legacyAndroid, checkinRequestIds: [] }
          : null,
      };
    case 'reset':
      return {
        ...initialState,
        preferences: { ...initialState.preferences, onboardingComplete: true },
      };
  }
}
