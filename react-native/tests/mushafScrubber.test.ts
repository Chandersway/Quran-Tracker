import assert from 'node:assert/strict';
import test from 'node:test';
import {
  pageAtRailPosition,
  railPositionForPage,
  tickForPage,
  tickPageRanges,
} from '../src/features/quran/layout/mushafScrubber';

test('the rail reaches and clamps both ends of each supported book length', () => {
  for (const maximum of [604, 612, 638]) {
    assert.equal(pageAtRailPosition(0, 280, maximum), maximum);
    assert.equal(pageAtRailPosition(280, 280, maximum), 1);
    assert.equal(pageAtRailPosition(-50, 280, maximum), maximum);
    assert.equal(pageAtRailPosition(350, 280, maximum), 1);
    assert.equal(pageAtRailPosition(0, 0, maximum), 1);
  }
});

test('tick ranges cover every page exactly once and match the highlighted tick', () => {
  for (const maximum of [604, 612, 638]) {
    for (const tickCount of [2, 35, 70]) {
      const ranges = tickPageRanges(maximum, tickCount);
      const coverage = new Array<number>(maximum + 1).fill(0);
      for (const [index, range] of ranges.entries()) {
        assert.ok(range.firstPage <= range.lastPage);
        for (let page = range.firstPage; page <= range.lastPage; page++) {
          coverage[page]!++;
          assert.equal(tickForPage(page, maximum, tickCount), index);
        }
      }
      for (let page = 1; page <= maximum; page++) assert.equal(coverage[page], 1);
    }
  }
});

test('each exact page maps back to itself independent of displayed tick count', () => {
  for (const maximum of [604, 612, 638]) {
    for (let page = 1; page <= maximum; page++) {
      assert.equal(
        pageAtRailPosition(railPositionForPage(page, maximum) * 300, 300, maximum),
        page,
      );
    }
  }
});
