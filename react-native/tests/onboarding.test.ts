import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjacentStep,
  DEMO_DURATION,
  freshDemoTimer,
  resolveOnboardingStep,
  sampleDemoTimer,
  toggleDemoTimer,
  validDemoPlan,
} from '../src/domain/onboarding';

test('stable onboarding checkpoints resume by ID and advance in source order', () => {
  assert.equal(resolveOnboardingStep('planning'), 'planning');
  assert.equal(resolveOnboardingStep('obsolete'), 'reading');
  assert.equal(adjacentStep('hifz', 1), 'pomodoro');
  assert.equal(adjacentStep('groups', 1), null);
  assert.equal(adjacentStep('reading', -1), null);
});
test('demo timer pauses without charging time away and restarts after completion', () => {
  const started = toggleDemoTimer(freshDemoTimer(), 1000);
  const paused = toggleDemoTimer(started, 6500);
  assert.equal(paused.remainingMs, DEMO_DURATION - 5500);
  assert.deepEqual(sampleDemoTimer(paused, 100000), paused);
  const resumed = toggleDemoTimer(paused, 100000);
  const done = sampleDemoTimer(resumed, 100000 + DEMO_DURATION);
  assert.equal(done.remainingMs, 0);
  assert.equal(done.startedAt, null);
  assert.equal(toggleDemoTimer(done, 2000000).remainingMs, DEMO_DURATION);
});
test('demo scheduling rejects past dates and elapsed reminders without scheduling anything', () => {
  const now = new Date(2026, 10, 13, 18, 30);
  assert.equal(validDemoPlan('2026-11-12', 1200, false, now), false);
  assert.equal(validDemoPlan('2026-11-13', 1080, true, now), false);
  assert.equal(validDemoPlan('2026-11-13', 1080, false, now), true);
  assert.equal(validDemoPlan('2026-11-14', 1080, true, now), true);
  assert.equal(validDemoPlan('2026-02-30', 1080, true, now), false);
});
