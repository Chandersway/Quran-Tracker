import type { Language } from '../../state/models';
import type { ThemeMode } from '../../domain/themePreferences';

type AppearanceCopy = {
  theme: string;
  themes: Record<ThemeMode, string>;
  hifzColors: string;
  hifzColorsHelp: string;
  replayHelp: string;
  media: string;
  mediaHelp: string;
};

/** Additive copy for restored controls; the curated Kotlin catalog remains unchanged. */
export const appearanceCopy: Record<Language, AppearanceCopy> = {
  en: {
    theme: 'Color theme',
    themes: {
      light: 'Light',
      dark: 'Dark',
      pink: 'Pink',
      mint: 'Mint',
      lavender: 'Lavender',
      ember: 'Ember',
      inferno: 'Inferno',
      ocean: 'Ocean',
      sand: 'Sand',
      matte_forest: 'Matte · Forest',
      matte_charcoal: 'Matte · Charcoal',
      matte_manuscript: 'Matte · Manuscript',
      system: 'System',
    },
    hifzColors: 'Hifz score colors',
    hifzColorsHelp:
      'Color the reading cards by their hifz score. Turning this off keeps your scores.',
    replayHelp:
      'Open the welcome guide now. Its practice examples do not change your saved progress.',
    media: 'Audio settings',
    mediaHelp: 'Find a reciter, filter by riwaya, and choose your playback settings.',
  },
  nl: {
    theme: 'Kleurthema',
    themes: {
      light: 'Licht',
      dark: 'Donker',
      pink: 'Roze',
      mint: 'Mint',
      lavender: 'Lavendel',
      ember: 'Vurig rood',
      inferno: 'Gloeiend vuur',
      ocean: 'Oceaan',
      sand: 'Zand',
      matte_forest: 'Mat · Bosgroen',
      matte_charcoal: 'Mat · Houtskool',
      matte_manuscript: 'Mat · Manuscript',
      system: 'Systeem',
    },
    hifzColors: 'Kleuren voor hifz-scores',
    hifzColorsHelp:
      'Geef de leeskaarten een kleur op basis van hun hifz-score. Uitschakelen bewaart je scores.',
    replayHelp:
      'Open de introductie meteen. De oefenvoorbeelden veranderen je opgeslagen voortgang niet.',
    media: 'Audio-instellingen',
    mediaHelp: 'Zoek een reciteur, filter op riwaya en kies je afspeelinstellingen.',
  },
  ar: {
    theme: 'ألوان المظهر',
    themes: {
      light: 'فاتح',
      dark: 'داكن',
      pink: 'وردي',
      mint: 'نعناعي',
      lavender: 'لافندر',
      ember: 'جمر',
      inferno: 'لهيب',
      ocean: 'محيط',
      sand: 'رملي',
      matte_forest: 'مطفي · أخضر داكن',
      matte_charcoal: 'مطفي · فحمي',
      matte_manuscript: 'مطفي · مخطوط',
      system: 'النظام',
    },
    hifzColors: 'ألوان درجات الحفظ',
    hifzColorsHelp: 'لوّن بطاقات القراءة حسب درجة الحفظ. تبقى درجاتك محفوظة عند إيقاف هذا الخيار.',
    replayHelp: 'افتح دليل الترحيب الآن. لا تغيّر الأمثلة التدريبية تقدّمك المحفوظ.',
    media: 'إعدادات الصوت',
    mediaHelp: 'ابحث عن قارئ وصفِّ حسب الرواية واختر إعدادات التشغيل.',
  },
};
