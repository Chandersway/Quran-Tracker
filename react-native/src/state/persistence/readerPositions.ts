import { chapters } from '../../content/quran';

/** Restore per-surah positions without altering the original Android import. */
export function restoreSurahPositions(
  saved: Record<string, number> | undefined,
  legacy: Record<string, number> = {},
  cursor?: { surah: number; ayah: number },
): Record<string, number> {
  const positions: Record<string, number> = {};
  for (const chapter of chapters) {
    const ayah = saved?.[chapter.id] ?? legacy[`last_read_ayah_${chapter.id}`];
    if (
      typeof ayah === 'number' &&
      Number.isInteger(ayah) &&
      ayah >= 1 &&
      ayah <= chapter.verseCount
    )
      positions[chapter.id] = ayah;
  }
  if (cursor && (cursor.surah !== 1 || cursor.ayah !== 1)) {
    const chapter = chapters[cursor.surah - 1];
    if (
      chapter &&
      Number.isInteger(cursor.ayah) &&
      cursor.ayah >= 1 &&
      cursor.ayah <= chapter.verseCount
    )
      positions[cursor.surah] = cursor.ayah;
  }
  return positions;
}
