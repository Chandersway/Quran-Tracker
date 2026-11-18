import React from 'react';
import { Pressable, View } from 'react-native';
import { usePalette } from '../theme';
import { Icon, IconName } from './Icon';
import { T } from './AppText';
import { s } from './styles';

export function Row({
  title,
  subtitle,
  icon,
  onPress,
  trailing,
  danger = false,
  translateTitle = true,
  translateSubtitle = true,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  translateTitle?: boolean;
  translateSubtitle?: boolean;
}) {
  const p = usePalette();
  const content = (
    <>
      <View style={[s.row, { flex: 1 }]}>
        {icon && (
          <View style={[s.rowIcon, { backgroundColor: p.subtle }]}>
            <Icon name={icon} color={danger ? p.danger : p.primary} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <T translate={translateTitle} bold color={danger ? p.danger : p.ink}>
            {title}
          </T>
          {subtitle && (
            <T translate={translateSubtitle} size={13} muted>
              {subtitle}
            </T>
          )}
        </View>
      </View>
      {trailing ?? (onPress && <Icon name="chevron-right" mirrorInRtl size={18} color={p.muted} />)}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.listRow,
        { borderBottomColor: p.line, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[s.listRow, { borderBottomColor: p.line }]}>{content}</View>
  );
}
