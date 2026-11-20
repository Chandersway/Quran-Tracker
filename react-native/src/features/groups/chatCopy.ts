import type { Locale } from '../../i18n';

export const chatCopy = {
  polling: {
    nl: 'Elke 5 seconden controleren op berichten',
    en: 'Checking for messages every 5 seconds',
    ar: 'التحقق من الرسائل كل ٥ ثوانٍ',
  },
  title: { nl: 'Groepschat', en: 'Group chat', ar: 'دردشة المجموعة' },
  open: { nl: 'Open groepschat', en: 'Open group chat', ar: 'فتح دردشة المجموعة' },
  placeholder: { nl: 'Schrijf een bericht…', en: 'Write a message…', ar: 'اكتب رسالة…' },
  send: { nl: 'Verzenden', en: 'Send', ar: 'إرسال' },
  empty: { nl: 'Begin het gesprek', en: 'Start the conversation', ar: 'ابدأ المحادثة' },
  emptyBody: {
    nl: 'Stuur een bericht aan de leden van deze groep.',
    en: 'Send a message to the members of this group.',
    ar: 'أرسل رسالة إلى أعضاء هذه المجموعة.',
  },
  older: { nl: 'Oudere chatberichten', en: 'Older messages', ar: 'الرسائل الأقدم' },
  beginning: {
    nl: 'Begin van het gesprek',
    en: 'Beginning of the conversation',
    ar: 'بداية المحادثة',
  },
  latest: { nl: 'Nieuwe berichten', en: 'New messages', ar: 'رسائل جديدة' },
  you: { nl: 'Jij', en: 'You', ar: 'أنت' },
  edited: { nl: 'bewerkt', en: 'edited', ar: 'معدّلة' },
  discussion: {
    nl: 'Open bericht en reacties',
    en: 'Open message and replies',
    ar: 'فتح الرسالة والردود',
  },
  readOnly: {
    nl: 'Je kunt meelezen. Berichten plaatsen is voor jouw rol uitgeschakeld.',
    en: 'You can read along. Sending messages is disabled for your role.',
    ar: 'يمكنك قراءة المحادثة. إرسال الرسائل غير متاح لدورك.',
  },
  failed: {
    nl: 'Verzending niet bevestigd. Je concept is bewaard. Controleer het gesprek voordat je opnieuw verzendt.',
    en: 'Sending was not confirmed. Your draft is kept. Check the conversation before sending again.',
    ar: 'لم يتم تأكيد الإرسال. تم حفظ مسودتك. تحقق من المحادثة قبل إعادة الإرسال.',
  },
} satisfies Record<string, Record<Locale, string>>;
export const chatText = (key: keyof typeof chatCopy, locale: Locale) => chatCopy[key][locale];
