import type { Chapter } from '../content/types';

export interface AyahReference {
  absolute: number;
  surah: number;
  ayah: number;
}

export function absoluteAyahLocation(
  absolute: number,
  sourceChapters: readonly Chapter[],
): AyahReference | null {
  if (!Number.isInteger(absolute) || absolute < 1) return null;
  let remaining = absolute;
  for (const chapter of sourceChapters) {
    if (remaining <= chapter.verseCount) return { absolute, surah: chapter.id, ayah: remaining };
    remaining -= chapter.verseCount;
  }
  return null;
}

export function absoluteAyahId(
  surah: number,
  ayah: number,
  sourceChapters: readonly Chapter[],
): number | null {
  const chapter = sourceChapters[surah - 1];
  if (
    !Number.isInteger(surah) ||
    !Number.isInteger(ayah) ||
    !chapter ||
    ayah < 1 ||
    ayah > chapter.verseCount
  )
    return null;
  return sourceChapters.slice(0, surah - 1).reduce((sum, item) => sum + item.verseCount, 0) + ayah;
}
