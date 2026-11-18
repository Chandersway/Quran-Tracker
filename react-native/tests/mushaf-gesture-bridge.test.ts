import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as gestures from '../src/features/quran/gestures/mushafTextGestures';

const nativeMotion = (startX = 40, dx = 120, elapsed = 120, movementDelay = elapsed) => ({
  startX,
  pageWidth: 400,
  dx,
  dy: 2,
  elapsed,
  movementDelay,
  maximumX: Math.abs(dx),
  maximumY: 2,
  maximumDistance: Math.hypot(dx, 2),
  horizontalTravel: Math.abs(dx),
  verticalTravel: 2,
});

test('two landscape page bindings isolate native gestures and dispose independently', () => {
  const callbacks = new Set<(event: unknown) => void>();
  const attached: Array<{
    tag: number;
    binding: string;
    pageTag: number;
    intentDistance: number;
    maxMovementDelay: number;
  }> = [];
  const detached: string[] = [];
  const native = {
    Platform: { OS: 'android' },
    NativeModules: {
      MushafTextGestures: {
        protocolVersion: 3,
        attach: (
          tag: number,
          binding: string,
          pageTag: number,
          intentDistance: number,
          maxMovementDelay: number,
        ) => attached.push({ tag, binding, pageTag, intentDistance, maxMovementDelay }),
        detach: (binding: string) => detached.push(binding),
      },
    },
    findNodeHandle: (view: { tag: number }) => view.tag,
    DeviceEventEmitter: {
      addListener: (_name: string, callback: (event: unknown) => void) => {
        callbacks.add(callback);
        return { remove: () => callbacks.delete(callback) };
      },
    },
  };
  const exports: {
    observeMushafText?: (
      view: unknown,
      onSwipe: (direction: number) => void,
      onSelection: (active: boolean) => void,
      pageView: unknown,
    ) => (() => void) | undefined;
  } = {};
  const source = readFileSync(
    new URL('../src/features/quran/gestures/mushafTextGestureBridge.ts', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      if (name === './mushafTextGestures') return gestures;
      assert.equal(name, 'react-native');
      return native;
    },
  });
  const left: unknown[] = [];
  const right: unknown[] = [];
  const disposeLeft = exports.observeMushafText!(
    { tag: 100 },
    (direction) => left.push(direction),
    (active) => left.push(active),
    { tag: 101 },
  )!;
  const disposeRight = exports.observeMushafText!(
    { tag: 200 },
    (direction) => right.push(direction),
    (active) => right.push(active),
    { tag: 201 },
  )!;
  assert.notEqual(attached[0]!.binding, attached[1]!.binding);
  assert.deepEqual(
    attached.map(({ tag, pageTag, intentDistance, maxMovementDelay }) => [
      tag,
      pageTag,
      intentDistance,
      maxMovementDelay,
    ]),
    [
      [100, 101, 12, 180],
      [200, 201, 12, 180],
    ],
  );
  const emit = (event: unknown) => callbacks.forEach((callback) => callback(event));
  emit({ bindingId: attached[0]!.binding, kind: 'selection', active: true });
  emit({ bindingId: attached[0]!.binding, kind: 'motion', motion: nativeMotion() });
  emit({ bindingId: attached[1]!.binding, kind: 'motion', motion: nativeMotion(360, -120) });
  emit({ bindingId: attached[1]!.binding, kind: 'motion', motion: nativeMotion(200, -120, 350) });
  emit({ bindingId: attached[1]!.binding, kind: 'swipe', direction: -1 });
  assert.deepEqual(left, [true, 1]);
  assert.deepEqual(right, [-1]);
  disposeLeft();
  emit({ bindingId: attached[0]!.binding, kind: 'motion', motion: nativeMotion() });
  assert.deepEqual(left, [true, 1]);
  assert.equal(callbacks.size, 1);
  assert.deepEqual(detached, [attached[0]!.binding]);
  disposeRight();
  assert.equal(callbacks.size, 0);
  assert.deepEqual(
    detached,
    attached.map((value) => value.binding),
  );
  native.NativeModules.MushafTextGestures.protocolVersion = 2;
  assert.equal(
    exports.observeMushafText!(
      { tag: 300 },
      () => {},
      () => {},
      { tag: 301 },
    ),
    undefined,
  );
  assert.equal(attached.length, 2, 'old native builds cannot use the new attach signature');
});

test('native snapshot classification and JS touch replay agree on speed, onset and direction', () => {
  for (const [startX, dx, duration, movementDelay, expected] of [
    [40, 120, 350, 100, 1],
    [360, -120, 350, 100, -1],
    [200, 120, 350, 100, null],
    [200, 160, 100, 40, 1],
    [40, 120, 650, 100, 1],
    [40, 120, 550, 450, null],
    [200, 120, 650, 100, null],
  ] as const) {
    const snapshot = nativeMotion(startX, dx, duration, movementDelay);
    const gesture = gestures.createMushafTextGesture();
    // The native bridge reports local DOWN x after converting pixels to dp.
    // JS observes global point coordinates with an offset page measurement.
    gesture.start({ x: 540 + startX, y: 100, time: 1000, touches: 1 }, { left: 540, width: 400 });
    gesture.move({
      x: 540 + startX + Math.sign(dx) * 20,
      y: 101,
      time: 1000 + movementDelay,
      touches: 1,
    });
    const replay = gesture.end({
      x: 540 + startX + dx,
      y: 102,
      time: 1000 + duration,
      touches: 0,
    });
    assert.equal(gestures.mushafSwipeDirection(snapshot), expected);
    assert.equal(replay, expected);
  }
});
