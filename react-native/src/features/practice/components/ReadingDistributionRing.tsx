import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { statsRingSegment, type StatsReadingBucket } from '../../../domain/statistics';
import { useI18n } from '../../../i18n';
import { T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

/** The same segment geometry selects the same records in both overview sizes. */
export function ReadingDistributionRing({
  entries,
  colors,
  title,
  size = 188,
  onSelect,
}: {
  entries: StatsReadingBucket[];
  colors: string[];
  title: string;
  size?: number;
  onSelect: (key: string | null) => void;
}) {
  const p = usePalette();
  const { locale } = useI18n();
  const total = entries.reduce((sum, entry) => sum + entry.rows.length, 0);
  const stroke = size < 140 ? 10 : 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${total.toLocaleString(locale)}`}
      onPress={(event) => {
        const index = statsRingSegment(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
          size,
          stroke,
          entries.map((entry) => entry.rows.length),
        );
        onSelect(index === null ? null : entries[index]!.key);
      }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={p.line}
          strokeWidth={stroke}
          fill="none"
        />
        {entries.map((entry, index) => {
          const length = (entry.rows.length / total) * circumference;
          const before = offset;
          offset += length;
          return (
            <Circle
              key={entry.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors[index % colors.length]}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-before}
              rotation={-90}
              origin={`${size / 2},${size / 2}`}
            />
          );
        })}
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: stroke + 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <T size={size < 140 ? 23 : 36} bold style={{ fontVariant: ['tabular-nums'] }}>
          {total.toLocaleString(locale)}
        </T>
      </View>
    </Pressable>
  );
}
