import type { AppState, Progress } from '../state/models';
import { hizbProgressId, juzProgressId, rubProgressId, surahProgressId } from './quran';

/** Original Juz/Hizb cards derive completion from marks, never new history rows. */
export function partitionReadStatus(
  progress: Readonly<Record<string, Progress>>,
  kind: 'juz' | 'hizb',
  number: number,
) {
  const firstHizb = kind === 'juz' ? number * 2 - 1 : number;
  const total = kind === 'juz' ? 8 : 4;
  const quarters = Array.from(
    { length: total },
    (_, index) => progress[rubProgressId(firstHizb + Math.floor(index / 4), (index % 4) + 1)],
  );
  const completed = quarters.filter((row) => row?.isRead).length;
  const direct = progress[kind === 'juz' ? juzProgressId(number) : hizbProgressId(number)];
  return {
    completed,
    total,
    isRead: completed === total || (kind === 'juz' && direct?.isRead === true),
    readCount:
      kind === 'juz'
        ? (direct?.readCount ?? 0)
        : Math.min(...quarters.map((row) => row?.readCount ?? 0)),
  };
}

export function firstUnreadPartition(
  progress: Readonly<Record<string, Progress>>,
  kind: 'juz' | 'hizb',
): number {
  const count = kind === 'juz' ? 30 : 60;
  return (
    Array.from({ length: count }, (_, index) => index + 1).find(
      (number) => !partitionReadStatus(progress, kind, number).isRead,
    ) ?? count
  );
}

export function sourceRubName(hizb: number, quarter: number): string {
  return `Hizb ${hizb} (${['1/4', '1/2', '3/4', '1'][quarter - 1]})`;
}
export function removeReadMark(
  state: AppState,
  kind: 'juz' | 'surah' | 'rub',
  number: number,
  quarter: number,
  today: string,
  now: number,
): AppState {
  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > (kind === 'juz' ? 30 : kind === 'surah' ? 114 : 60)
  )
    return state;
  if (kind === 'rub' && (!Number.isInteger(quarter) || quarter < 1 || quarter > 4)) return state;
  const key =
    kind === 'juz'
      ? juzProgressId(number)
      : kind === 'surah'
        ? surahProgressId(number)
        : rubProgressId(number, quarter);
  const old = state.progress[key];
  if (kind !== 'rub')
    return old
      ? {
          ...state,
          progress: { ...state.progress, [key]: { ...old, isRead: false, readCount: 0 } },
        }
      : state;
  // Source removeRub upserts a fresh default row (unlike removeJuz/Surah),
  // then deletes only today's matching legacy rubric history registrations.
  const reset: Progress = {
    id: key,
    referenceId: number,
    subId: quarter,
    type: 'rub',
    isRead: false,
    isMemorized: false,
    progress: 0,
    hasHifzScore: false,
    isCompleted: false,
    readCount: 0,
    lastUpdated: now,
  };
  const markers =
    quarter === 1
      ? ['(1/4)', '(¼)', '(Â¼)']
      : quarter === 2
        ? ['(1/2)', '(½)', '(Â½)']
        : quarter === 3
          ? ['(3/4)', '(¾)', '(Â¾)']
          : ['(1)', '(4/4)'];
  return {
    ...state,
    progress: { ...state.progress, [key]: reset },
    history: state.history.filter(
      (row) =>
        !(
          row.action === 'read' &&
          ['hizb', 'rub'].includes(row.type) &&
          row.surahId === number &&
          row.dateKey === today &&
          markers.some((marker) => row.surahName.includes(marker))
        ),
    ),
  };
}
export function markSurahMemorized(
  state: AppState,
  input: {
    number: number;
    name: string;
    marked: boolean;
    requestId: string;
    now: number;
    date: string;
    ownerId?: string;
  },
): AppState {
  if (!Number.isInteger(input.number) || input.number < 1 || input.number > 114) return state;
  const key = surahProgressId(input.number);
  const old = state.progress[key];
  if (!input.marked)
    return old
      ? { ...state, progress: { ...state.progress, [key]: { ...old, isMemorized: false } } }
      : state;
  if (!input.requestId || state.history.some((row) => row.sourceKey === input.requestId))
    return state;
  const updated: Progress = old
    ? { ...old, isMemorized: true }
    : {
        id: key,
        referenceId: input.number,
        subId: 0,
        type: 'surah',
        isRead: false,
        isMemorized: true,
        progress: 0,
        hasHifzScore: false,
        isCompleted: false,
        readCount: 0,
        lastUpdated: input.now,
      };
  return {
    ...state,
    progress: { ...state.progress, [key]: updated },
    history: [
      {
        id: input.requestId,
        surahId: input.number,
        surahName: input.name,
        type: 'surah',
        action: 'memorized',
        amount: 1,
        timestamp: input.now,
        dateKey: input.date,
        sourceKey: input.requestId,
        ownerId: input.ownerId ?? '',
        contentType: 'surah',
      },
      ...state.history,
    ],
  };
}
