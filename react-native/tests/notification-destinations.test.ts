import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseLocalNotificationUrl,
  planNotificationUrl,
} from '../src/services/notifications/notificationDestinations';
import type { Plan } from '../src/state/models';

const base: Plan = {
  id: 'plan 1',
  date: '2026-11-13',
  type: 'surah',
  referenceId: 2,
  subId: 0,
  displayName: 'Al-Baqarah',
  isDone: false,
  historyLogged: false,
  reminderHour: 20,
  reminderMinute: 0,
  createdAt: 1,
  goalId: 1,
  amount: 1,
  measurementUnit: 'surah',
};

test('legacy local notification routes map only to known local destinations', () => {
  assert.deepEqual(parseLocalNotificationUrl('qurantracker://notification/daily_goal'), {
    kind: 'goals',
  });
  assert.deepEqual(parseLocalNotificationUrl('qurantracker://notification/agenda'), {
    kind: 'agenda',
  });
  assert.deepEqual(parseLocalNotificationUrl('qurantracker://notification/agenda/42'), {
    kind: 'planning',
    planId: '42',
  });
  for (const raw of [
    'https://notification/agenda',
    'qurantracker://evil@notification/agenda',
    'qurantracker://notification:4/agenda',
    'qurantracker://notification/agenda/0',
    'qurantracker://notification/agenda/4/evil',
    'qurantracker://notification/agenda?url=https://evil.invalid',
  ])
    assert.equal(parseLocalNotificationUrl(raw), null);
});

test('planning notification opens Agenda with the stored plan identity', () => {
  assert.equal(planNotificationUrl(base), 'qurantracker://plan?planId=plan%201');
  const destination = new URL(planNotificationUrl({ ...base, type: 'juz', referenceId: 30 })!);
  assert.equal(destination.hostname, 'plan');
  assert.equal(destination.searchParams.has('date'), false); // Resolve date from local state.
  assert.equal(destination.searchParams.get('planId'), base.id);
});

test('removed, completed and invalid-range plans cannot produce reading destinations', () => {
  assert.equal(planNotificationUrl({ ...base, isDone: true }), null);
  assert.equal(planNotificationUrl({ ...base, date: '2026-02-30' }), null);
  assert.equal(planNotificationUrl({ ...base, referenceId: 115 }), null);
  assert.equal(planNotificationUrl({ ...base, type: 'rub', referenceId: 60, subId: 5 }), null);
  assert.equal(
    planNotificationUrl({ ...base, type: 'khatma', referenceId: 240, subId: 239 }),
    null,
  );
});
