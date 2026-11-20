import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { T } from './index';
import { usePalette } from '../theme';

export function ProgressRing({
  value,
  label,
  primary,
  secondary,
  size = 120,
}: {
  value: number;
  label: string;
  primary: string;
  secondary?: string;
  size?: number;
}) {
  const p = usePalette();
  const fraction = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const stroke = Math.max(8, size * 0.1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={p.line}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={p.primary}
          strokeWidth={stroke}
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <T translate={false} bold size={size < 100 ? 18 : 25}>
        {primary}
      </T>
      {secondary && (
        <T translate={false} muted size={size < 100 ? 10 : 12}>
          {secondary}
        </T>
      )}
    </View>
  );
}
