import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as mushafReading from '../src/domain/mushafReading';
import { localDate } from '../src/domain/localDate';
import { historyAyahEquivalent } from '../src/domain/readingMetrics';
import { statsOverview } from '../src/domain/statistics';
import { readPageMetrics } from '../src/features/quran/model/readPageMetrics';
import { initialState, type AppState } from '../src/state/models';
import { appReducer, newId, type Action } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';
import { createSnapshotWriter } from '../src/state/persistence/snapshotWriter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Execute actual reading controls with native hosts isolated.
type Node = { type: string; props: Record<string, any>; children: unknown[] };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as Node;
  return [node, ...node.children.flatMap(nodes)];
}

function readerControls(saved: AppState = initialState, initialOwner: string | null = '') {
  let state = saved;
  let ownerId = initialOwner;
  const navigations: unknown[][] = [];
  let slot = 0;
  const refs: { current: unknown }[] = [];
  const values: unknown[] = [];
  const modules: Record<string, unknown> = {
    react: {
      createElement: (type: string, props: Node['props'], ...children: unknown[]) => ({
        type,
        props: props ?? {},
        children,
      }),
      useRef: (current: unknown) => (refs[slot++] ??= { current }),
      useState: (value: unknown) => {
        const index = slot++;
        values[index] ??= value;
        return [
          values[index],
          (next: unknown) => {
            values[index] = next;
          },
        ];
      },
    },
    'react-native': { View: 'View', Pressable: 'Pressable' },
    '../../../state/store': {
      useAppStore: () => ({
        state,
        ownerId,
        ready: true,
        dispatch: (action: Action) => {
          state = appReducer(state, action);
        },
      }),
    },
    '../../../domain/localDate': { localDate },
    '../../../state/reducer': { newId },
    '../../../domain/mushafReading': mushafReading,
    '../../../app/navigation/types': {
      useAppNavigation: () => ({ navigate: (...args: unknown[]) => navigations.push(args) }),
    },
    '../../../shared/components': { Button: 'Button', Icon: 'Icon', Sheet: 'Sheet', T: 'T' },
    '../../../shared/components/styles': { s: { button: {} } },
    '../../../shared/theme': { usePalette: () => ({}) },
    '../../../i18n': {
      useI18n: () => ({
        t: (key: string) => key,
        format: (key: string, value: unknown) => `${key}:${value}`,
      }),
    },
  };
  const exports: Record<string, (props: Node['props']) => Node> = {};
  const compiled = ts.transpileModule(
    readFileSync('src/features/quran/components/MushafReadingActions.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  return {
    get state() {
      return state;
    },
    navigations,
    owner(next: string | null) {
      ownerId = next;
    },
    render(options: Node['props'] = {}) {
      slot = 0;
      const tree = exports.MushafReadingActions!({
        edition: 'hafs',
        pages: [1],
        compact: true,
        sessionId: 'test-reading-session',
        ...options,
      });
      return nodes(tree).find(
        (node) => node.props.testID === 'mushaf-page-read-toggle' || node.type === 'Button',
      )!;
    },
  };
}

test('the real page check can be tapped twice to restore exact history, statistics and rail state', () => {
  const app = readerControls();
  const before = JSON.stringify(app.state);
  assert.equal(app.render().props.accessibilityState.checked, false);
  app.render().props.onPress();
  assert.equal(app.state.history.length, 1);
  assert.equal(
    app.state.history.reduce((sum, entry) => sum + historyAyahEquivalent(entry), 0),
    7,
  );
  assert.deepEqual(readPageMetrics(app.state.history, 'hafs', 604)(1, 1), { read: true });
  const marked = app.render();
  assert.notEqual(
    marked.props.disabled,
    true,
    'The second native tap must remain enabled to undo the exact page mark',
  );
  assert.equal(marked.props.accessibilityRole, 'checkbox');
  assert.equal(marked.props.accessibilityState.checked, true);
  assert.equal(marked.props.accessibilityLabel, 'ui.mushaf.removePageMark');
  marked.props.onPress();
  assert.equal(JSON.stringify(app.state), before);
  assert.deepEqual(readPageMetrics(app.state.history, 'hafs', 604)(1, 1), { read: false });
  assert.equal(app.render().props.accessibilityState.checked, false);
});

test('the saved check can be undone after actual decode and a new reader session', () => {
  const first = readerControls(initialState, 'account-a');
  first.render({ compact: false }).props.onPress();
  const restored = decodeState(JSON.stringify(first.state));
  const reopened = readerControls(restored, 'account-a');
  const check = reopened.render({ sessionId: 'different-navigation-session' });
  assert.equal(check.props.accessibilityState.checked, true);
  check.props.onPress();
  assert.equal(reopened.state.history.length, 0);
  assert.equal(statsOverview(reopened.state.history, reopened.state.progress).ayahs, 0);
  assert.equal(reopened.render({ compact: false }).props.accessibilityState.checked, false);
});

test('undo preserves imported bulk, previous page sessions and their existing historical rail coverage', () => {
  const previous = mushafReading.mushafPageEntry(
    'hafs',
    1,
    'old-session:hafs:1',
    'Page1',
    100,
    '2026-11-01',
  );
  const repeated = {
    ...previous,
    id: 'another-session:hafs:1',
    sourceKey: 'another-session:hafs:1',
    timestamp: 200,
  };
  const bulk = {
    ...previous,
    id: 'imported-bulk',
    sourceKey: null,
    amount: 12,
    ayahRange: undefined,
    mushafPage: undefined,
    extraInfo: 'retained source history',
  };
  const saved = { ...initialState, history: [previous, repeated, bulk] };
  const baseline = statsOverview(saved.history, saved.progress);
  const app = readerControls(saved);
  assert.equal(
    app.render().props.accessibilityState.checked,
    false,
    'Historical reading is not an owned reversible mark',
  );
  app.render().props.onPress();
  assert.equal(statsOverview(app.state.history, app.state.progress).ayahs, baseline.ayahs + 7);
  app.render().props.onPress();
  assert.deepEqual(app.state, saved);
  assert.equal(app.state.history[0], previous);
  assert.equal(app.state.history[1], repeated);
  assert.equal(app.state.history[2], bulk);
  assert.deepEqual(statsOverview(app.state.history, app.state.progress), baseline);
  assert.equal(app.render().props.accessibilityState.checked, false);
  assert.deepEqual(readPageMetrics(app.state.history, 'hafs', 604)(1, 1), { read: true });
});

test('partial spreads fill only missing marks and undo only this edition and these pages', () => {
  const app = readerControls();
  app.render({ pages: [3] }).props.onPress();
  app.render({ edition: 'warsh_maknoon', pages: [1] }).props.onPress();
  const unrelated = [...app.state.history];
  app.render().props.onPress();
  const pageOne = app.state.history[0];
  const partial = app.render({ pages: [2, 1] });
  assert.equal(partial.props.accessibilityState.checked, 'mixed');
  partial.props.onPress();
  assert.equal(app.state.history.length, 4);
  assert.ok(app.state.history.includes(pageOne!));
  const all = app.render({ pages: [2, 1], compact: false });
  assert.equal(all.props.accessibilityState.checked, true);
  assert.equal(all.props.accessibilityLabel, 'ui.mushaf.removePageMarks');
  all.props.onPress();
  assert.deepEqual(app.state.history, unrelated);
  assert.equal(app.render({ pages: [2, 1] }).props.accessibilityState.checked, false);
  assert.deepEqual(readPageMetrics(app.state.history, 'hafs', 604)(1, 2), { read: false });
  assert.deepEqual(readPageMetrics(app.state.history, 'hafs', 604)(3, 3), { read: true });
  assert.deepEqual(readPageMetrics(app.state.history, 'warsh_maknoon', 604)(1, 1), { read: true });
});

test('account changes and sign-out select separate marks without adopting another owner', () => {
  const app = readerControls(initialState, 'account-a');
  app.render().props.onPress();
  const accountA = app.state.history[0];
  app.owner('account-b');
  assert.equal(app.render().props.accessibilityState.checked, false);
  app.render().props.onPress();
  const accountB = app.state.history[0];
  app.owner('');
  assert.equal(app.render().props.accessibilityState.checked, false);
  app.render().props.onPress();
  app.render().props.onPress();
  assert.deepEqual(app.state.history, [accountB, accountA]);
  app.owner('account-a');
  assert.equal(app.render().props.accessibilityState.checked, true);
  app.render().props.onPress();
  assert.deepEqual(app.state.history, [accountB]);
  app.owner('account-b');
  assert.equal(app.render().props.accessibilityState.checked, true);
});

test('rapid repeated callbacks express an idempotent desired state instead of flipping twice', () => {
  const app = readerControls();
  const mark = app.render().props.onPress;
  mark();
  mark();
  assert.equal(app.state.history.length, 1);
  const remove = app.render().props.onPress;
  remove();
  remove();
  assert.equal(app.state.history.length, 0);
});

test('unresolved owners wait, and unknown PDF mappings retain the explicit manual fallback', () => {
  const app = readerControls(initialState, null);
  assert.equal(app.render().props.disabled, true);
  app.render().props.onPress();
  assert.equal(app.state.history.length, 0);
  app.owner('');
  for (const compact of [true, false]) {
    const unknown = app.render({ edition: 'hafs_madina_pdf', pages: [73], compact });
    assert.equal(unknown.props.accessibilityState?.checked, undefined);
    unknown.props.onPress();
  }
  assert.equal(app.navigations.length, 2);
  assert.equal(app.navigations[0]?.[0], 'Goals');
  assert.equal(app.state.history.length, 0);
});

test('the atomic reducer refuses unmapped spreads and preserves conflicting unrelated records', () => {
  const change: Action = {
    type: 'mushaf/readMark',
    edition: 'hafs',
    pages: [
      { page: 1, title: 'One' },
      { page: 605, title: 'Unmapped' },
    ],
    marked: true,
    ownerId: '',
    now: 1,
    date: '2026-11-15',
  };
  assert.equal(appReducer(initialState, change), initialState);
  const key = mushafReading.mushafPageMarkKey('hafs', 1, '');
  const conflicting = {
    ...mushafReading.mushafPageEntry('hafs', 1, key, 'Historical bulk', 1, '2026-11-15'),
    amount: 3,
  };
  const saved = { ...initialState, history: [conflicting] };
  assert.equal(appReducer(saved, { ...change, pages: [{ page: 1, title: 'One' }] }), saved);
  assert.equal(
    appReducer(saved, { ...change, pages: [{ page: 1, title: 'One' }], marked: false }),
    saved,
  );
});

test('the real store rejects stale-owner callbacks at the dispatch boundary after sign-out or account switch', () => {
  let state = initialState;
  const refs: { current: unknown }[] = [];
  const modules: Record<string, unknown> = {
    react: {
      createContext: () => ({ Provider: 'Provider' }),
      createElement: (type: string, props: Node['props'], ...children: unknown[]) => ({
        type,
        props,
        children,
      }),
      useReducer: () => [
        state,
        (action: Action) => {
          state = appReducer(state, action);
        },
      ],
      useState: (value: unknown) => {
        const initial = typeof value === 'function' ? value() : value;
        return [
          initial,
          (next: AppState) => {
            if (initial && typeof initial === 'object' && 'version' in initial) state = next;
          },
        ];
      },
      useRef: (current: unknown) => {
        const ref = { current };
        refs.push(ref);
        return ref;
      },
      useCallback: (callback: unknown) => callback,
      useEffect: () => undefined,
    },
    '@react-native-async-storage/async-storage': { setItem: async () => undefined },
    './reducer': { appReducer },
    './models': { initialState },
    '../migration/legacyAndroid': {},
    './persistence/hydrateState': {},
    './persistence/snapshotWriter': { createSnapshotWriter },
  };
  const exports: Record<string, (props: Node['props']) => Node> = {};
  const compiled = ts.transpileModule(readFileSync('src/state/store.tsx', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(`${compiled}\nexports.HydratedStore = HydratedStore;`, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const tree = exports.HydratedStore!({ initial: initialState, children: null });
  const dispatch = tree.props.value.dispatch as (action: Action) => void;
  const owner = refs[0]!;
  const mark: Action = {
    type: 'mushaf/readMark',
    edition: 'hafs',
    pages: [{ page: 1, title: 'One' }],
    marked: true,
    ownerId: 'account-a',
    now: 1,
    date: '2026-11-15',
  };
  dispatch(mark);
  assert.equal(
    state,
    initialState,
    'Unresolved ownership never queues a page mark for an unknown future owner',
  );
  owner.current = 'account-a';
  dispatch(mark);
  const accountA = state.history[0];
  owner.current = 'account-b';
  dispatch({ ...mark, marked: false });
  assert.deepEqual(state.history, [accountA]);
  dispatch({ ...mark, ownerId: 'account-b' });
  const accountB = state.history[0];
  owner.current = '';
  dispatch({ ...mark, ownerId: 'account-b', marked: false });
  assert.deepEqual(state.history, [accountB, accountA]);
  dispatch({ ...mark, ownerId: '' });
  dispatch({ ...mark, ownerId: '', marked: false });
  assert.deepEqual(state.history, [accountB, accountA]);
});
