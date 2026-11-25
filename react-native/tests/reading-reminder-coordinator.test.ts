import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState } from '../src/state/models';
import { loadComponentModule } from './helpers/componentHarness';

test('the real coordinator reconciles reading changes, midnight and foreground, and releases its timer', () => {
  let state = structuredClone(initialState);
  let now = new Date(2026, 10, 19, 23, 59, 30).getTime();
  let slot = 0;
  const hooks: Array<{ value?: unknown; deps?: unknown[]; cleanup?: () => void }> = [];
  const timers = new Map<number, { fn: () => void; delay: number }>();
  const reconciled: (typeof state)[] = [];
  let nextId = 0;
  let foreground: ((value: string) => void) | undefined;
  let preferenceChanged: (() => void) | undefined;
  class Clock extends Date {
    constructor(value?: number | Date) {
      super(value instanceof Date ? value.getTime() : (value ?? now));
    }
    static now() {
      return now;
    }
  }
  const react = {
    useRef(value: unknown) {
      const i = slot++;
      hooks[i] ??= { value: { current: value } };
      return hooks[i]!.value;
    },
    useEffect(effect: () => () => void, deps: unknown[]) {
      const i = slot++,
        before = hooks[i];
      if (!before?.deps || deps.some((v, j) => !Object.is(v, before.deps?.[j]))) {
        before?.cleanup?.();
        hooks[i] = { deps, cleanup: effect() };
      }
    },
  };
  const { PlanningReminderCoordinator } = loadComponentModule<{
    PlanningReminderCoordinator: () => unknown;
  }>(
    new URL('../src/features/planning/components/PlanningReminderCoordinator.tsx', import.meta.url),
    {
      react,
      'react-native': {
        AppState: {
          addEventListener: (_name: string, fn: typeof foreground) => {
            foreground = fn;
            return {
              remove: () => {
                foreground = undefined;
              },
            };
          },
        },
      },
      '../../../state/store': { useAppStore: () => ({ state, ready: true }) },
      '../../../services/notifications/localReminders': {
        reconcileLocalReminders: async (value: typeof state) => {
          reconciled.push(value);
        },
        setReminderFailure() {},
        getReminderFailure() {},
        onReminderFailureChanged() {},
      },
      '../../../services/notifications/notificationPreferenceEvents': {
        onNotificationPreferencesChanged: (fn: () => void) => {
          preferenceChanged = fn;
          return () => {
            preferenceChanged = undefined;
          };
        },
        notifyNotificationPreferencesChanged() {},
      },
      '../../../shared/components': { Notice: 'Notice' },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key }) },
    },
    {
      Date: Clock,
      setTimeout: (fn: () => void, delay: number) => {
        const id = ++nextId;
        timers.set(id, { fn, delay });
        return id;
      },
      clearTimeout: (id: number) => timers.delete(id),
    },
  );
  const render = () => {
    slot = 0;
    PlanningReminderCoordinator();
  };
  render();
  assert.equal(reconciled.length, 1);
  assert.equal([...timers.values()][0]!.delay, 31000);
  state = { ...state, history: [...state.history] };
  render();
  assert.equal(reconciled.at(-1), state);
  assert.equal(reconciled.length, 2);
  state = { ...state, goals: state.goals.map((g) => ({ ...g, target: g.target + 1 })) };
  render();
  state = { ...state, goalDays: [...state.goalDays] };
  render();
  assert.equal(reconciled.length, 4);
  now += 31000;
  const timer = [...timers.entries()][0]!;
  timers.delete(timer[0]);
  timer[1].fn();
  assert.equal(reconciled.length, 5);
  assert.equal(timers.size, 1);
  assert.equal([...timers.values()][0]!.delay, 24 * 60 * 60 * 1000);
  foreground?.('background');
  assert.equal(reconciled.length, 5);
  foreground?.('active');
  assert.equal(reconciled.length, 6);
  preferenceChanged?.();
  assert.equal(reconciled.length, 7);
  for (const hook of hooks) hook.cleanup?.();
  assert.equal(timers.size, 0);
  assert.equal(foreground, undefined);
  assert.equal(preferenceChanged, undefined);
});
