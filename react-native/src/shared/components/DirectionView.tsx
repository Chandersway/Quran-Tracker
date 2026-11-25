import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useI18n } from '../../i18n';
import { layoutDirection } from '../../domain/layoutDirection';

/** Establish direction at app and native-modal roots. Rows inherit it once through Yoga. */
export function DirectionView({ style, ...props }: ViewProps) {
  const { locale } = useI18n();
  const direction = layoutDirection(locale);
  return <View {...props} style={[{ direction }, style]} />;
}
