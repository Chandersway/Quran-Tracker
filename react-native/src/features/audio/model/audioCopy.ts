import type { Language } from '../../../state/models';

const copy = {
  search: { en: 'Search reciters', nl: 'Zoek reciteurs', ar: 'البحث عن قارئ' },
  saveError: {
    en: 'Your reciter choice could not be saved. Try again.',
    nl: 'Je reciteurkeuze kan niet worden opgeslagen. Probeer opnieuw.',
    ar: 'تعذر حفظ اختيار القارئ. حاول مرة أخرى.',
  },
  more: { en: 'Show more reciters', nl: 'Meer reciteurs tonen', ar: 'عرض المزيد من القراء' },
  saveSelection: {
    en: 'Save selection offline',
    nl: 'Selectie offline opslaan',
    ar: 'حفظ المقطع دون اتصال',
  },
  selectionSaved: {
    en: 'This selection is available offline.',
    nl: 'Deze selectie is offline beschikbaar.',
    ar: 'هذا المقطع متاح دون اتصال.',
  },
  downloading: { en: 'Saving recordings', nl: 'Opnamen opslaan', ar: 'حفظ التسجيلات' },
  riwaya: { en: 'Riwaya', nl: 'Riwaya', ar: 'الرواية' },
  choose: { en: 'Choose', nl: 'Kiezen', ar: 'اختيار' },
  start: { en: 'Start now', nl: 'Nu starten', ar: 'تشغيل الآن' },
  chosen: { en: 'Selected reciter', nl: 'Gekozen reciteur', ar: 'القارئ المختار' },
  chooseHint: {
    en: 'Your choice is saved. When this surah is already open in the player, changing reciter keeps its time and play or pause state.',
    nl: 'Je keuze wordt bewaard. Als deze soera al in de speler staat, blijven bij wisselen de tijd en de speel- of pauzestand behouden.',
    ar: 'يُحفظ اختيارك. عند وجود هذه السورة في المشغل، يحافظ تغيير القارئ على الموضع وحالة التشغيل أو الإيقاف المؤقت.',
  },
  noMatches: {
    en: 'No reciters match these filters.',
    nl: 'Geen reciteurs voor deze filters.',
    ar: 'لا يوجد قارئ يطابق خيارات البحث.',
  },
  saved: { en: 'Available offline', nl: 'Offline beschikbaar', ar: 'متاح دون اتصال' },
  wholeSurah: { en: 'Whole surah', nl: 'Hele soera', ar: 'السورة كاملة' },
  printed: {
    en: 'Use the verse numbers printed in this Warsh mushaf.',
    nl: 'Gebruik de gedrukte versnummers van deze Warsh-mushaf.',
    ar: 'استخدم أرقام الآيات المطبوعة في مصحف ورش.',
  },
  count: {
    en: 'Rounds include the first play.',
    nl: 'Rondes zijn inclusief de eerste keer afspelen.',
    ar: 'عدد الدورات يشمل التشغيل الأول.',
  },
  position: { en: 'Playback position', nl: 'Afspeelpositie', ar: 'موضع التشغيل' },
  progress: { en: 'Clip', nl: 'Fragment', ar: 'المقطع' },
  cancelDownload: {
    en: 'The download did not finish. Try again.',
    nl: 'Het downloaden is niet voltooid. Probeer opnieuw.',
    ar: 'لم يكتمل التنزيل. حاول مرة أخرى.',
  },
} as const;

export function audioCopy(locale: Language, key: keyof typeof copy): string {
  return copy[key][locale];
}
