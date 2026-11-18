export function hifzSliderValue(x: number, width: number, rtl: boolean): number {
  if (!Number.isFinite(x) || !Number.isFinite(width) || width <= 0) return 0;
  const fraction = Math.max(0, Math.min(1, x / width));
  return Math.round((rtl ? 1 - fraction : fraction) * 100);
}
