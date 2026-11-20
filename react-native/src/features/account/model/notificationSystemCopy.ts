import type { Locale } from '../../../i18n';

const copy = {
  title: {
    en: 'System notification settings',
    nl: 'Systeeminstellingen voor meldingen',
    ar: 'إعدادات إشعارات النظام',
  },
  permission: { en: 'System permission', nl: 'Systeemtoestemming', ar: 'إذن النظام' },
  allowed: { en: 'Allowed', nl: 'Toegestaan', ar: 'مسموح' },
  provisional: {
    en: 'Quiet delivery allowed',
    nl: 'Stille bezorging toegestaan',
    ar: 'التسليم الصامت مسموح',
  },
  blocked: {
    en: 'Blocked in system settings',
    nl: 'Geblokkeerd in systeeminstellingen',
    ar: 'محظور في إعدادات النظام',
  },
  undetermined: { en: 'Not requested yet', nl: 'Nog niet aangevraagd', ar: 'لم يُطلب بعد' },
  unavailable: {
    en: 'Available in the installed app',
    nl: 'Beschikbaar in de geïnstalleerde app',
    ar: 'متاح في التطبيق المثبت',
  },
  enabled: { en: 'Enabled', nl: 'Ingeschakeld', ar: 'مفعّل' },
  notCreated: { en: 'Not set up yet', nl: 'Nog niet ingesteld', ar: 'لم يُعدّ بعد' },
  reminders: {
    en: 'Reading and planning reminders',
    nl: 'Lees- en agendaherinneringen',
    ar: 'تذكيرات القراءة والتخطيط',
  },
  groups: { en: 'Group replies', nl: 'Groepsreacties', ar: 'ردود المجموعة' },
  open: {
    en: 'Open notification settings',
    nl: 'Meldingsinstellingen openen',
    ar: 'فتح إعدادات الإشعارات',
  },
  error: {
    en: 'Could not read system settings. Try again.',
    nl: 'Systeeminstellingen konden niet worden gelezen. Probeer opnieuw.',
    ar: 'تعذرت قراءة إعدادات النظام. حاول مجددًا.',
  },
  openError: {
    en: 'Could not open system settings. Open them from your device settings.',
    nl: 'Systeeminstellingen konden niet worden geopend. Open ze via de instellingen van je apparaat.',
    ar: 'تعذر فتح إعدادات النظام. افتحها من إعدادات جهازك.',
  },
} as const;
export const notificationSystemText = (key: keyof typeof copy, locale: Locale): string =>
  copy[key][locale];
