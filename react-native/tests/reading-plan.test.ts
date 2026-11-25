import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReadingEntry } from '../src/state/models';
import {
  correctReadingPlan,
  decodeReadingPlan,
  defaultReadingPlan,
  normalizePlanNumber,
  readingPlanDone,
  readingPlanLogged,
  readingPlanPace,
  saveReadingPlan,
} from '../src/domain/readingPlan';
import { createReadingPlanRepository } from '../src/services/planning/independentReadingPlan';

const row = (type: string, timestamp: number, amount = 1, action = 'read'): ReadingEntry => ({
  id: `${type}-${timestamp}`,
  type,
  amount,
  action,
  timestamp,
  dateKey: '2026-11-13',
  contentType: type,
  surahId: 1,
  surahName: 'Al-Fatihah',
  sourceKey: null,
  ownerId: '',
});
const closeTo = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('independent plan counts only reading since its start; rereading counts and minutes do not', () => {
  const plan = { ...defaultReadingPlan, started: 100 };
  const history = [
    row('hizb', 99),
    row('hizb', 100),
    row('hizb', 101),
    row('minutes', 102, 30),
    row('hizb', 103, 1, 'review'),
    row('hizb', 104, 1, 'memorized'),
  ];
  closeTo(readingPlanLogged(plan, history), 2);
  closeTo(readingPlanDone(plan, history), 2);
  assert.equal(readingPlanLogged(defaultReadingPlan, history), 0);
});
test('source approximate Quran fractions convert surahs, page quantities and legacy partial Hizb', () => {
  const plan = { ...defaultReadingPlan, unit: 'ayahs' as const, started: 1 };
  closeTo(readingPlanLogged(plan, [row('surah', 2)]), 7);
  closeTo(readingPlanLogged({ ...plan, unit: 'pages' }, [row('pages', 3, 10)]), 10);
  closeTo(
    readingPlanLogged({ ...plan, unit: 'rub' }, [{ ...row('hizb', 4), surahName: 'Hizb 1 (1/4)' }]),
    1,
  );
});
test('manual correction replaces total progress rather than adding the logged amount twice', () => {
  const plan = { ...defaultReadingPlan, started: 1 };
  const history = [row('hizb', 2, 4)];
  const corrected = correctReadingPlan(plan, history, 7);
  closeTo(corrected.adjustment, 3);
  closeTo(readingPlanDone(corrected, history), 7);
  closeTo(readingPlanDone(corrected, [...history, row('hizb', 3)]), 8);
  closeTo(readingPlanDone(correctReadingPlan(plan, history, 0), history), 0);
});
test('saving another unit preserves start and converts the manual adjustment', () => {
  const plan = { ...defaultReadingPlan, started: 100, adjustment: 3 };
  const changed = saveReadingPlan(plan, 100, 'rub', '', 999);
  assert.equal(changed.started, 100);
  closeTo(changed.adjustment, 12);
  assert.equal(saveReadingPlan(defaultReadingPlan, 30, 'hizb', '', 99).started, 99);
  assert.throws(() => saveReadingPlan(plan, 0, 'rub', '', 999));
  assert.throws(() => decodeReadingPlan({ ...plan, adjustment: Infinity }));
});
test('optional finish date calculates inclusive civil-day pace in the selected unit', () => {
  const plan = { ...defaultReadingPlan, started: 1 };
  assert.equal(readingPlanPace(plan, [], 30, 'hizb', '', '2026-11-13'), null);
  closeTo(readingPlanPace(plan, [row('hizb', 2, 10)], 30, 'hizb', '2026-11-22', '2026-11-13')!, 2);
  closeTo(readingPlanPace(plan, [], 4, 'rub', '2026-10-26', '2026-10-24')!, 4 / 3);
  assert.equal(readingPlanPace(plan, [], 30, 'hizb', '2026-11-12', '2026-11-13'), null);
  assert.throws(() => decodeReadingPlan({ ...plan, end: '2026-02-30' }));
});
test('Arabic/Persian digits and decimal punctuation retain source input behavior', () => {
  assert.equal(normalizePlanNumber('١٢٫٥'), '12.5');
  assert.equal(normalizePlanNumber('۱۲,۵'), '12.5');
});
test('reading-plan persistence publishes only after the durable write and imports legacy once', async () => {
  const saved: string[] = [];
  let fail = false;
  const repository = createReadingPlanRepository({
    getItem: async () => null,
    setItem: async (_key, value) => {
      if (fail) throw new Error('full');
      saved.push(value);
    },
  });
  await repository.load({ target: 45, unit: 'hizb', started: 100, adjustment: '2', end: '' });
  assert.equal(repository.snapshot().plan.target, 45);
  assert.equal(saved.length, 1);
  const previous = repository.snapshot();
  fail = true;
  await assert.rejects(repository.save({ ...previous.plan, target: 60 }));
  assert.equal(repository.snapshot(), previous);
  fail = false;
  await repository.save({ ...previous.plan, target: 60 });
  assert.equal(repository.snapshot().plan.target, 60);
});
test('corrupt sidecar remains untouched and cannot be replaced by an uninitialized default', async () => {
  let writes = 0;
  const repository = createReadingPlanRepository({
    getItem: async () => '{broken',
    setItem: async () => {
      writes++;
    },
  });
  await repository.load();
  assert.equal(repository.snapshot().error, true);
  assert.equal(repository.snapshot().ready, false);
  await assert.rejects(repository.save(defaultReadingPlan));
  assert.equal(writes, 0);
});
