import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { initialState } from '../src/state/models';
import * as quran from '../src/content/quran';
import * as translations from '../src/content/translations';
import * as modes from '../src/features/quran/providers/readingModeContext';
import * as layout from '../src/features/quran/layout/readingLayout';
import * as copy from '../src/features/quran/model/readerCopy';
import * as readerAnchor from '../src/features/quran/layout/readerScrollAnchor';
import * as quranNavigation from '../src/domain/quranNavigation';
import * as bookPresentation from '../src/domain/bookPresentation';
import * as readerTypography from '../src/domain/readerTypography';
import {
  bookOffsetForAnchor,
  bookScrollAnchor,
} from '../src/features/quran/layout/bookScrollPosition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay real native screen hooks and action callbacks.
type Node = { type: string; props: Record<string, any>; children: unknown[] };
type Effect = { deps: unknown[]; cleanup?: () => void };

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object') return [];
  const node = value as Node;
  return [node, ...nodes(node.children)];
}

function mountReader(
  context: Record<string, unknown> = {},
  platform = 'android',
  preferences: Partial<typeof initialState.preferences> = {},
) {
  let index = 0,
    focused = true;
  const slots: unknown[] = [],
    effects: (() => void)[] = [];
  const chrome: boolean[] = [],
    actions: unknown[] = [];
  const dispatch = (value: unknown) => actions.push(value);
  const setChrome = (value: boolean) => chrome.push(value);
  const dimensions = { width: 360, height: 800, fontScale: 1 };
  const effect = (fn: () => (() => void) | void, deps: unknown[]) => {
    const slot = index++;
    const previous = slots[slot] as Effect | undefined;
    if (
      previous &&
      previous.deps.length === deps.length &&
      previous.deps.every((v, i) => v === deps[i])
    )
      return;
    const current: Effect = { deps };
    slots[slot] = current;
    effects.push(() => {
      previous?.cleanup?.();
      current.cleanup = fn() ?? undefined;
    });
  };
  const react = {
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useState(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof value === 'function' ? value() : value;
      return [
        slots[slot],
        (next: unknown) => {
          slots[slot] = typeof next === 'function' ? next(slots[slot]) : next;
        },
      ];
    },
    useRef(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: value };
      return slots[slot];
    },
    useMemo: (fn: () => unknown) => fn(),
    useEffect: effect,
    useLayoutEffect: effect,
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      ...Object.fromEntries(
        ['ActivityIndicator', 'FlatList', 'Image', 'Pressable', 'ScrollView', 'View'].map(
          (name) => [name, name],
        ),
      ),
      useWindowDimensions: () => ({ ...dimensions }),
      Dimensions: { get: () => dimensions },
      Platform: { OS: platform },
      BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
    },
    '@react-navigation/native': { useIsFocused: () => focused },
    'react-native-safe-area-context': {
      useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 16, left: 0 }),
    },
    'expo-keep-awake': { useKeepAwake: () => undefined },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    '../../../app/providers/AppChromeContext': { useAppChrome: () => setChrome },
    '../../../content/quran': quran,
    '../../../content/translations': translations,
    '../../../state/store': {
      useAppStore: () => ({
        state: { ...initialState, preferences: { ...initialState.preferences, ...preferences } },
        dispatch,
      }),
    },
    '../../../state/reducer': { newId: () => 'test' },
    '../../../domain/localDate': { localDate: () => '2026-11-14' },
    '../../../shared/theme': {
      usePalette: () => ({ primary: '#183B30', line: '#ddd', muted: '#567', subtle: '#eee' }),
    },
    '../../../shared/components': {
      ...Object.fromEntries(
        ['Button', 'Field', 'Icon', 'IconButton', 'Notice', 'Screen', 'Segments', 'Sheet', 'T'].map(
          (name) => [name, name],
        ),
      ),
      s: { row: {} },
    },
    '../../../services/audio/audio': { createAudioService: () => ({ listSurah: async () => [] }) },
    '../../audio/providers/audioContext': { useAudio: () => ({}) },
    '../../audio/components/RepeatSheet': { RepeatSheet: 'RepeatSheet' },
    '../../audio/components/MediaSettings': { MediaSettings: 'MediaSettings' },
    '../components/AyahActionsSheet': { AyahActionsSheet: 'AyahActionsSheet' },
    '../../../i18n': {
      useI18n: () => ({ locale: 'nl', t: (key: string) => key, format: (key: string) => key }),
    },
    '../components/ReadingModeSwitch': {
      ReadingModeSwitch: 'ReadingModeSwitch',
      TranslationControl: 'TranslationControl',
    },
    '../components/ReaderListenButton': { ReaderListenButton: 'ReaderListenButton' },
    '../model/readerCopy': copy,
    '../model/surahIllustrations': { surahIllustrations: { 2: 2 } },
    '../providers/readingModeContext': modes,
    '../layout/readingLayout': layout,
    '../layout/readerScrollAnchor': readerAnchor,
    '../../../domain/quranNavigation': quranNavigation,
    '../../../domain/bookPresentation': bookPresentation,
    '../../../domain/readerTypography': readerTypography,
  };
  const source = ts.transpileModule(
    readFileSync('src/features/quran/screens/ReaderScreen.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports: { ReaderScreen?: (props: unknown) => Node } = {};
  const navigations: unknown[] = [];
  const navigation = {
    setOptions: () => undefined,
    goBack: () => undefined,
    replace: (...args: unknown[]) => navigations.push(args),
  };
  vm.runInNewContext(source, {
    exports,
    process: { env: {} },
    setTimeout,
    clearTimeout,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const route = {
    params: {
      surah: 2,
      ayah: 5,
      edition: 'warsh_maknoon',
      page: 3,
      bookPresentation: 'original',
      ...context,
    },
  };
  return {
    chrome,
    actions,
    navigations,
    dimensions,
    setContext: (next: Record<string, unknown>) => Object.assign(route.params, next),
    setFocused: (value: boolean) => {
      focused = value;
    },
    render() {
      index = 0;
      const tree = exports.ReaderScreen!({ route, navigation });
      for (const run of effects.splice(0)) run();
      return nodes(tree);
    },
    unmount() {
      for (const slot of slots)
        if (slot && typeof slot === 'object' && 'cleanup' in slot) (slot as Effect).cleanup?.();
    },
  };
}

test('text fullscreen hides global chrome and restores it on blur and unmount without losing the passage', () => {
  const reader = mountReader();
  let tree = reader.render();
  const find = (type: string) => tree.find((node) => node.type === type)!;
  assert.equal(find('FlatList').props.initialScrollIndex, undefined);
  assert.equal(find('FlatList').props.initialNumToRender, 14);
  const list = find('FlatList').props.ref;
  const verse = find('FlatList').props.data[9];
  find('FlatList').props.onScrollBeginDrag();
  find('FlatList').props.onViewableItemsChanged({
    viewableItems: [{ item: verse, isViewable: true }],
  });
  const item = nodes(find('FlatList').props.renderItem({ item: verse }));
  assert.equal(item.find((node) => node.props.selectable)?.children[0], verse.text);
  item.find((node) => node.props.name === 'more-horizontal')!.props.onPress();
  tree = reader.render();
  assert.equal(find('AyahActionsSheet').props.ayah.number, 10);
  tree.find((node) => node.props.name === 'maximize')!.props.onPress();
  tree = reader.render();
  assert.equal(reader.chrome.at(-1), true);
  assert.equal(
    tree.some((node) => node.props.testID === 'reader-compact-controls'),
    false,
  );
  assert.equal(find('FlatList').props.ref, list);
  assert.equal(find('AyahActionsSheet').props.ayah.number, 10);
  reader.setFocused(false);
  tree = reader.render();
  assert.equal(reader.chrome.at(-1), false);
  reader.setFocused(true);
  reader.render();
  assert.equal(reader.chrome.at(-1), true);
  reader.unmount();
  assert.equal(reader.chrome.at(-1), false);
  assert.ok(
    reader.actions.some(
      (value) => JSON.stringify(value) === JSON.stringify({ type: 'cursor', surah: 2, ayah: 10 }),
    ),
  );
});

test('text controls keep optional artwork out of the initial passage and book switches retain the live position and edition', () => {
  const reader = mountReader();
  let tree = reader.render();
  let list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(
    nodes(list.props.ListHeaderComponent).some((node) => node.type === 'Image'),
    false,
  );
  assert.equal(
    nodes(tree.find((node) => node.props.testID === 'reader-compact-controls')).some(
      (node) => node.type === 'Field',
    ),
    false,
  );
  tree.find((node) => node.props.title === 'reader.showCard')!.props.onPress();
  tree = reader.render();
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(
    nodes(list.props.ListHeaderComponent).find((node) => node.type === 'Image')?.props.source,
    2,
  );
  list.props.onScrollBeginDrag();
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[9], isViewable: true }],
  });
  tree.find((node) => node.type === 'ReadingModeSwitch')!.props.onBook();
  const [, context] = reader.navigations.at(-1) as [
    string,
    { ayah: number; edition: string; page?: number },
  ];
  assert.equal(context.ayah, 10);
  assert.equal(context.edition, 'warsh_maknoon');
  assert.equal(context.page, undefined);
  reader.dimensions.width = 800;
  reader.dimensions.height = 360;
  reader.render();
  assert.equal(reader.chrome.at(-1), true);
  reader.unmount();
  assert.equal(reader.chrome.at(-1), false);
});

test('book rotation and fullscreen preserve a source-relative scroll point within the actual new bounds', () => {
  const anchor = bookScrollAnchor(480, 1200, 0);
  assert.equal(anchor, 0.4);
  assert.equal(bookOffsetForAnchor(anchor, 2400, 48, 56, 360), 1008);
  assert.equal(bookScrollAnchor(1008, 2400, 48), anchor);
  assert.equal(bookOffsetForAnchor(0, 1200, 48, 56, 800), 0);
  assert.equal(bookOffsetForAnchor(1, 1200, 48, 56, 800), 504);
  assert.equal(bookOffsetForAnchor(NaN, 0, 0, 0, 0), 0);
});

test('repeat reciters and page geometry follow the explicit Reader edition before global preferences', () => {
  for (const [edition, mushaf, warsh, pageEdition] of [
    ['hafs', 'warsh_maknoon', false, 'hafs'],
    ['warsh_maknoon', 'hafs_ayahinfo_1260', true, 'warsh_maknoon'],
    ['hafs_indopak_15', 'muhammadi', false, null],
    [undefined, 'warsh_maknoon', true, 'warsh_maknoon'],
  ] as const) {
    const reader = mountReader({ edition }, 'android', { mushaf });
    const sheet = reader.render().find((node) => node.type === 'RepeatSheet')!;
    assert.equal(sheet.props.warsh, warsh, `${edition ?? 'default'} must use its own reciters`);
    assert.equal(sheet.props.pageEdition, pageEdition);
    reader.unmount();
  }
});

test('repeat follows the complete visible canonical reference across surah boundaries', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reader = mountReader({ surah: 1, ayah: 1, endSurah: 2, endAyah: 100 });
  let tree = reader.render();
  const list = tree.find((node) => node.type === 'FlatList')!;
  const visible = list.props.data.find(
    (row: { surah: number; number: number }) => row.surah === 2 && row.number === 100,
  );
  assert.ok(visible);
  list.props.onViewableItemsChanged({ viewableItems: [{ item: visible, isViewable: true }] });
  tree
    .find((node) => node.type === 'Button' && node.props.title === 'repeat.title')!
    .props.onPress();
  t.mock.timers.tick(250);
  tree = reader.render();
  const sheet = tree.find((node) => node.type === 'RepeatSheet')!;
  assert.equal(sheet.props.visible, true);
  assert.equal(sheet.props.surah, 2);
  assert.equal(sheet.props.initialAyah, 100);
  reader.unmount();
});

test('Warsh158 opens canonical7:58 using measured rows and rejects intermediate cursor positions', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reader = mountReader({ surah: 7, ayah: 58, page: 158 });
  let tree = reader.render();
  let list = tree.find((node) => node.type === 'FlatList')!;
  const oldViewable = list.props.onViewableItemsChanged;
  const offsets: number[] = [];
  list.props.ref.current = {
    scrollToOffset: ({ offset }: { offset: number }) => offsets.push(offset),
  };
  assert.equal(list.props.initialNumToRender, 64);
  assert.equal(list.props.style.opacity, 0);
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[44], isViewable: true }],
  });
  list.props.onLayout({ nativeEvent: { layout: { height: 700 } } });
  list.props.onContentSizeChange(360, 100_000);
  nodes(list.props.ListHeaderComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 144 } },
  });
  const heights = Array.from({ length: 58 }, (_, index) => (index % 4 === 0 ? 570 : 126));
  heights.forEach((height, index) => {
    nodes(list.props.renderItem({ item: list.props.data[index], index }))[0]!.props.onLayout({
      nativeEvent: { layout: { height } },
    });
  });
  t.mock.timers.tick(0);
  const exact = 144 + heights.slice(0, 57).reduce((sum, height) => sum + height, 0);
  assert.equal(offsets.at(-1), exact);
  list.props.onScroll({ nativeEvent: { contentOffset: { y: exact } } });
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.initialNumToRender, 10);
  assert.equal(list.props.style.opacity, 1);
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[44], isViewable: true }],
  });
  tree.find((node) => node.type === 'ReadingModeSwitch')!.props.onBook();
  assert.equal((reader.navigations.at(-1) as [string, { ayah: number }])[1].ayah, 58);

  // A real drag resumes reading tracking. Reflow follows that live point, not the route's58.
  list.props.onScrollBeginDrag();
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[73], isViewable: true }],
  });
  reader.dimensions.width = 800;
  reader.dimensions.height = 360;
  tree = reader.render();
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.initialNumToRender, 64);
  oldViewable({ viewableItems: [{ item: list.props.data[1], isViewable: true }] });
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 7, ayah: 74 }),
  );
});

test('a clamped last-aya anchor keeps its requested point and user drag cancels late work', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reader = mountReader({ surah: 2, ayah: 286 });
  let tree = reader.render();
  let list = tree.find((node) => node.type === 'FlatList')!;
  const offsets: number[] = [];
  list.props.ref.current = {
    scrollToOffset: ({ offset }: { offset: number }) => offsets.push(offset),
  };
  list.props.onLayout({ nativeEvent: { layout: { height: 700 } } });
  nodes(list.props.ListHeaderComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 80 } },
  });
  nodes(list.props.ListFooterComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 100 } },
  });
  list.props.onContentSizeChange(360, 80 + 28600 + 100 + 32);
  let measured = 0;
  while (measured < list.props.data.length) {
    const limit = Math.min(list.props.data.length, list.props.initialNumToRender);
    assert.ok(limit > measured, 'Each bounded batch must make progress to the tail');
    for (let index = measured; index < limit; index++) {
      nodes(list.props.renderItem({ item: list.props.data[index], index }))[0]!.props.onLayout({
        nativeEvent: { layout: { height: 100 } },
      });
    }
    measured = limit;
    t.mock.timers.tick(0);
    list = reader.render().find((node) => node.type === 'FlatList')!;
  }
  assert.equal(offsets.at(-1), 28112);
  list.props.onScroll({ nativeEvent: { contentOffset: { y: 28112 } } });
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[281], isViewable: true }],
  });
  tree.find((node) => node.type === 'ReadingModeSwitch')!.props.onBook();
  assert.equal((reader.navigations.at(-1) as [string, { ayah: number }])[1].ayah, 286);
  reader.dimensions.fontScale = 1.3;
  reader.render();
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[280], isViewable: true }],
  });
  list.props.onScrollBeginDrag();
  const before = offsets.length;
  t.mock.timers.tick(1000);
  assert.equal(offsets.length, before);
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 2, ayah: 281 }),
  );
});

test('a reused Reader route reanchors the new canonical point and ignores old list callbacks', () => {
  const reader = mountReader({ surah: 7, ayah: 58, page: 158 });
  let tree = reader.render();
  const previous = tree.find((node) => node.type === 'FlatList')!;
  reader.setContext({ surah: 2, ayah: 100, page: undefined });
  reader.render();
  tree = reader.render();
  const list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.data[99].key, '2:100');
  assert.equal(list.props.style.opacity, 0);
  const key = list.props.key;
  previous.props.onScrollBeginDrag();
  previous.props.onViewableItemsChanged({
    viewableItems: [{ item: previous.props.data[44], isViewable: true }],
  });
  assert.equal(reader.render().find((node) => node.type === 'FlatList')!.props.key, key);
  const jump = tree.find((node) => node.type === 'Field' && node.props.value === '100');
  assert.ok(jump, 'The new route also updates the jump target');
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 7, ayah: 58 }),
  );
});

test('an unconfirmed manual jump never commits its requested target on unmount', () => {
  const reader = mountReader({ surah: 7, ayah: 1 });
  let tree = reader.render();
  const list = tree.find((node) => node.type === 'FlatList')!;
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[73], isViewable: true }],
  });
  tree.find((node) => node.type === 'Field' && node.props.value === '1')!.props.onChangeText('100');
  tree = reader.render();
  tree
    .find(
      (node) =>
        node.type === 'Button' &&
        node.props.title === 'ui.reader.jumpToAyah' &&
        node.props.icon === 'arrow-right',
    )!
    .props.onPress();
  tree = reader.render();
  assert.equal(tree.find((node) => node.type === 'FlatList')!.props.style.opacity, 0);
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 7, ayah: 74 }),
  );
});

test('a distant multi-surah position shapes at most64 new source rows per measurement batch', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reader = mountReader({ surah: 1, ayah: 1, endSurah: 114, endAyah: 6 });
  let tree = reader.render();
  let list = tree.find((node) => node.type === 'FlatList')!;
  const point = list.props.data[4000];
  list.props.onViewableItemsChanged({ viewableItems: [{ item: point, isViewable: true }] });
  reader.dimensions.width = 800;
  reader.render();
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.initialNumToRender, 64);
  assert.equal(list.props.renderItem({ item: list.props.data[64], index: 64 }), null);
  list.props.onLayout({ nativeEvent: { layout: { height: 600 } } });
  list.props.onContentSizeChange(800, 2_000_000);
  nodes(list.props.ListHeaderComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 80 } },
  });
  for (let index = 0; index < 64; index++) {
    nodes(list.props.renderItem({ item: list.props.data[index], index }))[0]!.props.onLayout({
      nativeEvent: { layout: { height: 180 + index } },
    });
  }
  t.mock.timers.tick(0);
  tree = reader.render();
  list = tree.find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.initialNumToRender, 128);
  const first = nodes(list.props.renderItem({ item: list.props.data[0], index: 0 }));
  assert.equal(first[0]!.props.testID, 'reader-measured-prefix-row');
  assert.equal(first[0]!.props.style.height, 180);
  assert.equal(
    first.some((node) => node.props.selectable),
    false,
  );
  const next = nodes(list.props.renderItem({ item: list.props.data[64], index: 64 }));
  assert.equal(
    next.some((node) => node.props.selectable),
    true,
  );
  list.props.onScrollBeginDrag();
  t.mock.timers.tick(1000);
  assert.equal(
    reader.render().find((node) => node.type === 'FlatList')!.props.initialNumToRender,
    10,
  );
  reader.unmount();
});

test('web scrolling without BeginDrag resumes cursor tracking after an exact anchor acknowledgement', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reader = mountReader({ surah: 7, ayah: 58, page: 158 }, 'web');
  let list = reader.render().find((node) => node.type === 'FlatList')!;
  const offsets: number[] = [];
  list.props.ref.current = {
    scrollToOffset: ({ offset }: { offset: number }) => offsets.push(offset),
  };
  list.props.onLayout({ nativeEvent: { layout: { height: 700 } } });
  list.props.onContentSizeChange(360, 100_000);
  nodes(list.props.ListHeaderComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 80 } },
  });
  for (let index = 0; index < 58; index++) {
    nodes(list.props.renderItem({ item: list.props.data[index], index }))[0]!.props.onLayout({
      nativeEvent: { layout: { height: 140 } },
    });
  }
  t.mock.timers.tick(0);
  const exact = offsets.at(-1)!;
  list.props.onScroll({ nativeEvent: { contentOffset: { y: exact } } });
  list = reader.render().find((node) => node.type === 'FlatList')!;
  list.props.onScroll({ nativeEvent: { contentOffset: { y: exact + 1000 } } });
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[150], isViewable: true }],
  });
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 7, ayah: 151 }),
  );
});

test('native reflow before the React dimensions render cannot replace live59 with geometric67', () => {
  const reader = mountReader({ surah: 7, ayah: 1 });
  let list = reader.render().find((node) => node.type === 'FlatList')!;
  list.props.onLayout({ nativeEvent: { layout: { width: 360, height: 650 } } });
  list.props.onScrollBeginDrag();
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[58], isViewable: true }],
  });
  list.props.onScrollEndDrag?.({ nativeEvent: { velocity: { y: 0 } } });
  // Android can reflow the existing list before useWindowDimensions commits.
  reader.dimensions.width = 800;
  reader.dimensions.height = 360;
  list.props.onScroll({ nativeEvent: { contentOffset: { y: 16000 } } });
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[66], isViewable: true }],
  });
  list.props.onLayout({ nativeEvent: { layout: { width: 800, height: 210 } } });
  reader.render();
  list = reader.render().find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.style.opacity, 0);
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 7, ayah: 59 }),
  );
});

test('native idle layout offsets do not act as drags, while momentum still advances the live cursor', () => {
  const reader = mountReader({ surah: 7, ayah: 1 });
  const list = reader.render().find((node) => node.type === 'FlatList')!;
  list.props.onScrollBeginDrag();
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[58], isViewable: true }],
  });
  list.props.onScrollEndDrag?.({ nativeEvent: { velocity: { y: 1 } } });
  list.props.onMomentumScrollBegin?.();
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[60], isViewable: true }],
  });
  list.props.onMomentumScrollEnd?.();
  list.props.onScroll({ nativeEvent: { contentOffset: { y: 19000 } } });
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[66], isViewable: true }],
  });
  reader.unmount();
  assert.equal(
    JSON.stringify(reader.actions.at(-1)),
    JSON.stringify({ type: 'cursor', surah: 7, ayah: 61 }),
  );
});

test('a near-end whole-Quran anchor measures its final tail and retains bounded source rows after acknowledgement', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reader = mountReader({ surah: 1, ayah: 1, endSurah: 114, endAyah: 6 });
  let list = reader.render().find((node) => node.type === 'FlatList')!;
  const count = list.props.data.length;
  const target = count - 12;
  list.props.onViewableItemsChanged({
    viewableItems: [{ item: list.props.data[target], isViewable: true }],
  });
  reader.dimensions.width = 800;
  reader.render();
  list = reader.render().find((node) => node.type === 'FlatList')!;
  const offsets: number[] = [];
  list.props.ref.current = {
    scrollToOffset: ({ offset }: { offset: number }) => offsets.push(offset),
  };
  list.props.onLayout({ nativeEvent: { layout: { height: 2000 } } });
  list.props.onContentSizeChange(800, count * 140 + 212);
  nodes(list.props.ListHeaderComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 80 } },
  });
  nodes(list.props.ListFooterComponent)[0]!.props.onLayout({
    nativeEvent: { layout: { height: 100 } },
  });
  let measured = 0;
  while (measured < count) {
    const limit = Math.min(count, list.props.initialNumToRender);
    assert.ok(limit > measured, 'Even the final two rows must remain reachable');
    assert.ok(limit - measured <= 64, 'Each batch shapes at most64 new rows');
    assert.equal(list.props.renderItem({ item: list.props.data[limit], index: limit }), null);
    for (let index = measured; index < limit; index++) {
      nodes(list.props.renderItem({ item: list.props.data[index], index }))[0]!.props.onLayout({
        nativeEvent: { layout: { height: 140 } },
      });
    }
    measured = limit;
    t.mock.timers.tick(0);
    list = reader.render().find((node) => node.type === 'FlatList')!;
  }
  const expected = count * 140 + 212 - 2000;
  assert.equal(offsets.at(-1), expected);
  list.props.onScroll({ nativeEvent: { contentOffset: { y: expected } } });
  list = reader.render().find((node) => node.type === 'FlatList')!;
  assert.equal(list.props.initialNumToRender, 10);
  assert.equal(list.props.style.opacity, 1);
  const sourceRows = list.props.data.filter((item: unknown, index: number) =>
    nodes(list.props.renderItem({ item, index })).some((node) => node.props.selectable),
  );
  assert.ok(
    sourceRows.length <= 129,
    'An old RN render mask cannot remount thousands of Text rows',
  );
  reader.unmount();
});
