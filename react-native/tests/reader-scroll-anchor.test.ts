import assert from 'node:assert/strict';
import test from 'node:test';
import { ReaderScrollAnchor } from '../src/features/quran/layout/readerScrollAnchor';

test('a distant aya uses every real prefix height plus the source header', () => {
  const heights = Array.from({ length: 80 }, (_, index) => (index % 4 === 0 ? 570 : 126));
  const anchor = new ReaderScrollAnchor(57, heights.length, 3, 32);
  anchor.measureHeader(144);
  anchor.measureViewport(700);
  anchor.measureContent(60_000);
  heights.slice(0, 58).forEach((height, index) => {
    if (index !== 18) anchor.measureRow(index, height);
  });
  assert.equal(anchor.offset(), null, 'An unmeasured earlier aya cannot be replaced by an average');
  anchor.measureRow(18, heights[18]!);
  const exact = 144 + heights.slice(0, 57).reduce((sum, height) => sum + height, 0);
  assert.equal(anchor.offset(), exact);
  assert.equal(anchor.confirms(exact - 1), true);
  assert.equal(anchor.confirms(57 * 126), false);
});

test('last aya waits for real tail/footer geometry and accepts native bottom clamping', () => {
  const anchor = new ReaderScrollAnchor(3, 4, 1, 32);
  anchor.measureHeader(80);
  anchor.measureViewport(700);
  [400, 120, 300, 100].forEach((height, index) => anchor.measureRow(index, height));
  anchor.measureContent(1132);
  assert.equal(anchor.offset(), null, 'Unknown footer must not produce an invented bottom offset');
  anchor.measureFooter(100);
  assert.equal(anchor.offset(), 432);
  assert.equal(anchor.confirms(432), true);
  assert.equal(anchor.confirms(900), false);
  anchor.measureContent(900);
  assert.equal(
    anchor.offset(),
    null,
    'Wait when native content has not incorporated measured rows',
  );
});

test('new layout generations cannot inherit earlier height estimates', () => {
  const before = new ReaderScrollAnchor(2, 5, 1, 32);
  before.measureHeader(100);
  before.measureViewport(500);
  before.measureContent(4000);
  [200, 300, 400].forEach((height, index) => before.measureRow(index, height));
  assert.equal(before.offset(), 600);
  const after = new ReaderScrollAnchor(2, 5, 2, 80);
  after.measureHeader(180);
  after.measureViewport(300);
  after.measureContent(4000);
  assert.equal(after.offset(), null);
  [110, 150, 220].forEach((height, index) => after.measureRow(index, height));
  assert.equal(after.offset(), 440);
});
