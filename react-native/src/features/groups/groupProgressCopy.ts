import type { Locale } from '../../i18n';
import type { GroupProgressEntry } from '../../services/groups/groupTypes';
import { groupReadingNumber, groupReadingReference } from '../../services/groups/groupReading';

const copy = {
  utcDays: {
    en: 'Group days and periods follow UTC.',
    nl: 'Groepsdagen en perioden volgen UTC.',
    ar: 'تتبع أيام المجموعة وفتراتها التوقيت العالمي UTC.',
  },
  readings: { en: 'Reading entries', nl: 'Leesregistraties', ar: 'سجلات القراءة' },
  pageEquivalent: { en: 'Page equivalents', nl: 'Pagina-equivalenten', ar: 'ما يعادل الصفحات' },
  readToday: { en: 'Read today', nl: 'Vandaag gelezen', ar: 'قرأ اليوم' },
  noReadingToday: {
    en: 'No reading today',
    nl: 'Vandaag nog niet gelezen',
    ar: 'لم يقرأ اليوم بعد',
  },
  streakDays: {
    en: 'Consecutive reading days',
    nl: 'Opeenvolgende leesdagen',
    ar: 'أيام القراءة المتتالية',
  },
  privateSave: {
    en: 'Save without a feed post',
    nl: 'Opslaan zonder feedbericht',
    ar: 'حفظ دون منشور في الخلاصة',
  },
  sharePreview: { en: 'Message to share', nl: 'Te delen bericht', ar: 'الرسالة التي ستُشارك' },
  shareOptional: {
    en: 'Your message (optional)',
    nl: 'Je bericht (optioneel)',
    ar: 'رسالتك (اختياري)',
  },
  saved: {
    en: 'Progress saved to the group.',
    nl: 'Voortgang opgeslagen in de groep.',
    ar: 'تم حفظ التقدم في المجموعة.',
  },
  languageUnknown: { en: 'Not specified', nl: 'Niet opgegeven', ar: 'غير محدد' },
} as const;

export function groupProgressText(key: keyof typeof copy, locale: Locale): string {
  return copy[key][locale];
}

export function groupReadingLabel(
  entry: GroupProgressEntry,
  locale: Locale,
  t: (key: string) => string,
  format: (key: string, ...values: (string | number)[]) => string,
): string {
  const reference = groupReadingReference(entry);
  if (reference !== null && ['surah', 'hizb', 'juz'].includes(entry.unit))
    return format(`common.${entry.unit}Number`, groupReadingNumber(reference, locale));
  const plurals: Record<string, string> = {
    page: 'pages',
    surah: 'surahs',
    hizb: 'hizbs',
    juz: 'juzs',
    ayah: 'ayahs',
    lesson: 'lessons',
    custom: 'customs',
  };
  return `${groupReadingNumber(entry.amount, locale)} ${t(`app.groupUnitOption.${entry.amount === 1 ? entry.unit : (plurals[entry.unit] ?? entry.unit)}`)}`;
}

export function groupLanguageLabel(code: string, locale: Locale): string {
  const languages: Record<string, Record<Locale, string>> = {
    ar: { en: 'Arabic', nl: 'Arabisch', ar: 'العربية' },
    en: { en: 'English', nl: 'Engels', ar: 'الإنجليزية' },
    nl: { en: 'Dutch', nl: 'Nederlands', ar: 'الهولندية' },
    fr: { en: 'French', nl: 'Frans', ar: 'الفرنسية' },
  };
  return (
    languages[code.toLowerCase()]?.[locale] ??
    (code || groupProgressText('languageUnknown', locale))
  );
}
