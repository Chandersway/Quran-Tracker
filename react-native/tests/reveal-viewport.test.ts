import assert from 'node:assert/strict';
import test from 'node:test';
import {
  revealIsInteractive,
  revealProgressAt,
  revealScrollRange,
  revealTranslation,
} from '../src/shared/animation/revealViewport.ts';

test('entry staging follows scroll, holds and reverses without a timer', () => {
  const card = { top: 1200, height: 240 };
  const viewport = { offset: 0, height: 700 };
  assert.deepEqual(revealScrollRange(card, 700), [150, 500, 696, 1440]);
  assert.equal(revealProgressAt(card, { ...viewport, offset: 500 }), 0);
  assert.equal(revealProgressAt(card, { ...viewport, offset: 598 }), 0.5);
  assert.equal(revealProgressAt(card, { ...viewport, offset: 598 }), 0.5);
  assert.equal(revealProgressAt(card, { ...viewport, offset: 696 }), 1);
  assert.equal(revealProgressAt(card, { ...viewport, offset: 1500 }), 1);
  assert.deepEqual(
    [500, 598, 696].map((offset) => revealProgressAt(card, { ...viewport, offset })),
    [1, 0.5, 0].reverse(),
  );
});
test('real upcoming edges converge inside the lower viewport band', () => {
  const card = { top: 1200, height: 240 };
  const range = revealScrollRange(card, 700)!;
  const translation = revealTranslation(card, 700)!;
  assert.equal(card.top - range[0] + translation[0], 616);
  assert.equal(card.top - range[1] + translation[1], 588);
  assert.equal(card.top - range[2] + translation[2], 504);
});
test('the last short card is flat and interactive at maximum scroll', () => {
  const card = { top: 1200, height: 90 };
  const viewport = { height: 700, offset: 1200 + 90 + 32 - 700 };
  const range = revealScrollRange(card, viewport.height)!;
  const translations = revealTranslation(card, viewport.height)!;
  assert.ok(viewport.offset >= range[2]);
  assert.equal(revealProgressAt(card, viewport), 1);
  const stagedTop = card.top - range[1] + translations[1];
  const flatTop = card.top - range[2];
  assert.ok(stagedTop >= flatTop && stagedTop < viewport.height);
});
test('invalid geometry falls back and rotation recalculates bounds', () => {
  const card = { top: 1200, height: 200 };
  assert.deepEqual(revealScrollRange(card, 400), [600, 800, 912, 1400]);
  assert.equal(revealScrollRange({ top: NaN, height: 100 }, 700), null);
  assert.equal(revealProgressAt({ top: 100, height: 0 }, { offset: 0, height: 700 }), null);
});

test('visible staged controls are enabled and fully invisible upcoming cards are gated', () => {
  const card = { top: 1200, height: 240 };
  assert.equal(revealIsInteractive(card, { height: 700, offset: 150 }), false);
  assert.equal(revealIsInteractive(card, { height: 700, offset: 220 }), true);
  assert.equal(revealIsInteractive(card, { height: 700, offset: 696 }), true);
});
