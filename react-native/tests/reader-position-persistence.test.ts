import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState } from '../src/state/models';
import { decodeState } from '../src/state/persistence/decodeState';
import { restoreSurahPositions } from '../src/state/persistence/readerPositions';

test('per-surah resume restores valid original keys and retains explicit newer positions', () => {
  assert.deepEqual(
    restoreSurahPositions(
      { 2: 40 },
      {
        last_read_ayah_1: 3,
        last_read_ayah_2: 255,
        last_read_ayah_114: 6,
        last_read_ayah_113: 999,
        last_read_ayah_112: 0,
        last_read_ayah_111: 1.5,
      },
      { surah: 3, ayah: 12 },
    ),
    { 1: 3, 2: 40, 3: 12, 114: 6 },
  );
});

test('per-surah saved positions survive hydration while invalid verse numbers never enter the reader', () => {
  const state = decodeState(
    JSON.stringify({ ...initialState, surahPositions: { 1: 7, 2: 255, 114: 20 } }),
  );
  assert.deepEqual(state.surahPositions, { 1: 7, 2: 255 });
  assert.equal(
    decodeState(
      JSON.stringify({ ...state, preferences: { ...state.preferences, hifzColorsEnabled: false } }),
    ).preferences.hifzColorsEnabled,
    false,
  );
});
