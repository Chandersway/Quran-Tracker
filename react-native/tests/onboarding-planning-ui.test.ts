import assert from 'node:assert/strict';
import test from 'node:test';
import { componentHarness, elements, loadComponentModule } from './helpers/componentHarness';
import * as onboarding from '../src/domain/onboarding';
import { addDays } from '../src/domain/journey';
import { layoutDirection } from '../src/domain/layoutDirection';

function demo() {
  const harness = componentHarness();
  const modules = {
    react: harness.react,
    'react-native': { View: 'View', Pressable: 'Pressable' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../../../i18n': {
      useI18n: () => ({
        t: (key: string) => key,
        format: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
        locale: 'en',
      }),
    },
    '../../../state/store': {},
    '../../../domain/localDate': { localDate: () => '2026-11-18' },
    '../../../domain/layoutDirection': { layoutDirection },
    '../../../domain/journey': { addDays },
    '../../../domain/onboarding': onboarding,
    '../../../shared/theme': { usePalette: () => ({}) },
    '../../../shared/components': {
      ...Object.fromEntries(
        [
          'Button',
          'Card',
          'Field',
          'Notice',
          'ProgressBar',
          'Screen',
          'Segments',
          'Sheet',
          'T',
        ].map((name) => [name, name]),
      ),
      s: {},
    },
  };
  const loaded = loadComponentModule<{ PlanningDemo(): unknown }>(
    new URL('../src/features/onboarding/components/OnboardingFlow.tsx', import.meta.url),
    modules,
  );
  const render = () => harness.render(loaded.PlanningDemo);
  return { render };
}

test('onboarding planning lets a reader choose an exact hour and minute without creating a real plan', () => {
  const f = demo();
  const chooser = elements(f.render(), 'Button').find(
    (node) => node.props.testID === 'planning_demo_time',
  );
  assert.ok(chooser, 'the original exact-time control remains available');
  (chooser.props.onPress as () => void)();
  const fields = elements(f.render(), 'Field');
  assert.equal(fields.length, 2);
  (fields[0]!.props.onChangeText as (value: string) => void)('23');
  (fields[1]!.props.onChangeText as (value: string) => void)('17');
  const save = elements(f.render(), 'Button').find(
    (node) => node.props.testID === 'planning_demo_time_save',
  )!;
  assert.equal(save.props.disabled, false);
  (save.props.onPress as () => void)();
  assert.match(
    String(
      elements(f.render(), 'Button').find((node) => node.props.testID === 'planning_demo_time')
        ?.props.title,
    ),
    /23:17/,
  );
});

test('onboarding exact-time validation rejects invalid values and cancel leaves the draft unchanged', () => {
  const f = demo();
  const chooser = elements(f.render(), 'Button').find(
    (node) => node.props.testID === 'planning_demo_time',
  );
  assert.ok(chooser);
  (chooser.props.onPress as () => void)();
  (elements(f.render(), 'Field')[0]!.props.onChangeText as (value: string) => void)('24');
  const save = elements(f.render(), 'Button').find(
    (node) => node.props.testID === 'planning_demo_time_save',
  )!;
  assert.equal(save.props.disabled, true);
  (elements(f.render(), 'Sheet')[0]!.props.onClose as () => void)();
  assert.match(
    String(
      elements(f.render(), 'Button').find((node) => node.props.testID === 'planning_demo_time')
        ?.props.title,
    ),
    /19:00/,
  );
});
