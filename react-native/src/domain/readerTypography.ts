export const MIN_ARABIC_FONT_SIZE = 20;
export const MAX_ARABIC_FONT_SIZE = 54;

/** Clamp explicit adjustments only; loading a saved size must never rewrite the preference. */
export function stepArabicFontSize(size: number, delta: number): number {
  return Math.max(MIN_ARABIC_FONT_SIZE, Math.min(MAX_ARABIC_FONT_SIZE, size + delta));
}
