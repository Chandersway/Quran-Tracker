import rawChapters from './generated/chapters.json';
import rawDivisions from './generated/rub_starts.json';
import { surahLoaders } from './generated/loaders';
import type { Chapter, Ayah, Division } from './types';

export const chapters: Chapter[] = rawChapters;
export const divisions: Division[] = rawDivisions.editions.hafs;
export function getAyahs(surah: number): Ayah[] {
  const loader = surahLoaders[surah];
  if (!loader) throw new RangeError('Surah must be between 1 and 114');
  return loader();
}
export const chapterById = (id: number): Chapter => chapters[id - 1] ?? chapters[0]!;
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase();
}
export function divisionEnd(id: number): { surah: number; ayah: number } {
  const next = divisions[id];
  if (!next) return { surah: 114, ayah: 6 };
  return next.ayah > 1
    ? { surah: next.surah, ayah: next.ayah - 1 }
    : { surah: next.surah - 1, ayah: chapterById(next.surah - 1).verseCount };
}
