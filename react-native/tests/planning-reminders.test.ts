import assert from 'node:assert/strict';
import test from 'node:test';
import type { Plan } from '../src/state/models';
import {
  desiredPlanReminders,
  planReminderKey,
  planningReminderDueAt,
  reconcilePlanReminders,
  type ExistingPlanReminder,
  type PlanReminderPort,
} from '../src/services/notifications/planningReminders';

function plan(
  id: string,
  date: string,
  hour: number | null,
  minute: number | null,
  isDone = false,
): Plan {
  return {
    id,
    date,
    type: 'surah',
    referenceId: 1,
    subId: 0,
    displayName: `Plan ${id}`,
    isDone,
    historyLogged: false,
    reminderHour: hour,
    reminderMinute: minute,
    createdAt: 1,
    goalId: 1,
    amount: 1,
    measurementUnit: 'surah',
  };
}

class FakePort implements PlanReminderPort {
  rows: ExistingPlanReminder[];
  serial = 0;
  scheduled: string[] = [];
  cancelled: string[] = [];
  constructor(rows: ExistingPlanReminder[] = []) {
    this.rows = rows;
  }
  async list() {
    return this.rows;
  }
  async schedule(reminder: Parameters<PlanReminderPort['schedule']>[0]) {
    const id = `generated-${++this.serial}`;
    this.rows.push({ id, data: { planReminderKey: reminder.key } });
    this.scheduled.push(reminder.key);
    return id;
  }
  async cancel(id: string) {
    this.cancelled.push(id);
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

test('local calendar time validates dates and rejects impossible wall times', () => {
  assert.throws(() => planningReminderDueAt('2026-02-30', 10, 0), /valid plan date/);
  assert.throws(() => planningReminderDueAt('2026-11-13', 24, 0), /valid reminder time/);
  assert.ok(planningReminderDueAt('2026-11-13', 20, 15) instanceof Date);
});

test('desired reminders exclude completed, unset, invalid, and already-past plans and sort by due time', () => {
  const today = '2026-11-13';
  const now = planningReminderDueAt(today, 12, 0);
  const rows = desiredPlanReminders(
    [
      plan('later', '2026-11-14', 8, 0),
      plan('soon', today, 18, 0),
      plan('past', today, 11, 0),
      plan('done', '2026-11-14', 9, 0, true),
      plan('unset', '2026-11-14', null, null),
      plan('bad', '2026-02-30', 10, 0),
    ],
    now,
    'nl',
  );
  assert.deepEqual(
    rows.map((row) => row.planId),
    ['soon', 'later'],
  );
  assert.equal(rows[0]?.title, 'Planning & agenda');
  assert.equal(rows[0]?.sourceId, 'planning:soon');
});

test('reconciliation preserves unrelated notifications, cancels stale duplicates, and schedules only missing reminders', async () => {
  const future = plan('one', '2026-11-14', 8, 0);
  const key = planReminderKey(future)!;
  const port = new FakePort([
    { id: 'current', data: { planReminderKey: key } },
    { id: 'duplicate', data: { planReminderKey: key } },
    { id: 'obsolete', data: { planReminderKey: 'planning:deleted:2026-11-14:9:0' } },
    { id: 'app-other', data: { route: 'daily_goal' } },
  ]);
  const result = await reconcilePlanReminders(
    desiredPlanReminders([future], new Date(2026, 10, 13, 10)),
    port,
  );
  assert.equal(result.notificationIds[key], 'current');
  assert.deepEqual(result.cancelled, ['duplicate', 'obsolete']);
  assert.deepEqual(result.scheduled, []);
  assert.ok(port.rows.some((row) => row.id === 'app-other'));
});

test('reconciliation schedules a missing reminder with a stable key', async () => {
  const item = plan('future', '2026-11-14', 8, 5);
  const desired = desiredPlanReminders([item], new Date(2026, 10, 13, 10));
  const port = new FakePort();
  const result = await reconcilePlanReminders(desired, port);
  assert.equal(result.scheduled.length, 1);
  assert.equal(result.notificationIds[planReminderKey(item)!], 'generated-1');
});

test('a failed replacement keeps the previous reminder and rolls back new partial schedules', async () => {
  const port = new FakePort([{ id: 'previous', data: { planReminderKey: 'planning:old' } }]);
  const schedule = port.schedule.bind(port);
  port.schedule = async (reminder) => {
    if (reminder.planId === 'two') throw new Error('quota');
    return schedule(reminder);
  };
  const desired = desiredPlanReminders(
    [plan('one', '2026-11-14', 8, 0), plan('two', '2026-11-14', 9, 0)],
    new Date(2026, 10, 13),
  );
  await assert.rejects(() => reconcilePlanReminders(desired, port), /quota/);
  assert.deepEqual(
    port.rows.map((item) => item.id),
    ['previous'],
  );
});

test('a failed settings commit rolls back new schedules before removing the previous alarm', async () => {
  const port = new FakePort([{ id: 'previous', data: { planReminderKey: 'planning:old' } }]);
  const desired = desiredPlanReminders([plan('one', '2026-11-14', 8, 0)], new Date(2026, 10, 13));
  await assert.rejects(
    () =>
      reconcilePlanReminders(desired, port, async () => {
        throw new Error('disk full');
      }),
    /disk full/,
  );
  assert.deepEqual(
    port.rows.map((item) => item.id),
    ['previous'],
  );
});
