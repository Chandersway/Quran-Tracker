import type { Locale } from '../../i18n';
import type { GroupProgressEntry } from '../../services/groups/groupTypes';
import { groupReadingNumber, groupReadingReference } from '../../services/groups/groupReading';

const copy = {
  utcDays: {
    en: 'A group day starts at midnight UTC (01:00 in the Netherlands, 02:00 in summer).',
    nl: 'Een groepsdag begint om middernacht UTC (in Nederland 01:00, in de zomer 02:00).',
    ar: 'يبدأ يوم المجموعة عند منتصف الليل بالتوقيت العالمي UTC.',
  },
  readings: { en: 'Times read', nl: 'Keer gelezen', ar: 'مرات القراءة' },
  pageEquivalent: { en: 'Pages (estimated)', nl: "Pagina's (geschat)", ar: 'الصفحات (تقديرًا)' },
  pointsExplain: {
    en: '1 point = 1 ayah · 1 page = 10 points · 1 Hizb = 103 points',
    nl: '1 punt = 1 ayah · 1 pagina = 10 punten · 1 hizb = 103 punten',
    ar: 'نقطة واحدة = آية واحدة · صفحة واحدة = 10 نقاط · حزب واحد = 103 نقاط',
  },
  last7: { en: 'Last 7 days', nl: 'Laatste 7 dagen', ar: 'آخر 7 أيام' },
  last30: { en: 'Last 30 days', nl: 'Laatste 30 dagen', ar: 'آخر 30 يومًا' },
  bestLast7: {
    en: 'Best reader, last 7 days',
    nl: 'Beste lezer, laatste 7 dagen',
    ar: 'أفضل قارئ في آخر 7 أيام',
  },
  bestLast30: {
    en: 'Best reader, last 30 days',
    nl: 'Beste lezer, laatste 30 dagen',
    ar: 'أفضل قارئ في آخر 30 يومًا',
  },
  you: { en: 'You', nl: 'Jij', ar: 'أنت' },
  streak: { en: 'streak', nl: 'streak', ar: 'سلسلة' },
  pagesUnit: { en: 'pages', nl: "pagina's", ar: 'صفحة' },
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
