import test from 'node:test';
import assert from 'node:assert/strict';
import { getAyahs } from '../src/content/quran';
import {
  availableTranslations,
  getAyahTranslation,
  isTranslationChoice,
} from '../src/content/translations';
import { initialState } from '../src/state/models';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';

test('Dutch and English translation registry preserves the complete bundled ayah text', () => {
  const verse = getAyahs(2)[254]!;
  assert.deepEqual(
    availableTranslations.map((translation) => translation.id),
    ['nl', 'en'],
  );
  assert.equal(getAyahTranslation(verse, 'nl'), verse.nl);
  assert.equal(getAyahTranslation(verse, 'en'), verse.en);
  assert.ok(verse.nl.length > 100 && verse.en.length > 100);
  assert.equal(getAyahTranslation(verse, 'off'), '');
  assert.ok(isTranslationChoice('nl') && isTranslationChoice('en') && isTranslationChoice('off'));
  assert.equal(isTranslationChoice('unavailable'), false);
});

test('translation choice survives persistence independently of UI language and reading mode', () => {
  let state = appReducer(initialState, {
    type: 'preferences',
    patch: { language: 'nl', translation: 'en', mushaf: 'hafs_ayahinfo_1260' },
  });
  state = appReducer(state, { type: 'preferences', patch: { mushaf: 'text' } });
  const restored = decodeState(JSON.stringify(state));
  assert.equal(restored.preferences.language, 'nl');
  assert.equal(restored.preferences.translation, 'en');
  assert.equal(restored.preferences.mushaf, 'text');
});
