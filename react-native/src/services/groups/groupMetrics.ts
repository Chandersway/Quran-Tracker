import { ayahEquivalent, pageEquivalent } from '../../domain/readingMetrics';
import type { Group, GroupMember } from '../backend/types';
import type { GroupLeaderboardRow, GroupPointTotal, GroupProgressEntry } from './groupTypes';

/** Integer conversions and point awards match Kotlin ReadingMetrics; never use rounded decimal ratios. */
export function groupAyahEquivalent(entry: GroupProgressEntry): number {
  const reference = Number(entry.source.split(':').at(-1));
  return ayahEquivalent(
    entry.unit,
    entry.amount,
    Number.isInteger(reference) && reference >= 1 && reference <= 114 ? reference : undefined,
  );
}
/** Group occurred_on is SQL current_date in UTC. Keep date-only values in that calendar. */
function daysAgo(now: Date, days: number) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
export function groupLeaderboard(
  members: GroupMember[],
  entries: GroupProgressEntry[],
  awards: GroupPointTotal[],
  now = new Date(),
): GroupLeaderboardRow[] {
  const users = new Set([
    ...members.map((member) => member.userId),
    ...entries.map((entry) => entry.user_id),
    ...awards.map((row) => row.user_id),
  ]);
  return [...users]
    .map((userId) => {
      const member = members.find((value) => value.userId === userId);
      const rows = entries
        .filter((entry) => entry.user_id === userId)
        .sort((left, right) => right.occurred_on.localeCompare(left.occurred_on));
      const points = awards.find((row) => row.user_id === userId);
      const totalAyahs = rows.reduce((sum, row) => sum + groupAyahEquivalent(row), 0);
      const dates = new Set(rows.map((row) => row.occurred_on));
      let streak = 0;
      // Kotlin counts a run through today or yesterday, so a day still in progress does not reset it.
      const offset = dates.has(daysAgo(now, 0)) ? 0 : 1;
      while (dates.has(daysAgo(now, streak + offset))) streak++;
      const clamp = (number: number) => Math.min(2147483647, Math.max(0, number));
      const period = (days: number) =>
        rows
          .filter(
            (row) => row.occurred_on >= daysAgo(now, days) && row.occurred_on <= daysAgo(now, 0),
          )
          .reduce((sum, row) => sum + groupAyahEquivalent(row), 0);
      return {
        userId,
        displayName: member?.displayName || `Lid ${userId.slice(0, 6)}`,
        avatarUrl: member?.avatarUrl ?? null,
        totalAyahs,
        totalPoints: clamp(totalAyahs + Number(points?.total_points ?? 0)),
        weeklyPoints: clamp(period(6) + Number(points?.weekly_points ?? 0)),
        monthlyPoints: clamp(period(29) + Number(points?.monthly_points ?? 0)),
        pages: pageEquivalent(totalAyahs),
        streak,
        activeToday: dates.has(daysAgo(now, 0)),
        entries: rows,
      };
    })
    .sort((left, right) => right.totalPoints - left.totalPoints);
}

/** Explicit unit totals are kept separate from the estimated page/ayah equivalents. */
export function groupReadingTotals(entries: readonly GroupProgressEntry[]) {
  const total = (unit: string) =>
    entries.filter((entry) => entry.unit === unit).reduce((sum, entry) => sum + entry.amount, 0);
  const totalAyahs = entries.reduce((sum, entry) => sum + groupAyahEquivalent(entry), 0);
  return {
    ayahs: total('ayah'),
    manualPages: total('page'),
    hizb: total('hizb'),
    juz: total('juz'),
    surah: total('surah'),
    totalAyahs,
    pages: pageEquivalent(totalAyahs),
    readings: entries.length,
  };
}

/** All-time points include task awards; reading totals and goals never do. */
export function groupDashboard(rows: readonly GroupLeaderboardRow[]) {
  const entries = rows.flatMap((row) => row.entries);
  const best = (key: 'weeklyPoints' | 'monthlyPoints') =>
    [...rows].sort((a, b) => b[key] - a[key]).find((row) => row[key] > 0) ?? null;
  return {
    ...groupReadingTotals(entries),
    // The original dashboard adds the page equivalents displayed for each reader.
    pages: rows.reduce((sum, row) => sum + row.pages, 0),
    points: rows.reduce((sum, row) => sum + row.totalPoints, 0),
    activeToday: rows.filter((row) => row.activeToday).length,
    bestTotal:
      [...rows].sort((a, b) => b.totalPoints - a.totalPoints).find((row) => row.totalPoints > 0) ??
      null,
    bestWeek: best('weeklyPoints'),
    bestMonth: best('monthlyPoints'),
    recent: rows
      .flatMap((member) => member.entries.map((entry) => ({ member, entry })))
      .sort((a, b) => b.entry.occurred_on.localeCompare(a.entry.occurred_on))
      .slice(0, 4),
  };
}

export function groupGoalProgress(
  rows: readonly GroupLeaderboardRow[],
  group: Pick<Group, 'progress_unit' | 'goal_target' | 'goal_period'>,
  now = new Date(),
) {
  const start =
    group.goal_period === 'daily'
      ? daysAgo(now, 0)
      : group.goal_period === 'weekly'
        ? daysAgo(now, 6)
        : group.goal_period === 'monthly'
          ? daysAgo(now, 29)
          : null;
  const entries = rows
    .flatMap((row) => row.entries)
    .filter(
      (entry) => entry.occurred_on <= daysAgo(now, 0) && (!start || entry.occurred_on >= start),
    );
  const ayahs = entries.reduce((sum, entry) => sum + groupAyahEquivalent(entry), 0);
  const divisors: Record<string, number> = { ayah: 1, page: 10, rub: 25, hizb: 103, juz: 207 };
  const divisor = divisors[group.progress_unit];
  const achieved = divisor
    ? Math.floor(ayahs / divisor)
    : entries
        .filter((entry) => entry.unit === group.progress_unit)
        .reduce((sum, entry) => sum + entry.amount, 0);
  const target =
    group.goal_period !== 'none' && (group.goal_target ?? 0) > 0 ? group.goal_target! : null;
  return { achieved, target, fraction: target ? Math.min(1, achieved / target) : 0 };
}

export type GroupContribution = {
  code: string;
  name: string;
  myPages: number;
  groupPages: number;
  share: number;
  myStreak: number;
  myWeeklyPoints: number;
  rank: number | null;
  members: number;
  goal: { achieved: number; target: number | null; fraction: number; unit: string; period: string };
};

/** The viewer's own slice of a group's leaderboard, for the personal statistics page. */
export function groupContribution(
  group: Pick<Group, 'code' | 'name' | 'progress_unit' | 'goal_target' | 'goal_period'>,
  rows: readonly GroupLeaderboardRow[],
  userId: string,
  now = new Date(),
): GroupContribution {
  const mine = rows.find((row) => row.userId === userId);
  const totalAyahs = rows.reduce((sum, row) => sum + row.totalAyahs, 0);
  const index = rows.findIndex((row) => row.userId === userId);
  return {
    code: group.code,
    name: group.name,
    myPages: mine?.pages ?? 0,
    groupPages: rows.reduce((sum, row) => sum + row.pages, 0),
    share: totalAyahs > 0 ? (mine?.totalAyahs ?? 0) / totalAyahs : 0,
    myStreak: mine?.streak ?? 0,
    myWeeklyPoints: mine?.weeklyPoints ?? 0,
    rank: mine && mine.totalPoints > 0 ? index + 1 : null,
    members: rows.length,
    goal: {
      ...groupGoalProgress(rows, group, now),
      unit: group.progress_unit,
      period: group.goal_period,
    },
  };
}
