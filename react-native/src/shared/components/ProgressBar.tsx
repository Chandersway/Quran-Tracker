import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';

export function ProgressBar({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const p = usePalette();
  const { t } = useI18n();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t(label)}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(Math.min(1, Math.max(0, value)) * 100),
      }}
      style={{
        height: 7,
        borderRadius: 4,
        backgroundColor: p.line,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.min(1, Math.max(0, value)) * 100}%`,
          backgroundColor: color ?? p.primary,
          borderRadius: 4,
        }}
      />
    </View>
  );
}
