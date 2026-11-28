import assert from 'node:assert/strict';
import test from 'node:test';
import * as content from '../src/content/quran';
import * as hizbContent from '../src/content/hizb';
import * as quickCheck from '../src/domain/quickCheckIn';
import * as goals from '../src/domain/goals';
import * as planning from '../src/domain/planning';
import * as plannedPassage from '../src/domain/plannedPassage';
import * as journey from '../src/domain/journey';
import * as agenda from '../src/domain/agenda';
import * as hifz from '../src/domain/hifz';
import * as hifzPresentation from '../src/domain/hifzPresentation';
import * as motivation from '../src/domain/motivation';
import * as goalRegistration from '../src/domain/goalRegistration';
import * as readingUnit from '../src/domain/readingUnit';
import * as progressActions from '../src/domain/progressActions';
import * as bookPresentation from '../src/domain/bookPresentation';
import * as quranNavigation from '../src/domain/quranNavigation';
import * as reducer from '../src/state/reducer';
import * as reminders from '../src/services/notifications/planningReminders';
import { initialState, type AppState, type Plan } from '../src/state/models';
import { localDate } from '../src/domain/localDate';
import { defaultReadingPlan, readingPlanLogged, saveReadingPlan } from '../src/domain/readingPlan';
import { light } from '../src/shared/theme/colors';
import {
  change,
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';
import type { usePracticeSave } from '../src/features/practice/hooks/usePracticeSave';
import type { usePracticeListAnchor } from '../src/features/practice/hooks/usePracticeListAnchor';

const now = new Date(2026, 10, 17, 18, 25, 13, 123).getTime();
const date = localDate(new Date(now));

function mount(
  componentName:
    | 'QuickCheckInSheet'
    | 'ProgressScreen'
    | 'GoalsScreen'
    | 'PlanningScreen'
    | 'PracticeOverview',
  before = initialState,
  routeParams: { date?: string; planId?: string } = { date },
) {
  const hooks = componentHarness();
  let state: AppState = structuredClone(before);
  let persist: () => Promise<void> = async () => {};
  let closed = 0;
  let saved = 0;
  let visible = true;
  const commits: reducer.Action[] = [];
  const navigations: unknown[][] = [];
  const dispatch = (action: reducer.Action) => {
    state = reducer.appReducer(state, action);
  };
  const commit = async (action: reducer.Action) => {
    commits.push(action);
    dispatch(action);
    await persist();
  };
  const paths = {
    QuickCheckInSheet: '../src/features/practice/components/QuickCheckInSheet.tsx',
    ProgressScreen: '../src/features/practice/screens/ProgressScreen.tsx',
    GoalsScreen: '../src/features/practice/screens/GoalsScreen.tsx',
    PlanningScreen: '../src/features/planning/screens/PlanningScreen.tsx',
    PracticeOverview: '../src/features/home/components/PracticeOverview.tsx',
  };
  const saveHook = loadComponentModule<{ usePracticeSave: typeof usePracticeSave }>(
    new URL('../src/features/practice/hooks/usePracticeSave.ts', import.meta.url),
    { react: hooks.react },
  );
  const anchorHook = loadComponentModule<{ usePracticeListAnchor: typeof usePracticeListAnchor }>(
    new URL('../src/features/practice/hooks/usePracticeListAnchor.ts', import.meta.url),
    { react: hooks.react },
    { setTimeout, clearTimeout },
  );
  const modules = {
    react: hooks.react,
    'react-native': {
      View: 'View',
      Pressable: 'Pressable',
      FlatList: 'FlatList',
      ScrollView: 'ScrollView',
    },
    '../../../content/quran': content,
    '../../../content/hizb': hizbContent,
    '../../../domain/quickCheckIn': quickCheck,
    '../../../domain/localDate': { localDate: (clock?: Date) => localDate(clock ?? new Date(now)) },
    '../../../domain/goals': goals,
    '../../../domain/planning': planning,
    '../../../domain/plannedPassage': plannedPassage,
    '../../../domain/journey': journey,
    '../../../domain/agenda': {
      ...agenda,
      agendaReminderPreset: (preset: agenda.AgendaReminderPreset) =>
        agenda.agendaReminderPreset(preset, new Date(now)),
    },
    '../../../domain/goalRegistration': goalRegistration,
    '../../../domain/readingUnit': readingUnit,
    '../../../domain/progressActions': progressActions,
    '../../../domain/bookPresentation': bookPresentation,
    '../../../domain/quranNavigation': quranNavigation,
    '../../../domain/hifz': hifz,
    '../../../domain/hifzPresentation': hifzPresentation,
    '../../../domain/motivation': motivation,
    '../../../state/reducer': reducer,
    '../../../state/store': { useAppStore: () => ({ state, dispatch, commit }) },
    '../../../i18n': {
      useI18n: () => ({
        t: (key: string) => key,
        locale: 'en',
        format: (key: string, ...values: unknown[]) => `${key}:${values.join(',')}`,
      }),
    },
    '../../../i18n/readingStreak': { readingStreakText: () => 'streak' },
    '../../../shared/components': { ...sharedComponents, s: {} },
    '../../../shared/theme': { usePalette: () => light },
    '../../../app/navigation/types': {
      useAppNavigation: () => ({
        navigate(...args: unknown[]) {
          navigations.push(args);
        },
      }),
    },
    '@react-navigation/native': {
      useRoute: () => ({ params: routeParams }),
      useNavigation: () => ({ setParams() {} }),
    },
    '../hooks/usePracticeSave': saveHook,
    '../hooks/usePracticeListAnchor': anchorHook,
    '../components/HifzScoreSlider': { HifzScoreSlider: 'HifzScoreSlider' },
    '../components/QuickCheckInSheet': { QuickCheckInSheet: 'QuickCheckInSheet' },
    '../../quran/components/HizbOpeningPreview': {
      HizbOpeningPreview: 'HizbOpeningPreview',
      HizbTitle: 'HizbTitle',
    },
    '../../quran/components/PartActionsSheet': { PartActionsSheet: 'PartActionsSheet' },
    '../../notes/components/NoteCountButton': { NoteCountButton: 'NoteCountButton' },
    '../../planning/components/ReadingJourneyPanel': { ReadingJourneyPanel: 'ReadingJourneyPanel' },
    '../components/AgendaCalendar': { AgendaCalendar: 'AgendaCalendar' },
    '../../../services/notifications/planningReminders': reminders,
    '../../../services/notifications/localReminders': {
      loadLocalNotifications: async () => ({ enabled: true, daily: true }),
    },
    '../../../services/notifications/planningReminderPort': {
      requestPlanReminderPermission: async () => true,
    },
  };
  const loaded = loadComponentModule<
    Record<string, (props: Record<string, unknown>) => TestElement>
  >(new URL(paths[componentName], import.meta.url), modules, {
    Date: class extends Date {
      static now() {
        return now;
      }
    },
  });
  return {
    render: () =>
      hooks.render(() =>
        loaded[componentName]!({
          visible,
          onSaved: () => {
            saved++;
          },
          onClose: () => {
            closed++;
          },
        }),
      ),
    state: () => state,
    commits,
    navigations,
    closed: () => closed,
    saved: () => saved,
    visible: (next: boolean) => {
      visible = next;
    },
    persistWith: (next: () => Promise<void>) => {
      persist = next;
    },
  };
}

function button(tree: TestElement, title: string) {
  return findElement(tree, 'Button', 'title', title);
}

test('actual quick-check callbacks block double taps and dismissal before storage, then retry the same request after failure', async () => {
  const app = mount('QuickCheckInSheet');
  let reject!: (error: Error) => void;
  app.persistWith(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  const original = app.render();
  const submit = button(original, 'quickCheck.saveAsRead');
  const first = press(submit);
  const duplicate = press(submit); // Same render, before React can disable anything.
  (original.props.onClose as () => void)();
  assert.equal(app.commits.length, 1);
  assert.equal(app.closed(), 0);
  assert.equal(app.saved(), 0);
  assert.equal(app.state().history.length, 1);
  assert.equal(button(app.render(), 'quickCheck.saveAsRead').props.loading, true);
  reject(new Error('Disk full'));
  await Promise.all([first, duplicate]);
  const failed = app.render();
  assert.equal(app.closed(), 0);
  assert.equal(elements(failed, 'Notice').length, 1);
  assert.equal(button(failed, 'common.retry').props.loading, false);
  app.persistWith(async () => {});
  await press(button(failed, 'common.retry'));
  assert.equal(app.commits.length, 2);
  assert.equal(app.commits[1], app.commits[0]);
  assert.equal(app.state().history.length, 1);
  assert.equal(app.closed(), 1);
  assert.equal(app.saved(), 1);
  await press(submit); // A queued old handler after close is still idempotent.
  assert.equal(app.commits.length, 2);
  app.visible(false);
  app.render();
  app.visible(true);
  await press(button(app.render(), 'quickCheck.saveAsRead'));
  assert.equal(app.state().history.length, 2);
});

test('multi-Hizb quick-check makes one durable batch with one history row and four rub marks per target', async () => {
  const app = mount('QuickCheckInSheet');
  change(findElement(app.render(), 'Segments', 'value', 'surah'), 'hizb');
  const selector = elements(app.render(), 'Button').find((node) =>
    String(node.props.title).startsWith('hizbOverview.chooseMultiple'),
  )!;
  press(selector);
  press(findElement(app.render(), 'Pressable', 'accessibilityLabel', 'unit.hizb 2'));
  press(button(app.render(), 'hizbOverview.done'));
  await press(button(app.render(), 'quickCheck.saveAsRead'));
  assert.equal(app.commits.length, 1);
  assert.equal(app.commits[0]!.type, 'checkIn/batch');
  assert.equal(app.state().history.length, 2);
  for (const number of [1, 2])
    for (const quarter of [1, 2, 3, 4])
      assert.equal(app.state().progress[`rub_${number}_${quarter}`]?.readCount, 1);
});

test('Practice bulk success waits for the durable batch and a failed retry does not double-count', async () => {
  const app = mount('ProgressScreen');
  const firstRow = elements(app.render(), 'Pressable').find(
    (node) => node.props.accessibilityRole === 'checkbox',
  )!;
  press(firstRow);
  let finish!: () => void;
  app.persistWith(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const first = press(button(app.render(), 'common.mark (1)'));
  assert.equal(elements(app.render(), 'Notice').length, 0);
  finish();
  await first;
  assert.equal(findElement(app.render(), 'Notice', 'message', 'quickCheck.saved').type, 'Notice');
  press(
    elements(app.render(), 'Pressable').find(
      (node) => node.props.accessibilityRole === 'checkbox',
    )!,
  );
  app.persistWith(async () => {
    throw new Error('Disk full');
  });
  await press(button(app.render(), 'common.mark (1)'));
  assert.equal(
    elements(app.render(), 'Notice').filter((node) => node.props.message === 'quickCheck.saved')
      .length,
    0,
  );
  app.persistWith(async () => {});
  await press(button(app.render(), 'common.retry'));
  assert.equal(app.state().history.length, 2);
});

test('Goals producer records actual clock time and defaults a pages goal to one selected whole Surah', () => {
  const app = mount('GoalsScreen', {
    ...initialState,
    goals: [{ ...initialState.goals[0]!, unit: 'pages', target: 20 }],
  });
  press(button(app.render(), 'inline.GoalHubPanel.846ac43c5f'));
  const recordSheet = elements(app.render(), 'Sheet').find(
    (node) => node.props.title === 'Reading' && node.props.visible,
  )!;
  assert.equal(
    elements(recordSheet, 'Segments').filter((node) => node.props.value === 'surah').length,
    2,
  );
  press(button(recordSheet, 'inline.GoalHubPanel.bfdd510698'));
  const entry = app.state().history[0]!;
  assert.equal(entry.timestamp, now);
  assert.equal(entry.dateKey, date);
  assert.equal(entry.type, 'surah');
  assert.equal(entry.amount, 1);
  const plan = saveReadingPlan(
    defaultReadingPlan,
    30,
    'hizb',
    '',
    new Date(2026, 10, 17, 14).getTime(),
  );
  assert.ok(readingPlanLogged(plan, app.state().history) > 0);
});

test('Home keeps its combined assessment average when browsing another category', () => {
  let state = initialState;
  for (const [kind, score] of [
    ['surah', 30],
    ['hizb', 50],
    ['juz', 90],
  ] as const)
    state = reducer.appReducer(state, { type: 'hifz', kind, number: 1, score, now });
  const app = mount('PracticeOverview', state);
  const before = findElement(app.render(), 'T', 'testID', 'home-hifz-average').props.children;
  assert.equal(JSON.stringify(before), JSON.stringify(['57/100']));
  change(findElement(app.render(), 'Segments', 'value', 'surah'), 'juz');
  assert.equal(
    JSON.stringify(findElement(app.render(), 'T', 'testID', 'home-hifz-average').props.children),
    JSON.stringify(before),
  );
});

test('Agenda Now callback saves an eligible exact reminder through the normal plan path', async () => {
  const plan: Plan = {
    id: 'p',
    date,
    type: 'hizb',
    referenceId: 1,
    subId: 0,
    displayName: 'Hizb 1',
    isDone: false,
    historyLogged: false,
    reminderHour: null,
    reminderMinute: null,
    createdAt: now,
    goalId: 1,
    amount: 1,
    measurementUnit: 'hizb',
  };
  const app = mount('PlanningScreen', { ...initialState, plans: [plan] });
  press(findElement(app.render(), 'IconButton', 'label', 'agenda.empty.addReminder'));
  press(button(app.render(), 'agenda.now'));
  await press(button(app.render(), 'planning.saveReminder'));
  assert.equal(app.commits.length, 1);
  const desired = reminders.desiredPlanReminders(app.state().plans, new Date(now));
  assert.equal(desired.length, 1);
  assert.equal(desired[0]!.dueAt.getTime(), now + 5_000);
  assert.equal(
    elements(app.render(), 'Sheet').find((node) => node.props.title === 'agenda.reminderTitle')!
      .props.visible,
    false,
  );
});

test('historical goal cards and registration defaults use their saved unit after the daily definition changes', () => {
  const priorDate = journey.addDays(date, -1);
  const app = mount(
    'GoalsScreen',
    {
      ...initialState,
      goals: [{ ...initialState.goals[0]!, unit: 'pages', target: 20 }],
      goalDays: [
        { goalId: 1, date: priorDate, unit: 'juz', target: 2, extra: 0, resolution: 'carry' },
      ],
    },
    { date: priorDate },
  );
  const tree = app.render();
  const progress = elements(tree, 'T').find((node) => node.props.size === 22)!;
  assert.match(JSON.stringify(progress.props.children), /juz/);
  assert.ok(
    elements(tree, 'T').some((node) =>
      JSON.stringify(node.props.children).includes('inline.GoalHubPanel.799ac7bdd3'),
    ),
  );
  press(button(tree, 'inline.GoalHubPanel.846ac43c5f'));
  press(button(app.render(), 'inline.GoalHubPanel.bfdd510698'));
  assert.equal(app.state().history[0]!.type, 'juz');
  assert.equal(app.state().history[0]!.dateKey, priorDate);
});

test('a planning notification selects its local agenda date and its row retains the precise reading jump', () => {
  const plan: Plan = {
    id: 'reminder-plan',
    date: journey.addDays(date, 2),
    type: 'juz',
    referenceId: 30,
    subId: 0,
    displayName: 'Juz 30',
    isDone: false,
    historyLogged: false,
    reminderHour: 20,
    reminderMinute: 0,
    createdAt: now,
    goalId: 1,
    amount: 1,
    measurementUnit: 'juz',
  };
  const app = mount('PlanningScreen', { ...initialState, plans: [plan] }, { planId: plan.id });
  const tree = app.render();
  assert.equal(elements(tree, 'AgendaCalendar')[0]!.props.value, plan.date);
  const row = elements(tree, 'Pressable').find(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      JSON.stringify(node.props.children).includes('Juz 30'),
  )!;
  press(row);
  assert.equal(
    JSON.stringify(app.navigations[0]),
    JSON.stringify([
      'Mushaf',
      {
        surah: 78,
        ayah: 1,
        endSurah: 114,
        endAyah: 6,
        planId: plan.id,
      },
    ]),
  );
});

test('the upcoming khatma entry opens the displayed verse interval directly with its plan identity', () => {
  const tomorrow = journey.addDays(date, 1);
  const [plan] = journey.buildJourneyPlans(tomorrow, tomorrow, 1, 8, 'khatma');
  assert.ok(plan);
  const app = mount('PlanningScreen', { ...initialState, plans: [plan] }, {});
  const row = findElement(app.render(), 'Row', 'title', 'Al-Fatihah 1:1 – Al-Baqarah 2:141');
  press(row);
  assert.deepEqual(JSON.parse(JSON.stringify(app.navigations)), [
    ['Mushaf', { surah: 1, ayah: 1, endSurah: 2, endAyah: 141, planId: plan.id }],
  ]);
  assert.equal(app.state().plans[0]!.displayName, 'Rub 1–8');
  assert.equal(app.state().plans[0]!.isDone, false);
});

test('Juz cards show completion from eight Rub marks without inventing a Juz read registration', () => {
  let state = initialState;
  for (const number of [1, 2])
    state = reducer.appReducer(state, {
      type: 'checkIn',
      kind: 'hizb',
      number,
      name: `Hizb ${number}`,
      requestId: `source:${number}`,
      now,
      date,
    });
  const app = mount('ProgressScreen', state);
  change(findElement(app.render(), 'Segments', 'value', 'hizb'), 'juz');
  const tree = app.render();
  const completed = findElement(tree, 'T', 'testID', 'partition-completion-juz-1');
  assert.match(JSON.stringify(completed.props.children), /✓/);
  assert.match(JSON.stringify(completed.props.children), /tracker.juzRubCount:8/);
  const scrolls: number[] = [];
  const list = elements(tree, 'FlatList')[0]!;
  (list.props.ref as { current: unknown }).current = {
    scrollToIndex: ({ index }: { index: number }) => scrolls.push(index),
  };
  (list.props.onContentSizeChange as () => void)();
  assert.deepEqual(scrolls, [1]);
  assert.equal(app.state().history.length, 2);
  assert.equal(app.state().progress.juz_1?.readCount, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(elements(tree, 'NoteCountButton')[0]!.props.target)), {
    scope: 'juz',
    number: 1,
  });
});

test('Home assessed scores never calls a low score strong and keeps all scores in one scrollable card', () => {
  let state = initialState;
  for (const [number, score] of [
    [18, 57],
    [19, 30],
    [20, 17],
  ] as const)
    state = reducer.appReducer(state, { type: 'hifz', kind: 'hizb', number, score, now });
  const app = mount('PracticeOverview', state);
  change(findElement(app.render(), 'Segments', 'value', 'surah'), 'hizb');
  const tree = app.render();
  assert.equal(
    elements(tree, 'T').some((node) => JSON.stringify(node.props.children).includes('app.strong')),
    false,
  );
  const list = findElement(tree, 'ScrollView', 'testID', 'hifz-assessed-list');
  assert.equal(list.props.nestedScrollEnabled, true);
  assert.equal(
    elements(list, 'T').filter((node) => node.props.testID === 'hifz-assessed-score').length,
    3,
  );
  assert.equal(
    elements(list, 'T').filter((node) =>
      JSON.stringify(node.props.children).includes('app.reviewFirst'),
    ).length,
    3,
  );
  assert.deepEqual(
    elements(list, 'T')
      .filter((node) => node.props.testID === 'hifz-assessed-score')
      .map((node) => node.props.color),
    [17, 30, 57].map(
      (score) =>
        hifzPresentation.hifzCardColors({ hasHifzScore: true, progress: score }, true)!.borderColor,
    ),
  );
  const review = findElement(tree, 'ScrollView', 'testID', 'hifz-review-list');
  const first = elements(review, 'Row')[0]!;
  const beforeHistory = structuredClone(app.state().history);
  press(first.props.trailing as TestElement);
  assert.equal(app.state().plans.length, 1);
  assert.equal(app.state().plans[0]!.referenceId, 20);
  assert.deepEqual(app.state().history, beforeHistory);
});
