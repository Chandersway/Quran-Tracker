import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as gestures from '../src/features/quran/gestures/mushafTextGestures';
import * as viewportGestures from '../src/features/quran/gestures/bookViewportGestures';
import * as bookPresentation from '../src/domain/bookPresentation';
import * as readingModes from '../src/features/quran/providers/readingModeContext';
import * as mushafReading from '../src/domain/mushafReading';
import * as audioCopy from '../src/features/quran/model/readerCopy';
import * as scrollPosition from '../src/features/quran/layout/bookScrollPosition';
import * as quranNavigation from '../src/domain/quranNavigation';
import { pageSegments } from '../src/content/mushafGeometry';
import { initialState } from '../src/state/models';
import { readPageMetrics } from '../src/features/quran/model/readPageMetrics';
import { getAyahs } from '../src/content/quran';
import type { RootStack } from '../src/app/navigation/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay actual screen props without a native renderer.
type Node = { type: string; props: Record<string, any>; children: unknown[] };

test('zoomed book applies both axes from one uninterrupted diagonal pointer gesture', () => {
  const app = screen('original');
  let tree = app.render();
  tree.find('MushafFooter').props.onZoomIn();
  tree = app.render();
  const viewport = tree.nodes.find(
    (node) => node.type === 'View' && node.props.onMoveShouldSetResponderCapture,
  )!;
  assert.equal(
    typeof viewport.props.onMoveShouldSetResponderCapture,
    'function',
    'one viewport owner must handle both axes instead of nested one-axis native locks',
  );
  const vertical = tree.find('ScrollView');
  const horizontal = tree.nodes.find(
    (node) => node.type === 'ScrollView' && node.props.horizontal && node.props.ref,
  )!;
  const writes: Array<{ x?: number; y?: number }> = [];
  vertical.props.ref.current = { scrollTo: (offset: { y: number }) => writes.push(offset) };
  horizontal.props.ref.current = { scrollTo: (offset: { x: number }) => writes.push(offset) };
  vertical.props.onContentSizeChange(800, 1800);
  horizontal.props.onContentSizeChange(800, 1800);
  vertical.props.onScroll({
    nativeEvent: {
      contentOffset: { x: 0, y: 200 },
      contentSize: { width: 800, height: 1800 },
      layoutMeasurement: { width: 352, height: 540 },
    },
  });
  horizontal.props.onScroll({ nativeEvent: { contentOffset: { x: 120, y: 0 } } });
  const event = (x: number, y: number) => ({
    nativeEvent: { touches: [{ identifier: 1, pageX: x, pageY: y }], pageX: x, pageY: y },
  });
  viewport.props.onTouchStart(event(240, 360));
  assert.equal(viewport.props.onMoveShouldSetResponderCapture(event(200, 310)), true);
  viewport.props.onResponderGrant(event(200, 310));
  viewport.props.onResponderMove(event(160, 260));
  assert.ok(
    writes.some((offset) => offset.x === 200),
    'same MOVE updates horizontal offset',
  );
  assert.ok(
    writes.some((offset) => offset.y === 300),
    'same MOVE updates vertical offset',
  );
  viewport.props.onResponderMove(event(180, 240));
  assert.ok(
    writes.some((offset) => offset.x === 180),
    'direction can change without lifting',
  );
  assert.ok(writes.some((offset) => offset.y === 320));
  assert.equal(app.render().find('MushafFooter').props.page, 50, 'panning never turns a page');
});

/** Preserve real screen hook state across user actions; only platform/data dependencies are stubbed. */
function screen(presentation = 'selectable', context: Partial<RootStack['Mushaf']> = {}) {
  let slot = 0;
  let stateChanges = 0;
  let now = 1000;
  let studyRequests = 0;
  let backPress: (() => boolean) | undefined;
  let focused = true;
  let immersive = false;
  const played: unknown[] = [];
  const timers: (() => void)[] = [];
  const frames: (() => void)[] = [];
  const replacements: RootStack['Mushaf'][] = [];
  const pushes: RootStack['Mushaf'][] = [];
  const pops: number[] = [];
  const navigationActions: {
    type: string;
    source: string;
    payload: { params: RootStack['Mushaf'] };
  }[] = [];
  const actions: { type: string }[] = [];
  const navigationState = {
    index: 1,
    routes: [
      { key: 'main', name: 'Main' },
      { key: 'book-current', name: 'Mushaf' },
    ],
  };
  const slots: unknown[] = [];
  const effects: Array<() => unknown> = [];
  const same = (a: unknown[], b: unknown[]) =>
    a.length === b.length && a.every((value, i) => value === b[i]);
  const react = {
    Fragment: 'Fragment',
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useState(value: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
      return [
        slots[index],
        (next: unknown) => {
          const value = typeof next === 'function' ? next(slots[index]) : next;
          if (!Object.is(value, slots[index])) stateChanges++;
          slots[index] = value;
        },
      ];
    },
    useRef(current: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = { current };
      return slots[index];
    },
    useMemo(fn: () => unknown, deps: unknown[]) {
      const index = slot++;
      const old = slots[index] as { deps: unknown[]; value: unknown } | undefined;
      if (!old || !same(old.deps, deps)) slots[index] = { deps, value: fn() };
      return (slots[index] as { value: unknown }).value;
    },
    useEffect(fn: () => unknown, deps: unknown[]) {
      const index = slot++;
      const old = slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!old || !same(old.deps, deps)) {
        const next: { deps: unknown[]; cleanup?: () => void } = { deps };
        slots[index] = next;
        effects.push(() => {
          old?.cleanup?.();
          const cleanup = fn();
          next.cleanup =
            typeof cleanup === 'function'
              ? () => {
                  cleanup();
                }
              : undefined;
        });
      }
    },
    useLayoutEffect(fn: () => unknown, deps: unknown[]) {
      const index = slot++;
      const old = slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!old || !same(old.deps, deps)) {
        old?.cleanup?.();
        const cleanup = fn();
        slots[index] = { deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined };
      }
    },
  };
  const setImmersive = (value: boolean) => {
    immersive = value;
  };
  const modules: Record<string, unknown> = {
    react,
    '@react-navigation/native': { useIsFocused: () => focused },
    '../../../app/providers/AppChromeContext': { useAppChrome: () => setImmersive },
    'react-native': {
      View: 'View',
      ScrollView: 'ScrollView',
      Pressable: 'Pressable',
      ActivityIndicator: 'ActivityIndicator',
      BackHandler: {
        addEventListener: (_name: string, callback: () => boolean) => {
          backPress = callback;
          return {
            remove: () => {
              backPress = undefined;
            },
          };
        },
      },
      useWindowDimensions: () => ({ width: 400, height: 800 }),
      useColorScheme: () => 'light',
    },
    'react-native-safe-area-context': {
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    '../../../state/store': {
      useAppStore: () => ({
        state: {
          preferences: { theme: 'light', mushaf: 'hafs', translation: 'nl', reciterId: 1 },
          history: [],
          mushafBookmarks: [],
          mushafPositions: {},
          cursor: { surah: 3, ayah: 2 },
        },
        dispatch: (action: { type: string }) => actions.push(action),
      }),
    },
    '../../../state/reducer': { newId: () => 'reading-session-fixture' },
    '../../../shared/components': {
      ...Object.fromEntries(
        ['Button', 'Field', 'IconButton', 'Notice', 'Screen', 'Segments', 'Sheet', 'T'].map(
          (name) => [name, name],
        ),
      ),
      s: { row: {} },
    },
    '../../../shared/theme': { usePalette: () => ({ blueWash: '#DFEAE4' }) },
    '../../../i18n': {
      useI18n: () => ({
        locale: 'nl',
        t: (value: string) => value,
        format: (key: string, value: string) => `${key}:${value}`,
      }),
    },
    '../../../content/quran': {
      chapterById: () => ({ id: 3, name: 'Al Imran', nameAr: 'آل عمران' }),
      getAyahs,
    },
    '../../../content/study': {
      getStudyAyah: () => {
        studyRequests++;
        return new Promise(() => undefined);
      },
    },
    '../../../content/mushafGeometry': {
      findMushafAyah: (edition: string) => ({ page: edition === 'warsh_maknoon' ? 158 : 50 }),
      pageSegments,
      hafsReferences: (_edition: string, _surah: number, ayah: number) => [ayah],
    },
    '../../../services/mushaf/storage': {},
    '../components/DownloadedPdfMushaf': { DownloadedPdfMushaf: 'DownloadedPdfMushaf' },
    '../components/PrintedMushafPage': { PrintedMushafPage: 'PrintedMushafPage' },
    '../components/SelectableMushafPage': { SelectableMushafPage: 'SelectableMushafPage' },
    '../components/MushafReadingActions': { MushafReadingActions: 'MushafReadingActions' },
    '../components/MushafFooter': {
      MushafFooter: 'MushafFooter',
      MushafPageRail: 'MushafPageRail',
    },
    '../components/MushafVerticalRail': { MushafVerticalRail: 'MushafVerticalRail' },
    '../components/ReadingModeSwitch': {
      ReadingModeSwitch: 'ReadingModeSwitch',
      TranslationControl: 'TranslationControl',
    },
    '../components/AyahActionsSheet': { AyahActionsSheet: 'AyahActionsSheet' },
    '../providers/readingModeContext': readingModes,
    '../components/ReaderListenButton': { ReaderListenButton: 'ReaderListenButton' },
    '../layout/readingLayout': { isShortLandscape: () => false, useBookSpread: () => false },
    '../../../domain/mushafReading': mushafReading,
    '../../../domain/bookPresentation': bookPresentation,
    '../../../domain/quranNavigation': quranNavigation,
    '../../../content/translations': { availableTranslations: [{ id: 'nl', labelKey: 'Dutch' }] },
    '../components/BookTranslationSheet': { BookTranslationSheet: 'BookTranslationSheet' },
    '../gestures/mushafTextGestures': gestures,
    '../gestures/bookViewportGestures': viewportGestures,
    '../../../services/audio/audio': {
      createAudioService: () => ({ listSurah: async (surah: number) => [{ surah, reciterId: 1 }] }),
    },
    '../../audio/providers/audioContext': {
      useAudio: () => ({ play: (track: unknown) => played.push(track) }),
    },
    '../../audio/components/RepeatSheet': { RepeatSheet: 'RepeatSheet' },
    '../model/readPageMetrics': { readPageMetrics },
    '../model/readerCopy': audioCopy,
    '../layout/bookScrollPosition': scrollPosition,
  };
  const source = readFileSync(
    new URL('../src/features/quran/screens/MushafScreen.tsx', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: Record<string, (props: unknown) => Node> = {};
  vm.runInNewContext(output + '\nexports.image = ImageMushaf;', {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    Date: { now: () => now },
    queueMicrotask,
    process: { env: {} },
    setTimeout: (callback: () => void) => {
      timers.push(callback);
      return timers.length;
    },
    clearTimeout: () => undefined,
    requestAnimationFrame: (callback: () => void) => {
      frames.push(callback);
      return frames.length;
    },
    cancelAnimationFrame: () => undefined,
  });
  function render() {
    slot = 0;
    const tree = exports.image!({
      route: {
        key: 'book-current',
        params: {
          surah: 3,
          ayah: 2,
          page: 50,
          edition: 'hafs',
          bookPresentation: presentation,
          ...context,
        },
      },
      navigation: {
        replace: (_screen: string, params: RootStack['Mushaf']) => replacements.push(params),
        push: (_screen: string, params: RootStack['Mushaf']) => pushes.push(params),
        pop: (count: number) => pops.push(count),
        getState: () => navigationState,
        dispatch: (action: (typeof navigationActions)[number]) => navigationActions.push(action),
      },
    });
    effects.splice(0).forEach((effect) => effect());
    const nodes: Node[] = [];
    function visit(value: unknown) {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      const node = value as Node;
      nodes.push(node);
      visit(node.children);
    }
    visit(tree);
    return {
      nodes,
      find: (type: string) =>
        nodes.find(
          (node) => node.type === type && (type !== 'ScrollView' || !!node.props.onScroll),
        )!,
    };
  }
  return {
    render,
    stateChanges: () => stateChanges,
    replacements,
    pushes,
    pops,
    actions,
    navigationState,
    navigationActions,
    played,
    flushTimers: () => timers.splice(0).forEach((callback) => callback()),
    flushFrames: () => frames.splice(0).forEach((callback) => callback()),
    unmount: () =>
      slots.forEach((value) => {
        if (value && typeof value === 'object' && 'cleanup' in value)
          (value as { cleanup?: () => void }).cleanup?.();
      }),
    studyRequests: () => studyRequests,
    immersive: () => immersive,
    focus: (value: boolean) => {
      focused = value;
    },
    back: () => backPress?.(),
    time: (ms: number) => {
      now += ms;
    },
    event: (x: number, y: number, count: number) => ({
      nativeEvent: {
        pageX: x,
        pageY: y,
        timestamp: now,
        touches: Array(count).fill({ pageX: x, pageY: y }),
      },
    }),
  };
}

test('native pan updates the rail without rerendering the original artwork on every scroll', () => {
  const app = screen('original', { bookView: { zoom: 2, horizontalOffset: 0, verticalAnchor: 0 } });
  let tree = app.render();
  const native = (y: number) => ({
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { width: 800, height: 1800 },
      layoutMeasurement: { width: 352, height: 540 },
    },
  });
  tree.find('ScrollView').props.onContentSizeChange(800, 1800);
  tree.find('ScrollView').props.onScroll(native(200));
  tree = app.render();
  const before = app.stateChanges();
  tree.find('ScrollView').props.onScroll(native(250));
  assert.equal(
    app.stateChanges(),
    before,
    'moving inside the same measured page must not invalidate its React render',
  );
  const offsets: number[] = [];
  tree.find('MushafVerticalRail').props.positionRef.current = {
    update: (value: number) => offsets.push(value),
  };
  tree.find('ScrollView').props.onScroll(native(260));
  assert.deepEqual(offsets, [260], 'the accessible rail still follows the actual native offset');
});

test('zooming back to page width resets a retained native horizontal pan', () => {
  const app = screen('original', {
    fullscreen: true,
    bookView: { zoom: 2, horizontalOffset: 0, verticalAnchor: 0 },
  });
  let tree = app.render();
  const horizontal = () =>
    tree.nodes.find((node) => node.type === 'ScrollView' && node.props.horizontal)!;
  const writes: number[] = [];
  horizontal().props.ref.current = { scrollTo: ({ x }: { x: number }) => writes.push(x) };
  horizontal().props.onContentSizeChange(800);
  horizontal().props.onScroll({ nativeEvent: { contentOffset: { x: 240, y: 0 } } });
  while (tree.find('MushafFooter').props.zoom > 1) {
    tree.find('MushafFooter').props.onZoomOut();
    tree = app.render();
  }
  // Android can keep the old offset when the disabled horizontal viewport shrinks.
  // Replay the real content-layout callback after +/- has returned the book to 1x.
  horizontal().props.onContentSizeChange(400);
  assert.equal(writes.at(-1), 0, 'the full page must be visible again, not cut off on the left');
  assert.equal(tree.find('MushafFooter').props.page, 50);
});

test('fullscreen rail includes space occupied by overlays even when the artwork alone fits', () => {
  const app = screen('original', {
    fullscreen: true,
    bookView: { zoom: 1.5, horizontalOffset: 0, verticalAnchor: 0 },
  });
  let tree = app.render();
  tree.nodes
    .find((node) => node.props.testID === 'mushaf-book-content')!
    .props.onLayout({ nativeEvent: { layout: { width: 500, height: 500 } } });
  tree.find('ScrollView').props.onContentSizeChange(500, 700);
  tree = app.render();
  assert.equal(
    tree.find('MushafVerticalRail').props.maximum,
    160,
    'the real scroll range includes fullscreen gutters',
  );
});

test('fullscreen rail overlays the full-width book without changing pan bounds or blocking its body', () => {
  const app = screen('original', {
    fullscreen: true,
    bookView: { zoom: 2, horizontalOffset: 0, verticalAnchor: 0 },
  });
  let tree = app.render();
  assert.equal(tree.find('PrintedMushafPage').props.maxWidth, 370);
  assert.equal(tree.find('ScrollView').props.style, undefined, 'the rail reserves no book width');
  const overlay = tree.nodes.find((node) => node.props.testID === 'mushaf-vertical-overlay')!;
  assert.equal(overlay.props.pointerEvents, 'box-none', 'only the narrow control receives touches');
  assert.equal(overlay.props.style.position, 'absolute');
  assert.equal(overlay.props.style.right, 0);
  assert.equal(overlay.props.style.width, 48);
  assert.equal(overlay.props.style.backgroundColor, 'transparent');
  const writes: Array<{ x?: number; y?: number }> = [];
  const vertical = tree.find('ScrollView');
  const horizontal = tree.nodes.find(
    (node) => node.type === 'ScrollView' && node.props.horizontal && node.props.ref,
  )!;
  vertical.props.ref.current = { scrollTo: (value: { y: number }) => writes.push(value) };
  horizontal.props.ref.current = { scrollTo: (value: { x: number }) => writes.push(value) };
  vertical.props.onContentSizeChange(800, 1800);
  horizontal.props.onContentSizeChange(800, 1800);
  tree = app.render();
  assert.equal(
    tree.find('PrintedMushafPage').props.maxWidth,
    370,
    'measuring cannot move the book',
  );
  assert.equal(tree.find('MushafVerticalRail').props.maximum, 1260);
  tree.find('MushafVerticalRail').props.onScroll(750);
  assert.equal(writes.at(-1)!.y, 750);
  const viewport = tree.nodes.find((node) => node.props.testID === 'mushaf-pan-viewport')!;
  viewport.props.onTouchStart(app.event(300, 300, 1));
  assert.equal(viewport.props.onMoveShouldSetResponderCapture(app.event(-500, 100, 1)), true);
  viewport.props.onResponderGrant(app.event(-500, 100, 1));
  assert.equal(
    writes.at(-2)!.x,
    400,
    'pan clamps to the full viewport, without a hidden rail gutter',
  );
  assert.equal(writes.at(-1)!.y, 200, 'the same body gesture still moves both axes');
  assert.equal(tree.find('MushafFooter').props.page, 50);
});

test('fullscreen uses the whole page width and releases root chrome when unfocused or exited', () => {
  const app = screen();
  let tree = app.render();
  const regularWidth = tree.find('SelectableMushafPage').props.maxWidth;
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  tree = app.render();
  assert.equal(app.immersive(), true);
  assert.equal(tree.find('SelectableMushafPage').props.maxWidth, regularWidth);
  app.focus(false);
  app.render();
  assert.equal(app.immersive(), false);
  assert.equal(app.back(), undefined, 'a covered Mushaf must not consume Back on Lexicon/Study');
  app.focus(true);
  app.render();
  assert.equal(app.immersive(), true);
  assert.equal(app.back(), true);
  app.render();
  assert.equal(app.immersive(), false);
});

test('portrait Hafs retains its complete width after async overflow without shrinking source typography', () => {
  const app = screen();
  let tree = app.render();
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  tree = app.render();
  const fullWidth = tree.find('SelectableMushafPage').props.maxWidth;
  assert.equal(
    tree.find('MushafVerticalRail'),
    undefined,
    'full-width portrait does not overlay rightmost words with a rail',
  );
  tree.nodes
    .find((node) => node.props.testID === 'mushaf-book-content')!
    .props.onLayout({ nativeEvent: { layout: { height: 1800 } } });
  tree.find('ScrollView').props.onContentSizeChange(400, 2000);
  tree = app.render();
  assert.equal(
    tree.find('SelectableMushafPage').props.maxWidth,
    fullWidth,
    'content arriving cannot resize Quran typography',
  );
  assert.equal(tree.find('ScrollView').props.style, undefined);
  assert.equal(
    typeof tree.find('ScrollView').props.onScroll,
    'function',
    'unexpected overflow remains natively scrollable',
  );
});

test('a measured overflowing page survives fullscreen viewport changes without a body swipe and ignores stale pages', () => {
  const app = screen();
  let tree = app.render();
  tree.find('MushafFooter').props.onZoomIn();
  tree = app.render();
  const firstBook = tree.nodes.find((node) => node.props.testID === 'mushaf-book-content')!;
  firstBook.props.onLayout({ nativeEvent: { layout: { height: 1800 } } });
  tree = app.render();
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  tree = app.render();
  const viewport = tree.nodes.find(
    (node) => node.type === 'View' && node.props.onLayout && !node.props.testID,
  )!;
  viewport.props.onLayout({ nativeEvent: { layout: { width: 400, height: 700 } } });
  tree = app.render();
  assert.equal(
    tree.find('ScrollView').props.style,
    undefined,
    'fullscreen zoom overlays the rail without a reserved gutter',
  );
  const narrowedBook = tree.nodes.find((node) => node.props.testID === 'mushaf-book-content')!;
  narrowedBook.props.onLayout({ nativeEvent: { layout: { height: 1900 } } });
  tree.find('ScrollView').props.onContentSizeChange(352, 2104);
  tree = app.render();
  assert.equal(
    tree.find('MushafVerticalRail').props.maximum,
    1404,
    'actual extent activates rail before any scroll',
  );
  tree.find('MushafFooter').props.onPageChange(51);
  tree = app.render();
  assert.equal(
    tree.find('MushafVerticalRail').props.maximum,
    0,
    'the prior page extent is not reused',
  );
  narrowedBook.props.onLayout({ nativeEvent: { layout: { height: 1900 } } });
  tree = app.render();
  assert.equal(
    tree.find('MushafVerticalRail').props.maximum,
    0,
    'late old-page layout cannot enable this page',
  );
});

test('fullscreen Warsh keeps its full width beneath the overlay as asynchronous text overflows', () => {
  const app = screen('selectable', {
    edition: 'warsh_maknoon',
    surah: 7,
    ayah: 58,
    page: 158,
    fullscreen: true,
  });
  let tree = app.render();
  const firstWidth = tree.find('SelectableMushafPage').props.maxWidth;
  assert.equal(firstWidth, 370);
  assert.equal(tree.find('ScrollView').props.style, undefined);
  assert.equal(tree.find('MushafVerticalRail').props.maximum, 0);
  tree.nodes
    .find((node) => node.props.testID === 'mushaf-book-content')!
    .props.onLayout({ nativeEvent: { layout: { height: 500 } } });
  tree.find('ScrollView').props.onContentSizeChange(352, 700);
  tree = app.render();
  assert.equal(
    tree.find('MushafVerticalRail').props.maximum,
    160,
    'fullscreen clearance is real scrollable space around the same-width text',
  );
  tree.nodes
    .find((node) => node.props.testID === 'mushaf-book-content')!
    .props.onLayout({ nativeEvent: { layout: { height: 1800 } } });
  tree.find('ScrollView').props.onContentSizeChange(352, 2000);
  tree = app.render();
  assert.equal(
    tree.find('SelectableMushafPage').props.maxWidth,
    firstWidth,
    'loading cannot visibly resize the book',
  );
  assert.equal(tree.find('MushafVerticalRail').props.maximum, 1460);
});

test('selection mode is visible in normal and fullscreen reading and keeps explicit page controls', () => {
  const app = screen();
  let tree = app.render();
  const choose = (label: string) =>
    tree.nodes.find((node) => node.props.accessibilityLabel === label)!.props.onPress();
  assert.equal(tree.find('SelectableMushafPage').props.selectionEnabled, false);
  choose('ui.mushaf.selectionMode');
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.selectionEnabled, true);
  assert.equal(tree.find('SelectableMushafPage').props.pageTurnEnabled, false);
  assert.equal(
    tree.nodes.find((node) => node.props.accessibilityLabel === 'ui.mushaf.selectionMode')!.props
      .accessibilityState.selected,
    true,
  );
  tree.find('MushafFooter').props.onNext();
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.page, 51);
  assert.equal(tree.find('SelectableMushafPage').props.selectionEnabled, true);
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  tree = app.render();
  assert.equal(tree.find('MushafVerticalRail'), undefined);
  tree.find('MushafFooter').props.onPageChange(52);
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.page, 52);
  choose('ui.mushaf.browseMode');
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.selectionEnabled, false);
  assert.equal(tree.find('SelectableMushafPage').props.pageTurnEnabled, true);
  assert.equal(app.back(), true);
  app.render();
  assert.equal(app.immersive(), false);
});

test('Select stays on every original edition and retains the page, zoom and fullscreen', () => {
  for (const edition of ['hafs', 'hafs_maknoon', 'warsh_maknoon', 'muhammadi'] as const) {
    const app = screen('original', { edition, fullscreen: true });
    let tree = app.render();
    tree.find('MushafFooter').props.onPageChange(51);
    tree.find('MushafFooter').props.onZoomIn();
    tree = app.render();
    tree.nodes
      .find((node) => node.props.accessibilityLabel === 'ui.mushaf.selectionMode')!
      .props.onPress();
    tree = app.render();
    assert.equal(app.pushes.length, 0);
    assert.equal(app.replacements.length, 0);
    assert.equal(tree.find('PrintedMushafPage').props.edition, edition);
    assert.equal(tree.find('PrintedMushafPage').props.page, 51);
    assert.equal(tree.find('PrintedMushafPage').props.zoom, 1.25);
    assert.equal(tree.find('SelectableMushafPage'), undefined);
    assert.equal(app.immersive(), true);
    assert.equal(
      tree.nodes.find((node) => node.props.accessibilityLabel === 'ui.mushaf.selectionMode')!.props
        .accessibilityState.selected,
      true,
    );
  }
});

test('selecting the original preserves its plan, precise verse and reading target', () => {
  const app = screen('original', { planId: 'plan', endSurah: 3, endAyah: 9 });
  app
    .render()
    .nodes.find((node) => node.props.accessibilityLabel === 'ui.mushaf.selectionMode')!
    .props.onPress();
  const tree = app.render();
  const context = tree.find('MushafFooter').props.context;
  assert.equal(context.page, 50);
  assert.equal(context.ayah, 2);
  assert.equal(context.planId, 'plan');
  assert.equal(context.endAyah, 9);
});

test('Warsh Unicode remains an explicit presentation choice and never invents verified word data', () => {
  const original = screen('original', {
    edition: 'warsh_maknoon',
    surah: 7,
    ayah: 58,
    page: 158,
    fullscreen: true,
    planId: 'plan',
  });
  const tree = original.render();
  tree.nodes
    .find((node) => node.type === 'Segments' && node.props.value === 'original')!
    .props.onChange('selectable');
  const entry = original.replacements[0]!;
  assert.equal(entry.edition, 'warsh_maknoon');
  assert.equal(entry.page, 158);
  assert.equal(entry.planId, 'plan');
  assert.equal(entry.fullscreen, true);
  const selected = screen('selectable', { ...entry, selectionMode: true });
  let selectedTree = selected.render();
  const page = selectedTree.find('SelectableMushafPage');
  assert.equal(page.props.edition, 'warsh_maknoon');
  assert.equal(page.props.selectionEnabled, true);
  page.props.onWordPress({ surah: 7, ayah: 58, word: 1 }, 'word');
  selectedTree = selected.render();
  assert.equal(selected.studyRequests(), 0);
  assert.equal(
    selectedTree.find('Notice').props.message,
    'ui.selectableMushaf.warshWordUnavailable',
  );
});

test('edition switch uses current fullscreen and selection modes instead of stale route flags', () => {
  const app = screen('selectable', {
    edition: 'warsh_maknoon',
    surah: 7,
    ayah: 58,
    page: 158,
    fullscreen: true,
    selectionMode: true,
  });
  let tree = app.render();
  assert.equal(app.back(), true);
  tree = app.render();
  tree.nodes
    .find((node) => node.props.accessibilityLabel === 'ui.mushaf.browseMode')!
    .props.onPress();
  tree = app.render();
  tree.nodes
    .find((node) => node.type === 'Segments' && node.props.value === 'warsh_maknoon')!
    .props.onChange('hafs');
  const entry = app.replacements[0]!;
  assert.equal(entry.edition, 'hafs');
  assert.equal(entry.fullscreen, false);
  assert.equal(entry.selectionMode, false);

  const inverse = screen('selectable', { fullscreen: false, selectionMode: false });
  tree = inverse.render();
  tree.nodes
    .find((node) => node.props.accessibilityLabel === 'ui.mushaf.selectionMode')!
    .props.onPress();
  tree = inverse.render();
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  tree = inverse.render();
  tree.nodes
    .find((node) => node.type === 'Segments' && node.props.value === 'hafs')!
    .props.onChange('warsh_maknoon');
  assert.equal(inverse.replacements[0]!.fullscreen, true);
  assert.equal(inverse.replacements[0]!.selectionMode, true);
});

test('an existing explicit alternate selection returns to its exact retained scan route', () => {
  const original = screen('original', {
    edition: 'warsh_maknoon',
    page: 158,
    surah: 7,
    ayah: 58,
    fullscreen: true,
  });
  let tree = original.render();
  tree.find('MushafFooter').props.onZoomIn();
  tree = original.render();
  tree.nodes
    .find((node) => node.props.accessibilityLabel === 'ui.mushaf.selectionMode')!
    .props.onPress();
  assert.equal(original.pushes.length, 0, 'ordinary selection stays on its original');
  const context = bookPresentation.beginBookSelection(
    initialState,
    {
      surah: 7,
      ayah: 58,
      edition: 'warsh_maknoon',
      page: 158,
      bookPresentation: 'original',
      fullscreen: true,
      bookView: { zoom: 1.25, horizontalOffset: 0, verticalAnchor: 0 },
    },
    'book-current',
  );
  assert.equal(context.selectionOrigin?.routeKey, 'book-current');
  assert.equal(context.selectionOrigin?.bookView?.zoom, 1.25);
  assert.equal(context.selectionOrigin?.bookPresentation, 'original');
  assert.equal(
    original.actions.some((action) => action.type === 'preferences'),
    false,
  );
  const selected = screen('selectable', context);
  selected.navigationState.routes.push({ key: 'temporary-selection', name: 'Mushaf' });
  selected.navigationState.index = 2;
  tree = selected.render();
  tree.nodes
    .find((node) => node.props.accessibilityLabel === 'ui.mushaf.browseMode')!
    .props.onPress();
  assert.deepEqual(selected.pops, [1]);
  assert.deepEqual(
    selected.navigationActions,
    [],
    'same page returns without disturbing native pan or zoom',
  );
  assert.equal(selected.replacements.length, 0);
  assert.equal(
    selected.actions.some((action) => action.type === 'preferences'),
    false,
  );
});

test('a deliberate page turn in temporary Warsh selection returns to that verified original page', () => {
  const selectionOrigin = {
    routeKey: 'book-current',
    edition: 'warsh_maknoon' as const,
    originalEdition: 'warsh_maknoon' as const,
    bookPresentation: 'original' as const,
    page: 158,
    surah: 7,
    ayah: 58,
    bookView: { zoom: 2, horizontalOffset: 82, verticalAnchor: 0.3 },
  };
  const selected = screen('selectable', {
    selectionOrigin,
    edition: 'warsh_maknoon',
    page: 158,
    surah: 7,
    ayah: 58,
    selectionMode: true,
  });
  selected.navigationState.routes.push({ key: 'temporary-selection', name: 'Mushaf' });
  selected.navigationState.index = 2;
  let tree = selected.render();
  tree.find('MushafFooter').props.onPageChange(159);
  tree = selected.render();
  tree.nodes
    .find((node) => node.props.accessibilityLabel === 'ui.mushaf.browseMode')!
    .props.onPress();
  assert.deepEqual(selected.pops, [1]);
  const updated = selected.navigationActions[0]!;
  assert.equal(updated.source, 'book-current');
  assert.equal(updated.payload.params.edition, 'warsh_maknoon');
  assert.equal(updated.payload.params.page, 159);
  assert.equal(updated.payload.params.bookPresentation, 'original');
  assert.equal(
    updated.payload.params.ayah,
    mushafReading.mushafPageRange('warsh_maknoon', 159)!.start.ayah,
  );
  assert.equal(updated.payload.params.bookView?.zoom, 2);
  assert.equal(updated.payload.params.bookView?.horizontalOffset, 0);
  assert.equal(updated.payload.params.bookView?.verticalAnchor, 0);
  assert.equal(selected.replacements.length, 0);
  assert.equal(
    selected.actions.some((action) => action.type === 'preferences'),
    false,
  );
});

test('a missing selection origin route restores the original PDF snapshot, never an unrelated route', () => {
  const selectionOrigin = {
    routeKey: 'removed-pdf',
    edition: 'hafs_indopak_15' as const,
    originalEdition: 'hafs_indopak_15' as const,
    bookPresentation: 'original' as const,
    page: 73,
    surah: 3,
    ayah: 2,
    bookView: { zoom: 2.25, horizontalOffset: 0, verticalAnchor: 0 },
  };
  const app = screen('selectable', {
    selectionOrigin,
    selectionMode: true,
    planId: 'retained-plan',
  });
  const tree = app.render();
  tree.nodes
    .find((node) => node.props.accessibilityLabel === 'ui.mushaf.browseMode')!
    .props.onPress();
  assert.deepEqual(app.pops, []);
  const restored = app.replacements[0]!;
  assert.equal(restored.edition, 'hafs_indopak_15');
  assert.equal(restored.page, 73);
  assert.equal(restored.bookPresentation, 'original');
  assert.equal(restored.bookView?.zoom, 2.25);
  assert.equal(restored.planId, 'retained-plan');
  assert.equal(restored.selectionOrigin, undefined);
  assert.equal(restored.selectionMode, false);
});

test('saved image viewport initializes zoom, horizontal pan and actual measured vertical anchor', () => {
  const app = screen('original', {
    bookView: { zoom: 2, horizontalOffset: 73, verticalAnchor: 0.4 },
  });
  let tree = app.render();
  const writes: { y: number }[] = [];
  tree.find('ScrollView').props.ref.current = {
    scrollTo: (value: { y: number }) => writes.push(value),
  };
  assert.equal(tree.find('MushafFooter').props.zoom, 2);
  assert.equal(
    tree.nodes.find(
      (node) => node.type === 'ScrollView' && node.props.horizontal && node.props.ref,
    )!.props.contentOffset.x,
    73,
  );
  tree.nodes
    .find((node) => node.props.testID === 'mushaf-book-content')!
    .props.onLayout({ nativeEvent: { layout: { height: 1600 } } });
  tree = app.render();
  app.flushFrames();
  assert.equal(writes.at(-1)?.y, 640);
  assert.equal(tree.find('MushafFooter').props.page, 50);
});

test('Browse on original images does not select an ayah or change the page', async () => {
  const app = screen('original');
  let tree = app.render();
  tree.find('PrintedMushafPage').props.onSelect({ surah: 3, ayah: 2 }, 50);
  await Promise.resolve();
  tree = app.render();
  assert.equal(tree.find('AyahActionsSheet').props.ayah, null);
  assert.equal(tree.find('PrintedMushafPage').props.page, 50);
  assert.equal(app.pushes.length, 0);
});

test('word highlight survives meaning dismissal and clears when the real screen turns the page', () => {
  const app = screen();
  let tree = app.render();
  const reference = { surah: 3, ayah: 2, word: 1 };
  tree.find('SelectableMushafPage').props.onWordPress(reference, 'كَلِمَةٌ');
  tree = app.render();
  assert.deepEqual(tree.find('SelectableMushafPage').props.selectedWord, reference);
  const sheet = tree.nodes.find(
    (node) => node.type === 'Sheet' && node.props.title === 'ui.selectableMushaf.wordInfo',
  )!;
  assert.equal(sheet.props.visible, true);
  assert.ok(
    tree.nodes.some(
      (node) =>
        node.type === 'T' &&
        node.props.style?.backgroundColor === '#DFEAE4' &&
        node.children.includes('كَلِمَةٌ'),
    ),
    'selected word must be visible immediately while meanings load',
  );
  sheet.props.onClose();
  tree = app.render();
  assert.deepEqual(tree.find('SelectableMushafPage').props.selectedWord, reference);
  tree.find('SelectableMushafPage').props.onPageTurn(1);
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.page, 51);
  assert.equal(tree.find('SelectableMushafPage').props.selectedWord, null);
});

test('original printed scans use the same page-turn action and suppress accidental ayah taps after swiping', async () => {
  const app = screen('original');
  let tree = app.render();
  const surface = tree.find('ScrollView');
  const page = tree.nodes.find(
    (node) =>
      node.type === 'View' && node.props.onTouchStart && typeof node.props.ref === 'function',
  )!;
  page.props.ref({
    measure: (callback: (...values: number[]) => void) => callback(0, 0, 370, 600, 0, 0),
  });
  page.props.onTouchStart(app.event(30, 100, 1));
  app.time(200);
  surface.props.onTouchMove(app.event(200, 102, 1));
  surface.props.onTouchEnd(app.event(200, 102, 0));
  tree.find('PrintedMushafPage').props.onSelect({ surah: 3, ayah: 2 }, 50);
  await Promise.resolve();
  tree = app.render();
  assert.equal(tree.find('PrintedMushafPage').props.page, 51);
  assert.equal(tree.find('AyahActionsSheet').props.ayah, null);
});

test('printed Pressable release before ancestor touch-end cannot consume a pending page swipe', async () => {
  for (const [startX, endX, duration, expectedPage] of [
    [45, 300, 350, 51],
    [340, 80, 350, 49],
    [200, 360, 100, 51],
    [160, 300, 350, 50],
  ]) {
    const app = screen('original');
    let tree = app.render();
    const surface = tree.find('ScrollView');
    const page = tree.nodes.find(
      (node) =>
        node.type === 'View' && node.props.onTouchStart && typeof node.props.ref === 'function',
    )!;
    page.props.ref({
      measure: (callback: (...values: number[]) => void) => callback(0, 0, 370, 600, 15, 0),
    });
    page.props.onTouchStart(app.event(startX!, 100, 1));
    app.time(duration!);
    surface.props.onTouchMove(app.event(endX!, 100, 1));
    // React Native delivers Pressability's responder release before the bubbled
    // ancestor raw touch-end. The page Pressable still contains the finger.
    tree.find('PrintedMushafPage').props.onSelect({ surah: 3, ayah: 2 }, 50);
    surface.props.onTouchEnd(app.event(endX!, 100, 0));
    await Promise.resolve();
    tree = app.render();
    assert.equal(tree.find('PrintedMushafPage').props.page, expectedPage);
    assert.equal(tree.find('AyahActionsSheet').props.ayah, null);
  }
});

test('a printed page tap still selects its ayah after the raw release finishes', async () => {
  const app = screen('original', { selectionMode: true });
  let tree = app.render();
  const surface = tree.find('ScrollView');
  const page = tree.nodes.find(
    (node) =>
      node.type === 'View' && node.props.onTouchStart && typeof node.props.ref === 'function',
  )!;
  page.props.ref({
    measure: (callback: (...values: number[]) => void) => callback(0, 0, 370, 600, 15, 0),
  });
  page.props.onTouchStart(app.event(100, 100, 1));
  app.time(100);
  tree.find('PrintedMushafPage').props.onSelect({ surah: 3, ayah: 2 }, 50);
  surface.props.onTouchEnd(app.event(102, 101, 0));
  await Promise.resolve();
  tree = app.render();
  assert.equal(tree.find('PrintedMushafPage').props.page, 50);
  assert.equal(tree.find('AyahActionsSheet').props.ayah?.surah, 3);
});

test('fullscreen keeps the page and zoom, scrolls measured content and exits before navigating back', () => {
  const app = screen();
  let tree = app.render();
  tree.find('MushafFooter').props.onZoomIn();
  tree = app.render();
  const zoomedWidth = tree.find('SelectableMushafPage').props.maxWidth;
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  tree = app.render();
  assert.equal(
    tree.find('MushafFooter').props.zoom,
    1.25,
    'fullscreen retains zoom and explicit registration controls',
  );
  assert.equal(tree.find('ReadingModeSwitch'), undefined);
  assert.equal(tree.find('StatusBar').props.hidden, true);
  assert.equal(tree.find('MushafFooter').props.page, 50);
  const scrollCalls: { y: number; animated: boolean }[] = [];
  tree.find('ScrollView').props.ref.current = {
    scrollTo: ({ y, animated }: { y: number; animated: boolean }) =>
      scrollCalls.push({ y, animated }),
  };
  tree.nodes
    .find((node) => node.props.testID === 'mushaf-book-content')!
    .props.onLayout({ nativeEvent: { layout: { height: 1800 } } });
  tree.find('ScrollView').props.onContentSizeChange(400, 2000);
  tree = app.render();
  assert.equal(tree.find('MushafVerticalRail').props.maximum, 1460);
  tree.find('MushafVerticalRail').props.onScroll(700);
  assert.deepEqual(scrollCalls, [{ y: 700, animated: false }]);
  assert.equal(tree.find('SelectableMushafPage').props.page, 50);
  assert.equal(app.back(), true);
  tree = app.render();
  assert.equal(tree.find('MushafFooter').props.page, 50);
  assert.equal(tree.find('MushafFooter').props.zoom, 1.25);
  assert.equal(tree.find('SelectableMushafPage').props.maxWidth, zoomedWidth);
});

test('footer next and previous callbacks navigate real screen state and retain the reading session', () => {
  const app = screen();
  let tree = app.render();
  const session = tree.find('MushafFooter').props.readingSessionId;
  assert.equal(session, 'reading-session-fixture');
  tree.find('MushafFooter').props.onNext();
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.page, 51);
  assert.equal(tree.find('MushafFooter').props.readingSessionId, session);
  tree.find('MushafFooter').props.onPrevious();
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.page, 50);
  assert.equal(tree.find('MushafFooter').props.readingSessionId, session);
});

test('a selected printed aya connects full-surah Play and the existing Repeat flow without moving the page', async () => {
  const app = screen('original', { selectionMode: true });
  let tree = app.render();
  const surface = tree.find('ScrollView');
  const page = tree.nodes.find(
    (node) =>
      node.type === 'View' && node.props.onTouchStart && typeof node.props.ref === 'function',
  )!;
  page.props.ref({
    measure: (callback: (...values: number[]) => void) => callback(0, 0, 370, 600, 15, 0),
  });
  page.props.onTouchStart(app.event(100, 100, 1));
  app.time(100);
  tree.find('PrintedMushafPage').props.onSelect({ surah: 3, ayah: 2 }, 50);
  surface.props.onTouchEnd(app.event(102, 101, 0));
  await Promise.resolve();
  tree = app.render();
  const actions = tree.find('AyahActionsSheet');
  assert.equal(actions.props.ayah.number, 2);
  actions.props.onPlay(3);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(
    app.played,
    [{ surah: 3, reciterId: 1 }],
    'Play starts the selected surah, matching the original action',
  );
  actions.props.onRepeat(3, 2);
  app.flushTimers();
  tree = app.render();
  assert.equal(tree.find('RepeatSheet').props.visible, true);
  assert.equal(tree.find('RepeatSheet').props.surah, 3);
  assert.equal(tree.find('RepeatSheet').props.initialAyah, 2);
  assert.equal(tree.find('RepeatSheet').props.warsh, false);
  assert.equal(tree.find('PrintedMushafPage').props.page, 50);
});

test('book translation retains selection and page typography, and immersive unmount restores global controls', () => {
  const app = screen('selectable', { selectionMode: true });
  let tree = app.render();
  const source = tree.find('SelectableMushafPage');
  source.props.onWordPress({ surah: 3, ayah: 2, word: 1 }, 'source word');
  tree = app.render();
  tree.nodes
    .find((node) => node.type === 'Sheet' && node.props.title === 'ui.selectableMushaf.wordInfo')!
    .props.onClose();
  tree.nodes
    .find((node) => node.type === 'Button' && node.props.title === 'Dutch')!
    .props.onPress();
  tree = app.render();
  assert.equal(tree.find('BookTranslationSheet').props.visible, true);
  tree.find('BookTranslationSheet').props.onClose();
  tree = app.render();
  assert.equal(tree.find('SelectableMushafPage').props.maxWidth, source.props.maxWidth);
  assert.equal(tree.find('SelectableMushafPage').props.page, 50);
  assert.deepEqual(tree.find('SelectableMushafPage').props.selectedWord, {
    surah: 3,
    ayah: 2,
    word: 1,
  });
  assert.equal(tree.find('SelectableMushafPage').props.selectionEnabled, true);
  tree.nodes
    .find((node) => node.type === 'IconButton' && node.props.label === 'ui.mushaf.enterFullscreen')!
    .props.onPress();
  app.render();
  assert.equal(app.immersive(), true);
  app.unmount();
  assert.equal(app.immersive(), false);
});
