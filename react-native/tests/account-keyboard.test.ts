import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay actual native measurement/focus callbacks.
type Node = { type: string; props: Record<string, any>; children: unknown[] };

function form(platform = 'android') {
  let slot = 0;
  const slots: unknown[] = [];
  const effects: Array<() => void> = [];
  const cleanups: Array<() => void> = [];
  const frames = new Map<number, () => void>();
  const listeners = new Map<string, (event: unknown) => void>();
  let keyboardTop: number | undefined;
  let fieldTop = 1426 / 2.625;
  let focused = true;
  let scrollY = 0;
  const scrolls: number[] = [];
  const input = {
    measureInWindow: (callback: (...bounds: number[]) => void) =>
      callback(40, fieldTop - scrollY, 300, 138 / 2.625),
  };
  const react = {
    createElement(type: string, props: Node['props'], ...children: unknown[]) {
      const node = { type, props: props ?? {}, children };
      if (props?.ref)
        props.ref.current =
          type === 'ScrollView'
            ? {
                measureInWindow: (callback: (...bounds: number[]) => void) =>
                  callback(0, 403 / 2.625, 411, 1153 / 2.625),
                scrollTo: ({ y }: { y: number }) => {
                  scrolls.push(y);
                  scrollY = y;
                },
              }
            : {
                measureInWindow: (callback: (...bounds: number[]) => void) =>
                  callback(0, 403 / 2.625, 411, 1997 / 2.625),
              };
      return node;
    },
    useState(initial: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (next: unknown) => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        },
      ];
    },
    useRef(current: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = { current };
      return slots[index];
    },
    useCallback: (callback: unknown) => callback,
    useEffect(callback: () => (() => void) | void, deps: unknown[]) {
      const index = slot++;
      if (slots[index]) return;
      slots[index] = deps;
      effects.push(() => {
        const cleanup = callback();
        if (cleanup) cleanups.push(cleanup);
      });
    },
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      KeyboardAvoidingView: 'KeyboardAvoidingView',
      View: 'View',
      ScrollView: 'ScrollView',
      Platform: { OS: platform },
      TextInput: { State: { currentlyFocusedInput: () => (focused ? input : undefined) } },
      Keyboard: {
        metrics: () => (keyboardTop === undefined ? undefined : { screenY: keyboardTop }),
        addListener: (name: string, callback: (event: unknown) => void) => {
          listeners.set(name, callback);
          return { remove: () => listeners.delete(name) };
        },
      },
    },
    '@react-navigation/elements': { useHeaderHeight: () => 275 / 2.625 },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../../../shared/components': { Screen: 'Screen', s: { screen: {} } },
    '../../../shared/theme': { usePalette: () => ({}) },
  };
  const output = ts.transpileModule(
    readFileSync(
      new URL('../src/features/account/components/KeyboardFormScreen.tsx', import.meta.url),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
  ).outputText;
  const exports: { KeyboardFormScreen?: (props: unknown) => Node } = {};
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    requestAnimationFrame: (callback: () => void) => {
      const id = frames.size + 1;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  });
  let tree: Node;
  function nodes(value: unknown = tree): Node[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('type' in value)) return [];
    const node = value as Node;
    return [node, ...node.children.flatMap(nodes)];
  }
  return {
    scrolls,
    render: () => {
      slot = 0;
      tree = exports.KeyboardFormScreen!({ children: 'form' });
      effects.splice(0).forEach((effect) => effect());
      return tree;
    },
    node: (type: string) => nodes().find((node) => node.type === type),
    frames: () => {
      for (const [id, callback] of [...frames]) {
        frames.delete(id);
        callback();
      }
    },
    showKeyboard: () => {
      keyboardTop = 1426 / 2.625;
      listeners.get('keyboardDidShow')?.({ endCoordinates: { screenY: keyboardTop } });
    },
    keyboardFrame: (top: number) => {
      listeners.get('keyboardWillChangeFrame')?.({ endCoordinates: { screenY: top } });
    },
    changeField: (top = 1750 / 2.625) => {
      fieldTop = top;
    },
    blur: () => {
      focused = false;
    },
    unmount: () => cleanups.splice(0).forEach((cleanup) => cleanup()),
    listenerCount: () => listeners.size,
  };
}

test('edge-to-edge account viewport uses its measured window origin, including the outer safe area', () => {
  const app = form();
  const root = app.render();
  root.props.onLayout?.({ nativeEvent: { layout: { y: 0 } } });
  app.frames();
  app.render();
  assert.equal(app.node('KeyboardAvoidingView')!.props.keyboardVerticalOffset, 403 / 2.625);
});

test('iOS retains padding avoidance and responds to actual keyboard-frame changes', () => {
  const app = form('ios');
  app.render();
  assert.equal(app.node('KeyboardAvoidingView')!.props.behavior, 'padding');
  app.node('ScrollView')!.props.onFocus();
  app.showKeyboard();
  app.frames();
  assert.ok(app.scrolls[0]! > 64);
  app.keyboardFrame(500);
  app.frames();
  assert.ok(app.scrolls.at(-1)! >= 1564 / 2.625 - 500 + 12 - 0.001);
  app.unmount();
  assert.equal(app.listenerCount(), 0);
});

test('an already visible email and a blurred field do not move the form', () => {
  const app = form();
  app.changeField(1154 / 2.625);
  app.render();
  app.node('ScrollView')!.props.onFocus();
  app.showKeyboard();
  app.frames();
  assert.deepEqual(app.scrolls, []);
  app.changeField();
  app.node('ScrollView')!.props.onFocus();
  app.blur();
  app.frames();
  assert.deepEqual(app.scrolls, [], 'a queued measurement cannot chase a field after blur');
  app.unmount();
});

test('password focused below the physical IME scrolls above it, including switching fields while open', () => {
  const app = form();
  app.render();
  app.node('ScrollView')!.props.onFocus();
  app.showKeyboard();
  app.frames();
  assert.ok(
    app.scrolls[0]! >= (1564 - 1426) / 2.625 + 12 - 0.001,
    'the entire field must clear the physical IME, not only the reported clipped viewport',
  );
  app.changeField();
  app.node('ScrollView')!.props.onFocus();
  app.frames();
  assert.ok(app.scrolls.at(-1)! >= (1888 - 1426) / 2.625 + 12 - 0.001);
  const count = app.scrolls.length;
  app.node('ScrollView')!.props.onFocus();
  app.unmount();
  app.frames();
  assert.equal(app.scrolls.length, count, 'unmount cancels scheduled native measurements');
  assert.equal(app.listenerCount(), 0);
});
