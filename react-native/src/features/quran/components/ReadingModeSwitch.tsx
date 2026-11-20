import React from 'react';
import { Pressable, View } from 'react-native';
import { Segments, T } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { useAppStore } from '../../../state/store';
import { availableTranslations } from '../../../content/translations';
import { usePalette } from '../../../shared/theme';

export function ReadingModeSwitch({
  mode,
  onBook,
  onText,
  compact = false,
}: {
  mode: 'book' | 'text';
  onBook: () => void;
  onText: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const p = usePalette();
  if (compact)
    return (
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
        {(['book', 'text'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === value }}
            onPress={value === 'book' ? onBook : onText}
            style={({ pressed }) => ({
              minHeight: 48,
              justifyContent: 'center',
              paddingHorizontal: 12,
              borderBottomWidth: 2,
              borderBottomColor: mode === value ? p.primary : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <T bold size={14} color={mode === value ? p.primary : p.muted}>
              {t(value === 'book' ? 'app.mushaf' : 'reader.readText')}
            </T>
          </Pressable>
        ))}
      </View>
    );
  return (
    <Segments
      value={mode}
      onChange={(value) => (value === 'book' ? onBook() : onText())}
      options={[
        { value: 'book', label: t('app.mushaf') },
        { value: 'text', label: t('reader.readText') },
      ]}
    />
  );
}
export function TranslationControl() {
  const { t } = useI18n();
  const { state, dispatch } = useAppStore();
  return (
    <View>
      <T bold size={13}>
        {t('navigation.translation')}
      </T>
      <Segments
        value={state.preferences.translation}
        onChange={(translation) => dispatch({ type: 'preferences', patch: { translation } })}
        options={[
          ...availableTranslations.map((item) => ({ value: item.id, label: t(item.labelKey) })),
          { value: 'off', label: t('ui.reader.arabicOnly') },
        ]}
      />
    </View>
  );
}
