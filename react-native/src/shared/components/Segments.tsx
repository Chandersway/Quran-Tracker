import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { T } from './AppText';
import { s } from './styles';
import { layoutDirection, selectedOptionScrollX } from '../../domain/layoutDirection';

export function Segments<K extends string>({
  value,
  options,
  onChange,
  translateLabels = true,
  layout = 'auto',
}: {
  value: K;
  options: readonly { value: K; label: string }[];
  onChange: (value: K) => void;
  translateLabels?: boolean;
  /** Short sets wrap for large text; long catalogs remain horizontally scrollable. */
  layout?: 'auto' | 'wrap' | 'scroll';
}) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const wraps = layout === 'wrap' || (layout === 'auto' && options.length <= 4);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const choicesRef = useRef<React.ComponentRef<typeof View>>(null);
  const optionRefs = useRef(new Map<string, React.ComponentRef<typeof View>>());
  const geometry = useRef({
    viewport: 0,
    content: 0,
    options: new Map<string, { x: number; width: number }>(),
  });
  const revealSelection = () => {
    const { viewport, content, options: positions } = geometry.current;
    const selected = positions.get(value);
    if (!wraps && selected && viewport > 0 && content > 0) {
      scroll.current?.scrollTo({
        x: selectedOptionScrollX(selected, viewport, content),
        animated: false,
      });
    }
  };
  useEffect(() => {
    // Web's ResizeObserver does not report position-only changes when language flips.
    // Measure after layout so the active chip stays visible without remounting controls.
    const frame = requestAnimationFrame(() => {
      const selected = optionRefs.current.get(value);
      if (selected && choicesRef.current) {
        selected.measureLayout(choicesRef.current, (x, _y, width) => {
          geometry.current.options.set(value, { x, width });
          revealSelection();
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [value, locale, wraps]);
  const choices = (
    <View
      ref={choicesRef}
      accessibilityRole="tablist"
      style={[
        s.row,
        {
          gap: 8,
          flexWrap: wraps ? 'wrap' : 'nowrap',
          flexDirection: 'row',
          direction: layoutDirection(locale),
        },
      ]}
    >
      {options.map((o) => (
        <Pressable
          key={o.value}
          ref={(node) => {
            if (node) optionRefs.current.set(o.value, node);
            else optionRefs.current.delete(o.value);
          }}
          accessibilityRole="tab"
          accessibilityLabel={translateLabels ? t(o.label) : o.label}
          accessibilityState={{ selected: value === o.value }}
          aria-selected={value === o.value}
          onPress={() => onChange(o.value)}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            geometry.current.options.set(o.value, { x, width });
            if (o.value === value) revealSelection();
          }}
          style={[
            s.segment,
            {
              minHeight: 48,
              maxWidth: wraps ? '100%' : undefined,
              backgroundColor: value === o.value ? p.primary : p.subtle,
            },
          ]}
        >
          <T translate={false} bold size={14} color={value === o.value ? p.onPrimary : p.muted}>
            {translateLabels ? t(o.label) : o.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
  return wraps ? (
    <View style={{ paddingVertical: 8 }}>{choices}</View>
  ) : (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={{ paddingVertical: 8 }}
      // Explicit physical coordinates prevent browser/native RTL scroll-offset differences.
      style={{ flexGrow: 0, direction: 'ltr' }}
      onLayout={(event) => {
        geometry.current.viewport = event.nativeEvent.layout.width;
        revealSelection();
      }}
      onContentSizeChange={(width) => {
        geometry.current.content = width;
        revealSelection();
      }}
    >
      {choices}
    </ScrollView>
  );
}
