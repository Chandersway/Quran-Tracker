/** Stable unit codes are stored in data; only the view translates their labels. */
const readingUnitKeys: Readonly<Record<string, string>> = {
  ayah: 'unit.ayah.other',
  ayahs: 'unit.ayah.other',
  page: 'unit.page.short',
  pages: 'unit.page.short',
  surah: 'unit.surah',
  hizb: 'unit.hizb',
  rub: 'unit.rub',
  juz: 'unit.juz',
  minutes: 'focus.minutesShort',
};

export function readingUnitLabelKey(unit: string): string {
  return readingUnitKeys[unit] ?? unit;
}
