type Locale = 'en' | 'nl' | 'ar';
export const downloadCopy = {
  en: {
    retry: 'Resume download',
    retryPdf: 'Retry download',
    checkAgain: 'Check downloads again',
    cancelled:
      'Download cancelled. Complete files are kept; incomplete files will be downloaded again.',
    cancelling: 'Cancelling download…',
    waiting: 'Waiting for download progress…',
    estimating: 'Estimating remaining time…',
    seconds: 'About {count} seconds remaining',
    minutes: 'About {count} minutes remaining',
    estimateNote: 'The estimate covers only pages that still need downloading.',
  },
  nl: {
    retry: 'Download hervatten',
    retryPdf: 'Opnieuw downloaden',
    checkAgain: 'Downloads opnieuw controleren',
    cancelled:
      'Download geannuleerd. Volledige bestanden blijven bewaard; onvolledige bestanden worden opnieuw gedownload.',
    cancelling: 'Download annuleren…',
    waiting: 'Wachten op downloadvoortgang…',
    estimating: 'Resterende tijd berekenen…',
    seconds: 'Nog ongeveer {count} seconden',
    minutes: 'Nog ongeveer {count} minuten',
    estimateNote: 'De schatting geldt alleen voor pagina’s die nog gedownload moeten worden.',
  },
  ar: {
    retry: 'استئناف التنزيل',
    retryPdf: 'إعادة محاولة التنزيل',
    checkAgain: 'التحقق من التنزيلات مجددًا',
    cancelled: 'أُلغي التنزيل. تُحفَظ الملفات المكتملة، وتُنزَّل الملفات غير المكتملة من جديد.',
    cancelling: 'جارٍ إلغاء التنزيل…',
    waiting: 'في انتظار تقدم التنزيل…',
    estimating: 'جارٍ تقدير الوقت المتبقي…',
    seconds: 'متبقٍ نحو {count} ثانية',
    minutes: 'متبقٍ نحو {count} دقيقة',
    estimateNote: 'يشمل التقدير الصفحات التي لم تُنزَّل بعد فقط.',
  },
} as const;
export function remainingDownloadTime(locale: Locale, seconds: number | null): string {
  const copy = downloadCopy[locale];
  if (seconds === null || !Number.isFinite(seconds)) return copy.estimating;
  const count = seconds < 60 ? Math.max(1, Math.ceil(seconds)) : Math.ceil(seconds / 60);
  return (seconds < 60 ? copy.seconds : copy.minutes).replace('{count}', String(count));
}
