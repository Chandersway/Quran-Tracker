import type {
  BookPresentation,
  LegacyPreferenceValue,
  MushafBookmark,
  MushafEdition,
} from '../state/models';

/** The printed Medina and selectable QPC layouts have different Hafs page boundaries. */
export function bookmarkPresentation(
  bookmark: Pick<MushafBookmark, 'edition' | 'bookPresentation'>,
): BookPresentation {
  return bookmark.edition === 'hafs' && bookmark.bookPresentation === 'selectable'
    ? 'selectable'
    : 'original';
}

export function matchesMushafBookmarkPage(
  bookmark: MushafBookmark,
  edition: MushafEdition,
  page: number,
  bookPresentation?: BookPresentation,
): boolean {
  return (
    bookmark.edition === edition &&
    bookmark.page === page &&
    bookmarkPresentation(bookmark) === bookmarkPresentation({ edition, bookPresentation })
  );
}

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
