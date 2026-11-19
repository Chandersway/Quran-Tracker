import { restoreSourceCopy, screenSourceKeys, sourceText } from '../../../i18n';
import { availableTranslations } from '../../../content/translations';
import React, { useState } from 'react';
import { Modal, Switch, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { useAppStore } from '../../../state/store';
import { Button, Card, Row, Screen, Section, Segments, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { OnboardingFlow } from '../../onboarding/components/OnboardingFlow';
import { ThemePicker } from '../../../shared/theme/ThemePicker';
import { appearanceCopy } from '../appearanceCopy';
import { bookmarkCopy } from '../../bookmarks/bookmarkCopy';
import { MediaSettingsSheet } from '../../audio/components/MediaSettings';
import {
  MIN_ARABIC_FONT_SIZE,
  MAX_ARABIC_FONT_SIZE,
  stepArabicFontSize,
} from '../../../domain/readerTypography';

const labels = {
  en: {
    title: 'Your reading space',
    subtitle: 'Make the app feel right for your rhythm.',
    appearance: 'Appearance',
    cardPatterns: 'Card patterns',
    cardPatternsHelp: 'Turn this off to show plain cards.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'App language',
    translation: 'Translation',
    english: 'English',
    dutch: 'Nederlands',
    arabic: 'العربية',
    none: 'Off',
    reading: 'Reading',
    fontSize: 'Arabic text size',
    mushaf: 'Mushaf edition',
    text: 'Text',
    warsh: 'Warsh',
    hafs: 'Hafs',
    muhammadi: 'Muhammadi',
    ritual: 'Daily rhythm',
    reminder: 'Reading reminder',
    reminderHelp: 'A quiet reminder on this device. You can turn it off at any time.',
    at: 'Every day at',
    earlier: 'Earlier',
    later: 'Later',
    account: 'Account and community',
    accountHelp: 'Sign in, change account details, or manage your groups.',
    accountButton: 'Open account',
    groupsButton: 'Open groups',
    restart: 'Replay welcome guide',
    restartHelp: 'Open the welcome guide now.',
    permission: 'Allow notifications in system settings to schedule this reminder.',
    scheduled: 'Daily reminder set for this device.',
    failed: 'The reminder could not be updated. Check notification permissions and try again.',
  },
  nl: {
    title: 'Jouw leesruimte',
    subtitle: 'Stel de app af op jouw ritme.',
    appearance: 'Weergave',
    cardPatterns: 'Kaartpatronen',
    cardPatternsHelp: 'Zet dit uit voor effen kaarten.',
    light: 'Licht',
    dark: 'Donker',
    system: 'Systeem',
    language: 'App-taal',
    translation: 'Vertaling',
    english: 'English',
    dutch: 'Nederlands',
    arabic: 'العربية',
    none: 'Uit',
    reading: 'Lezen',
    fontSize: 'Grootte Arabische tekst',
    mushaf: 'Mushaf-editie',
    text: 'Tekst',
    warsh: 'Warsh',
    hafs: 'Hafs',
    muhammadi: 'Muhammadi',
    ritual: 'Dagelijks ritme',
    reminder: 'Leesherinnering',
    reminderHelp: 'Een stille herinnering op dit apparaat. Je kunt deze altijd uitzetten.',
    at: 'Elke dag om',
    earlier: 'Vroeger',
    later: 'Later',
    account: 'Account en gemeenschap',
    accountHelp: 'Log in, wijzig accountgegevens of beheer je groepen.',
    accountButton: 'Account openen',
    groupsButton: 'Groepen openen',
    restart: 'Introductie opnieuw afspelen',
    restartHelp: 'Open de introductie meteen.',
    permission: 'Sta meldingen toe in de systeeminstellingen om deze herinnering in te plannen.',
    scheduled: 'Dagelijkse herinnering ingesteld op dit apparaat.',
    failed:
      'De herinnering kon niet worden bijgewerkt. Controleer de meldingsrechten en probeer opnieuw.',
  },
  ar: {
    title: 'مساحة قراءتك',
    subtitle: 'اضبط التطبيق على إيقاعك.',
    appearance: 'المظهر',
    cardPatterns: 'زخارف البطاقات',
    cardPatternsHelp: 'أوقف هذا الخيار لعرض بطاقات بلا زخارف.',
    light: 'فاتح',
    dark: 'داكن',
    system: 'النظام',
    language: 'لغة التطبيق',
    translation: 'الترجمة',
    english: 'English',
    dutch: 'Nederlands',
    arabic: 'العربية',
    none: 'إيقاف',
    reading: 'القراءة',
    fontSize: 'حجم النص العربي',
    mushaf: 'نسخة المصحف',
    text: 'نص',
    warsh: 'ورش',
    hafs: 'حفص',
    muhammadi: 'المحمدي',
    ritual: 'الإيقاع اليومي',
    reminder: 'تذكير القراءة',
    reminderHelp: 'تذكير هادئ على هذا الجهاز. يمكنك إيقافه في أي وقت.',
    at: 'كل يوم الساعة',
    earlier: 'مبكرًا',
    later: 'لاحقًا',
    account: 'الحساب والمجتمع',
    accountHelp: 'سجّل الدخول أو غيّر بيانات الحساب أو أدر المجموعات.',
    accountButton: 'فتح الحساب',
    groupsButton: 'فتح المجموعات',
    restart: 'إعادة دليل الترحيب',
    restartHelp: 'افتح دليل الترحيب الآن.',
    permission: 'اسمح بالإشعارات من إعدادات النظام لتفعيل هذا التذكير.',
    scheduled: 'تم ضبط التذكير اليومي على هذا الجهاز.',
    failed: 'تعذر تحديث التذكير. تحقق من أذونات الإشعارات ثم حاول مجددًا.',
  },
} as const;

export function SettingsScreen() {
  const [replay, setReplay] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const navigation = useAppNavigation();
  const { state, dispatch } = useAppStore();
  const p = usePalette();
  const t = restoreSourceCopy(
    state.preferences.language,
    labels[state.preferences.language],
    labels.en,
    screenSourceKeys.settings,
  );
  const preferences = state.preferences;
  const appearance = appearanceCopy[preferences.language];

  return (
    <Screen>
      <T size={32} bold style={{ letterSpacing: -0.7 }}>
        {t.title}
      </T>
      <T muted style={{ marginTop: 6, marginBottom: 12 }}>
        {t.subtitle}
      </T>

      <Section title={t.account} />
      <Row
        icon="user"
        title={t.accountButton}
        subtitle={t.accountHelp}
        onPress={() => navigation.navigate('Account')}
      />
      <Row icon="users" title={t.groupsButton} onPress={() => navigation.navigate('Groups')} />
      <Row
        icon="bell"
        title={
          state.preferences.language === 'nl'
            ? 'Meldingen en stille uren'
            : state.preferences.language === 'ar'
              ? 'الإشعارات وساعات الهدوء'
              : 'Notifications and quiet hours'
        }
        onPress={() => navigation.navigate('Notifications')}
      />

      <Section title={t.language} />
      <Segments
        value={preferences.language}
        options={[
          { value: 'en', label: t.english },
          { value: 'nl', label: t.dutch },
          { value: 'ar', label: t.arabic },
        ]}
        onChange={(language) => dispatch({ type: 'preferences', patch: { language } })}
      />
      <View style={{ marginTop: 12 }}>
        <T bold>{t.translation}</T>
        <Segments
          value={preferences.translation}
          options={[
            { value: 'off' as const, label: t.none },
            ...availableTranslations.map((translation) => ({
              value: translation.id,
              label: sourceText(translation.labelKey, preferences.language),
            })),
          ]}
          onChange={(translation) => dispatch({ type: 'preferences', patch: { translation } })}
        />
      </View>

      <Section title={t.reading} />
      <Row
        icon="bookmark"
        title={bookmarkCopy[preferences.language].title}
        subtitle={bookmarkCopy[preferences.language].help}
        translateTitle={false}
        translateSubtitle={false}
        onPress={() => navigation.navigate('Bookmarks')}
      />
      <Row icon="book-open" title={t.mushaf} onPress={() => navigation.navigate('MushafLibrary')} />
      <Card style={{ borderWidth: 1, borderColor: p.line, gap: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <T bold>{t.fontSize}</T>
            <T size={14} muted>
              {preferences.arabicFontSize} pt
            </T>
          </View>
          <Button
            title="−"
            variant="secondary"
            disabled={preferences.arabicFontSize <= MIN_ARABIC_FONT_SIZE}
            onPress={() =>
              dispatch({
                type: 'preferences',
                patch: { arabicFontSize: stepArabicFontSize(preferences.arabicFontSize, -2) },
              })
            }
          />
          <Button
            title="+"
            variant="secondary"
            disabled={preferences.arabicFontSize >= MAX_ARABIC_FONT_SIZE}
            onPress={() =>
              dispatch({
                type: 'preferences',
                patch: { arabicFontSize: stepArabicFontSize(preferences.arabicFontSize, 2) },
              })
            }
          />
        </View>
        <T
          arabic
          size={preferences.arabicFontSize}
          style={{ textAlign: 'center', color: p.primary }}
        >
          وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
        </T>
        <T bold>{t.mushaf}</T>
        <Segments
          value={preferences.mushaf}
          options={[
            { value: 'text', label: t.text },
            { value: 'hafs_ayahinfo_1260', label: t.hafs },
            { value: 'warsh_maknoon', label: t.warsh },
            { value: 'muhammadi', label: t.muhammadi },
          ]}
          onChange={(mushaf) => dispatch({ type: 'preferences', patch: { mushaf } })}
        />
      </Card>

      <Row
        icon="headphones"
        title={appearance.media}
        subtitle={appearance.mediaHelp}
        onPress={() => setMediaOpen(true)}
      />
      <MediaSettingsSheet visible={mediaOpen} onClose={() => setMediaOpen(false)} />

      <View style={{ marginTop: 24, gap: 8 }}>
        <T bold>{t.restart}</T>
        <T size={14} muted>
          {appearance.replayHelp}
        </T>
        <Button
          title={t.restart}
          variant="secondary"
          icon="rotate-ccw"
          onPress={() => setReplay(true)}
        />
        <Modal visible={replay} onRequestClose={() => setReplay(false)} animationType="slide">
          {replay && <OnboardingFlow replay onClose={() => setReplay(false)} />}
        </Modal>
      </View>

      <Section title={t.appearance} />
      <ThemePicker
        value={preferences.theme}
        labels={appearance.themes}
        label={appearance.theme}
        onChange={(theme) =>
          dispatch({
            type: 'preferences',
            patch: {
              theme,
              ...(['matte_night', 'matte_ocean', 'matte_plum'].includes(theme)
                ? { cardPatterns: false }
                : {}),
            },
          })
        }
      />
      <Card style={{ marginTop: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <T bold>{t.cardPatterns}</T>
            <T muted size={14} style={{ marginTop: 4 }}>
              {t.cardPatternsHelp}
            </T>
          </View>
          <Switch
            testID="card-patterns-switch"
            accessibilityLabel={t.cardPatterns}
            accessibilityHint={t.cardPatternsHelp}
            value={preferences.cardPatterns}
            onValueChange={(cardPatterns) =>
              dispatch({ type: 'preferences', patch: { cardPatterns } })
            }
            trackColor={{ false: p.line, true: p.primary }}
            thumbColor={preferences.cardPatterns ? p.onPrimary : p.muted}
            style={{ minHeight: 48 }}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: p.line,
          }}
        >
          <View style={{ flex: 1 }}>
            <T bold>{appearance.hifzColors}</T>
            <T muted size={14} style={{ marginTop: 4 }}>
              {appearance.hifzColorsHelp}
            </T>
          </View>
          <Switch
            testID="hifz-colors-switch"
            accessibilityLabel={appearance.hifzColors}
            accessibilityHint={appearance.hifzColorsHelp}
            value={preferences.hifzColorsEnabled}
            onValueChange={(hifzColorsEnabled) =>
              dispatch({ type: 'preferences', patch: { hifzColorsEnabled } })
            }
            trackColor={{ false: p.line, true: p.primary }}
            thumbColor={preferences.hifzColorsEnabled ? p.onPrimary : p.muted}
            style={{ minHeight: 48 }}
          />
        </View>
      </Card>
    </Screen>
  );
}
