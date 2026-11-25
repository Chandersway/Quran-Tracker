import assert from 'node:assert/strict';
import test from 'node:test';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
} from './helpers/componentHarness';
import { initialState, type AppState } from '../src/state/models';
import { appReducer, type Action } from '../src/state/reducer';
import { appearanceCopy } from '../src/features/account/appearanceCopy';
import { bookmarkCopy } from '../src/features/bookmarks/bookmarkCopy';
import { light } from '../src/shared/theme/colors';
import {
  layoutDirection,
  mirroredIconScale,
  selectedOptionScrollX,
} from '../src/domain/layoutDirection';
import * as typography from '../src/domain/readerTypography';
import * as onboarding from '../src/domain/onboarding';
import { localDate } from '../src/domain/localDate';
import { addDays } from '../src/domain/journey';

function settingsHarness() {
  const harness = componentHarness();
  let state: AppState = structuredClone(initialState);
  const actions: Action[] = [];
  const navigations: unknown[][] = [];
  const { SettingsScreen } = loadComponentModule<{ SettingsScreen: () => unknown }>(
    new URL('../src/features/account/screens/SettingsScreen.tsx', import.meta.url),
    {
      react: harness.react,
      'react-native': { Modal: 'Modal', Switch: 'Switch', View: 'View' },
      '../../../i18n': {
        restoreSourceCopy: (_language: string, labels: unknown) => labels,
        screenSourceKeys: { settings: {} },
        sourceText: (key: string) => key,
      },
      '../../../content/translations': { availableTranslations: [] },
      '../../../app/navigation/types': {
        useAppNavigation: () => ({ navigate: (...args: unknown[]) => navigations.push(args) }),
      },
      '../../../state/store': {
        useAppStore: () => ({
          state,
          dispatch(action: Action) {
            actions.push(action);
            state = appReducer(state, action);
          },
        }),
      },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => light },
      '../../../shared/theme/ThemePicker': { ThemePicker: 'ThemePicker' },
      '../../onboarding/components/OnboardingFlow': { OnboardingFlow: 'OnboardingFlow' },
      '../../audio/components/MediaSettings': { MediaSettingsSheet: 'MediaSettingsSheet' },
      '../appearanceCopy': { appearanceCopy },
      '../../bookmarks/bookmarkCopy': { bookmarkCopy },
      '../../../domain/readerTypography': typography,
    },
  );
  return { render: () => harness.render(SettingsScreen), actions, navigations, state: () => state };
}

test('account is the first settings action, bookmarks open directly, and appearance controls come last', () => {
  const ui = settingsHarness();
  const root = ui.render();
  const rows = elements(root, 'Row');
  assert.equal(rows[0]!.props.icon, 'user');
  press(rows[0]!);
  press(rows.find((row) => row.props.icon === 'bookmark')!);
  assert.deepEqual(ui.navigations, [['Account'], ['Bookmarks']]);
  const nodes = elements(root);
  const pickerIndex = nodes.findIndex((node) => node.type === 'ThemePicker');
  const lastRowIndex = Math.max(...nodes.map((node, index) => (node.type === 'Row' ? index : -1)));
  assert.ok(pickerIndex > lastRowIndex);
  const picker = elements(root, 'ThemePicker')[0]!;
  (picker.props.onChange as (theme: string) => void)('matte_ocean');
  assert.equal(ui.state().preferences.theme, 'matte_ocean');
  assert.equal(ui.state().preferences.cardPatterns, false);
});

test('visible hifz and card-pattern switches persist independent preferences without changing scores', () => {
  const ui = settingsHarness();
  const before = structuredClone(ui.state().progress);
  const toggle = (id: string, value: boolean) => {
    const element = findElement(ui.render(), 'Switch', 'testID', id);
    (element.props.onValueChange as (value: boolean) => void)(value);
  };
  toggle('hifz-colors-switch', false);
  assert.equal(ui.state().preferences.hifzColorsEnabled, false);
  assert.equal(ui.state().preferences.cardPatterns, true);
  toggle('card-patterns-switch', false);
  toggle('hifz-colors-switch', true);
  assert.equal(ui.state().preferences.hifzColorsEnabled, true);
  assert.equal(ui.state().preferences.cardPatterns, false);
  assert.deepEqual(ui.state().progress, before);
});

test('theme picker selects the restored modes and replay opens immediately without changing completion', () => {
  const ui = settingsHarness();
  const picker = elements(ui.render(), 'ThemePicker')[0]!;
  (picker.props.onChange as (theme: string) => void)('matte_manuscript');
  assert.equal(ui.state().preferences.theme, 'matte_manuscript');
  const before = structuredClone(ui.state());
  const replay = elements(ui.render(), 'Button').find((node) => node.props.icon === 'rotate-ccw')!;
  press(replay);
  const modal = elements(ui.render(), 'Modal')[0]!;
  assert.equal(modal.props.visible, true);
  assert.equal(elements(ui.render(), 'OnboardingFlow')[0]!.props.replay, true);
  assert.deepEqual(ui.state(), before);
  (modal.props.onRequestClose as () => void)();
  assert.equal(elements(ui.render(), 'Modal')[0]!.props.visible, false);
});

test('Arabic typography bounds preserve old sizes and allow larger reader settings', () => {
  assert.equal(typography.stepArabicFontSize(22, -2), 20);
  assert.equal(typography.stepArabicFontSize(20, -2), 20);
  assert.equal(typography.stepArabicFontSize(52, 2), 54);
  assert.equal(typography.stepArabicFontSize(54, 2), 54);
});

test('UI icons mirror only on request, and measured selected chips scroll correctly in both directions', () => {
  assert.equal(layoutDirection('ar'), 'rtl');
  assert.equal(layoutDirection('nl'), 'ltr');
  assert.equal(mirroredIconScale('ar', true), -1);
  assert.equal(mirroredIconScale('nl', true), 1);
  assert.equal(mirroredIconScale('ar', false), 1);
  assert.equal(selectedOptionScrollX({ x: 460, width: 94 }, 358, 554), 196);
  assert.equal(selectedOptionScrollX({ x: 0, width: 94 }, 358, 554), 0);
  assert.equal(selectedOptionScrollX({ x: 100, width: 94 }, 700, 554), 0);
});

test('replaying all onboarding pages stays isolated from persisted progress and preferences', () => {
  const harness = componentHarness();
  const actions: unknown[] = [];
  let closed = 0;
  const state = structuredClone(initialState);
  const before = structuredClone(state);
  const { OnboardingFlow } = loadComponentModule<{
    OnboardingFlow: (props: { replay: boolean; onClose(): void }) => unknown;
  }>(new URL('../src/features/onboarding/components/OnboardingFlow.tsx', import.meta.url), {
    react: harness.react,
    'react-native': {
      AppState: {},
      BackHandler: { addEventListener: () => ({ remove() {} }) },
      Pressable: 'Pressable',
      View: 'View',
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../../../i18n': { useI18n: () => ({ t: (key: string) => key, format: (key: string) => key }) },
    '../../../state/store': {
      useAppStore: () => ({ state, dispatch: (action: unknown) => actions.push(action) }),
    },
    '../../../domain/localDate': { localDate },
    '../../../domain/layoutDirection': { layoutDirection },
    '../../../domain/journey': { addDays },
    '../../../shared/components': { ...sharedComponents, s: { row: {} } },
    '../../../shared/theme': { usePalette: () => light },
    '../../../domain/onboarding': onboarding,
  });
  const render = () =>
    harness.render(() =>
      OnboardingFlow({
        replay: true,
        onClose() {
          closed++;
        },
      }),
    );
  for (const step of onboarding.onboardingSteps) {
    const tree = render();
    assert.ok(
      elements(tree, 'T').some((node) =>
        (node.props.children as unknown[]).includes(`onboarding.${step}.title`),
      ),
    );
    press(
      findElement(
        tree,
        'Button',
        'title',
        step === 'groups' ? 'onboarding.start' : 'onboarding.next',
      ),
    );
  }
  assert.equal(closed, 1);
  assert.deepEqual(actions, []);
  assert.deepEqual(state, before);
});
