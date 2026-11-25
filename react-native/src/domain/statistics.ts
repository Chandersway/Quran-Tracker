import type { Progress, ReadingEntry } from '../state/models';
import { historyAyahEquivalent, pageEquivalent } from './readingMetrics';
import { chapterById, divisions, getAyahs } from '../content/quran';
import { checklistRange, verseIndex, versePoint } from './checklist';
import type { NoteScope } from './quran';

/** Ports StatsDrilldown.kt: rings count registrations, never their quantities. */
export type StatsReadingPeriod = 'all' | 'week' | 'month';
export type StatsDistribution = 'type' | 'hizb' | 'surah' | 'juz';
export type StatsReadingBucket = { key: string; rows: ReadingEntry[] };

/** Weekly activity includes every history action, unlike the reading rings. */
export function weeklyHistoryActivity(
  history: readonly ReadingEntry[],
  now = Date.now(),
): { date: string; count: number }[] {
  const cutoff = now - 7 * 86_400_000;
  const days = new Map<string, number>();
  for (const row of history) {
    if (row.timestamp > cutoff) days.set(row.dateKey, (days.get(row.dateKey) ?? 0) + 1);
  }
  return [...days]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ date, count }));
}

export function statsPeriodHistory(
  history: readonly ReadingEntry[],
  period: StatsReadingPeriod,
  now = new Date(),
): ReadingEntry[] {
  if (period === 'all') return [...history];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period === 'week' ? 6 : 29));
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  return history.filter((row) => row.timestamp >= start.getTime() && row.timestamp < end.getTime());
}

export function newestFirst(left: ReadingEntry, right: ReadingEntry): number {
  return (
    right.timestamp - left.timestamp ||
    right.id.localeCompare(left.id, undefined, { numeric: true })
  );
}

export function statsReadingBuckets(
  history: readonly ReadingEntry[],
  kind: StatsDistribution,
): StatsReadingBucket[] {
  const grouped = new Map<string, ReadingEntry[]>();
  for (const row of history) {
    if (row.action !== 'read') continue;
    if (kind === 'hizb' && !['hizb', 'rub'].includes(row.type) && row.contentType !== 'hizb')
      continue;
    if (kind === 'surah' && row.type !== 'surah' && row.contentType !== 'surah') continue;
    if (kind === 'juz' && row.type !== 'juz' && row.contentType !== 'juz') continue;
    const key = kind === 'type' ? row.contentType || row.type : String(row.surahId);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  const result = [...grouped]
    .map(([key, rows]) => ({ key, rows: rows.sort(newestFirst) }))
    .sort((a, b) => b.rows.length - a.rows.length || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return kind === 'type' ? result : result.slice(0, 8);
}

/** Source canvas convention: top origin, clockwise, including in Arabic UI. */
export function statsRingSegment(
  x: number,
  y: number,
  diameter: number,
  stroke: number,
  counts: readonly number[],
): number | null {
  if (diameter <= 0 || stroke <= 0) return null;
  const radius = diameter / 2;
  const distance = Math.hypot(x - radius, y - radius);
  if (distance < radius - stroke || distance > radius) return null;
  const total = counts.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (!total) return null;
  const angle = ((Math.atan2(y - radius, x - radius) * 180) / Math.PI + 450) % 360;
  let end = 0;
  for (let index = 0; index < counts.length; index++) {
    const count = Math.max(0, counts[index]!);
    end += (count / total) * 360;
    if (count > 0 && angle < end) return index;
  }
  return null;
}

export function historyQuarter(name: string): number | null {
  if (['(1/4)', '(¼)', '(Â¼)', '(Ã‚Â¼)'].some((marker) => name.includes(marker))) return 1;
  if (['(1/2)', '(½)', '(Â½)', '(Ã‚Â½)'].some((marker) => name.includes(marker))) return 2;
  if (['(3/4)', '(¾)', '(Â¾)', '(Ã‚Â¾)'].some((marker) => name.includes(marker))) return 3;
  return name.includes('(1)') ? 4 : null;
}

export function statsHistoryRange(
  row: ReadingEntry,
): { start: { surah: number; ayah: number }; end: { surah: number; ayah: number } } | null {
  const explicit = (
    row as ReadingEntry & {
      ayahRange?: { start: { surah: number; ayah: number }; end: { surah: number; ayah: number } };
    }
  ).ayahRange;
  if (explicit !== undefined) {
    try {
      return verseIndex(explicit.start.surah, explicit.start.ayah) <=
        verseIndex(explicit.end.surah, explicit.end.ayah)
        ? explicit
        : null;
    } catch {
      return null;
    }
  }
  // GroupMemberReadingSheet.kt deliberately refuses to imply exact coverage
  // from an amount or measurement unit that does not identify one partition.
  if (row.amount !== 1) return null;
  let scope = row.contentType.trim() || row.type;
  const quarter = ['rub', 'hizb'].includes(scope) ? historyQuarter(row.surahName) : null;
  if (scope === 'rub' && quarter === null) return null;
  if (quarter !== null && (row.surahId < 1 || row.surahId > 60)) return null;
  const number = quarter === null ? row.surahId : (row.surahId - 1) * 4 + quarter;
  if (quarter !== null) scope = 'rub';
  if (!['juz', 'hizb', 'surah', 'rub'].includes(scope)) return null;
  try {
    const [start, end] = checklistRange({ scope: scope as NoteScope, number });
    return { start: versePoint(start), end: versePoint(end - 1) };
  } catch {
    return null;
  }
}

export type StatsHistoryGroupMode = 'day' | 'week' | 'month';
export type StatsHistoryDisplayItem =
  | { kind: 'entry'; timestamp: number; row: ReadingEntry }
  | {
      kind: 'hizb-day';
      timestamp: number;
      hizbNumber: number;
      rubNumbers: number[];
      extraInfo: string;
      rows: ReadingEntry[];
    };
export type StatsHistoryGroup = { key: string; title: string; items: StatsHistoryDisplayItem[] };

/** Dutch SimpleDateFormat YYYY-'W'ww uses ISO weeks, including year boundaries. */
export function statsIsoWeek(timestamp: number): { year: number; week: number } {
  const local = new Date(timestamp);
  const day = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const year = day.getUTCFullYear();
  return { year, week: Math.ceil(((day.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7) };
}

/** Source collapses repeated legacy quarter registrations by calendar day/Hizb. */
export function statsHistoryDisplayItems(rows: readonly ReadingEntry[]): StatsHistoryDisplayItem[] {
  const rubs = new Map<string, { row: ReadingEntry; quarter: number }[]>();
  const singles: StatsHistoryDisplayItem[] = [];
  for (const row of rows) {
    const quarter =
      row.action === 'read' && row.type === 'hizb' ? historyQuarter(row.surahName) : null;
    if (quarter === null) {
      singles.push({ kind: 'entry', timestamp: row.timestamp, row });
      continue;
    }
    const date = new Date(row.timestamp);
    const dateKey =
      row.dateKey ||
      (row.timestamp > 0
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : '');
    const key = `${dateKey}-${row.surahId}`;
    rubs.set(key, [...(rubs.get(key) ?? []), { row, quarter }]);
  }
  for (const entries of rubs.values()) {
    const ordered = entries.map((entry) => entry.row).sort(newestFirst);
    singles.push({
      kind: 'hizb-day',
      timestamp: ordered[0]!.timestamp,
      hizbNumber: ordered[0]!.surahId,
      rubNumbers: [...new Set(entries.map((entry) => entry.quarter))].sort((a, b) => a - b),
      extraInfo: entries.find((entry) => entry.row.extraInfo?.trim())?.row.extraInfo ?? '',
      rows: ordered,
    });
  }
  return singles.sort((a, b) => b.timestamp - a.timestamp);
}

export function statsHistoryGroups(
  history: readonly ReadingEntry[],
  mode: StatsHistoryGroupMode,
  locale = 'nl',
  weekLabel = 'Week',
): StatsHistoryGroup[] {
  const groups = new Map<string, ReadingEntry[]>();
  for (const row of [...history].sort(newestFirst)) {
    const date = new Date(row.timestamp);
    if (!Number.isFinite(date.getTime())) continue;
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const iso = statsIsoWeek(row.timestamp);
    const key =
      mode === 'day'
        ? day
        : mode === 'month'
          ? day.slice(0, 7)
          : `${iso.year}-W${String(iso.week).padStart(2, '0')}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups]
    .map(([key, rows]) => {
      const date = new Date(rows[0]!.timestamp),
        iso = statsIsoWeek(date.getTime());
      const title =
        mode === 'week'
          ? `${weekLabel} ${iso.week.toLocaleString(locale)}, ${iso.year.toLocaleString(locale, { useGrouping: false })}`
          : date.toLocaleDateString(
              locale,
              mode === 'day'
                ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                : { month: 'long', year: 'numeric' },
            );
      return { key, title, items: statsHistoryDisplayItems(rows) };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

function statsDateKey(row: ReadingEntry): string | null {
  if (row.dateKey) return row.dateKey;
  if (row.timestamp <= 0) return null;
  const date = new Date(row.timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** ReadingStatsSummary.kt + active StatsScreen progress equations. */
export function statsOverview(
  history: readonly ReadingEntry[],
  progress: Readonly<Record<string, Progress>>,
  now = new Date(),
) {
  const reads = history.filter((row) => row.action === 'read');
  const ayahs = reads.reduce((sum, row) => sum + historyAyahEquivalent(row), 0);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const week = new Date(start);
  week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
  const month = new Date(start);
  month.setDate(1);
  const pagesSince = (time: number) =>
    pageEquivalent(
      reads
        .filter((row) => row.timestamp >= time)
        .reduce((sum, row) => sum + historyAyahEquivalent(row), 0),
    );
  const quarters = new Set(
    Object.values(progress)
      .filter((row) => row.type === 'rub' && row.isRead)
      .map((row) => row.id),
  );
  const hizbFromRub = (hizb: number) =>
    [1, 2, 3, 4].every((quarter) => quarters.has(`rub_${hizb}_${quarter}`));
  const marked = (kind: string) =>
    Object.values(progress).filter((row) => row.type === kind && row.isRead).length;
  const activeDays = new Set(
    history
      .filter((row) => row.action === 'read' || row.action === 'memorized')
      .map(statsDateKey)
      .filter((key): key is string => key !== null),
  );
  const cursor = new Date(start);
  let streak = 0;
  const dateKey = () =>
    `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
  if (!activeDays.has(dateKey())) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dateKey())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    readActions: reads.length,
    ayahs,
    pages: pageEquivalent(ayahs),
    points: ayahs,
    surahReads: reads
      .filter((row) => row.type === 'surah')
      .reduce((sum, row) => sum + row.amount, 0),
    rubDone: Math.min(240, quarters.size),
    hizbDone: Math.min(
      60,
      Math.max(
        marked('hizb'),
        Array.from({ length: 60 }, (_, index) => index + 1).filter(hizbFromRub).length,
      ),
    ),
    juzDone: Math.min(
      30,
      Math.max(
        marked('juz'),
        Array.from({ length: 30 }, (_, index) => index + 1).filter(
          (juz) => hizbFromRub(juz * 2 - 1) && hizbFromRub(juz * 2),
        ).length,
      ),
    ),
    todayPages: pagesSince(+start),
    weekPages: pagesSince(+week),
    monthPages: pagesSince(+month),
    streak,
    activeDays: new Set(reads.map(statsDateKey).filter((key) => key !== null)).size,
  };
}

export function statsHistoryOpening(row: ReadingEntry): string | null {
  if (row.mushafPage && row.ayahRange) {
    const range = statsHistoryRange(row);
    return range
      ? (getAyahs(range.start.surah)
          .find((ayah) => ayah.number === range.start.ayah)
          ?.text.trim()
          .split(/\s+/)
          .slice(0, 4)
          .join(' ') ?? null)
      : null;
  }
  if (
    !['hizb', 'rub'].includes(row.contentType.trim() || row.type) ||
    row.surahId < 1 ||
    row.surahId > 60
  )
    return null;
  const start = divisions[(row.surahId - 1) * 4];
  return start
    ? (getAyahs(start.surah)
        .find((ayah) => ayah.number === start.ayah)
        ?.text.trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(' ') ?? null)
    : null;
}

export function statsHistoryTitle(row: ReadingEntry): string {
  const kind = row.contentType.trim() || row.type;
  if (kind === 'juz') return `Juz ${row.surahId}`;
  if (kind === 'hizb' || kind === 'rub') {
    const quarter = historyQuarter(row.surahName);
    return `Hizb ${row.surahId}${quarter === null ? '' : ` - Rub ${quarter}/4`}`;
  }
  return row.surahName || (kind === 'surah' ? chapterById(row.surahId).name : kind);
}
