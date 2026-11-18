import React from 'react';
import { Pressable } from 'react-native';
import { T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

export function FilterPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 13,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? p.lime : p.subtle,
      }}
    >
      <T translate={false} size={13} bold color={selected ? p.onLime : p.muted}>
        {label}
      </T>
    </Pressable>
  );
}
