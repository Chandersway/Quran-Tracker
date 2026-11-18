import { divisions } from '../../content/quran';
import { parseDateKey } from '../../domain/journey';
import type { Plan } from '../../state/models';

export type LocalNotificationTap =
  | { kind: 'planning'; planId: string }
  | { kind: 'goals' }
  | { kind: 'agenda' };
/** Only the source's local notification routes are accepted; arbitrary URLs never become navigation. */
export function parseLocalNotificationUrl(raw: string): LocalNotificationTap | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (
    url.protocol !== 'qurantracker:' ||
    url.hostname !== 'notification' ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  )
    return null;
  if (url.pathname === '/daily_goal') return { kind: 'goals' };
  if (url.pathname === '/agenda') return { kind: 'agenda' };
  const match = /^\/agenda\/([1-9][0-9]*)$/.exec(url.pathname);
  return match && Number.isSafeInteger(Number(match[1]))
    ? { kind: 'planning', planId: match[1]! }
    : null;
}

/** Open the source Agenda context; its reading row still opens the precise Mushaf range. */
export function planNotificationUrl(plan: Plan): string | null {
  if (plan.isDone) return null;
  try {
    parseDateKey(plan.date);
  } catch {
    return null;
  }
  const { referenceId: number, subId, type } = plan;
  if (!Number.isInteger(number) || number < 1) return null;
  const destination = `qurantracker://plan?planId=${encodeURIComponent(plan.id)}`;
  if (type === 'surah') return number <= 114 ? destination : null;
  if (
    (type === 'juz' && number > 30) ||
    (type === 'hizb' && number > 60) ||
    (type === 'rub' && (number > 60 || subId < 1 || subId > 4))
  )
    return null;
  const first =
    type === 'khatma'
      ? number
      : type === 'juz'
        ? (number - 1) * 8 + 1
        : type === 'hizb'
          ? (number - 1) * 4 + 1
          : (number - 1) * 4 + subId;
  const last = type === 'khatma' ? subId : first + (type === 'juz' ? 7 : type === 'hizb' ? 3 : 0);
  const start = divisions[first - 1];
  if (!start || !Number.isInteger(last) || last < first || last > 240) return null;
  return destination;
}
