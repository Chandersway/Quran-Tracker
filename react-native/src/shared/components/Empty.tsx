import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { Icon, IconName } from './Icon';
import { T } from './AppText';
import { Button } from './Button';

export function Empty({
  icon = 'book-open',
  title,
  message,
  action,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const p = usePalette();
  const { t } = useI18n();
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
      <View style={{ backgroundColor: p.subtle, padding: 18, borderRadius: 32 }}>
        <Icon name={icon} size={30} color={p.primary} />
      </View>
      <T bold size={22} style={{ textAlign: 'center' }}>
        {t(title)}
      </T>
      <T muted style={{ textAlign: 'center', maxWidth: 340 }}>
        {t(message)}
      </T>
      {action && onAction && <Button title={action} onPress={onAction} style={{ marginTop: 8 }} />}
    </View>
  );
}
