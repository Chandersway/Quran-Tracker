import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { useI18n } from '../../i18n';
import { fonts, usePalette } from '../theme';

export function T({
  children,
  size = 16,
  bold = false,
  muted = false,
  color,
  style,
  arabic = false,
  translate: shouldTranslate = false,
  textDirection,
  ...rest
}: React.PropsWithChildren<{
  size?: number;
  bold?: boolean;
  muted?: boolean;
  color?: string;
  arabic?: boolean;
  translate?: boolean;
  /** Isolate mixed-script values such as email addresses and URLs from the surrounding UI. */
  textDirection?: 'ltr' | 'rtl';
  style?: StyleProp<TextStyle>;
}> &
  Omit<React.ComponentProps<typeof Text>, 'style'>) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const content =
    typeof children === 'string' && !arabic && shouldTranslate ? t(children) : children;
  return (
    <Text
      {...rest}
      style={[
        {
          color: color ?? (muted ? p.muted : p.ink),
          fontFamily: arabic
            ? fonts.arabic
            : locale === 'ar'
              ? bold
                ? fonts.arabicUiBold
                : fonts.arabicUi
              : bold
                ? fonts.bold
                : fonts.regular,
          fontSize: size,
          lineHeight: arabic ? size * 1.9 : locale === 'ar' ? size * 1.8 : size * 1.45,
          writingDirection: textDirection ?? (arabic || locale === 'ar' ? 'rtl' : 'auto'),
          textAlign:
            textDirection === 'ltr' ? 'left' : arabic || locale === 'ar' ? 'right' : 'auto',
        },
        style,
      ]}
    >
      {content}
    </Text>
  );
}

export { T as AppText };
