import React from 'react';
import { Pressable, View } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { T } from './AppText';
import { s } from './styles';

export function Section({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const p = usePalette();
  const { t } = useI18n();
  return (
    <View
      style={[
        s.row,
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 28,
          marginBottom: 12,
        },
      ]}
    >
      <T size={21} bold style={{ flex: 1 }}>
        {t(title)}
      </T>
      {action && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(action)}
          onPress={onAction}
          style={{
            minHeight: 48,
            justifyContent: 'center',
            paddingStart: 16,
          }}
        >
          <T color={p.primary} size={14} bold>
            {t(action)}
          </T>
        </Pressable>
      )}
    </View>
  );
}
