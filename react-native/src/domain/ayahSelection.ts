import { chapterById } from '../content/quran';
import type { Ayah } from '../content/types';

export type SelectedVerse = Ayah & { surah: number };

/** Preserve every canonical verse represented by a merged printed ayah, in source order. */
export function selectionVerses(
  first: SelectedVerse,
  related?: readonly SelectedVerse[],
): SelectedVerse[] {
  const seen = new Set<string>();
  return [first, ...(related ?? [])].filter((verse) => {
    const key = `${verse.surah}:${verse.number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function selectionQuote(verses: readonly SelectedVerse[]): string {
  const citations = verses.map(
    (verse) => `${chapterById(verse.surah).nameAr} ${verse.surah}:${verse.number}`,
  );
  return `${verses.map((verse) => verse.text).join('\n')}\n${citations.join(' · ')}`;
}
