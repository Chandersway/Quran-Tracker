import assert from 'node:assert/strict';
import test from 'node:test';
import * as readingPlan from '../src/domain/readingPlan';
import * as readingUnit from '../src/domain/readingUnit';
import * as journey from '../src/domain/journey';
import { localDate } from '../src/domain/localDate';
import {
  createReadingPlanRepository,
  READING_PLAN_KEY,
} from '../src/services/planning/independentReadingPlan';
import { initialState } from '../src/state/models';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

test('actual plan editor save and progress correction never write the daily goal or history', async () => {
  const hooks = componentHarness();
  const appState = structuredClone(initialState);
  const before = structuredClone(appState);
  const writes: string[] = [];
  const repo = createReadingPlanRepository({
    getItem: async () => null,
    setItem: async (key) => {
      writes.push(key);
    },
  });
  await repo.load();
  const module = loadComponentModule<{ ReadingPlanScreen: () => TestElement }>(
    new URL('../src/features/planning/screens/ReadingPlanScreen.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { View: 'View' },
      '../../../domain/readingPlan': readingPlan,
      '../../../domain/readingUnit': readingUnit,
      '../../../domain/journey': journey,
      '../../../domain/localDate': { localDate },
      '../../../state/store': {
        useAppStore: () => ({
          state: appState,
          dispatch: () =>
            assert.fail('Plan editor must not dispatch a daily-goal or history action'),
        }),
      },
      '../hooks/useReadingPlan': {
        useReadingPlan: () => ({ ...repo.snapshot(), save: repo.save, retry: () => {} }),
      },
      '../components/ReadingPlanHomeCard': { ReadingPlanHomeCard: 'ReadingPlanHomeCard' },
      '../../../shared/components': { ...sharedComponents, s: {} },
      '../../../shared/components/Calendar': { Calendar: 'Calendar' },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key, locale: 'nl' }) },
    },
  );
  const render = () => hooks.render(module.ReadingPlanScreen);
  (
    findElement(render(), 'Field', 'label', 'readingPlan.Totaal te lezen').props.onChangeText as (
      value: string,
    ) => void
  )('90');
  (findElement(render(), 'Segments', 'value', 'hizb').props.onChange as (value: string) => void)(
    'rub',
  );
  await press(findElement(render(), 'Button', 'title', 'readingPlan.Leesplan starten'));
  assert.equal(repo.snapshot().plan.target, 90);
  assert.equal(repo.snapshot().plan.unit, 'rub');
  await press(findElement(render(), 'Button', 'title', 'readingPlan.Voortgang aanpassen'));
  const sheet = elements(render(), 'Sheet').find(
    (node) => node.props.title === 'readingPlan.Gelezen totaal corrigeren',
  )!;
  (
    findElement(sheet, 'Field', 'keyboardType', 'decimal-pad').props.onChangeText as (
      value: string,
    ) => void
  )('15');
  await press(findElement(render(), 'Button', 'title', 'readingPlan.Opslaan'));
  assert.equal(readingPlan.readingPlanDone(repo.snapshot().plan, appState.history), 15);
  assert.deepEqual(appState, before);
  assert.deepEqual(writes, [READING_PLAN_KEY, READING_PLAN_KEY]);
});
