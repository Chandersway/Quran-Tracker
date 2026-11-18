import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { initialState } from '../src/state/models';
import { appReducer, type Action } from '../src/state/reducer';
import * as prefs from '../src/domain/dockPreferences';
import * as catalog from '../src/app/navigation/dockDestinations';
import * as navigationCopy from '../src/app/navigation/navigationCopy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Inspect rendered native props in a small hook harness.
type Node = { type: string; props: Record<string, any>; children: unknown[] };
function dock() {
  let app = initialState;
  let slot = 0;
  const slots: unknown[] = [];
  const calls: unknown[][] = [];
  const react = {
    Fragment: 'Fragment',
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useState(initial: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value: unknown) => {
          slots[index] = value;
        },
      ];
    },
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': { View: 'View', Pressable: 'Pressable' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '../../state/store': {
      useAppStore: () => ({
        state: app,
        dispatch: (action: Action) => {
          app = appReducer(app, action);
        },
      }),
    },
    '../../i18n': {
      useI18n: () => ({
        locale: 'en',
        t: (key: string) => key,
        format: (key: string, n: number, max: number) => `${key}:${n}/${max}`,
      }),
    },
    '../../shared/components': {
      Button: 'Button',
      Icon: 'Icon',
      Row: 'Row',
      Sheet: 'Sheet',
      T: 'T',
    },
    '../../shared/theme': { usePalette: () => ({}) },
    './DockGlyph': { DockGlyph: 'DockGlyph' },
    './types': { useAppNavigation: () => ({ navigate: (...args: unknown[]) => calls.push(args) }) },
    '../../domain/mushafResume': { mushafResume: () => ({ page: 99 }) },
    '../../domain/dockPreferences': prefs,
    './dockDestinations': catalog,
    './navigationCopy': navigationCopy,
  };
  const output = ts.transpileModule(
    readFileSync(new URL('../src/app/navigation/NavigationDock.tsx', import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports: Record<string, (props: unknown) => Node> = {};
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  function render() {
    slot = 0;
    const routes = ['Today', 'Circle', 'Quran', 'Practice', 'Juz', 'Plan'].map((name) => ({
      name,
      key: name,
    }));
    const tree = exports.NavigationDock!({
      state: { routes, index: 0 },
      navigation: {
        emit: () => ({ defaultPrevented: false }),
        navigate: (...args: unknown[]) => calls.push(args),
      },
    });
    const nodes: Node[] = [];
    function visit(value: unknown) {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      const node = value as Node;
      nodes.push(node);
      visit(node.children);
    }
    visit(tree);
    return nodes;
  }
  return { render, calls, selected: () => app.preferences.dockDestinations };
}

test('selector enforces three choices, restores defaults, and More groups destinations without duplicating pinned tabs', () => {
  const app = dock();
  let nodes = app.render();
  nodes
    .find((n) => n.type === 'Pressable' && n.props.accessibilityLabel === 'ui.more')!
    .props.onPress();
  nodes = app.render();
  assert.equal(
    nodes.filter((n) => n.type === 'Row').length,
    catalog.dockDestinations.length - 3 + 2,
  );
  assert.equal(
    nodes.some((n) => n.type === 'Row' && n.props.title === 'app.stats'),
    false,
  );
  assert.ok(nodes.some((n) => n.type === 'Row' && n.props.title === 'Your account'));
  nodes.find((n) => n.type === 'Button' && n.props.title === 'ui.nav.select')!.props.onPress();
  nodes = app.render();
  const checkbox = (label: string) =>
    nodes.find(
      (n) =>
        n.type === 'Pressable' &&
        n.props.accessibilityRole === 'checkbox' &&
        n.props.accessibilityLabel === label,
    )!;
  assert.equal(checkbox('navigation.notes').props.disabled, true);
  assert.equal(checkbox('app.stats').props.accessibilityState.checked, true);
  checkbox('app.stats').props.onPress();
  nodes = app.render();
  assert.equal(checkbox('navigation.notes').props.disabled, false);
  checkbox('navigation.notes').props.onPress();
  nodes = app.render();
  assert.deepEqual(app.selected(), ['mushaf', 'groups', 'notes']);
  nodes
    .find((n) => n.type === 'Button' && n.props.title === 'ui.nav.restoreDefaults')!
    .props.onPress();
  assert.deepEqual(app.selected(), ['stats', 'mushaf', 'groups']);
});

test('lexicon, study sources and books are reachable from the grouped overflow', () => {
  const app = dock();
  const nodes = app.render();
  for (const title of ['Lexicon', 'Study sources', 'Books']) {
    nodes.find((node) => node.type === 'Row' && node.props.title === title)!.props.onPress();
  }
  assert.deepEqual(app.calls, [['LexiconSearch'], ['StudySources', undefined], ['Books']]);
});

test('Mushaf resumes its saved position and its separate library remains reachable', () => {
  const app = dock();
  let nodes = app.render();
  nodes
    .find(
      (n) =>
        n.type === 'Pressable' &&
        n.props.accessibilityRole === 'tab' &&
        n.props.accessibilityLabel === 'app.mushaf',
    )!
    .props.onPress();
  nodes = app.render();
  nodes.find((n) => n.type === 'Row' && n.props.title === 'ui.nav.library')!.props.onPress();
  assert.deepEqual(app.calls, [['Mushaf', { page: 99 }], ['MushafLibrary']]);
});
