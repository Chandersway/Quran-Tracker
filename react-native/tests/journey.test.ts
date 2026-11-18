import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, buildJourneyPlans, parseDateKey } from '../src/domain/journey';

test('journeys partition all rub exactly once across calendar and DST boundaries', () => {
  const plans = buildJourneyPlans('2026-03-20', '2026-04-18', 1, 240, 'test', 0);
  assert.equal(plans.length, 30);
  assert.equal(plans[0]!.referenceId, 1);
  assert.equal(plans.at(-1)!.subId, 240);
  assert.equal(plans.at(-1)!.date, '2026-04-18');
  assert.equal(
    plans.reduce((sum, p) => sum + p.amount, 0),
    240,
  );
  for (let i = 1; i < plans.length; i++)
    assert.equal(plans[i]!.referenceId, plans[i - 1]!.subId + 1);
});
test('invalid calendar dates fail instead of rolling into another month', () => {
  assert.throws(() => parseDateKey('2026-02-30'));
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.throws(() => buildJourneyPlans('2026-02-04', '2026-02-03'));
});
