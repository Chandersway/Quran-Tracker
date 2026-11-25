import type { Plan } from '../state/models';

/** Civil-date arithmetic uses UTC internally so DST never skips a reading day. */
export function parseDateKey(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a date in YYYY-MM-DD format.');
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new Error('Choose a valid calendar date.');
  return date;
}
export function addDays(value: string, days: number): string {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function buildJourneyPlans(
  start: string,
  end: string,
  startRub = 1,
  endRub = 240,
  id = 'journey',
  now = Date.now(),
): Plan[] {
  const days =
    Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / 86400000) + 1;
  if (days < 1 || days > 3660)
    throw new Error('Choose an end date after the start, within ten years.');
  if (
    !Number.isInteger(startRub) ||
    !Number.isInteger(endRub) ||
    startRub < 1 ||
    endRub > 240 ||
    startRub > endRub
  )
    throw new Error('Choose a rub range between 1 and 240.');
  const total = endRub - startRub + 1;
  const scheduleDays = Math.min(days, total);
  return Array.from({ length: scheduleDays }, (_, index) => {
    const first = startRub + Math.floor((index * total) / scheduleDays);
    const last = startRub + Math.floor(((index + 1) * total) / scheduleDays) - 1;
    return {
      id: `${id}:${index}`,
      date: addDays(start, index),
      type: 'khatma',
      referenceId: first,
      subId: last,
      displayName: first === last ? `Rub ${first}` : `Rub ${first}–${last}`,
      isDone: false,
      historyLogged: false,
      reminderHour: null,
      reminderMinute: null,
      createdAt: now + index,
      goalId: 1,
      amount: last - first + 1,
      measurementUnit: 'rub',
    };
  });
}
