import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { initialState, type Plan } from '../src/state/models';
import * as preferences from '../src/domain/notificationPreferences';
import { localDate } from '../src/domain/localDate';
import * as planning from '../src/services/notifications/planningReminders';
import * as ledger from '../src/services/notifications/planningReminderLedger';
import type * as LocalReminders from '../src/services/notifications/localReminders';

const ledgerKey = 'wirdna:plan-reminder-submissions:v1';
const time = (hour: number, minute = 0) => new Date(2026, 10, 18, hour, minute).getTime();
function planned(id = 'late', hour = 10): Plan {
  return {
    id,
    date: '2026-11-18',
    type: 'surah',
    referenceId: 1,
    subId: 0,
    displayName: `Plan ${id}`,
    isDone: false,
    historyLogged: false,
    reminderHour: hour,
    reminderMinute: 0,
    createdAt: time(8),
    goalId: 1,
    amount: 1,
    measurementUnit: 'surah',
  };
}

function fixture(permission = true, grantAt: number | null = null) {
  let now = time(12);
  let firstUseChecks = 0;
  let failWrite: string | undefined;
  const values = new Map<string, string>([
    [ledgerKey, JSON.stringify({ version: 1, initializedAt: time(0), entries: {} })],
    [
      'wirdna:notification-preferences:v1',
      JSON.stringify({ ...preferences.localNotificationDefaults, daily: false }),
    ],
  ]);
  const rows: planning.ExistingPlanReminder[] = [];
  const scheduled: planning.DesiredPlanReminder[] = [];
  const cancelled: string[] = [];
  const port: planning.PlanReminderPort = {
    list: async () => [...rows],
    schedule: async (reminder) => {
      scheduled.push(reminder);
      const id = `notification-${scheduled.length}`;
      rows.push({ id, data: { planReminderKey: reminder.key } });
      return id;
    },
    cancel: async (id) => {
      cancelled.push(id);
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
  };
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      if (key === failWrite) throw new Error('storage full');
      values.set(key, value);
    },
  };
  const state = { ...initialState, plans: [planned()] };
  function load() {
    const code = ts.transpileModule(
      readFileSync('src/services/notifications/localReminders.ts', 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      },
    ).outputText;
    const modules: Record<string, unknown> = {
      '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
      'react-native': { Platform: { OS: 'ios' } },
      '../../domain/notificationPreferences': preferences,
      '../../domain/localDate': { localDate },
      '../../i18n': { sourceText: (key: string) => key },
      './planningReminders': planning,
      './planningReminderLedger': ledger,
      './planningReminderPort': {
        expoPlanReminderPort: port,
        hasPlanReminderPermission: async () => permission,
        firstPlanReminderGrantAt: async () => grantAt,
        initialPlanReminderPermission: async () => {
          firstUseChecks++;
          return true;
        },
      },
    };
    class ClockDate extends Date {
      constructor(value?: string | number | Date) {
        super(value instanceof Date ? value.getTime() : (value ?? now));
      }
      static now() {
        return now;
      }
    }
    const exports = {};
    vm.runInNewContext(code, {
      exports,
      Date: ClockDate,
      require: (name: string) => {
        assert.ok(name in modules, name);
        return modules[name];
      },
    });
    return exports as typeof LocalReminders;
  }
  return {
    state,
    values,
    rows,
    scheduled,
    cancelled,
    port,
    load,
    firstUseChecks: () => firstUseChecks,
    advance: (value: number) => {
      now = value;
    },
    failWrite: (key?: string) => {
      failWrite = key;
    },
    preferences: (patch: Partial<preferences.LocalNotificationPreferences>) => {
      values.set(
        'wirdna:notification-preferences:v1',
        JSON.stringify({ ...preferences.localNotificationDefaults, daily: false, ...patch }),
      );
    },
  };
}

test('granting after 08:00 submits the default DAILY and exactly one same-day DATE, even after dismissal and restart', async () => {
  const f = fixture(false, time(12));
  f.state.plans = [];
  f.preferences({ daily: true });
  const service = f.load();
  await service.reconcileLocalReminders(f.state);
  assert.equal(f.firstUseChecks(), 0);
  assert.equal(f.scheduled.length, 0);
  f.state.preferences = { ...f.state.preferences, onboardingComplete: true };
  await service.reconcileLocalReminders(f.state);
  await service.reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 2);
  assert.equal(f.scheduled[0]?.repeatDaily, true);
  assert.equal(f.scheduled[0]?.dueAt.getHours(), 8);
  assert.equal(f.scheduled[0]?.dueAt.getMinutes(), 0);
  const catchUp = f.scheduled[1]!;
  assert.equal(catchUp.repeatDaily, false);
  assert.equal(catchUp.firstGrantSlot, 480);
  assert.equal(catchUp.deliveryKey, 'daily-catchup:2026-11-18:480');
  assert.equal(catchUp.dueAt.getTime(), time(12) + 5000);
  f.rows.splice(1, 1);
  await f.load().reconcileLocalReminders(f.state);
  f.advance(time(18));
  f.state.preferences = { ...f.state.preferences, language: 'en' };
  await f.load().reconcileLocalReminders(f.state);
  f.advance(time(24 + 12));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.filter((item) => item.firstGrantSlot !== undefined).length, 1);
  assert.equal(f.rows.length, 1);
});

test('an early grant, disabled daily slot or existing same-minute Kotlin/RN alarm cannot produce a duplicate catch-up', async () => {
  for (const prior of [null, 'daily:480:ar', 'legacy-daily:old']) {
    const f = fixture(true, prior ? time(12) : time(7));
    f.state.plans = [];
    f.preferences({ daily: true, extra: true, extraMinute: 480 });
    if (prior) f.rows.push({ id: 'existing', data: { planReminderKey: prior } });
    await f.load().reconcileLocalReminders(f.state);
    assert.equal(
      f.scheduled.some((item) => item.firstGrantSlot !== undefined),
      false,
    );
    assert.equal(f.rows.length, 1);
  }
  const disabled = fixture(true, time(12));
  disabled.state.plans = [];
  disabled.preferences({ enabled: false, daily: true });
  await disabled.load().reconcileLocalReminders(disabled.state);
  assert.equal(disabled.rows.length, 0);
});

test('a late first grant defers across same-day quiet hours, deduplicates equal slots and never queues a catch-up for tomorrow', async () => {
  const f = fixture(true, time(12));
  f.state.plans = [];
  f.preferences({
    daily: true,
    extra: true,
    extraMinute: 480,
    quiet: true,
    quietStart: 11 * 60,
    quietEnd: 14 * 60,
  });
  await f.load().reconcileLocalReminders(f.state);
  const oneShots = f.scheduled.filter((item) => item.firstGrantSlot !== undefined);
  assert.equal(oneShots.length, 1);
  assert.equal(oneShots[0]!.dueAt.getTime(), time(14));
  f.preferences({ daily: false, extra: false });
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.rows.length, 0);

  const night = fixture(true, time(23));
  night.advance(time(23));
  night.state.plans = [];
  night.preferences({ daily: true, quiet: true, quietStart: 22 * 60, quietEnd: 7 * 60 });
  await night.load().reconcileLocalReminders(night.state);
  assert.equal(night.scheduled.length, 1);
  assert.equal(night.scheduled[0]?.repeatDaily, true);
});

test('daily first-grant catch-up can exceed twelve hours and keeps independent extra and regular slots', async () => {
  const f = fixture(true, time(22));
  f.advance(time(22));
  f.state.plans = [];
  f.preferences({ daily: true, extra: true });
  await f.load().reconcileLocalReminders(f.state);
  assert.deepEqual(
    f.scheduled.filter((r) => r.firstGrantSlot !== undefined).map((r) => r.firstGrantSlot),
    [480, 1260],
  );
  assert.equal(f.scheduled.filter((r) => r.repeatDaily).length, 2);
});

test('an uncertain first-grant DATE retains the regular DAILY and its reservation prevents an immediate retry', async () => {
  const f = fixture(true, time(12));
  f.state.plans = [];
  f.preferences({ daily: true });
  let oneShotAttempts = 0;
  const schedule = f.port.schedule;
  f.port.schedule = async (reminder) => {
    if (reminder.firstGrantSlot === undefined) return schedule(reminder);
    oneShotAttempts++;
    throw new Error('Native result lost');
  };
  const service = f.load();
  await service.reconcileLocalReminders(f.state);
  assert.equal(service.getReminderFailure(), 'restore');
  assert.equal(f.rows.length, 1);
  assert.equal(f.scheduled[0]?.repeatDaily, true);
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(oneShotAttempts, 1);
  assert.equal(f.rows.length, 1);
});

test('onboarding and restart never offer permission for disabled local alerts', async () => {
  const f = fixture(false);
  f.state.preferences = { ...f.state.preferences, onboardingComplete: true };
  f.state.plans = [];
  for (const prefs of [{ enabled: false }, { daily: false, extra: false }]) {
    f.preferences(prefs);
    await f.load().reconcileLocalReminders(f.state);
  }
  assert.equal(f.firstUseChecks(), 0);
  assert.equal(f.scheduled.length, 0);
});

test('an unscheduled planning reminder catches up once within Kotlin’s 12-hour window', async () => {
  const f = fixture();
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 1);
  assert.equal(f.scheduled[0]?.planId, 'late');
  assert.ok(f.scheduled[0]!.dueAt.getTime() > time(12));
});

test('restarting after a caught-up alarm leaves it submitted even after it disappears from OS schedules', async () => {
  const f = fixture();
  await f.load().reconcileLocalReminders(f.state);
  f.rows.splice(0);
  f.advance(time(13));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 1);
});

test('ordinary future alarms are not replayed after their OS delivery; a changed reminder time is a new event', async () => {
  const f = fixture();
  f.state.plans = [planned('later', 14)];
  await f.load().reconcileLocalReminders(f.state);
  f.rows.splice(0);
  f.advance(time(16));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 1);
  f.state.plans[0]!.reminderHour = 15;
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 2);
  assert.ok(f.scheduled[1]!.dueAt.getTime() > time(16));
});

test('an old OS-owned pending alarm is adopted and retained without a second submission', async () => {
  const f = fixture();
  const key = `${planning.planReminderKey(f.state.plans[0]!)}:at:${time(10)}:nl`;
  f.rows.push({ id: 'already-submitted', data: { planReminderKey: key } });
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
  assert.equal(f.rows[0]?.id, 'already-submitted');
  f.rows.splice(0);
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
});

test('changing language cannot cancel or replay an overdue alarm still owned by the OS', async () => {
  const f = fixture();
  const key = `${planning.planReminderKey(f.state.plans[0]!)}:at:${time(10)}:en`;
  f.rows.push({ id: 'pending-in-previous-language', data: { planReminderKey: key } });
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
  assert.equal(f.rows[0]?.id, 'pending-in-previous-language');
});

test('completed plans and reminders older than 12 hours never catch up', async () => {
  const f = fixture();
  f.state.plans[0]!.isDone = true;
  await f.load().reconcileLocalReminders(f.state);
  f.state.plans[0]!.isDone = false;
  f.advance(time(22, 1));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
});

test('catch-up waits for the current quiet period to end and keeps original quiet deferral', async () => {
  const f = fixture();
  f.preferences({ quiet: true, quietStart: 12 * 60, quietEnd: 14 * 60 });
  f.advance(time(13));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
  f.advance(time(14));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 1);
  const deferred = fixture();
  deferred.preferences({ quiet: true, quietStart: 9 * 60, quietEnd: 13 * 60 });
  await deferred.load().reconcileLocalReminders(deferred.state);
  assert.equal(deferred.scheduled[0]?.dueAt.getTime(), time(13));
});

test('first upgrade establishes a baseline and does not guess whether older alarms already displayed', async () => {
  const f = fixture();
  f.values.delete(ledgerKey);
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
  assert.equal(JSON.parse(f.values.get(ledgerKey)!).initializedAt, time(12));
  f.state.plans = [planned('new', 13)];
  f.advance(time(14));
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 1);
});

test('confirmed cancellation of a future alarm permits catch-up after the setting is re-enabled', async () => {
  const f = fixture();
  f.state.plans = [planned('future', 13)];
  await f.load().reconcileLocalReminders(f.state);
  f.preferences({ planning: false });
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.rows.length, 0);
  f.advance(time(14));
  f.preferences({ planning: true });
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 2);
});

test('failed reservation writes preserve old native alarms and schedule nothing new', async () => {
  const f = fixture();
  f.rows.push({ id: 'prior', data: { planReminderKey: 'planning:old' } });
  f.failWrite(ledgerKey);
  await assert.rejects(f.load().reconcileLocalReminders(f.state), /storage full/);
  assert.equal(f.scheduled.length, 0);
  assert.equal(f.rows[0]?.id, 'prior');
});

test('a failed settings commit rolls back a pending catch-up and its reservation for safe retry', async () => {
  const f = fixture();
  f.failWrite('wirdna:notification-preferences:v1');
  const prefs = { ...preferences.localNotificationDefaults, daily: false };
  await assert.rejects(f.load().saveLocalNotifications(f.state, prefs), /storage full/);
  assert.equal(f.rows.length, 0);
  assert.deepEqual(JSON.parse(f.values.get(ledgerKey)!).entries, {});
  f.failWrite();
  await f.load().saveLocalNotifications(f.state, prefs);
  assert.equal(f.rows.length, 1);
});

test('ambiguous native submission failure is reserved before the call and never blindly retried late', async () => {
  const f = fixture();
  f.port.schedule = async () => {
    throw new Error('native response lost');
  };
  await assert.rejects(f.load().reconcileLocalReminders(f.state), /native response lost/);
  assert.equal(Object.keys(JSON.parse(f.values.get(ledgerKey)!).entries).length, 1);
  await f.load().reconcileLocalReminders(f.state);
  assert.equal(f.scheduled.length, 0);
});

test('a damaged submission ledger fails closed without rewriting it or changing OS alarms', async () => {
  const f = fixture();
  f.values.set(ledgerKey, '{invalid');
  f.rows.push({ id: 'prior', data: { planReminderKey: 'planning:old' } });
  await assert.rejects(f.load().reconcileLocalReminders(f.state));
  assert.equal(f.values.get(ledgerKey), '{invalid');
  assert.equal(f.rows[0]?.id, 'prior');
});
