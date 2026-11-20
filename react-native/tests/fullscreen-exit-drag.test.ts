import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('fullscreen control drags on both axes, clamps after rotation, and separates dragging from exit', () => {
  let dimensions = { width: 360, height: 800 };
  let slot = 0;
  let exits = 0;
  const slots: unknown[] = [];
  const values: Array<{ x: number; y: number }> = [];
  const react = {
    createElement: (type: unknown, props: unknown) => ({ type, props }),
    useRef: (value: unknown) => {
      const i = slot++;
      slots[i] ??= { current: value };
      return slots[i];
    },
    useMemo: (factory: () => unknown) => factory(),
    useEffect: (effect: () => void) => effect(),
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      useWindowDimensions: () => dimensions,
      PanResponder: { create: (handlers: unknown) => ({ panHandlers: handlers }) },
      Animated: {
        View: 'AnimatedView',
        ValueXY: class {
          constructor(value: { x: number; y: number }) {
            values.push(value);
          }
          setValue(value: { x: number; y: number }) {
            values[0] = value;
          }
          getTranslateTransform() {
            return [];
          }
        },
      },
    },
    'react-native-safe-area-context': {
      useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
    },
    '../../../shared/components': { Icon: 'Icon' },
    '../../../shared/theme': { usePalette: () => ({ surface: '#FFFFFF' }) },
  };
  type Gesture = { dx: number; dy: number };
  type Handlers = {
    onPanResponderGrant: () => void;
    onPanResponderMove: (event: unknown, gesture: Gesture) => void;
    onPanResponderRelease: (event: unknown, gesture: Gesture) => void;
    onPanResponderTerminate: () => void;
    onAccessibilityTap: () => void;
  };
  const exports: {
    FloatingReaderButton?: (props: { label: string; onPress: () => void }) => { props: Handlers };
  } = {};
  const output = ts.transpileModule(
    readFileSync('src/features/quran/components/FloatingReaderButton.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const render = () => {
    slot = 0;
    return exports.FloatingReaderButton!({ label: 'Exit fullscreen', onPress: () => exits++ })
      .props;
  };
  let button = render();
  button.onPanResponderGrant();
  button.onPanResponderMove(null, { dx: 100, dy: 120 });
  assert.equal(values[0]!.x, 112);
  assert.equal(values[0]!.y, 132);
  button.onPanResponderRelease(null, { dx: 100, dy: 120 });
  assert.equal(exits, 0);
  button.onPanResponderGrant();
  button.onPanResponderMove(null, { dx: 9999, dy: 9999 });
  button.onPanResponderRelease(null, { dx: 9999, dy: 9999 });
  assert.equal(values[0]!.x, 300);
  assert.equal(values[0]!.y, 716);
  dimensions = { width: 720, height: 360 };
  button = render();
  assert.equal(values[0]!.y, 276);
  button.onPanResponderGrant();
  button.onPanResponderMove(null, { dx: -9999, dy: -9999 });
  button.onPanResponderRelease(null, { dx: -9999, dy: -9999 });
  assert.equal(values[0]!.x, 12);
  assert.equal(values[0]!.y, 12);
  button.onPanResponderGrant();
  button.onPanResponderMove(null, { dx: 20, dy: 20 });
  button.onPanResponderMove(null, { dx: 0, dy: 0 });
  button.onPanResponderRelease(null, { dx: 0, dy: 0 });
  assert.equal(exits, 0, 'returning to the start after a drag is not a tap');
  button.onPanResponderGrant();
  button.onPanResponderRelease(null, { dx: 1, dy: 1 });
  assert.equal(exits, 1);
  button.onAccessibilityTap();
  assert.equal(exits, 2);
});
