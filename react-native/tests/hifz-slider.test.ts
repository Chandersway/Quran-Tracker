import test from 'node:test';
import assert from 'node:assert/strict';
import { hifzSliderValue } from '../src/domain/hifzSlider';

test('score drag maps full track in both directions and clamps beyond edges', () => {
  assert.equal(hifzSliderValue(30, 100, false), 30);
  assert.equal(hifzSliderValue(30, 100, true), 70);
  assert.equal(hifzSliderValue(-10, 100, false), 0);
  assert.equal(hifzSliderValue(120, 100, false), 100);
  assert.equal(hifzSliderValue(120, 100, true), 0);
  assert.equal(hifzSliderValue(20, 0, false), 0);
});
