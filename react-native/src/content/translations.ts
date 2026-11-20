import type { Ayah } from './types';

/** Add a bundled translation here, together with its importer and locale labels. */
export const availableTranslations = [
  { id: 'nl', labelKey: 'ui.reader.languageDutch', read: (ayah: Ayah) => ayah.nl },
  { id: 'en', labelKey: 'ui.reader.languageEnglish', read: (ayah: Ayah) => ayah.en },
] as const;

export type TranslationLanguage = (typeof availableTranslations)[number]['id'];
export type TranslationChoice = TranslationLanguage | 'off';

/** Optional previews can show a translation even when the reader has it off. */
export function resolveTranslationLanguage(
  choice: TranslationChoice,
  locale: string,
): TranslationLanguage {
  if (choice !== 'off') return choice;
  return availableTranslations.find((translation) => translation.id === locale)?.id ?? 'en';
}

export function isTranslationChoice(value: unknown): value is TranslationChoice {
  return value === 'off' || availableTranslations.some((translation) => translation.id === value);
}

/** Text is the original bundled translation; this never translates words at runtime. */
export function getAyahTranslation(ayah: Ayah, choice: TranslationChoice): string {
  if (choice === 'off') return '';
  return availableTranslations.find((translation) => translation.id === choice)?.read(ayah) ?? '';
}
