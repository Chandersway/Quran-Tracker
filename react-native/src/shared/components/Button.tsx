import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { Icon, IconName } from './Icon';
import { T } from './AppText';
import { s } from './styles';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
  testID,
  mirrorInRtl = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  mirrorInRtl?: boolean;
}) {
  const p = usePalette();
  const { t } = useI18n();
  const label = t(title);
  const backgroundColor =
    variant === 'primary'
      ? p.primary
      : variant === 'secondary'
        ? p.subtle
        : variant === 'danger'
          ? p.dangerWash
          : 'transparent';
  const color = variant === 'primary' ? p.onPrimary : variant === 'danger' ? p.danger : p.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Icon name={icon} size={19} color={color} mirrorInRtl={mirrorInRtl} />
      ) : null}
      <T bold color={color}>
        {label}
      </T>
    </Pressable>
  );
}
