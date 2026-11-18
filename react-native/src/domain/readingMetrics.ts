import { chapters } from '../content/quran';
import type { ReadingEntry } from '../state/models';
import { verseIndex } from './checklist';

// ReadingMetrics.kt deliberately uses integer equivalents. These estimates are
// separate from exact verse ranges and from goal-unit fractions.
export function ayahEquivalent(unit: string, amount: number, referenceId?: number): number {
  const safe = Math.max(0, Math.trunc(amount));
  switch (unit.trim().toLowerCase()) {
    case 'ayah':
    case 'ayahs':
    case 'ayat':
      return safe;
    case 'page':
    case 'pages':
      return safe * 10;
    case 'rub':
      return safe * 25;
    case 'hizb':
      return safe * 103;
    case 'juz':
      return safe * 207;
    case 'surah':
    case 'sura':
    case 'soera':
      return safe === 1 && referenceId !== undefined
        ? (chapters[referenceId - 1]?.verseCount ?? 54)
        : safe * 54;
    default:
      return safe;
  }
}
export function historyAyahEquivalent(entry: ReadingEntry): number {
  if (entry.type === 'minutes') return 0;
  if (entry.ayahRange) {
    try {
      const first = verseIndex(entry.ayahRange.start.surah, entry.ayahRange.start.ayah),
        last = verseIndex(entry.ayahRange.end.surah, entry.ayahRange.end.ayah);
      if (last >= first) return last - first + 1;
    } catch {
      /* Historical rows without trustworthy verse bounds retain source equivalents. */
    }
  }
  return ayahEquivalent(
    entry.type === 'hizb' && entry.surahName.includes('(') ? 'rub' : entry.type,
    entry.amount,
    entry.surahId,
  );
}
export function pageEquivalent(ayahs: number): number {
  return Math.ceil(Math.max(0, ayahs) / 10);
}
