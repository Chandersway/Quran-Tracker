import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { getHizbOpening } from '../../../content/hizb';
import {
  availableTranslations,
  getAyahTranslation,
  resolveTranslationLanguage,
} from '../../../content/translations';
import { useI18n } from '../../../i18n';
import { useAppStore } from '../../../state/store';
import { Icon, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

/** The title uses the opening surah, matching the original Kotlin HizbInfo UI. */
export function HizbTitle({ number }: { number: number }) {
  const { format, locale } = useI18n();
  const { chapter } = getHizbOpening(number);
  return (
    <T translate={false} bold size={18}>
      {format('common.hizbNumber', number)} · {locale === 'ar' ? chapter.nameAr : chapter.name}
    </T>
  );
}

/** Independent of row navigation and progress controls; hidden until requested. */
export function HizbOpeningPreview({ number }: { number: number }) {
  const [expanded, setExpanded] = useState(false);
  const { state } = useAppStore();
  const { t, format, locale } = useI18n();
  const p = usePalette();
  const { ayah } = getHizbOpening(number);
  const language = resolveTranslationLanguage(state.preferences.translation, locale);
  const languageLabel = t(availableTranslations.find((item) => item.id === language)!.labelKey);
  const toggleLabel = format(
    expanded ? 'ui.hizb.hideTranslation' : 'ui.hizb.showTranslation',
    languageLabel,
  );
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <T
        arabic
        translate={false}
        accessibilityLanguage="ar"
        size={17}
        style={{ textAlign: 'right', writingDirection: 'rtl' }}
      >
        {ayah.text}
      </T>
      <Pressable
        testID={`hizb_translation_toggle_${number}`}
        accessibilityRole="button"
        accessibilityLabel={`${toggleLabel} · ${format('common.hizbNumber', number)}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => ({
          minHeight: 44,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: p.subtle,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={p.primary} />
        <T translate={false} size={12} bold color={p.primary} style={{ flexShrink: 1 }}>
          {toggleLabel}
        </T>
      </Pressable>
      {expanded && (
        <T
          testID={`hizb_translation_${number}`}
          translate={false}
          accessibilityLanguage={language}
          size={14}
          style={{ textAlign: 'left', writingDirection: 'ltr', marginBottom: 4 }}
        >
          {getAyahTranslation(ayah, language)}
        </T>
      )}
    </View>
  );
}
