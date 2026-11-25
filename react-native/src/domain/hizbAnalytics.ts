import type { ReadingEntry } from '../state/models';
import { addDays, parseDateKey } from './journey';

export type HizbPeriod = 'Week' | 'Month' | 'Year' | 'Custom';
export type HizbDateRange = { from: string; through: string };
export type HizbReadingCount = { hizbNumber: number; count: number };

function subtractCalendarMonths(today: string, months: number): string {
  const date = parseDateKey(today);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const maximum = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, maximum));
  return date.toISOString().slice(0, 10);
}
/** Source LocalDate.minusMonths/Years clamps month ends before adding a day. */
export function hizbDateRange(period: HizbPeriod, today: string): HizbDateRange {
  return {
    from:
      period === 'Week'
        ? addDays(today, -6)
        : period === 'Month'
          ? addDays(subtractCalendarMonths(today, 1), 1)
          : period === 'Year'
            ? addDays(subtractCalendarMonths(today, 12), 1)
            : today,
    through: today,
  };
}
export function hizbDateBounds(range: HizbDateRange): readonly [number, number] {
  parseDateKey(range.from);
  parseDateKey(range.through);
  if (range.from > range.through) throw new RangeError('Invalid Hizb date range');
  const localMidnight = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year!, month! - 1, day!).getTime();
  };
  return [localMidnight(range.from), localMidnight(addDays(range.through, 1))];
}
export function completeHizbCounts(rows: readonly HizbReadingCount[]): HizbReadingCount[] {
  const counts = new Map(rows.map((row) => [row.hizbNumber, row.count]));
  return Array.from({ length: 60 }, (_, index) => ({
    hizbNumber: index + 1,
    count: counts.get(index + 1) ?? 0,
  }));
}
/** Exact ReadingHistoryDao.hizbCounts selection. Amount is not the row count. */
export function countHizbReadings(
  history: readonly ReadingEntry[],
  range: HizbDateRange,
  owner: string,
): HizbReadingCount[] {
  const [start, end] = hizbDateBounds(range);
  const counts = new Map<number, number>();
  for (const row of history) {
    // RN's initial anonymous rows used ''. They are guest rows, never silently
    // attributed to a subsequently signed-in account.
    if (
      (row.ownerId || 'guest') !== owner ||
      row.timestamp < start ||
      row.timestamp >= end ||
      row.action !== 'read' ||
      row.type !== 'hizb' ||
      row.surahId < 1 ||
      row.surahId > 60
    )
      continue;
    counts.set(row.surahId, (counts.get(row.surahId) ?? 0) + 1);
  }
  return completeHizbCounts([...counts].map(([hizbNumber, count]) => ({ hizbNumber, count })));
}
