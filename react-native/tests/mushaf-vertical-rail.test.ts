import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay native responder props without a renderer.
type Node = { type: string; props: Record<string, any>; children: Node[] };

function rail() {
  let slot = 0;
  const states: unknown[] = [];
  const drag = { current: null };
  const scrolls: number[] = [];
  const positionRef: { current?: { update(offset: number): void } } = {};
  const props = {
    offset: 0,
    maximum: 0,
    onScroll: (value: number) => scrolls.push(value),
    positionRef,
  };
  const modules: Record<string, unknown> = {
    react: {
      createElement: (type: string, attributes: Node['props'], ...children: Node[]) => ({
        type,
        props: attributes ?? {},
        children,
      }),
      useRef: () => drag,
      useState(value: unknown) {
        const index = slot++;
        if (!(index in states)) states[index] = value;
        return [
          states[index],
          (next: unknown) => {
            states[index] = next;
          },
        ];
      },
      useEffect() {},
      useImperativeHandle(
        ref: typeof positionRef,
        create: () => NonNullable<typeof positionRef.current>,
      ) {
        ref.current = create();
      },
    },
    'react-native': { View: 'View' },
    '../../../i18n': {
      useI18n: () => ({
        t: (value: string) => value,
        format: (key: string, value: number) => `${key}:${value}`,
      }),
    },
  };
  const source = readFileSync(
    new URL('../src/features/quran/components/MushafVerticalRail.tsx', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: { MushafVerticalRail?: (props: unknown) => Node } = {};
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  return {
    scrolls,
    positionRef,
    render: (next: Partial<typeof props> = {}) => {
      Object.assign(props, next);
      slot = 0;
      return exports.MushafVerticalRail!(props);
    },
    event: (pageY: number, identifier = 7, locationY = pageY - 100) => ({
      nativeEvent: { changedTouches: [{ pageY, locationY, identifier }] },
    }),
  };
}

test('the fit rail stays visible and finite while passing all text touches through', () => {
  const app = rail();
  let view = app.render();
  view.props.onLayout({ nativeEvent: { layout: { height: 400 } } });
  view = app.render();
  assert.equal(view.props.pointerEvents, 'none');
  assert.equal(view.props.accessibilityState.disabled, true);
  assert.equal(view.props.accessibilityValue.text, 'ui.mushaf.scrollFits');
  assert.equal(view.props.accessibilityActions.length, 0);
  assert.equal(view.props.onStartShouldSetResponder(), false);
  assert.equal(view.props.onMoveShouldSetResponder(), false);
  assert.equal(view.children[0]!.props.style.width, 3);
  assert.equal(view.children[0]!.props.style.height, '100%');
  assert.ok(Number.isFinite(view.children[1]!.props.style.top));
  view.props.onResponderGrant(app.event(300));
  view.props.onResponderMove(app.event(400));
  view.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  assert.deepEqual(app.scrolls, []);
});

test('the active 48dp rail follows its finger, clamps actual scroll range, and supports accessible adjustment', () => {
  const app = rail();
  let view = app.render({ maximum: 1000, offset: 500 });
  view.props.onLayout({ nativeEvent: { layout: { height: 400 } } });
  view = app.render();
  assert.equal(view.props.style.width, 48);
  assert.equal(view.props.pointerEvents, 'auto');
  assert.equal(view.props.accessibilityState.disabled, false);
  assert.equal(view.props.accessibilityValue.text, 'ui.mushaf.scrollPercent:50');
  assert.equal(view.children[1]!.props.style.top, 186);
  view.props.onResponderGrant(app.event(300));
  view.props.onResponderMove(app.event(600, 8));
  assert.deepEqual(app.scrolls, [500], 'a second finger cannot move the rail');
  view.props.onResponderMove(app.event(600));
  view.props.onResponderRelease(app.event(50));
  assert.deepEqual(app.scrolls, [500, 1000, 0]);
  view.props.onResponderMove(app.event(350));
  assert.equal(app.scrolls.length, 3, 'release ends the drag');
  view.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  view.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
  assert.deepEqual(app.scrolls.slice(-2), [600, 400]);
  view = app.render({ maximum: 0 });
  view.props.onResponderMove(app.event(350));
  assert.equal(view.props.pointerEvents, 'none');
  assert.equal(view.props.accessibilityValue.text, 'ui.mushaf.scrollFits');
  assert.equal(app.scrolls.length, 5);
});

test('native offset updates move the thumb and accessible adjustment without rerendering the book', () => {
  const app = rail();
  let view = app.render({ maximum: 1000 });
  view.props.onLayout({ nativeEvent: { layout: { height: 400 } } });
  app.positionRef.current!.update(750);
  view = app.render();
  assert.equal(view.props.accessibilityValue.now, 750);
  assert.equal(view.children[1]!.props.style.top, 279);
  view.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
  assert.deepEqual(app.scrolls, [650]);
});
