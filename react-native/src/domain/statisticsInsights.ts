import type { GoalDay, Progress, ReadingEntry } from '../state/models';
import { progressForGoal } from './goals';
import { addDays, parseDateKey } from './journey';
import { localDate } from './localDate';
import { historyAyahEquivalent, pageEquivalent } from './readingMetrics';
import { statsIsoWeek } from './statistics';

/** Calendar key of a history row; legacy rows without a key fall back to their timestamp. */
export function entryDateKey(row: ReadingEntry): string | null {
  if (row.dateKey) return row.dateKey;
  return row.timestamp > 0 ? localDate(new Date(row.timestamp)) : null;
}

/** Ayah equivalents read per calendar day (read actions only). */
export function dailyReadAyahs(history: readonly ReadingEntry[]): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of history) {
    if (row.action !== 'read') continue;
    const key = entryDateKey(row);
    if (key && /^\d{4}-\d{2}-\d{2}$/.test(key))
      days.set(key, (days.get(key) ?? 0) + historyAyahEquivalent(row));
  }
  return days;
}

/** Days with reading or memorisation activity, matching the streak definition of statsOverview. */
export function activeDateKeys(history: readonly ReadingEntry[]): Set<string> {
  return new Set(
    history
      .filter((row) => row.action === 'read' || row.action === 'memorized')
      .map(entryDateKey)
      .filter((key): key is string => key !== null),
  );
}

/** Longest run of consecutive active days ever recorded. */
export function longestStreak(history: readonly ReadingEntry[]): number {
  const days = [...activeDateKeys(history)].filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export type HeatmapCell = {
  date: string;
  pages: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
};

/**
 * Week columns (Monday first) ending with the current week. Levels are relative to the
 * busiest day in view so a light reader still sees contrast.
 */
export function readingHeatmap(
  history: readonly ReadingEntry[],
  weeks = 17,
  today = localDate(),
): HeatmapCell[][] {
  const daily = dailyReadAyahs(history);
  const weekday = (parseDateKey(today).getUTCDay() + 6) % 7;
  const start = addDays(today, -weekday - (weeks - 1) * 7);
  const columns: HeatmapCell[][] = [];
  let maximum = 0;
  for (let week = 0; week < weeks; week++) {
    const column: HeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
      const date = addDays(start, week * 7 + day);
      const pages = pageEquivalent(daily.get(date) ?? 0);
      maximum = Math.max(maximum, pages);
      column.push({ date, pages, level: 0, future: date > today });
    }
    columns.push(column);
  }
  for (const column of columns)
    for (const cell of column) {
      if (!cell.pages || !maximum) continue;
      const ratio = cell.pages / maximum;
      cell.level = ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
    }
  return columns;
}

export type ReadingBarPeriod = 'day' | 'week' | 'month';
export type ReadingBar = { key: string; start: string; pages: number; current: boolean };

/** Pages read per day (14), ISO week (12) or month (12), oldest first. */
export function readingBars(
  history: readonly ReadingEntry[],
  period: ReadingBarPeriod,
  today = localDate(),
): ReadingBar[] {
  const daily = dailyReadAyahs(history);
  const keyOf = (date: string) => {
    if (period === 'day') return date;
    if (period === 'month') return date.slice(0, 7);
    const iso = statsIsoWeek(parseDateKey(date).getTime() + 12 * 3_600_000);
    return `${iso.year}-W${String(iso.week).padStart(2, '0')}`;
  };
  const starts: string[] = [];
  if (period === 'day') for (let i = 13; i >= 0; i--) starts.push(addDays(today, -i));
  else if (period === 'week') {
    const monday = addDays(today, -((parseDateKey(today).getUTCDay() + 6) % 7));
    for (let i = 11; i >= 0; i--) starts.push(addDays(monday, -7 * i));
  } else {
    const [year, month] = today.split('-').map(Number) as [number, number];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(Date.UTC(year, month - 1 - i, 1));
      starts.push(date.toISOString().slice(0, 10));
    }
  }
  const totals = new Map<string, number>();
  for (const [date, ayahs] of daily) {
    const key = keyOf(date);
    totals.set(key, (totals.get(key) ?? 0) + ayahs);
  }
  const currentKey = keyOf(today);
  return starts.map((start) => {
    const key = keyOf(start);
    return { key, start, pages: pageEquivalent(totals.get(key) ?? 0), current: key === currentKey };
  });
}

/** Share of finished days (before today) on which a daily goal with a target was met. */
export function dailyGoalSuccess(
  goalDays: readonly GoalDay[],
  history: readonly ReadingEntry[],
  days = 30,
  today = localDate(),
): { met: number; total: number; fraction: number } {
  const from = addDays(today, -days);
  const relevant = goalDays.filter(
    (day) => day.date >= from && day.date < today && day.target + day.extra > 0,
  );
  const byDate = new Map<string, boolean>();
  for (const day of relevant) {
    const progress = progressForGoal(day, history);
    const met = progress.done >= progress.target;
    byDate.set(day.date, (byDate.get(day.date) ?? true) && met);
  }
  const met = [...byDate.values()].filter(Boolean).length;
  const total = byDate.size;
  return { met, total, fraction: total ? met / total : 0 };
}

/** Rub quarters marked as read, per Hizb (0-4). */
export function hizbCoverage(progress: Readonly<Record<string, Progress>>): {
  hizb: number;
  rubsRead: number;
  read: boolean;
  memorized: boolean;
}[] {
  const rows = Object.values(progress);
  const rubRead = new Set(
    rows.filter((row) => row.type === 'rub' && row.isRead).map((row) => row.id),
  );
  const hizbRead = new Set(
    rows.filter((row) => row.type === 'hizb' && row.isRead).map((row) => row.referenceId),
  );
  const memorized = new Set(
    rows.filter((row) => row.type === 'hizb' && row.isMemorized).map((row) => row.referenceId),
  );
  const rubMemorized = new Set(
    rows.filter((row) => row.type === 'rub' && row.isMemorized).map((row) => row.id),
  );
  return Array.from({ length: 60 }, (_, index) => {
    const hizb = index + 1;
    const quarters = [1, 2, 3, 4].filter((q) => rubRead.has(`rub_${hizb}_${q}`)).length;
    const rubsRead = hizbRead.has(hizb) ? 4 : quarters;
    return {
      hizb,
      rubsRead,
      read: rubsRead === 4,
      memorized:
        memorized.has(hizb) || [1, 2, 3, 4].every((q) => rubMemorized.has(`rub_${hizb}_${q}`)),
    };
  });
}

export type KhatmaForecast =
  | { kind: 'none' }
  | { kind: 'done' }
  | { kind: 'forecast'; remainingPages: number; pagesPerDay: number; days: number; date: string };

/**
 * Projects the remaining unmarked part of the Quran (by Rub) at the average pace of the
 * last `window` days. Purely an estimate; never written back to plans or goals.
 */
export function khatmaForecast(
  history: readonly ReadingEntry[],
  progress: Readonly<Record<string, Progress>>,
  window = 30,
  today = localDate(),
): KhatmaForecast {
  const rubsRead = hizbCoverage(progress).reduce((sum, row) => sum + row.rubsRead, 0);
  if (rubsRead >= 240) return { kind: 'done' };
  const remainingPages = Math.ceil(((240 - rubsRead) / 240) * 604);
  const from = addDays(today, -(window - 1));
  let ayahs = 0;
  for (const [date, value] of dailyReadAyahs(history))
    if (date >= from && date <= today) ayahs += value;
  const pagesPerDay = ayahs / 10 / window;
  if (pagesPerDay <= 0) return { kind: 'none' };
  const days = Math.ceil(remainingPages / pagesPerDay);
  // Beyond ten years the projection says nothing useful.
  if (days > 3650) return { kind: 'none' };
  return { kind: 'forecast', remainingPages, pagesPerDay, days, date: addDays(today, days) };
}
