import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reconcileTrackedPlanReminders,
  planningReminderLedgerKey,
} from '../src/services/notifications/planningReminderLedger';
import type {
  DesiredPlanReminder,
  ExistingPlanReminder,
  PlanReminderPort,
} from '../src/services/notifications/planningReminders';

test('quiet-hour edits cannot replay a delivered planning reminder by shifting it back into the future', async () => {
  const hour = (value: number) => new Date(2026, 10, 18, value).getTime();
  let now = hour(10);
  const values = new Map([
    [
      planningReminderLedgerKey,
      JSON.stringify({ version: 1, initializedAt: hour(0), entries: {} }),
    ],
  ]);
  const rows: ExistingPlanReminder[] = [];
  const scheduled: DesiredPlanReminder[] = [];
  const port: PlanReminderPort = {
    list: async () => [...rows],
    schedule: async (reminder) => {
      scheduled.push(reminder);
      const id = `alarm-${scheduled.length}`;
      rows.push({ id, data: { planReminderKey: reminder.key } });
      return id;
    },
    cancel: async (id) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
  };
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const identity = 'planning:reader-plan:2026-11-18:12:0';
  const reminder = (at: number): DesiredPlanReminder => ({
    key: `${identity}:at:${hour(at)}:en`,
    deliveryKey: identity,
    dueAt: new Date(hour(at)),
    planId: 'reader-plan',
    sourceId: 'planning:reader-plan',
    date: '2026-11-18',
    title: 'Plan',
    body: 'Read',
  });
  await reconcileTrackedPlanReminders([reminder(12)], port, storage, { now: () => now });
  now = hour(13);
  rows.splice(0); // The OS delivered the noon alarm while the app was closed.
  // Enabling quiet hours 11:00–14:00 changes only the allowed time, not the plan.
  await reconcileTrackedPlanReminders([reminder(14)], port, storage, { now: () => now });
  assert.equal(scheduled.length, 1);
});
