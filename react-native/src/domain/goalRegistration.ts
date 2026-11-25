import { parseDateKey } from './journey';
import { localDate } from './localDate';

/** Keep the chosen calendar day and the real registration clock, including seconds. */
export function goalRegistrationTimestamp(date: string, now = Date.now()): number {
  const calendar = parseDateKey(date);
  const clock = new Date(now);
  if (!Number.isFinite(now)) throw new Error('Choose a valid registration time.');
  if (date === localDate(clock)) return now;
  const timestamp = new Date(
    calendar.getUTCFullYear(),
    calendar.getUTCMonth(),
    calendar.getUTCDate(),
    clock.getHours(),
    clock.getMinutes(),
    clock.getSeconds(),
    clock.getMilliseconds(),
  );
  // A spring-forward gap is normalized to its next valid local time. Never let
  // a date-line/timezone change silently move the entry onto a different day.
  if (localDate(timestamp) !== date) throw new Error('Choose a valid calendar date.');
  return timestamp.getTime();
}
