import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { buildSelectableMushafPage } from '../src/domain/selectableMushaf';
import * as pageText from '../src/domain/selectableMushafText';
import * as pageDomain from '../src/domain/selectableMushaf';
import * as gestures from '../src/features/quran/gestures/mushafTextGestures';
import * as pageTurn from '../src/features/quran/gestures/mushafPageTurn';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Native event prop replay in this renderer-free component harness.
type Node = { type: string; props: Record<string, any>; children: unknown[] };
const reference = { surah: 3, ayah: 2, word: 1 };
const data = buildSelectableMushafPage(
  50,
  [
    {
      verse_key: '3:2',
      words: [
        {
          id: 7,
          position: 1,
          page_number: 50,
          line_number: 1,
          char_type_name: 'word',
          text_qpc_hafs: 'كَلِمَةٌ',
          text_uthmani: 'كَلِمَةٌ',
        },
      ],
    },
  ],
  () => ({ status: 'verified', reference }),
);

function render(extra: Record<string, unknown> = {}, platform = 'web') {
  let hook = 0;
  let now = 1000;
  let pageLeft = 0;
  const turns: number[] = [];
  const words: unknown[] = [];
  const react = {
    createElement: (type: string, props: Record<string, unknown>, ...children: unknown[]) => {
      if (props?.ref) {
        const ref = props.ref as { current: unknown };
        ref.current = {
          measure: (callback: (...values: number[]) => void) =>
            callback(0, 0, 380, 560, pageLeft, 0),
        };
      }
      return { type, props: props ?? {}, children };
    },
    Fragment: 'Fragment',
    useEffect: () => undefined,
    useMemo: (fn: () => unknown) => fn(),
    useRef: (current: unknown) => ({ current }),
    useState: (value: unknown) => {
      const index = hook++;
      // Gesture tests run a page after fitting; lifecycle tests replay the real measurement phase.
      const fitted =
        index === 3
          ? {
              signature: `hafs:${pageText.selectablePageLayoutKey(50, 380, 380 * 1.47, 0, 2.625)}:font=1`,
              scale: 1,
              status: 'verified',
            }
          : value;
      return [index === 0 ? data : fitted, () => undefined];
    },
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      Text: 'Text',
      View: 'View',
      Pressable: 'Pressable',
      ActivityIndicator: 'ActivityIndicator',
      PixelRatio: { get: () => 2.625 },
      Platform: { OS: platform },
    },
    'expo-font': { useFonts: () => [true, null] },
    '@expo-google-fonts/amiri/400Regular': { Amiri_400Regular: 'marker-font' },
    '../../../../assets/fonts/UthmanicHafs_V22.ttf': 'font',
    '../../../../assets/fonts/UthmanicWarsh-v-3.0.ttf': 'warsh-font',
    '../../../content/quran': { chapterById: () => ({ nameAr: '' }) },
    '../../../domain/selectableMushaf': pageDomain,
    '../../../domain/selectableMushafText': pageText,
    '../../../services/mushaf/selectableMushaf': {},
    '../gestures/mushafTextGestures': gestures,
    '../gestures/mushafPageTurn': pageTurn,
    '../gestures/mushafTextGestureBridge': { observeMushafText: () => undefined },
  };
  const source = readFileSync(
    new URL('../src/features/quran/components/SelectableMushafPage.tsx', import.meta.url),
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
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    Date: { now: () => now },
  });
  const tree = exports.SelectableMushafPage!({
    page: 50,
    maxWidth: 380,
    maxHeight: 10000,
    labels: {},
    onWordPress: (...args: unknown[]) => words.push(args),
    onUnavailableWord: () => undefined,
    onPageTurn: (direction: number) => turns.push(direction),
    selectedWord: reference,
    ...extra,
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
  const word = nodes.find((node) => node.props.key === 7)!;
  function event(x: number, y: number, touches = 1) {
    return {
      nativeEvent: {
        pageX: x,
        pageY: y,
        timestamp: now,
        touches: Array.from({ length: touches }, () => ({ pageX: x, pageY: y })),
        changedTouches: [{ pageX: x, pageY: y }],
      },
    };
  }
  return {
    tree,
    nodes,
    word,
    turns,
    words,
    event,
    movePage: (left: number) => {
      pageLeft = left;
    },
    time: (ms: number) => {
      now += ms;
    },
  };
}

test('actual selectable page turns on a quick horizontal swipe without opening the touched word', () => {
  const page = render();
  page.tree.props.onTouchStart?.(page.event(80, 100));
  page.word.props.onPressIn(page.event(80, 100));
  page.time(120);
  page.tree.props.onTouchMove?.(page.event(200, 104));
  page.tree.props.onTouchEnd?.(page.event(200, 104, 0));
  page.word.props.onPress(page.event(200, 104, 0));
  assert.deepEqual(page.turns, [1]);
  assert.deepEqual(page.words, []);
});

test('Android Browse turns from paper margins or text without requiring a native TextView event', async () => {
  for (const [startX, endX, direction] of [
    [12, 260, 1],
    [60, 300, 1],
    [368, 100, -1],
  ] as const) {
    const page = render({}, 'android');
    page.tree.props.onTouchStart(page.event(startX, 100));
    page.time(250);
    page.tree.props.onTouchMove(page.event(endX, 101));
    page.tree.props.onTouchEnd(page.event(endX, 101, 0));
    assert.deepEqual(page.turns, [], 'raw END must finish before unmounting a word responder');
    page.word.props.onPress();
    await Promise.resolve();
    assert.deepEqual(page.turns, [direction]);
    assert.deepEqual(page.words, []);
  }
});

test('Android raw page fallback still respects cancellation, zoom and explicit selection', async () => {
  for (const scenario of ['cancel', 'zoom', 'selection'] as const) {
    const page = render(
      { pageTurnEnabled: scenario !== 'zoom', selectionEnabled: scenario === 'selection' },
      'android',
    );
    page.tree.props.onTouchStart(page.event(20, 100));
    page.time(200);
    page.tree.props.onTouchMove(page.event(260, 100));
    if (scenario === 'cancel') page.tree.props.onTouchCancel();
    page.tree.props.onTouchEnd(page.event(260, 100, 0));
    await Promise.resolve();
    assert.deepEqual(page.turns, [], scenario);
  }
});

test('selectable page measures its own current offset at DOWN before classifying edge intent', () => {
  for (const [startX, expected] of [
    [580, [1]],
    [730, []],
    [80, []],
  ] as const) {
    const page = render();
    page.movePage(540);
    page.tree.props.onTouchStart(page.event(startX, 100));
    page.time(350);
    page.tree.props.onTouchEnd(page.event(startX + 120, 102, 0));
    assert.deepEqual(page.turns, expected);
  }
});

test('a smooth long edge pan turns without opening meanings; holding before moving does neither', () => {
  for (const [delay, duration, expected] of [
    [100, 650, [1]],
    [450, 550, []],
  ] as const) {
    const page = render();
    page.tree.props.onTouchStart(page.event(40, 100));
    page.word.props.onPressIn(page.event(40, 100));
    page.time(delay);
    page.tree.props.onTouchMove(page.event(60, 101));
    page.time(duration - delay);
    page.tree.props.onTouchEnd(page.event(160, 102, 0));
    page.word.props.onPress(page.event(160, 102, 0));
    assert.deepEqual(page.turns, expected);
    assert.deepEqual(page.words, []);
  }
});

test('the controlled canonical word has a visible highlight without modifying the single selection buffer', () => {
  const page = render();
  assert.equal(page.word.props.style?.backgroundColor, '#E1E8D5');
  assert.equal(page.word.props.accessibilityState?.selected, true);
  const text = page.nodes.find((node) => node.props.testID === 'selectable-mushaf-text')!;
  assert.equal(
    text.props.selectable,
    false,
    'browsing preserves word taps without native selection',
  );
  function buffer(node: unknown): string {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(buffer).join('');
    return node && typeof node === 'object' ? buffer((node as Node).children) : '';
  }
  assert.equal(buffer(text), pageText.selectablePageText(data, () => '').text);
});

test('native selection mode owns the entire text buffer without word responders or page swipes', () => {
  const page = render({ selectionEnabled: true, verticalEdges: { top: true, bottom: true } });
  const text = page.nodes.find((node) => node.props.testID === 'selectable-mushaf-text')!;
  assert.equal(text.props.selectable, true);
  assert.equal(text.props.key, 'hafs:50:select');
  assert.equal(page.word.props.onPressIn, undefined);
  assert.equal(page.word.props.onLongPress, undefined);
  assert.equal(page.word.props.onPress, undefined);
  for (const [x, y, endX, endY] of [
    [30, 100, 250, 100],
    [150, 300, 150, 100],
  ]) {
    page.tree.props.onTouchStart(page.event(x!, y!));
    page.time(150);
    page.tree.props.onTouchMove(page.event(endX!, endY!));
    page.tree.props.onTouchEnd(page.event(endX!, endY!, 0));
  }
  assert.deepEqual(page.turns, []);
  assert.deepEqual(page.words, []);
});

test('a short word tap opens the exact canonical word once and does not turn the page', () => {
  const page = render();
  page.tree.props.onTouchStart(page.event(80, 100));
  page.word.props.onPressIn(page.event(80, 100));
  page.time(100);
  page.tree.props.onTouchEnd(page.event(83, 101, 0));
  page.word.props.onPress(page.event(83, 101, 0));
  assert.deepEqual(page.turns, []);
  assert.deepEqual(page.words, [[reference, 'كَلِمَةٌ']]);
});

test('real Android pressIn-before-touchStart order still protects long presses with shorter system timeouts', () => {
  const page = render();
  page.word.props.onPressIn(page.event(80, 100));
  page.tree.props.onTouchStart(page.event(80, 100));
  page.time(300);
  page.word.props.onLongPress();
  page.tree.props.onTouchEnd(page.event(80, 100, 0));
  page.word.props.onPress(page.event(80, 100, 0));
  assert.deepEqual(page.words, []);
  assert.deepEqual(page.turns, []);
});

test('native selection holds, slow drags, vertical motion, pinches and cancellations cannot turn or open meanings', () => {
  for (const scenario of ['long', 'slow', 'vertical', 'pinch', 'cancel']) {
    const page = render();
    page.tree.props.onTouchStart(page.event(80, 100));
    page.word.props.onPressIn(page.event(80, 100));
    page.time(scenario === 'slow' || scenario === 'long' ? 700 : 150);
    if (scenario === 'long') page.word.props.onLongPress();
    if (scenario === 'cancel') page.tree.props.onTouchCancel();
    page.tree.props.onTouchMove(
      page.event(200, scenario === 'vertical' ? 300 : 104, scenario === 'pinch' ? 2 : 1),
    );
    page.tree.props.onTouchEnd(page.event(200, scenario === 'vertical' ? 300 : 104, 0));
    page.word.props.onPress(page.event(200, 104, 0));
    assert.deepEqual(page.turns, [], scenario);
    assert.deepEqual(page.words, [], scenario);
  }
});

test('zoomed book pages preserve panning and never turn in response to a swipe', () => {
  const page = render({ pageTurnEnabled: false });
  page.tree.props.onTouchStart(page.event(200, 100));
  page.time(120);
  page.tree.props.onTouchEnd(page.event(80, 100, 0));
  assert.deepEqual(page.turns, []);
});

test('an ordinary 350ms thumb swipe advances but a 450ms hold cannot become a page turn', () => {
  for (const [duration, expected] of [
    [350, [1]],
    [450, []],
  ] as const) {
    const page = render();
    page.tree.props.onTouchStart(page.event(40, 100));
    page.time(duration);
    page.tree.props.onTouchEnd(page.event(160, 102, 0));
    assert.deepEqual(page.turns, expected);
  }
});

test('an extra vertical swipe at a scroll boundary turns; scrolling within a tall page does not', () => {
  for (const [edges, dy, expected] of [
    [{ top: false, bottom: false }, -100, []],
    [{ top: false, bottom: true }, -100, [1]],
    [{ top: true, bottom: false }, 100, [-1]],
    [{ top: false, bottom: true }, 100, []],
  ] as const) {
    const page = render({ verticalEdges: edges });
    page.tree.props.onTouchStart(page.event(100, 200));
    page.time(120);
    page.tree.props.onTouchEnd(page.event(101, 200 + dy, 0));
    assert.deepEqual(page.turns, expected);
  }
});

test('selection protection resets from actual selection state at the next gesture, never a sticky timer', () => {
  const gesture = gestures.createMushafTextGesture();
  const start = { x: 80, y: 100, time: 1000, touches: 1 };
  const end = { x: 200, y: 100, time: 1120, touches: 0 };
  gesture.selection(true);
  gesture.start(start, { left: 0, width: 380 });
  assert.equal(gesture.end(end), null, 'a fast selection handle drag must be rejected');
  gesture.selection(false);
  gesture.start(start, { left: 0, width: 380 });
  assert.equal(
    gesture.end(end),
    1,
    'the next gesture after selection clears can swipe immediately',
  );
  gesture.start({ ...start, x: 300 }, { left: 0, width: 380 });
  assert.equal(gesture.end({ ...end, x: 180 }), -1);
});

test('completed touch activation cannot block a later accessibility activation without raw touch events', () => {
  const gesture = gestures.createMushafTextGesture();
  gesture.start({ x: 0, y: 0, time: 0, touches: 1 });
  gesture.wordStart(1, 0);
  gesture.end({ x: 0, y: 0, time: 100, touches: 0 });
  assert.equal(gesture.wordTap(1, 100), true);
  assert.equal(gesture.wordTap(2, 1000), true);
});
