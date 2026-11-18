import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { T } from './AppText';
import { Button } from './Button';

export function Notice({
  message,
  error = false,
  onRetry,
}: {
  message: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  const p = usePalette();
  const { t } = useI18n();
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: error ? p.dangerWash : p.subtle,
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        gap: 8,
      }}
    >
      <T size={14} color={error ? p.danger : p.ink}>
        {t(message)}
      </T>
      {onRetry && <Button title="Try again" onPress={onRetry} variant="quiet" />}
    </View>
  );
}
