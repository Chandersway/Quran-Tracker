import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checklistRange,
  checklistAnchor,
  checklistChildren,
  clearChecklistCoverage,
  clearChecklistPosition,
  decodeChecklistState,
  toggleCoverage,
  totalVerses,
} from '../src/domain/checklist';
import { isNumericKeyboard, normalizeNumericDigits } from '../src/shared/forms/inputNormalization';

test('restore rejects corrupt coverage and positions rather than silently discarding stored data', () => {
  for (const value of [
    { coverage: [0, totalVerses], position: null },
    { coverage: [1, 1], position: null },
    { coverage: [], position: { scope: 'ayah', number: 1 } },
    { coverage: [], position: { scope: 'juz', number: 31 } },
    { coverage: 'bad', position: null },
  ])
    assert.throws(() => decodeChecklistState(value));
  const valid = { coverage: [0, 1], position: { scope: 'surah' as const, number: 1 } };
  assert.deepEqual(decodeChecklistState(valid), valid);
});
test('checklist and position resets retain their independent state', () => {
  const position = { scope: 'surah' as const, number: 2 };
  const state = { coverage: toggleCoverage([], position, true), position };
  assert.deepEqual(clearChecklistCoverage(state), { coverage: [], position });
  assert.deepEqual(clearChecklistPosition(state), { coverage: state.coverage, position: null });
  assert.equal(checklistRange({ scope: 'surah', number: 114 })[1], totalVerses);
});
test('numeric keyboard normalizes Arabic and Persian digits without touching other text', () => {
  assert.equal(normalizeNumericDigits('١۲٣.۰-abc'), '123.0-abc');
  for (const type of ['number-pad', 'numeric', 'decimal-pad', 'phone-pad'] as const)
    assert.equal(isNumericKeyboard(type), true);
  for (const type of ['default', 'email-address', 'url'] as const)
    assert.equal(isNumericKeyboard(type), false);
});

test('checklist grouping anchors to the last verse of the saved stop, including the final Quran quarter', () => {
  const position = { scope: 'rub' as const, number: 157 };
  assert.equal(checklistAnchor(position, 'rub'), 157);
  assert.equal(checklistAnchor(position, 'hizb'), 40);
  assert.equal(checklistAnchor(position, 'juz'), 20);
  assert.equal(checklistAnchor(position, 'surah'), 28);
  assert.equal(checklistAnchor({ scope: 'surah', number: 114 }, 'rub'), 240);
  assert.equal(checklistAnchor(null, 'hizb'), 1);
});

test('nested checklist quarters exactly cover their parent and share checkbox coverage', () => {
  for (const target of [
    { scope: 'hizb', number: 40 },
    { scope: 'juz', number: 20 },
  ] as const) {
    const children = checklistChildren(target);
    assert.equal(children.length, target.scope === 'juz' ? 8 : 4);
    const coverage = children.reduce(
      (state, child) => toggleCoverage(state, child, true),
      [] as number[],
    );
    assert.deepEqual(coverage, toggleCoverage([], target, true));
    assert.deepEqual(toggleCoverage(coverage, target, false), []);
  }
  assert.deepEqual(checklistChildren({ scope: 'surah', number: 2 }), []);
});
