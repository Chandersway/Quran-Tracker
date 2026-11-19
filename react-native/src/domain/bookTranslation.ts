import { getAyahs } from '../content/quran';
import type { Ayah } from '../content/types';
import type { BookPresentation, MushafEdition } from '../state/models';
import { mushafPageRange } from './mushafReading';

export type BookTranslationVerse = { key: string; surah: number; ayah: Ayah };

/** Complete, original verses touching these verified pages; never infer a PDF's contents. */
export function bookTranslationVerses(
  edition: MushafEdition,
  pages: readonly number[],
  bookPresentation?: BookPresentation,
): BookTranslationVerse[] {
  const verses = new Map<string, BookTranslationVerse>();
  for (const page of [...new Set(pages)].sort((a, b) => a - b)) {
    if (!Number.isSafeInteger(page) || page < 1) continue;
    const range = mushafPageRange(edition, page, bookPresentation);
    if (!range) continue;
    for (let surah = range.start.surah; surah <= range.end.surah; surah++) {
      for (const ayah of getAyahs(surah)) {
        if (surah === range.start.surah && ayah.number < range.start.ayah) continue;
        if (surah === range.end.surah && ayah.number > range.end.ayah) continue;
        const key = `${surah}:${ayah.number}`;
        verses.set(key, { key, surah, ayah });
      }
    }
  }
  return [...verses.values()];
}
