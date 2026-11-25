import { useOptionalAppStore } from '../state/store';
import extracted from './source-catalog.json';
import aliases from './source-aliases.json';
import newUICopy from './new-ui-copy.json';
export { default as screenSourceKeys } from './screen-source-keys.json';

export type Locale = 'en' | 'nl' | 'ar';
export type SourceLocale = Locale | 'fr';
export type SourceCopyEntry = {
  values: Partial<Record<SourceLocale, string>>;
  provenance: Partial<Record<SourceLocale, { path: string; line: number }>>;
  kind: string;
};

// The Kotlin wording is the authority. These are complete source sentences, not
// freshly translated English fragments. Regenerate with extract-kotlin-copy.py.
export const sourceCatalog: Readonly<Record<string, SourceCopyEntry>> = extracted.entries;
const sourceAliases: Readonly<Record<string, string>> = aliases;
const newNavigationCopy: Record<string, Record<Locale, string>> = {
  ...newUICopy.entries,
  // New RN overflow affordance; there was no overflow tab in the Kotlin app.
  'ui.more': { en: 'More', nl: 'Meer', ar: 'المزيد' },
  // New cross-platform restore failure; no Kotlin sentence covers it.
  'ui.focusLoadError': {
    en: 'Your saved focus session could not be opened. Retry to continue it.',
    nl: 'Je opgeslagen focussessie kan niet worden geopend. Probeer opnieuw om verder te gaan.',
    ar: 'تعذّر فتح جلسة التركيز المحفوظة. أعد المحاولة لمتابعتها.',
  },
  'ui.reminderRestoreError': {
    en: 'Your reminders could not be restored. Please try again.',
    nl: 'Je herinneringen kunnen niet worden hersteld. Probeer opnieuw.',
    ar: 'تعذّرت استعادة تذكيراتك. أعد المحاولة.',
  },
  'ui.reminderCleanupError': {
    en: 'An older reminder could not be removed. Retry to prevent duplicate alerts.',
    nl: 'Een oude herinnering kan niet worden verwijderd. Probeer opnieuw om dubbele meldingen te voorkomen.',
    ar: 'تعذّر حذف تذكير سابق. أعد المحاولة لتجنّب تكرار الإشعارات.',
  },
};

const exactSource = new Map<string, string>();
const preferred = Object.entries(sourceCatalog).sort(([a], [b]) => {
  const rank = (key: string) => (key.startsWith('common.') ? 0 : key.startsWith('app.') ? 1 : 2);
  return rank(a) - rank(b);
});
for (const [key, row] of preferred) {
  if (row.values.en && !exactSource.has(row.values.en)) exactSource.set(row.values.en, key);
}

export function resolveLocale(value: unknown): Locale {
  return value === 'nl' || value === 'ar' ? value : 'en';
}

export function sourceKeyFor(value: string): string | undefined {
  return sourceCatalog[value] ? value : (sourceAliases[value] ?? exactSource.get(value));
}

export function hasSourceKey(key: string): boolean {
  return key in sourceCatalog;
}

/** Restore an existing screen's record with curated copy, preserving its shape. */
export function restoreSourceCopy<T extends Record<string, unknown>>(
  locale: SourceLocale,
  current: T,
  english: Record<string, unknown>,
  keys: Partial<Record<keyof T, string>> = {},
): T {
  const restored: Record<string, unknown> = { ...current };
  for (const [field, value] of Object.entries(english)) {
    if (typeof value === 'string') {
      const sourceKey = keys[field as keyof T] ?? sourceKeyFor(value);
      if (sourceKey && (hasSourceKey(sourceKey) || sourceKey in newNavigationCopy))
        restored[field] = sourceText(sourceKey, locale);
    } else if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current[field] &&
      typeof current[field] === 'object'
    ) {
      restored[field] = restoreSourceCopy(
        locale,
        current[field] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    }
  }
  return restored as T;
}

export function sourceText(key: string, locale: SourceLocale): string {
  const newRow = newNavigationCopy[key];
  if (newRow) return newRow[locale === 'fr' ? 'en' : locale];
  const row = sourceCatalog[key];
  return row?.values[locale] ?? row?.values.en ?? key;
}

export function translate(source: string, locale: Locale): string {
  const newRow = newNavigationCopy[source];
  if (newRow) return newRow[locale];
  const key = sourceKeyFor(source);
  // Unknown/user/Quran text is preserved. Missing source translations are
  // visible in the copy audit, never filled with word-for-word machine copy.
  return key ? sourceText(key, locale) : source;
}

/** Java/Kotlin String.format positional placeholders, preserving punctuation. */
export function formatSource(
  key: string,
  locale: SourceLocale,
  args: readonly (string | number)[],
): string {
  let next = 0;
  return sourceText(key, locale).replace(
    /%%|%(?:(\d+)\$)?(?:\.(\d+))?([sdfox])/g,
    (match, position: string | undefined, precision: string | undefined, type: string) => {
      if (match === '%%') return '%';
      const value = args[position ? Number(position) - 1 : next++];
      if (value === undefined) return match;
      return type === 'f' && precision !== undefined
        ? Number(value).toFixed(Number(precision))
        : String(value);
    },
  );
}

/** Kotlin string interpolation is replaced inside the complete curated sentence. */
export function interpolateSource(
  key: string,
  locale: SourceLocale,
  values: Record<string, string | number>,
): string {
  return sourceText(key, locale).replace(
    /\$\{([^}]+)\}|\$([A-Za-z_]\w*)/g,
    (match, expression: string | undefined, identifier: string | undefined) =>
      String(values[expression ?? identifier ?? ''] ?? match),
  );
}

const templateAliases: Record<string, { key: string; args: string[] }> = {
  '{completed} of {target} {unit}': { key: 'common.countOfTotal', args: ['completed', 'target'] },
  'Read {count} time': { key: 'app.timesRead', args: ['count'] },
  'Read {count} times': { key: 'app.timesRead', args: ['count'] },
  'Recall {score}%': { key: 'tracker.hizbScoreValue', args: ['score'] },
  'Page {page} / {total}': { key: 'bookReader.pageLabel', args: ['page', 'total'] },
  '{remaining} {unit} left for today': { key: 'app.remainingToday', args: ['remaining', 'unit'] },
  'Ayah {ayah}': { key: 'app.quranAudioCurrentAyah', args: ['ayah'] },
  'Your journey is ready: {count} reading days.': { key: 'readingJourney.saved', args: [] },
  '{name}, make a little room for Quran.': { key: 'app.home', args: [] },
  'Continue reading {name}': { key: 'checklist.continue', args: [] },
};

export function translateTemplate(
  source: string,
  locale: Locale,
  values: Record<string, string | number>,
): string {
  const alias = templateAliases[source];
  if (alias)
    return formatSource(
      alias.key,
      locale,
      alias.args.map((key) => values[key] ?? `{${key}}`),
    );
  return translate(source, locale).replace(/\{(\w+)\}/g, (_match, key: string) =>
    String(values[key] ?? `{${key}}`),
  );
}

export function useI18n() {
  const store = useOptionalAppStore();
  const locale = resolveLocale(store?.state.preferences.language);
  return {
    locale,
    t: (key: string) => translate(key, locale),
    template: (key: string, values: Record<string, string | number>) =>
      translateTemplate(key, locale, values),
    format: (key: string, ...args: (string | number)[]) => formatSource(key, locale, args),
    interpolate: (key: string, values: Record<string, string | number>) =>
      interpolateSource(key, locale, values),
  };
}

// The catalog also contains untranslated identifiers, names, Arabic Quran
// titles, and Android resources. Semantic UI maps form this locale contract.
export function hasAllLocaleEntries(): boolean {
  return Object.values(sourceCatalog)
    .filter((row) => row.kind === 'semantic-map')
    .every((row) => ['en', 'nl', 'ar'].every((lang) => Boolean(row.values[lang as Locale])));
}
export function hasArabicLocaleEntries(): boolean {
  return Object.values(sourceCatalog)
    .filter((row) => row.kind === 'semantic-map')
    .every((row) => Boolean(row.values.ar));
}
