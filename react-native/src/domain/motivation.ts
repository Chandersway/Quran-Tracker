import type { ReadingEntry } from '../state/models';
import { localDate } from './localDate';

import { historyAyahEquivalent } from './readingMetrics';

export function motivationLevel(points: number) {
  const index =
    points < 100
      ? 0
      : points < 250
        ? 1
        : points < 500
          ? 2
          : points < 1000
            ? 3
            : points < 2000
              ? 4
              : 5;
  return {
    key: `home.motivation.level${index + 1}`,
    start: [0, 100, 250, 500, 1000, 2000][index]!,
    next: [100, 250, 500, 1000, 2000, 4000][index]!,
  };
}
export function motivationBonusPoints(goalReached: boolean, streak: number): number {
  return (goalReached ? 10 : 0) + (streak >= 30 ? 50 : streak >= 7 ? 15 : streak >= 3 ? 5 : 0);
}
export function motivationStats(
  history: readonly ReadingEntry[],
  goalReached: boolean,
  now = new Date(),
) {
  const reads = history.filter((entry) => entry.action === 'read');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const week = new Date(today);
  week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
  const days = new Set(reads.map((entry) => entry.dateKey));
  const cursor = new Date(today);
  let streak = 0;
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const points = (entry: ReadingEntry) =>
    ['surah', 'juz', 'hizb', 'rub', 'page', 'pages', 'ayah', 'ayahs'].includes(entry.type)
      ? Math.max(1, historyAyahEquivalent(entry))
      : 1;
  const sum = (entries: ReadingEntry[]) =>
    entries.reduce((total, entry) => total + points(entry), 0);
  const bonus = motivationBonusPoints(goalReached, streak);
  const total = sum(reads) + bonus;
  const level = motivationLevel(total);
  const latest = reads.reduce<ReadingEntry | undefined>(
    (result, entry) => (!result || entry.timestamp > result.timestamp ? entry : result),
    undefined,
  );
  return {
    total,
    today: sum(reads.filter((entry) => entry.timestamp >= +today)) + (goalReached ? 10 : 0),
    week: sum(reads.filter((entry) => entry.timestamp >= +week)) + bonus,
    bonus,
    streak,
    level,
    progress: Math.min(1, Math.max(0, (total - level.start) / (level.next - level.start))),
    remaining: Math.max(0, level.next - total),
    latest,
    latestPoints: latest ? points(latest) : 0,
  };
}
