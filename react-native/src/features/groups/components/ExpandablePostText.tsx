import React, { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useI18n } from '../../../i18n';
import { T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

/** Measure the complete text so short wrapped posts do not get a needless toggle. */
export function ExpandablePostText({ content }: { content: string }) {
  const { t, locale } = useI18n();
  const palette = usePalette();
  const { fontScale } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const lineHeight = locale === 'ar' ? 28.8 : 23.2;
  return (
    <View>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', width: '100%', opacity: 0 }}
      >
        <T
          translate={false}
          size={16}
          style={{ lineHeight }}
          onLayout={(event) =>
            setOverflows(event.nativeEvent.layout.height > lineHeight * fontScale * 6 + 1)
          }
          onTextLayout={(event) => setOverflows(event.nativeEvent.lines.length > 6)}
        >
          {content}
        </T>
      </View>
      <T
        translate={false}
        size={16}
        style={{ lineHeight }}
        selectable
        numberOfLines={expanded ? undefined : 6}
      >
        {content}
      </T>
      {overflows ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={{
            minHeight: 48,
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <T color={palette.primary} bold size={14}>
            {t(expanded ? 'groups.feed.readLess' : 'groups.feed.readMore')}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
