import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, useCardPatterns, usePalette } from '../../../shared/theme';

/** Interface labels only: this background never contains decorative Quran verses. */
export function ArabicWatermark({ label, large = false }: { label: string; large?: boolean }) {
  const p = usePalette();
  const enabled = useCardPatterns();
  if (!enabled) return null;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.crop}
    >
      <Text
        accessible={false}
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.lettering, { color: p.primary }, large && styles.largeLettering]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  crop: { position: 'absolute', inset: 0, overflow: 'hidden' },
  lettering: {
    position: 'absolute',
    right: -16,
    top: -54,
    fontFamily: fonts.arabicUiBold,
    fontSize: 96,
    lineHeight: 180,
    opacity: 0.06,
    writingDirection: 'rtl',
    textAlign: 'right',
    width: 900,
  },
  largeLettering: { fontSize: 144, lineHeight: 250, top: -74, right: -24 },
});
