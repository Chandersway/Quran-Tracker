import type { Locale } from '../../i18n';

/** New community affordances; existing Kotlin role labels remain the authority below. */
export const communityCopy = {
  tools: { en: 'Group tools', nl: 'Groepstools', ar: 'أدوات المجموعة' },
  participate: { en: 'Participate', nl: 'Meedoen', ar: 'المشاركة' },
  about: { en: 'About this group', nl: 'Over deze groep', ar: 'عن المجموعة' },
  manage: { en: 'Administration', nl: 'Beheer', ar: 'الإدارة' },
  older: { en: 'Load older posts', nl: 'Oudere berichten laden', ar: 'تحميل المنشورات الأقدم' },
  end: {
    en: 'You have reached the beginning of this group’s feed.',
    nl: 'Je bent bij het begin van de groepsfeed.',
    ar: 'وصلت إلى بداية منشورات المجموعة.',
  },
  connecting: {
    en: 'Connecting to live updates…',
    nl: 'Verbinden met live updates…',
    ar: 'جارٍ الاتصال بالتحديثات المباشرة…',
  },
  live: {
    en: 'Live updates connected',
    nl: 'Live updates verbonden',
    ar: 'التحديثات المباشرة متصلة',
  },
  polling: {
    en: 'Checking for updates every 30 seconds',
    nl: 'Elke 30 seconden controleren op updates',
    ar: 'التحقق من التحديثات كل ٣٠ ثانية',
  },
  offline: {
    en: 'Updates unavailable. Your draft stays here; retry when connected.',
    nl: 'Updates niet beschikbaar. Je concept blijft bewaard; probeer opnieuw zodra je verbinding hebt.',
    ar: 'التحديثات غير متاحة. مسودتك محفوظة هنا؛ أعد المحاولة عند الاتصال.',
  },
  sending: { en: 'Sending…', nl: 'Verzenden…', ar: 'جارٍ الإرسال…' },
  failed: {
    en: 'Could not send. Your draft is kept. Tap Retry to send again.',
    nl: 'Verzenden mislukt. Je concept is bewaard. Tik op Opnieuw om het nogmaals te verzenden.',
    ar: 'تعذّر الإرسال. تم الاحتفاظ بمسودتك. اضغط على إعادة المحاولة للإرسال مجددًا.',
  },
  sent: { en: 'Sent to the group', nl: 'Verzonden naar de groep', ar: 'تم الإرسال إلى المجموعة' },
  unknown: { en: 'Unknown status', nl: 'Onbekende status', ar: 'حالة غير معروفة' },
  guest: { en: 'Guest', nl: 'Gast', ar: 'ضيف' },
  active: { en: 'Active', nl: 'Actief', ar: 'نشط' },
  pending: { en: 'Pending', nl: 'In afwachting', ar: 'قيد الانتظار' },
  accepted: { en: 'Accepted', nl: 'Geaccepteerd', ar: 'مقبول' },
  approved: { en: 'Approved', nl: 'Goedgekeurd', ar: 'تمت الموافقة' },
  rejected: { en: 'Rejected', nl: 'Afgewezen', ar: 'مرفوض' },
  revoked: { en: 'Revoked', nl: 'Ingetrokken', ar: 'ملغى' },
  expired: { en: 'Expired', nl: 'Verlopen', ar: 'منتهي الصلاحية' },
  exhausted: { en: 'All uses taken', nl: 'Alle keren gebruikt', ar: 'استُنفدت الاستخدامات' },
  scheduled: { en: 'Scheduled', nl: 'Gepland', ar: 'مجدول' },
  completed: { en: 'Completed', nl: 'Afgerond', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', nl: 'Geannuleerd', ar: 'ملغى' },
  deleted: { en: 'Deleted', nl: 'Verwijderd', ar: 'محذوف' },
} satisfies Record<string, Record<Locale, string>>;
export function communityText(key: keyof typeof communityCopy, locale: Locale) {
  return communityCopy[key][locale];
}
export function groupRoleLabel(role: string, t: (key: string) => string, locale: Locale): string {
  switch (role.trim().toLowerCase()) {
    case 'owner':
      return t('app.groupManagement.ownerBadge');
    case 'admin':
      return t('groups.detail.role.admin');
    case 'moderator':
      return t('groups.detail.role.moderator');
    case 'guest':
      return communityText('guest', locale);
    default:
      return t('groups.member');
  }
}
export function groupStatusLabel(status: string, locale: Locale): string {
  const key = status.trim().toLowerCase();
  return communityText(
    (
      [
        'active',
        'pending',
        'accepted',
        'approved',
        'rejected',
        'revoked',
        'expired',
        'exhausted',
        'scheduled',
        'completed',
        'cancelled',
        'deleted',
      ] as string[]
    ).includes(key)
      ? (key as keyof typeof communityCopy)
      : 'unknown',
    locale,
  );
}
