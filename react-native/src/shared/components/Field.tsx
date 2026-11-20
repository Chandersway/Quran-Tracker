import React from 'react';
import { TextInput, View, TextInputProps } from 'react-native';
import { useI18n } from '../../i18n';
import { isNumericKeyboard, normalizeNumericDigits } from '../forms/inputNormalization';
import { fonts, usePalette } from '../theme';
import { T } from './AppText';
import { s } from './styles';

export function Field({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const translatedLabel = t(label);
  const numeric = isNumericKeyboard(props.keyboardType);
  const ltr =
    numeric ||
    props.keyboardType === 'email-address' ||
    props.keyboardType === 'url' ||
    props.inputMode === 'email' ||
    props.inputMode === 'url';
  const rtl = locale === 'ar' && !ltr;
  const onChangeText =
    numeric && props.onChangeText
      ? (text: string) => props.onChangeText?.(normalizeNumericDigits(text))
      : props.onChangeText;
  return (
    <View style={{ gap: 6, marginBottom: 16 }}>
      <T size={14} bold>
        {translatedLabel}
      </T>
      <TextInput
        {...props}
        onChangeText={onChangeText}
        accessibilityLabel={translatedLabel}
        placeholder={props.placeholder ? t(props.placeholder) : undefined}
        placeholderTextColor={p.muted}
        style={[
          s.input,
          {
            color: p.ink,
            backgroundColor: p.surface,
            borderColor: error ? p.danger : p.line,
            fontFamily: rtl ? fonts.arabicUi : fonts.regular,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
            direction: rtl ? 'rtl' : 'ltr',
          },
          style,
        ]}
      />
      {error && (
        <T color={p.danger} size={13}>
          {t(error)}
        </T>
      )}
    </View>
  );
}
