export const onboardingSteps = [
  'reading',
  'hifz',
  'pomodoro',
  'planning',
  'statistics',
  'groups',
] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];
export function resolveOnboardingStep(value: unknown): OnboardingStep | 'language' {
  if (value === 'language') return value;
  return onboardingSteps.find((step) => step === value) ?? 'reading';
}
export function adjacentStep(step: OnboardingStep, direction: -1 | 1): OnboardingStep | null {
  return onboardingSteps[onboardingSteps.indexOf(step) + direction] ?? null;
}

export const DEMO_DURATION = 25 * 60 * 1000;
export type DemoTimer = { remainingMs: number; startedAt: number | null; hasStarted: boolean };
export const freshDemoTimer = (): DemoTimer => ({
  remainingMs: DEMO_DURATION,
  startedAt: null,
  hasStarted: false,
});
export function sampleDemoTimer(timer: DemoTimer, now: number): DemoTimer {
  if (timer.startedAt === null) return timer;
  const remainingMs = Math.max(0, timer.remainingMs - Math.max(0, now - timer.startedAt));
  return { ...timer, remainingMs, startedAt: remainingMs === 0 ? null : now };
}
export function toggleDemoTimer(timer: DemoTimer, now: number): DemoTimer {
  if (timer.startedAt !== null) return { ...sampleDemoTimer(timer, now), startedAt: null };
  return { remainingMs: timer.remainingMs || DEMO_DURATION, startedAt: now, hasStarted: true };
}
export function validDemoPlan(date: string, minute: number, reminder: boolean, now: Date): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute >= 1440
  )
    return false;
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const selected = new Date(year, month - 1, day, Math.floor(minute / 60), minute % 60);
  if (
    selected.getFullYear() !== year ||
    selected.getMonth() !== month - 1 ||
    selected.getDate() !== day
  )
    return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(year, month - 1, day);
  return selectedDay >= today && (!reminder || selected > now);
}
