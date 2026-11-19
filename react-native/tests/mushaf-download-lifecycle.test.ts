import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Run the actual screen's hooks and button handlers without a native renderer.
test('leaving the library screen does not cancel a user-started download', async () => {
  const effects: Array<() => void | (() => void)> = [];
  let signal: AbortSignal | undefined;
  const react = {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({
      type,
      props,
      children,
    }),
    useCallback: (fn: unknown) => fn,
    useEffect: (fn: () => void | (() => void)) => effects.push(fn),
    useRef: (current: unknown) => ({ current }),
    useState: (value: unknown) => [value, () => undefined],
    useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
  };
  const manager = {
    subscribe: () => () => undefined,
    getSnapshot: () => ({
      active: null,
      lastTask: null,
      installed: {},
      checking: false,
      error: null,
    }),
    refresh: async () => undefined,
    start: () => {
      signal = new AbortController().signal;
    },
  };
  const source = readFileSync(
    new URL('../src/features/quran/screens/MushafLibraryScreen.tsx', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: Record<string, () => unknown> = {};
  const modules: Record<string, unknown> = {
    react,
    '@react-navigation/native': { useRoute: () => ({ params: undefined }) },
    'react-native': {
      Platform: { OS: 'android' },
      View: 'View',
      Alert: {
        alert: (_title: string, _body: string, buttons: Array<{ onPress?: () => void }>) =>
          buttons.at(-1)?.onPress?.(),
      },
    },
    '../../../state/store': {
      useAppStore: () => ({
        state: { preferences: { mushaf: 'hafs_ayahinfo_1260' }, cursor: {}, mushafPositions: {} },
        dispatch: () => undefined,
      }),
    },
    '../../../i18n': { useI18n: () => ({ locale: 'en', t: (key: string) => key }) },
    '../../../shared/components': Object.fromEntries(
      ['Button', 'Card', 'Notice', 'Screen', 'T'].map((name) => [name, name]),
    ),
    '../../../shared/theme': { usePalette: () => ({}) },
    '../../../app/navigation/types': { useAppNavigation: () => ({}) },
    '../../../services/mushaf/library': {
      mushafOptions: [{ id: 'hafs_maknoon', type: 'png', title: 'Hafs' }],
      optionFor: () => ({ type: 'png' }),
      installedMushaf: async () => ({ ready: false, count: 0, total: 604 }),
      downloadMushaf: (_id: unknown, _port: unknown, value: AbortSignal) => {
        signal = value;
        return new Promise(() => undefined);
      },
    },
    '../../../services/mushaf/storage': {
      importLegacyMushafs: async () => undefined,
      mushafDownloadPort: {},
      removeMushaf: () => undefined,
    },
    '../../../domain/bookPresentation': {},
    '../../../domain/mushafResume': {},
    '../../../services/mushaf/mushafDownloads': { mushafDownloads: manager },
    '../model/mushafDownloadCopy': { downloadCopy: { en: {} } },
  };
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    AbortController,
    setTimeout,
    clearTimeout,
    console,
  });
  const tree = exports.MushafLibraryScreen!();
  const cleanups = effects.map((effect) => effect());
  const find = (value: unknown): { props: { onPress: () => void } } | undefined => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = find(child);
        if (found) return found;
      }
      return;
    }
    const node = value as {
      type: string;
      props?: { title?: string; onPress: () => void };
      children: unknown[];
    };
    if (node.type === 'Button' && node.props?.title === 'Download')
      return node as { props: { onPress: () => void } };
    return find(node.children);
  };
  find(tree)!.props.onPress();
  await Promise.resolve();
  assert.ok(signal, 'the download was started through the screen');
  cleanups.forEach((cleanup) => cleanup?.());
  assert.equal(signal.aborted, false, 'screen unmount must only detach its subscription');
});
