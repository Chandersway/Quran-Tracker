export type Word = {
  position: number;
  arabic: string;
  translation: string;
  transliteration: string;
};
export type Ayah = { number: number; text: string; page: number; en: string; nl: string };
export type StudyAyah = { number: number; words: Word[]; irab: string };
export type Chapter = {
  id: number;
  name: string;
  nameAr: string;
  verseCount: number;
  juz: number;
  page: number;
};
export type Division = {
  id: number;
  hizb: number;
  quarter: number;
  surah: number;
  ayah: number;
  page: number;
  appAyahs?: number[];
};
