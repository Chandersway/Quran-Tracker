import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState } from '../src/state/models';
import { appReducer, type Action } from '../src/state/reducer';
import * as goals from '../src/domain/goals';
import * as journey from '../src/domain/journey';
import * as readingUnit from '../src/domain/readingUnit';
import * as planning from '../src/domain/planning';
import * as goalRegistration from '../src/domain/goalRegistration';
import { light } from '../src/shared/theme/colors';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

function fixture(allowed: boolean, enabled = true, platform = 'android', schedulerError = false) {
  const hooks = componentHarness();
  let state = structuredClone(initialState);
  let prompts = 0;
  const actions: Action[] = [];
  const apply = (action: Action) => {
    actions.push(action);
    state = appReducer(state, action);
  };
  const loaded = loadComponentModule<{ GoalsScreen: () => TestElement }>(
    new URL('../src/features/practice/screens/GoalsScreen.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { View: 'View', Platform: { OS: platform } },
      '@react-navigation/native': {
        useRoute: () => ({ params: {} }),
        useNavigation: () => ({ setParams() {} }),
      },
      '../../../state/store': {
        useAppStore: () => ({
          state,
          dispatch: apply,
          commit: async (action: Action) => apply(action),
        }),
      },
      '../../../domain/localDate': { localDate: () => '2026-11-19' },
      '../../../state/reducer': { newId: () => 'goal-test' },
      '../../../domain/goals': goals,
      '../../../domain/planning': planning,
      '../../../domain/goalRegistration': goalRegistration,
      '../../../domain/journey': journey,
      '../../../domain/readingUnit': readingUnit,
      '../../../shared/components': { ...sharedComponents, s: { row: {} } },
      '../../../shared/theme': { usePalette: () => light },
      '../../../content/quran': { chapterById: () => ({ name: 'Chapter' }) },
      '../../planning/components/ReadingJourneyPanel': {
        ReadingJourneyPanel: 'ReadingJourneyPanel',
      },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key }) },
      '../components/QuickCheckInSheet': { QuickCheckInSheet: 'QuickCheckInSheet' },
      '../../../services/notifications/localReminders': {
        loadLocalNotifications: async () => ({ enabled, daily: true }),
        reconcileLocalReminders: async (next: typeof initialState, commit: () => Promise<void>) => {
          assert.equal(next.goals[0]!.reminderHour, 15);
          assert.equal(next.goals[0]!.reminderMinute, 37);
          if (schedulerError) throw new Error('Native schedule failed');
          await commit();
        },
      },
      '../../../services/notifications/planningReminderPort': {
        requestPlanReminderPermission: async () => {
          prompts++;
          return allowed;
        },
      },
    },
    { Error },
  );
  const render = () => hooks.render(loaded.GoalsScreen);
  async function save(
    fields: Record<string, string> = {
      'notifications.hours': '15',
      'notifications.minutesLabel': '37',
    },
  ) {
    press(elements(render(), 'Button').find((node) => node.props.title === 'common.open')!);
    for (const [label, value] of Object.entries(fields)) {
      const field = findElement(render(), 'Field', 'label', label);
      (field.props.onChangeText as (text: string) => void)(value);
    }
    await press(findElement(render(), 'Button', 'title', 'inline.GoalHubPanel.88b7665451'));
    await new Promise(setImmediate);
  }
  return { render, save, actions, prompts: () => prompts, state: () => state };
}

test('daily goal reminder time cannot be saved as successful while notification permission is blocked', async () => {
  const f = fixture(false);
  const before = f.state().goals[0]!.reminderHour;
  await f.save();
  assert.equal(f.prompts(), 1);
  assert.equal(
    f.actions.some((action) => action.type === 'goals/save'),
    false,
  );
  assert.equal(f.state().goals[0]!.reminderHour, before);
  assert.ok(findElement(f.render(), 'Notice', 'message', 'notifications.blocked'));
  assert.ok(elements(f.render(), 'Sheet').some((sheet) => sheet.props.visible));
});

test('permitted daily goal edits retain the chosen time, and disabled reminders or web never prompt', async () => {
  for (const [enabled, platform, expectedPrompts] of [
    [true, 'android', 1],
    [false, 'android', 0],
    [true, 'web', 0],
  ] as const) {
    const f = fixture(true, enabled, platform);
    await f.save();
    assert.equal(f.prompts(), expectedPrompts);
    assert.equal(f.state().goals[0]!.reminderHour, 15);
    assert.equal(f.state().goals[0]!.reminderMinute, 37);
    assert.equal(
      elements(f.render(), 'Sheet').some((sheet) => sheet.props.visible),
      false,
    );
  }
});

test('changing only the reading target saves it even when notifications are off', async () => {
  const f = fixture(false);
  await f.save({ 'inline.GoalHubPanel.e1f4a7690e': '7' });
  assert.equal(f.prompts(), 0);
  assert.equal(f.state().goals[0]!.target, 7);
  assert.equal(f.state().goals[0]!.reminderHour, 8);
});

test('a failed native submission keeps the original goal time and the editable sheet', async () => {
  const f = fixture(true, true, 'android', true);
  await f.save();
  assert.equal(f.state().goals[0]!.reminderHour, 8);
  const sheet = findElement(f.render(), 'Sheet', 'visible', true);
  assert.ok(findElement(sheet, 'Notice', 'message', 'Native schedule failed'));
});
