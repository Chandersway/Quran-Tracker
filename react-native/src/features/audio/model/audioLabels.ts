import { chapterById } from '../../../content/quran';
import type { AudioSelection } from '../providers/audioContext';

export function audioTime(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export function selectionTitle(
  range: AudioSelection | null,
  format: (key: string, ...args: (string | number)[]) => string,
): string | null {
  if (!range) return null;
  if (range.mode === 'page') return format('repeat.page', range.first);
  if (range.mode === 'pages') return format('repeat.pagesRange', range.first, range.last);
  if (range.mode === 'surah') return chapterById(range.surah).name;
  return 'surah' in range
    ? `${chapterById(range.surah).name} · ${format('repeat.range', range.first, range.last)}`
    : null;
}
