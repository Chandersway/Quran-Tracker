export const playbackSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export function normalizePlaybackSpeed(value: number): number {
  return Number.isFinite(value)
    ? playbackSpeeds.reduce((best, next) =>
        Math.abs(next - value) < Math.abs(best - value) ? next : best,
      )
    : 1;
}
export function normalizeSkipInterval(value: number): 5 | 10 {
  return value === 5 ? 5 : 10;
}
export function clipWindow(
  start = 0,
  end?: number,
  duration = 0,
): { start: number; duration: number } {
  return { start, duration: Math.max(0, (end ?? duration) - start) };
}
export function clipSeekPosition(relative: number, start = 0, end?: number, duration = 0): number {
  return start + Math.max(0, Math.min(relative, Math.max(0, (end ?? duration) - start)));
}
