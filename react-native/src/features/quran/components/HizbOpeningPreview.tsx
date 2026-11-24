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

const openCopy = {
  nl: 'Hizb openen',
  en: 'Open hizb',
  ar: 'فتح الحزب',
} as const;

/**
 * The opening verse of a hizb. With `onOpen` the verse itself and an explicit
 * button open the hizb, so it is clear how to start reading it.
 */
export function HizbOpeningPreview({ number, onOpen }: { number: number; onOpen?: () => void }) {
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
      <Pressable
        disabled={!onOpen}
        accessibilityRole={onOpen ? 'button' : undefined}
        accessibilityLabel={
          onOpen ? `${openCopy[locale]} · ${format('common.hizbNumber', number)}` : undefined
        }
        onPress={onOpen}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <T
          arabic
          translate={false}
          accessibilityLanguage="ar"
          size={17}
          style={{ textAlign: 'right', writingDirection: 'rtl' }}
        >
          {ayah.text}
        </T>
      </Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {onOpen ? (
          <Pressable
            testID={`hizb_open_${number}`}
            accessibilityRole="button"
            accessibilityLabel={`${openCopy[locale]} · ${format('common.hizbNumber', number)}`}
            onPress={onOpen}
            style={({ pressed }) => ({
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: p.primary,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="book-open" size={16} color={p.onPrimary} />
            <T translate={false} size={13} bold color={p.onPrimary}>
              {openCopy[locale]}
            </T>
          </Pressable>
        ) : null}
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
      </View>
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
