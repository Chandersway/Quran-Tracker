import assert from 'node:assert/strict';
import test from 'node:test';
import type { GestureResponderEvent } from 'react-native';
import { createBookViewportGesture } from '../src/features/quran/gestures/bookViewportGestures';

const event = (...points: Array<[number, number, number?]>) =>
  ({
    nativeEvent: {
      touches: points.map(([pageX, pageY, identifier], i) => ({
        identifier: identifier ?? i,
        pageX,
        pageY,
      })),
    },
  }) as unknown as GestureResponderEvent;
type Viewport = ReturnType<Parameters<typeof createBookViewportGesture>[0]['state']>;
function harness(overrides: Partial<Viewport> = {}) {
  const state: Viewport = {
    zoom: 2,
    selection: false,
    blocked: false,
    x: 200,
    y: 300,
    maximumX: 600,
    maximumY: 1200,
    ...overrides,
  };
  const scrolls: number[][] = [];
  const zooms: number[] = [];
  let claimed = 0;
  const gesture = createBookViewportGesture({
    state: () => state,
    scroll(x, y) {
      scrolls.push([x, y]);
      state.x = x;
      state.y = y;
    },
    zoom(value) {
      zooms.push(value);
      state.zoom = value;
    },
    claimed() {
      claimed++;
    },
  });
  return { gesture, h: gesture.handlers, state, scrolls, zooms, claimed: () => claimed };
}
function claim(app: ReturnType<typeof harness>) {
  app.h.onTouchStart(event([200, 300]));
  assert.equal(app.h.onMoveShouldSetResponderCapture(event([180, 280])), true);
  app.h.onResponderGrant(event([180, 280]));
}

test('one zoomed touch pans both axes and changes direction without releasing', () => {
  const app = harness();
  claim(app);
  app.h.onResponderMove(event([130, 200]));
  app.h.onResponderMove(event([160, 170]));
  assert.deepEqual(app.scrolls, [
    [220, 320],
    [270, 400],
    [240, 430],
  ]);
  assert.equal(app.claimed(), 1);
});

test('cancelled gestures cannot be restarted by late move or grant events', () => {
  for (const cancel of [
    'cancel',
    'onResponderTerminate',
    'onTouchCancel',
    'onResponderRelease',
  ] as const) {
    const app = harness();
    claim(app);
    if (cancel === 'cancel') app.gesture.cancel();
    else app.h[cancel]();
    const count = app.scrolls.length;
    app.h.onResponderMove(event([100, 150]));
    assert.equal(app.h.onMoveShouldSetResponderCapture(event([80, 140])), false);
    app.h.onResponderGrant(event([80, 140]));
    app.h.onResponderMove(event([60, 100]));
    assert.equal(app.scrolls.length, count);
    assert.equal(app.gesture.active, false);
  }
});

test('plain taps, native selection handles and 1x edge swipes are never captured', () => {
  for (const state of [{ zoom: 1 }, { selection: true }, { blocked: true }]) {
    const app = harness(state);
    app.h.onTouchStart(event([200, 300]));
    assert.equal(app.h.onStartShouldSetResponderCapture(event([200, 300])), false);
    assert.equal(app.h.onMoveShouldSetResponderCapture(event([100, 150])), false);
    app.h.onResponderMove(event([100, 150]));
    assert.equal(app.scrolls.length, 0);
  }
  const app = harness();
  app.h.onTouchStart(event([200, 300]));
  assert.equal(app.h.onMoveShouldSetResponderCapture(event([202, 303])), false);
});

test('opening a modal or entering selection cancels the active viewport immediately', () => {
  for (const state of [{ blocked: true }, { selection: true }]) {
    const app = harness();
    claim(app);
    Object.assign(app.state, state);
    app.h.onResponderMove(event([100, 150]));
    assert.equal(app.gesture.active, false);
    assert.equal(app.scrolls.length, 1);
    Object.assign(app.state, { blocked: false, selection: false });
    app.h.onResponderMove(event([80, 120]));
    assert.equal(app.scrolls.length, 1);
  }
});

test('pinch clamps zoom and a changed pointer set rebases without a pan jump', () => {
  const app = harness();
  app.h.onTouchStart(event([100, 200, 1], [200, 200, 2]));
  assert.equal(app.h.onStartShouldSetResponderCapture(event([100, 200, 1], [200, 200, 2])), true);
  app.h.onResponderGrant(event([100, 200, 1], [200, 200, 2]));
  app.h.onResponderMove(event([0, 200, 1], [300, 200, 2]));
  assert.equal(app.zooms.at(-1), 3);
  app.h.onResponderMove(event([140, 200, 1], [160, 200, 2]));
  assert.equal(app.zooms.at(-1), 1);
  app.h.onResponderMove(event([50, 200, 3], [250, 200, 4]));
  const before = app.scrolls.length;
  app.h.onResponderMove(event([50, 200, 3]));
  assert.equal(app.scrolls.length, before);
});

test('pinch preserves the source point under its centroid after native layout and release', () => {
  const app = harness({
    geometry: { left: 20, top: 50, insetX: 0, insetY: 0, width: 800, height: 1600 },
  });
  const down = event([150, 400, 1], [250, 400, 2]);
  app.h.onTouchStart(down);
  assert.equal(app.h.onStartShouldSetResponderCapture(down), true);
  app.h.onResponderGrant(down);
  app.h.onResponderMove(event([125, 400, 1], [275, 400, 2]));
  assert.equal(app.state.zoom, 3);
  app.h.onResponderRelease();
  Object.assign(app.state, {
    maximumX: 1000,
    maximumY: 2000,
    geometry: { left: 20, top: 50, insetX: 0, insetY: 0, width: 1200, height: 2400 },
  });
  app.gesture.layout();
  assert.deepEqual(app.scrolls.at(-1), [390, 625]);
  app.state.zoom = 2.75;
  const settled = app.scrolls.length;
  app.gesture.layout();
  assert.equal(app.scrolls.length, settled, 'a later +/- zoom owns its own anchor');
  app.gesture.cancel();
  const count = app.scrolls.length;
  app.gesture.layout();
  assert.equal(app.scrolls.length, count, 'a stale layout cannot restore a cancelled page');
});

test('sources that refit selectable text decline pinch while retaining enlarged browse panning', () => {
  const app = harness({ pinchEnabled: false });
  const two = event([100, 200], [200, 200]);
  app.h.onTouchStart(two);
  assert.equal(app.h.onStartShouldSetResponderCapture(two), false);
  assert.equal(app.h.onMoveShouldSetResponderCapture(two), false);
  claim(app);
  assert.equal(app.gesture.active, true);
});
