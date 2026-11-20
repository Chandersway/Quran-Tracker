import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  groupReadingBounds,
  groupReadingPointLabel,
  groupReadingReference,
} from '../src/services/groups/groupReading';
import type { GroupProgressEntry } from '../src/services/groups/groupTypes';
const entry = (unit: string, number: number, amount = 1): GroupProgressEntry => ({
  user_id: 'user',
  unit,
  amount,
  occurred_on: '2026-11-13',
  source: `group_manual:${unit}:${number}`,
});
test('member reading details preserve source partition bounds and never infer ranges from quantities', () => {
  assert.deepEqual(groupReadingBounds(entry('hizb', 1)), {
    start: { surah: 1, ayah: 1 },
    end: { surah: 2, ayah: 74 },
  });
  assert.deepEqual(groupReadingBounds(entry('juz', 1))?.end, { surah: 2, ayah: 141 });
  assert.deepEqual(groupReadingBounds(entry('juz', 30)), {
    start: { surah: 78, ayah: 1 },
    end: { surah: 114, ayah: 6 },
  });
  assert.equal(groupReadingBounds(entry('hizb', 1, 2)), null);
  assert.equal(groupReadingBounds(entry('juz', 31)), null);
  assert.equal(groupReadingBounds({ ...entry('hizb', 30), source: 'manual' }), null);
  assert.equal(groupReadingReference(entry('hizb', 30)), 30);
});
test('Arabic reading references use Arabic chapter names and digits, matching Kotlin acceptance tests', () => {
  const text = groupReadingPointLabel({ surah: 2, ayah: 141 }, 'ar');
  assert.equal(text.includes('(٢:١٤١)'), true);
  assert.equal(/[0-9]/.test(text), false);
  assert.equal(text.includes('البقرة'), true);
});
