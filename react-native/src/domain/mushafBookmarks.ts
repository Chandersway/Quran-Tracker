import type { LegacyPreferenceValue, MushafBookmark } from '../state/models';

/** Kotlin's warsh_page_bookmarks keys were used for its Muhammadi page viewer. */
export function legacyWarshBookmarks(
  values: Record<string, LegacyPreferenceValue>,
): MushafBookmark[] {
  return Object.entries(values).flatMap(([key, entries]) => {
    const match = key.match(/^warsh_page_bookmarks_(\d+)$/);
    const surah = Number(match?.[1]);
    if (!match || surah < 1 || surah > 114 || !Array.isArray(entries)) return [];
    return [...new Set(entries.map(Number))]
      .filter((page) => Number.isInteger(page) && page >= 1 && page <= 638)
      .map((page) => ({ edition: 'muhammadi' as const, surah, page }));
  });
}
