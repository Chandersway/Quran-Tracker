import {
  reconcilePlanReminders,
  type DesiredPlanReminder,
  type PlanReminderPort,
} from './planningReminders';

export const planningReminderLedgerKey = 'wirdna:plan-reminder-submissions:v1';
const catchUpWindow = 12 * 60 * 60 * 1000;
const retentionWindow = 35 * 24 * 60 * 60 * 1000;
type Submission = { dueAt: number; scheduledFor: number; notificationId: string | null };
type Ledger = { version: 1; initializedAt: number; entries: Record<string, Submission> };
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

function decodeLedger(raw: string | null, now: number): Ledger {
  if (raw === null) return { version: 1, initializedAt: now, entries: {} };
  const value = JSON.parse(raw) as Ledger;
  if (
    !value ||
    value.version !== 1 ||
    !Number.isFinite(value.initializedAt) ||
    !value.entries ||
    typeof value.entries !== 'object' ||
    Array.isArray(value.entries) ||
    Object.values(value.entries).some(
      (entry) =>
        !entry ||
        !Number.isFinite(entry.dueAt) ||
        !Number.isFinite(entry.scheduledFor) ||
        (entry.notificationId !== null && typeof entry.notificationId !== 'string'),
    )
  )
    throw new Error('Invalid planning reminder submission history');
  return value;
}

/**
 * Preserve OS-owned one-shots and catch up only reminders never submitted on this
 * installation, within Kotlin's 12-hour bound. The first ledger run cannot infer
 * whether an older alarm has already displayed, so pre-baseline reminders remain
 * suppressed. No new plan fields or import formats are introduced.
 */
export async function reconcileTrackedPlanReminders(
  desired: readonly DesiredPlanReminder[],
  port: PlanReminderPort,
  storage: Storage,
  {
    now = Date.now,
    catchUpAllowed = true,
    commit,
  }: {
    now?: () => number;
    catchUpAllowed?: boolean;
    commit?: () => Promise<void>;
  } = {},
) {
  const timestamp = now();
  const ledger = decodeLedger(await storage.getItem(planningReminderLedgerKey), timestamp);
  const existing = await port.list();
  const byKey = new Map(existing.map((item) => [item.data.planReminderKey, item]));
  const existingFor = (reminder: DesiredPlanReminder) =>
    byKey.get(reminder.key) ??
    (reminder.deliveryKey
      ? existing.find(
          (item) =>
            typeof item.data.planReminderKey === 'string' &&
            item.data.planReminderKey.startsWith(`${reminder.deliveryKey}:at:`),
        )
      : undefined);
  for (const [key, entry] of Object.entries(ledger.entries)) {
    if (entry.dueAt < timestamp - retentionWindow) delete ledger.entries[key];
  }
  // Adopt schedules created by an older app version before doing any catch-up.
  for (const reminder of desired) {
    const previous = existingFor(reminder);
    if (!reminder.deliveryKey) continue;
    if (!previous) {
      // Preserve the conservative first-upgrade decision if quiet hours change
      // later and move this same event into a future allowed time.
      const existingDaily =
        reminder.firstGrantSlot !== undefined &&
        existing.some((item) => {
          const key = item.data.planReminderKey;
          return (
            typeof key === 'string' &&
            (key.startsWith(`daily:${reminder.firstGrantSlot}:`) || key.startsWith('legacy-daily:'))
          );
        });
      if (existingDaily || reminder.dueAt.getTime() < ledger.initializedAt) {
        const dueAt = reminder.deliveryDueAt ?? reminder.dueAt.getTime();
        ledger.entries[reminder.deliveryKey] ??= {
          dueAt,
          scheduledFor: dueAt,
          notificationId: null,
        };
      }
      continue;
    }
    const scheduledFor = Number(
      String(previous.data.planReminderKey).split(':at:')[1]?.split(':')[0],
    );
    ledger.entries[reminder.deliveryKey] ??= {
      dueAt: reminder.dueAt.getTime(),
      scheduledFor: Number.isFinite(scheduledFor) ? scheduledFor : reminder.dueAt.getTime(),
      notificationId: previous.id,
    };
  }
  const persist = () => storage.setItem(planningReminderLedgerKey, JSON.stringify(ledger));
  await persist();
  const eligible = desired.flatMap((reminder) => {
    const dueAt = reminder.dueAt.getTime();
    const nativePending = existingFor(reminder);
    const submitted = reminder.deliveryKey ? ledger.entries[reminder.deliveryKey] : undefined;
    // Deferring quiet hours must never create a second alarm for an event whose
    // previous submission may already have displayed, even if its new time is future.
    if (
      submitted &&
      !nativePending &&
      (reminder.firstGrantSlot !== undefined || submitted.scheduledFor <= timestamp)
    )
      return [];
    if (reminder.repeatDaily || dueAt > timestamp || byKey.has(reminder.key)) return [reminder];
    if (nativePending) return [{ ...reminder, key: String(nativePending.data.planReminderKey) }];
    if (
      !reminder.deliveryKey ||
      !catchUpAllowed ||
      dueAt < ledger.initializedAt ||
      dueAt < timestamp - catchUpWindow ||
      ledger.entries[reminder.deliveryKey]
    )
      return [];
    // Give native submission and its bookkeeping time to finish before display.
    return [{ ...reminder, dueAt: new Date(timestamp + 5000), deliveryDueAt: dueAt }];
  });
  const tracked: PlanReminderPort = {
    list: async () => existing,
    async schedule(reminder) {
      if (!reminder.deliveryKey) return port.schedule(reminder);
      const key = reminder.deliveryKey;
      const prior = ledger.entries[key];
      // Reserve BEFORE the native call: an interrupted response cannot replay a
      // notification that the OS may already own. A future alarm can still retry.
      ledger.entries[key] = {
        dueAt: reminder.deliveryDueAt ?? reminder.dueAt.getTime(),
        scheduledFor: reminder.dueAt.getTime(),
        notificationId: null,
      };
      await persist();
      const id = await port.schedule(reminder);
      ledger.entries[key]!.notificationId = id;
      try {
        await persist();
      } catch (error) {
        // The reservation is already durable. Retain it if cancellation is
        // uncertain; otherwise restore the old entry without touching old alarms.
        try {
          await port.cancel(id);
          if (reminder.dueAt.getTime() > now()) {
            if (prior) ledger.entries[key] = prior;
            else delete ledger.entries[key];
            await persist();
          }
        } catch {
          /* The durable reservation prevents an ambiguous replay. */
        }
        throw error;
      }
      return id;
    },
    async cancel(id) {
      await port.cancel(id);
      let changed = false;
      for (const [key, entry] of Object.entries(ledger.entries)) {
        // A confirmed future cancellation can be offered again after re-enable.
        // Past submissions may already have displayed and remain suppressed.
        if (entry.notificationId === id && entry.scheduledFor > now()) {
          delete ledger.entries[key];
          changed = true;
        }
      }
      if (changed) await persist();
    },
  };
  return reconcilePlanReminders(eligible, tracked, commit);
}
