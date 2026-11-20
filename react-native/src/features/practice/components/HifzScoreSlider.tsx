import React, { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { useI18n } from '../../../i18n';
import { T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

import { hifzSliderValue } from '../../../domain/hifzSlider';

export function HifzScoreSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { t, locale } = useI18n();
  const p = usePalette();
  const rtl = locale === 'ar';
  const latest = useRef({ value, onChange, rtl, width: 1, start: 0 });
  Object.assign(latest.current, { value, onChange, rtl });
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const state = latest.current;
          state.start = event.nativeEvent.locationX;
          state.onChange(hifzSliderValue(state.start, state.width, state.rtl));
        },
        onPanResponderMove: (_, gesture) => {
          const state = latest.current;
          state.onChange(hifzSliderValue(state.start + gesture.dx, state.width, state.rtl));
        },
      }),
    [],
  );
  const score = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <View style={{ marginVertical: 12 }}>
      <T translate={false} bold size={24}>
        {score.toLocaleString(locale)} / 100
      </T>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('app.hifzScore')}
        accessibilityValue={{ min: 0, max: 100, now: score }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const delta =
            event.nativeEvent.actionName === 'increment'
              ? 1
              : event.nativeEvent.actionName === 'decrement'
                ? -1
                : 0;
          if (delta) onChange(Math.max(0, Math.min(100, score + delta)));
        }}
        onLayout={(event) => {
          latest.current.width = event.nativeEvent.layout.width;
        }}
        {...responder.panHandlers}
        // Pointer coordinates are physical; the slider already maps them to RTL itself.
        style={{ height: 52, justifyContent: 'center', direction: 'ltr' }}
      >
        <View
          pointerEvents="none"
          style={{ height: 8, borderRadius: 4, backgroundColor: p.line }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: rtl ? undefined : 0,
            right: rtl ? 0 : undefined,
            width: `${score}%`,
            height: 8,
            borderRadius: 4,
            backgroundColor: p.primary,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${rtl ? 100 - score : score}%`,
            marginLeft: -10,
            width: 20,
            height: 32,
            borderRadius: 10,
            backgroundColor: p.primary,
            borderWidth: 2,
            borderColor: p.surface,
          }}
        />
      </View>
    </View>
  );
}
