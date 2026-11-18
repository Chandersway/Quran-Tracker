import React from 'react';
import { Pressable, useColorScheme, View } from 'react-native';
import { themeModes, resolvedThemeMode, type ThemeMode } from '../../domain/themePreferences';
import { T } from '../components/AppText';
import { Icon } from '../components/Icon';
import { usePalette } from './index';
import { palettes } from './colors';

export function ThemePicker({
  value,
  labels,
  label,
  onChange,
}: {
  value: ThemeMode;
  labels: Record<ThemeMode, string>;
  label: string;
  onChange: (theme: ThemeMode) => void;
}) {
  const p = usePalette();
  const device = useColorScheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
    >
      {themeModes.map((theme) => {
        const preview = palettes[resolvedThemeMode(theme, device)];
        const selected = theme === value;
        return (
          <Pressable
            key={theme}
            testID={`theme-${theme}`}
            accessibilityRole="radio"
            accessibilityLabel={labels[theme]}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => onChange(theme)}
            style={({ pressed }) => ({
              flexBasis: '47%',
              flexGrow: 1,
              minHeight: 64,
              minWidth: 120,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: selected ? p.primary : p.line,
              backgroundColor: selected ? p.subtle : p.surface,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: preview.background,
                borderWidth: 1,
                borderColor: preview.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected && <Icon name="check" size={18} color={preview.ink} />}
            </View>
            <T size={14} bold={selected} style={{ flex: 1 }}>
              {labels[theme]}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
