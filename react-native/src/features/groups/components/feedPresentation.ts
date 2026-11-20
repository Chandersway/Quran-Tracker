import type { FeedLocale } from '../feedCopy';

/** Short display time; callers retain the full timestamp for accessibility. */
export function formatFeedTime(value: string, locale: FeedLocale, now = Date.now()): string {
  const stamp = new Date(value);
  if (!Number.isFinite(stamp.getTime())) return '';
  const minutes = Math.max(0, Math.floor((now - stamp.getTime()) / 60000));
  const number = (value: number) => value.toLocaleString(locale, { useGrouping: false });
  if (minutes < 1) return locale === 'nl' ? 'zojuist' : locale === 'ar' ? 'الآن' : 'just now';
  if (minutes < 60) return `${number(minutes)} ${locale === 'ar' ? 'د' : 'min'}`;
  if (minutes < 1440)
    return `${number(Math.floor(minutes / 60))} ${locale === 'nl' ? 'u' : locale === 'ar' ? 'س' : 'h'}`;
  return stamp.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(stamp.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}),
  });
}
