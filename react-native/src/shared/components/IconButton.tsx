import React from 'react';
import { Pressable } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { Icon, IconName } from './Icon';
import { s } from './styles';

export function IconButton({
  name,
  label,
  onPress,
  selected = false,
  disabled = false,
  mirrorInRtl = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  mirrorInRtl?: boolean;
}) {
  const p = usePalette();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        {
          backgroundColor: selected ? p.lime : pressed ? p.subtle : 'transparent',
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Icon name={name} mirrorInRtl={mirrorInRtl} color={selected ? p.onLime : p.ink} />
    </Pressable>
  );
}
