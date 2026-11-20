import { chapterById, divisionEnd, divisions } from '../../content/quran';
import type { Language } from '../../state/models';
import type { GroupProgressEntry } from './groupTypes';

export type ReadingPoint = { surah: number; ayah: number };
export function groupReadingReference(entry: GroupProgressEntry): number | null {
  if (entry.amount !== 1 || !entry.source.startsWith(`group_manual:${entry.unit}:`)) return null;
  const number = Number(entry.source.split(':').at(-1));
  const maximum =
    entry.unit === 'surah'
      ? 114
      : entry.unit === 'juz'
        ? 30
        : entry.unit === 'hizb'
          ? 60
          : entry.unit === 'rub'
            ? 240
            : 0;
  return Number.isInteger(number) && number >= 1 && number <= maximum ? number : null;
}
export function groupReadingBounds(
  entry: GroupProgressEntry,
): { start: ReadingPoint; end: ReadingPoint } | null {
  const number = groupReadingReference(entry);
  if (number === null) return null;
  if (entry.unit === 'surah')
    return {
      start: { surah: number, ayah: 1 },
      end: { surah: number, ayah: chapterById(number).verseCount },
    };
  const size = entry.unit === 'juz' ? 8 : entry.unit === 'hizb' ? 4 : 1;
  const first = (number - 1) * size + 1;
  const start = divisions[first - 1];
  return start
    ? { start: { surah: start.surah, ayah: start.ayah }, end: divisionEnd(first + size - 1) }
    : null;
}
export function groupReadingNumber(value: number, language: Language): string {
  const text = String(value);
  return language === 'ar'
    ? text.replace(/[0-9]/g, (digit) => String.fromCharCode(0x660 + Number(digit)))
    : text;
}
export function groupReadingPointLabel(point: ReadingPoint, language: Language): string {
  const chapter = chapterById(point.surah);
  return `${language === 'ar' ? chapter.nameAr : chapter.name} (${groupReadingNumber(point.surah, language)}:${groupReadingNumber(point.ayah, language)})`;
}
