import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { layoutDirection } from '../src/domain/layoutDirection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay the actual Screen and native measurement callbacks.
type Node = { type: string; props: Record<string, any>; children: unknown[] };

function mountKeyboardScreen(enabled = true, platform = 'android', includeRegion = true) {
  const density = 2.625;
  let cursor = 0;
  const slots: unknown[] = [];
  const effects: (() => void)[] = [];
  const cleanups: (() => void)[] = [];
  const frames = new Map<number, () => void>();
  const listeners = new Map<string, (event: unknown) => void>();
  let nextFrame = 0;
  let focused = true;
  let inModal = false;
  let deferInput = false;
  const inputCallbacks: (() => void)[] = [];
  let keyboardTop: number | undefined;
  let viewportTop = 403 / density;
  let viewportHeight = 1997 / density;
  let inputTop = 1336 / density;
  let inputHeight = 235 / density;
  let regionTop = 1204 / density;
  let regionHeight = 630 / density;
  let y = 0;
  const moves: number[] = [];
  const viewport = {
    measureInWindow: (done: (...bounds: number[]) => void) =>
      done(0, viewportTop, 1080 / density, viewportHeight),
    scrollTo: ({ y: next }: { y: number }) => {
      y = next;
      moves.push(next);
    },
  };
  const input = {
    measureInWindow: (done: (...bounds: number[]) => void) => {
      const measured = [126 / density, inputTop - y, 828 / density, inputHeight];
      if (deferInput) inputCallbacks.push(() => done(...measured));
      else done(...measured);
    },
  };
  const modalInput = {
    measureInWindow: (done: (...bounds: number[]) => void) =>
      done(126 / density, 1336 / density, 828 / density, 235 / density),
  };
  const regionRef = {
    current: {
      measureInWindow: (done: (...bounds: number[]) => void) =>
        done(63 / density, regionTop - y, 954 / density, regionHeight),
    },
  };
  const react = {
    createElement(type: string, props: Node['props'], ...children: unknown[]) {
      if (type === 'RevealScrollView' && props?.scrollRef) props.scrollRef.current = viewport;
      return { type, props: props ?? {}, children };
    },
    useState(initial: unknown) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[index],
        (next: unknown) => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        },
      ];
    },
    useRef(initial: unknown) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback: (callback: unknown) => callback,
    useEffect(callback: () => (() => void) | void) {
      const index = cursor++;
      if (slots[index]) return;
      slots[index] = true;
      effects.push(() => {
        const cleanup = callback();
        if (cleanup) cleanups.push(cleanup);
      });
    },
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      View: 'View',
      Modal: 'Modal',
      KeyboardAvoidingView: 'KeyboardAvoidingView',
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      useWindowDimensions: () => ({ width: 411, height: 914 }),
      Platform: { OS: platform },
      StyleSheet: {
        absoluteFill: {},
        flatten: (styles: unknown[]) => Object.assign({}, ...styles.filter(Boolean)),
      },
      TextInput: {
        State: {
          currentlyFocusedInput: () => (focused ? (inModal ? modalInput : input) : undefined),
        },
      },
      Keyboard: {
        ...(platform === 'web'
          ? {}
          : {
              metrics: () => (keyboardTop === undefined ? undefined : { screenY: keyboardTop }),
            }),
        addListener: (event: string, handler: (event: unknown) => void) => {
          listeners.set(event, handler);
          return { remove: () => listeners.delete(event) };
        },
      },
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    './RevealBlock': { RevealScrollView: 'RevealScrollView' },
    '../theme': { usePalette: () => ({}) },
    '../../i18n': { useI18n: () => ({ t: (text: string) => text, locale: 'nl' }) },
    '../../domain/layoutDirection': { layoutDirection },
    './AppText': { T: 'T' },
    './IconButton': { IconButton: 'IconButton' },
    './styles': { s: { screen: { padding: 24, paddingBottom: 40 } } },
  };
  function load(path: string) {
    const exports: Record<string, (props: Node['props']) => Node> = {};
    const output = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(output, {
      exports,
      require: (name: string) => {
        assert.ok(name in modules, name);
        return modules[name];
      },
      requestAnimationFrame: (callback: () => void) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      },
      cancelAnimationFrame: (id: number) => frames.delete(id),
    });
    return exports;
  }
  const hook = 'src/shared/forms/useKeyboardScroll.ts';
  if (existsSync(hook)) modules['../forms/useKeyboardScroll'] = load(hook);
  const screen = load('src/shared/components/Screen.tsx');
  let tree: Node;
  function nodes(value: unknown = tree): Node[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('type' in value)) return [];
    const node = value as Node;
    return [node, ...node.children.flatMap(nodes)];
  }
  return {
    moves,
    render() {
      cursor = 0;
      tree = screen.Screen!({
        children: 'group composer',
        avoidKeyboard: enabled,
        keyboardRevealRef: includeRegion ? regionRef : undefined,
      });
      effects.splice(0).forEach((effect) => effect());
      return tree;
    },
    scroll: () => nodes().find((node) => node.type === 'RevealScrollView')!,
    focus: () =>
      nodes()
        .find((node) => node.type === 'RevealScrollView')!
        .props.onFocus?.(),
    show(top = 1517) {
      keyboardTop = top / density;
      listeners.get('keyboardDidShow')?.({ endCoordinates: { screenY: keyboardTop } });
    },
    hide() {
      keyboardTop = undefined;
      listeners.get('keyboardDidHide')?.({});
    },
    frames() {
      for (const [id, callback] of [...frames]) {
        frames.delete(id);
        callback();
      }
    },
    grow(height: number) {
      const difference = height / density - inputHeight;
      inputHeight += difference;
      regionHeight += difference;
      nodes()
        .find((node) => node.type === 'RevealScrollView')!
        .props.onContentSizeChange?.(411, 2400);
    },
    reflow(top: number, height: number, fieldTop: number, fieldHeight: number) {
      viewportTop = top / density;
      viewportHeight = height / density;
      inputTop = fieldTop / density;
      inputHeight = fieldHeight / density;
      regionTop = inputTop - 120 / density;
      regionHeight = inputHeight + 360 / density;
      nodes()
        .find((node) => node.type === 'RevealScrollView')!
        .props.onLayout?.();
    },
    inputBottom: () => (inputTop + inputHeight - y) * density,
    delayInputMeasurement: () => {
      deferInput = true;
    },
    finishInputMeasurement: () => inputCallbacks.splice(0).forEach((callback) => callback()),
    manualScroll: (pixels: number) => {
      y = pixels / density;
      nodes()
        .find((node) => node.type === 'RevealScrollView')!
        .props.onScroll?.({ nativeEvent: { contentOffset: { y } } });
    },
    focusSheet: () => {
      inModal = true;
      const sheet = load('src/shared/components/Sheet.tsx').Sheet!({
        visible: true,
        title: 'Replies',
        onClose: () => {},
      });
      let stopped = false;
      nodes(sheet)
        .find((node) => node.type === 'SafeAreaView')!
        .props.onFocus?.({
          stopPropagation: () => {
            stopped = true;
          },
        });
      if (!stopped)
        nodes()
          .find((node) => node.type === 'RevealScrollView')!
          .props.onFocus?.();
    },
    regionBottom: () => (regionTop + regionHeight - y) * density,
    blur: () => {
      focused = false;
    },
    unmount: () => cleanups.splice(0).forEach((cleanup) => cleanup()),
    listeners: () => listeners.size,
  };
}

test('actual group Screen keeps the measured three-line composer and send action above the physical IME', () => {
  const app = mountKeyboardScreen();
  app.render();
  app.focus();
  app.show();
  app.frames();
  app.render();
  assert.ok(
    app.inputBottom() <= 1517 - 12 * 2.625,
    `typed text is covered: input bottom ${app.inputBottom()} > IME1517`,
  );
  assert.ok(
    app.regionBottom() <= 1517 - 12 * 2.625,
    'the measured composer, including send, fits above IME',
  );
});

test('growing multiline input is remeasured while the keyboard is already visible', () => {
  const app = mountKeyboardScreen();
  app.render();
  app.focus();
  app.show();
  app.frames();
  app.grow(420);
  app.frames();
  assert.ok(app.inputBottom() <= 1517 - 12 * 2.625, 'newly typed lower lines remain visible');
  assert.ok(app.regionBottom() <= 1517 - 12 * 2.625);
});

test('font/viewport re-layout and keyboard close/reopen do not retain stale geometry', () => {
  const app = mountKeyboardScreen();
  app.render();
  app.focus();
  app.show();
  app.frames();
  app.reflow(403, 1997, 1727, 420);
  app.show(1289);
  app.frames();
  assert.ok(app.inputBottom() <= 1289 - 12 * 2.625);
  app.hide();
  app.render();
  const count = app.moves.length;
  app.frames();
  assert.equal(app.moves.length, count, 'hiding the IME must not jump the feed');
  app.show(1517);
  app.frames();
  assert.ok(app.inputBottom() <= 1517 - 12 * 2.625);
});

test('blur and unmount cancel queued native measurements; non-opted-in screens remain unchanged', () => {
  const app = mountKeyboardScreen();
  app.render();
  app.focus();
  app.show();
  app.blur();
  app.frames();
  assert.deepEqual(app.moves, []);
  app.unmount();
  assert.equal(app.listeners(), 0);
  const ordinary = mountKeyboardScreen(false);
  ordinary.render();
  ordinary.focus();
  ordinary.show();
  ordinary.frames();
  assert.deepEqual(ordinary.moves, []);
  assert.equal(ordinary.listeners(), 0);
});

test('web Screen does not require native-only keyboard metrics or install native avoidance', () => {
  const app = mountKeyboardScreen(true, 'web');
  app.render();
  app.focus();
  assert.equal(app.listeners(), 0);
  assert.deepEqual(app.moves, []);
});

test('an input taller than the usable viewport holds its lower edge on repeated layouts, with or without a composer region', () => {
  for (const includeRegion of [true, false]) {
    const app = mountKeyboardScreen(true, 'android', includeRegion);
    app.render();
    app.focus();
    app.reflow(403, 700, 1336, 900);
    app.show(1000);
    app.frames();
    const first = app.moves.at(-1);
    assert.ok(first && first > 0);
    for (let repeat = 0; repeat < 5; repeat++) {
      app.scroll().props.onLayout?.();
      app.frames();
    }
    assert.equal(app.moves.length, 1, 'oversized input must not alternate between top and bottom');
    assert.equal(app.moves.at(-1), first);
    assert.ok(Math.abs(app.inputBottom() - (1000 - 12 * 2.625)) < 0.01);
  }
});

test('manual scroll invalidates an already-started native input measurement', () => {
  const app = mountKeyboardScreen();
  app.render();
  app.focus();
  app.delayInputMeasurement();
  app.show();
  app.frames();
  app.manualScroll(300);
  assert.ok(app.inputBottom() < 1517);
  app.finishInputMeasurement();
  assert.deepEqual(
    app.moves,
    [],
    'a stale rectangle must not be combined with the new scroll offset',
  );
});

test('a real Sheet focus event does not let the background Screen claim the modal input', () => {
  const app = mountKeyboardScreen();
  app.render();
  app.focusSheet();
  app.show();
  app.frames();
  for (let repeat = 0; repeat < 3; repeat++) {
    app.scroll().props.onLayout?.();
    app.frames();
  }
  assert.deepEqual(app.moves, [], 'a modal input must never scroll the background feed');
});
