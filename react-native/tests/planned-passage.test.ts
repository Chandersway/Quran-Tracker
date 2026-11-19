import assert from 'node:assert/strict';
import test from 'node:test';
import { rubPassage, rubPassageLabel, plannedPassageTitle } from '../src/domain/plannedPassage';
import { buildJourneyPlans } from '../src/domain/journey';

test('khatma day labels and destinations cover the exact generated verse intervals', () => {
  const plans = buildJourneyPlans('2026-11-19', '2026-12-18', 1, 240, 'journey-test');
  assert.equal(plans.length, 30);
  const first = plans[0]!;
  assert.deepEqual(rubPassage(first.referenceId, first.subId), {
    surah: 1,
    ayah: 1,
    endSurah: 2,
    endAyah: 141,
  });
  assert.equal(plannedPassageTitle(first, 'nl'), 'Al-Fatihah 1:1 – Al-Baqarah 2:141');
  const last = plans.at(-1)!;
  assert.equal(rubPassage(last.referenceId, last.subId)?.endSurah, 114);
  assert.equal(rubPassage(last.referenceId, last.subId)?.endAyah, 6);
  assert.ok(rubPassageLabel(1, 1, 'ar').includes('الفاتحة'));
  assert.equal(rubPassage(0, 8), null);
  assert.equal(rubPassage(9, 8), null);
  assert.equal(rubPassage(1, 241), null);
});
