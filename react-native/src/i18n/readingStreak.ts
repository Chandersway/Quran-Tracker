import type { Locale } from './index';

/** Whole pluralized phrases; the original single-template catalog cannot express these forms. */
export function readingStreakText(days: number, locale: Locale): string {
  const count = Math.max(0, Math.floor(days));
  const number = count.toLocaleString(locale);
  if (locale === 'nl') return count === 1 ? '1 dag op rij' : `${number} dagen op rij`;
  if (locale === 'en') return count === 1 ? '1 day in a row' : `${number} days in a row`;
  // Whole-day Arabic forms also work on Hermes builds without Intl.PluralRules.
  if (count === 0) return 'لم تبدأ سلسلة القراءة بعد';
  if (count === 1) return 'يوم واحد من القراءة المتواصلة';
  if (count === 2) return 'يومان من القراءة المتواصلة';
  const remainder = count % 100;
  if (remainder >= 3 && remainder <= 10) return `${number} أيام متتالية من القراءة`;
  if (remainder >= 11 && remainder <= 99) return `${number} يومًا متتاليًا من القراءة`;
  return `${number} يوم من القراءة المتواصلة`;
}
