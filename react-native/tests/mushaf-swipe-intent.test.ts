import assert from 'node:assert/strict';
import test from 'node:test';
import { createMushafTextGesture } from '../src/features/quran/gestures/mushafTextGestures';

const page = { left: 40, width: 400 };

function swipe(startX: number, dx: number, duration: number, left = page.left) {
  const gesture = createMushafTextGesture();
  gesture.start({ x: left + startX, y: 100, time: 1000, touches: 1 }, { ...page, left });
  return gesture.end({ x: left + startX + dx, y: 103, time: 1000 + duration, touches: 0 });
}

test('a slow deliberate horizontal swipe must start near its originating page edge', () => {
  assert.equal(swipe(40, 100, 350), 1, 'left edge swiped right advances');
  assert.equal(swipe(360, -100, 350), -1, 'right edge swiped left goes back');
  assert.equal(swipe(200, 100, 350), null, 'slow middle drag must stay on the page');
  assert.equal(swipe(40, -100, 100), null, 'moving outward from the wrong edge is not a turn');
  assert.equal(swipe(360, 100, 100), null, 'rightward turns originate toward the left');
});

test('speed widens the starting edge envelope but never substitutes for meaningful travel', () => {
  assert.equal(swipe(40, 100, 90), 1, 'fast edge swipe');
  assert.equal(swipe(140, 120, 100), 1, 'fast swipe may start farther inward');
  assert.equal(swipe(140, 120, 350), null, 'the same interior drag at low speed is rejected');
  assert.equal(swipe(200, 160, 100), 1, 'deliberate fast middle swipe');
  assert.equal(swipe(200, -160, 100), -1, 'middle is symmetric for a fast opposite swipe');
  assert.equal(swipe(270, 160, 80), null, 'speed never admits the far half of the wrong edge');
  assert.equal(swipe(200, 70, 35), null, 'short interior flick has speed but insufficient intent');
  assert.equal(swipe(40, 8, 2), null, 'a short tap cannot become a turn at any speed');
});

test('the starting page bounds, not the screen edge or release position, determine eligibility', () => {
  for (const left of [0, 80, 540]) {
    assert.equal(swipe(40, 100, 350, left), 1, `left offset ${left}`);
    assert.equal(swipe(200, 160, 100, left), 1, `fast middle at offset ${left}`);
    assert.equal(swipe(200, 100, 350, left), null, `slow middle at offset ${left}`);
  }
  assert.equal(swipe(-10, 200, 100), null, 'touch began outside the page');
  assert.equal(swipe(410, -200, 100), null, 'touch began beyond the other edge');
  const gesture = createMushafTextGesture();
  gesture.start({ x: 40, y: 100, time: 1000, touches: 1 });
  assert.equal(gesture.end({ x: 200, y: 100, time: 1100, touches: 0 }), null);
});

test('diagonal excursions, overshoot and direction reversals do not masquerade as clean swipes', () => {
  for (const moves of [
    [
      { x: 100, y: 170 },
      { x: 200, y: 100 },
    ],
    [
      { x: 240, y: 100 },
      { x: 170, y: 100 },
    ],
    [
      { x: 40, y: 100 },
      { x: 200, y: 100 },
    ],
  ]) {
    const gesture = createMushafTextGesture();
    gesture.start({ x: 80, y: 100, time: 1000, touches: 1 }, page);
    moves.forEach((point, i) => gesture.move({ ...point, time: 1040 + i * 40, touches: 1 }));
    const end = moves.at(-1)!;
    assert.equal(gesture.end({ ...end, time: 1120, touches: 0 }), null);
  }
});

test('selection, long holds, extra pointers and cancellation remain stronger than swipe intent', () => {
  for (const mode of ['selection', 'selection-cleared', 'hold', 'long-press', 'pinch', 'cancel']) {
    const gesture = createMushafTextGesture();
    if (mode.startsWith('selection')) gesture.selection(true);
    gesture.start({ x: 80, y: 100, time: 1000, touches: 1 }, page);
    if (mode === 'selection-cleared') gesture.selection(false);
    if (mode === 'long-press') gesture.longPress();
    if (mode === 'pinch') gesture.move({ x: 160, y: 100, time: 1050, touches: 2 });
    if (mode === 'cancel') gesture.cancel();
    assert.equal(
      gesture.end({ x: 240, y: 100, time: mode === 'hold' ? 1450 : 1100, touches: 0 }),
      null,
      mode,
    );
  }
});

test('vertical turns still require an existing scroll boundary and a clean vertical path', () => {
  for (const [edges, dy, expected] of [
    [{ top: false, bottom: false }, -100, null],
    [{ top: false, bottom: true }, -100, 1],
    [{ top: true, bottom: false }, 100, -1],
    [{ top: false, bottom: true }, 100, null],
  ] as const) {
    const gesture = createMushafTextGesture();
    gesture.start({ x: 240, y: 200, time: 1000, touches: 1 }, page);
    assert.equal(gesture.end({ x: 241, y: 200 + dy, time: 1120, touches: 0 }, edges), expected);
  }
});

test('smooth 650–800 ms edge pans turn, while a stationary hold followed by a flick does not', () => {
  for (const [startX, firstMovement, duration, expected] of [
    [40, 100, 650, 1],
    [40, 100, 800, 1],
    [40, 180, 650, 1],
    [40, 181, 650, null],
    [360, 100, 650, -1],
    [40, 100, 801, null],
    [40, 450, 550, null],
    [200, 100, 650, null],
  ] as const) {
    const gesture = createMushafTextGesture();
    const direction = startX > 300 ? -1 : 1;
    const x = page.left + startX;
    gesture.start({ x, y: 100, time: 1000, touches: 1 }, page);
    gesture.move({ x: x + 20 * direction, y: 101, time: 1000 + firstMovement, touches: 1 });
    assert.equal(
      gesture.end({ x: x + 120 * direction, y: 102, time: 1000 + duration, touches: 0 }),
      expected,
      `origin ${startX}, onset ${firstMovement}, duration ${duration}`,
    );
  }
});

test('a late page measurement cannot revive a finished, cancelled or subsequent gesture', () => {
  const gesture = createMushafTextGesture();
  const start = { x: 80, y: 100, time: 1000, touches: 1 };
  const end = { x: 200, y: 100, time: 1100, touches: 0 };
  const firstBounds = gesture.start(start);
  firstBounds(page);
  assert.equal(gesture.end(end), 1);
  assert.equal(gesture.end(end), null, 'one release produces at most one turn');
  gesture.start(start);
  firstBounds(page);
  assert.equal(gesture.end(end), null, 'old measurement cannot populate a later gesture');
  const cancelledBounds = gesture.start(start);
  gesture.cancel();
  cancelledBounds(page);
  assert.equal(gesture.end(end), null);
});

test('native event timing keeps delayed JS delivery from exaggerating velocity or disguising a hold', () => {
  const gesture = createMushafTextGesture();
  gesture.start({ x: 240, y: 100, time: 1000, timestamp: 500, touches: 1 }, page);
  assert.equal(
    gesture.end({ x: 400, y: 100, time: 1001, timestamp: 850, touches: 0 }),
    null,
    'events delivered together are still a 350 ms middle drag',
  );
  gesture.start({ x: 240, y: 100, time: 1000, timestamp: 500, touches: 1 }, page);
  assert.equal(
    gesture.end({ x: 400, y: 100, time: 2000, timestamp: 600, touches: 0 }),
    1,
    'a quick real flick remains quick after JS was busy',
  );
});
