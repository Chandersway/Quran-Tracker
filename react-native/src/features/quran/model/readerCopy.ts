import type { Language } from '../../../state/models';

/** New reader controls use complete locale-specific copy, separate from Quran source text. */
const copy = {
  nl: {
    selectOriginalHint:
      'Selecteer een aya op de oorspronkelijke pagina voor tekst, studie en acties.',
    preparingPdf: 'PDF-marges voorbereiden…',
    originalPdf: 'Oorspronkelijke PDF openen',
    originalPdfHint: 'De oorspronkelijke PDF wordt zonder vaste uitsnede weergegeven.',
    cropFailed:
      'De PDF-uitsnede kon niet worden voorbereid. Probeer opnieuw of open het oorspronkelijke bestand.',
    preparePdfCrop: 'Vaste PDF-uitsnede voorbereiden',
    selectHafs: 'Selecteerbare tekst openen · Hafs',
    pdfPositionHint: 'Tekst, selectie en audio gebruiken je laatst bekende Quran-positie.',
    listen: 'Luisteren',
    pause: 'Pauzeren',
    resume: 'Verder luisteren',
    resumeShort: 'Hervatten',
    playing: 'Speelt',
    loadingAudio: 'Audio laden…',
    openingPassage: 'Passage openen…',
    enterImmersive: 'Schermvullend lezen',
    exitImmersive: 'Bediening weergeven',
    verseActions: 'Acties voor aya',
    wordDetails: 'Woordgegevens',
    illustration: 'Oorspronkelijke informatiekaart van soera',
    railHint:
      'Groene streepjes tonen volledig geregistreerde pagina’s. Onbekende uitgaven blijven neutraal.',
    source: 'Deze informatiekaart komt ongewijzigd uit de oorspronkelijke app.',
  },
  en: {
    selectOriginalHint: 'Select an ayah on the original page for text, study and actions.',
    preparingPdf: 'Preparing PDF margins…',
    originalPdf: 'Open original PDF',
    originalPdfHint: 'The original PDF is displayed without fixed cropping.',
    cropFailed: 'The PDF crop could not be prepared. Retry or open the original file.',
    preparePdfCrop: 'Prepare fixed PDF crop',
    selectHafs: 'Open selectable text · Hafs',
    pdfPositionHint: 'Text, selection and audio use your last known Quran position.',
    listen: 'Listen',
    pause: 'Pause',
    resume: 'Resume listening',
    resumeShort: 'Resume',
    playing: 'Playing',
    loadingAudio: 'Loading audio…',
    openingPassage: 'Opening passage…',
    enterImmersive: 'Read full screen',
    exitImmersive: 'Show reading controls',
    verseActions: 'Actions for verse',
    wordDetails: 'Word information',
    illustration: 'Original information card for surah',
    railHint:
      'Green ticks show fully recorded pages. Editions without verified page ranges remain neutral.',
    source: 'This information card is unchanged from the original app.',
  },
  ar: {
    selectOriginalHint: 'حدّد آية على الصفحة الأصلية لعرض النص والدراسة والإجراءات.',
    preparingPdf: 'جارٍ إعداد هوامش PDF…',
    originalPdf: 'افتح ملف PDF الأصلي',
    originalPdfHint: 'يُعرض ملف PDF الأصلي دون قص ثابت للهوامش.',
    cropFailed: 'تعذر إعداد قص هوامش PDF. حاول مرة أخرى أو افتح الملف الأصلي.',
    preparePdfCrop: 'إعداد القص الثابت لهوامش PDF',
    selectHafs: 'افتح النص القابل للتحديد · حفص',
    pdfPositionHint: 'يتبع النص والتحديد والصوت آخر موضع معروف لك في القرآن.',
    listen: 'استماع',
    pause: 'إيقاف مؤقت',
    resume: 'متابعة الاستماع',
    resumeShort: 'متابعة',
    playing: 'قيد التشغيل',
    loadingAudio: 'جارٍ تحميل الصوت…',
    openingPassage: 'جارٍ فتح المقطع…',
    enterImmersive: 'القراءة بملء الشاشة',
    exitImmersive: 'إظهار أدوات القراءة',
    verseActions: 'إجراءات الآية',
    wordDetails: 'تفاصيل الكلمة',
    illustration: 'البطاقة المعلوماتية الأصلية للسورة',
    railHint:
      'تشير العلامات الخضراء إلى الصفحات المسجلة بالكامل. وتبقى الطبعات التي ليس لها نطاق صفحات موثّق بلون محايد.',
    source: 'هذه البطاقة المعلوماتية محفوظة دون تغيير من التطبيق الأصلي.',
  },
} as const;

export function readerCopy(locale: Language) {
  return copy[locale];
}
