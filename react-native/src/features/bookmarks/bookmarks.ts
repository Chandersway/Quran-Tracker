import { chapterById } from '../../content/quran';
import { bookmarkPresentation } from '../../domain/mushafBookmarks';
import type { AppState, MushafBookmark, MushafEdition } from '../../state/models';

export type BookmarkSort = 'quran' | 'name' | 'recent';
type Bookmark =
  | ({ kind: 'ayah' } & AppState['bookmarks'][number])
  | ({ kind: 'page' } & AppState['mushafBookmarks'][number]);
export type SavedBookmark = Bookmark & { key: string; index: number };

export function pageBookmarkKey(bookmark: MushafBookmark) {
  const key = `page:${bookmark.edition}:${bookmark.surah}:${bookmark.page}`;
  return bookmarkPresentation(bookmark) === 'selectable' ? `${key}:selectable` : key;
}

/** Reads the live store without rewriting either original bookmark format. */
export function savedBookmarks(
  state: Pick<AppState, 'bookmarks' | 'mushafBookmarks'>,
  sort: BookmarkSort,
): SavedBookmark[] {
  const entries: SavedBookmark[] = [
    ...state.bookmarks.map((bookmark, index) => ({
      ...bookmark,
      key: `ayah:${bookmark.surah}:${bookmark.ayah}`,
      kind: 'ayah' as const,
      index,
    })),
    ...state.mushafBookmarks.map((bookmark, index) => ({
      ...bookmark,
      key: pageBookmarkKey(bookmark),
      kind: 'page' as const,
      index,
    })),
  ];
  return entries.sort((a, b) => {
    if (sort === 'recent') {
      if (a.kind !== b.kind) return a.kind === 'ayah' ? -1 : 1;
      if (a.kind === 'ayah' && b.kind === 'ayah') return b.createdAt - a.createdAt;
      return b.index - a.index;
    }
    const chapter =
      sort === 'name'
        ? chapterById(a.surah).name.localeCompare(chapterById(b.surah).name)
        : a.surah - b.surah;
    if (chapter) return chapter;
    if (a.kind !== b.kind) return a.kind === 'ayah' ? -1 : 1;
    return a.kind === 'ayah' && b.kind === 'ayah'
      ? a.ayah - b.ayah
      : a.kind === 'page' && b.kind === 'page'
        ? a.page - b.page || a.edition.localeCompare(b.edition)
        : 0;
  });
}

export function savedBookmarkTarget(bookmark: Bookmark) {
  return bookmark.kind === 'ayah'
    ? { surah: bookmark.surah, ayah: bookmark.ayah, fullscreen: true as const }
    : {
        surah: bookmark.surah,
        page: bookmark.page,
        edition: bookmark.edition,
        originalEdition: bookmark.edition,
        bookPresentation: bookmarkPresentation(bookmark),
        fullscreen: true as const,
      };
}

const bookmarkEditionNames: Record<MushafEdition, string> = {
  hafs: 'Hafs · Medina',
  hafs_maknoon: 'Hafs · Maknoon',
  warsh_maknoon: 'Warsh · Maknoon',
  muhammadi: 'Warsh · Muhammadi',
  hafs_madina_pdf: 'Hafs · Madinah PDF',
  hafs_indopak_15: 'Hafs · IndoPak 15-line',
};

export function bookmarkEditionName(bookmark: MushafBookmark) {
  return bookmarkPresentation(bookmark) === 'selectable'
    ? 'Hafs · QPC V1'
    : bookmarkEditionNames[bookmark.edition];
}
