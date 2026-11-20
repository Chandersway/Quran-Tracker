import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { isDarkPalette, usePalette } from '../../../shared/theme';
import type { AppleSignInButtonProps } from './AppleSignInButton';

/** Apple's own localized and accessible button is shown only on supported devices. */
export function AppleSignInButton({ disabled, loading, onPress }: AppleSignInButtonProps) {
  const [available, setAvailable] = useState(false);
  const palette = usePalette();
  useEffect(() => {
    let mounted = true;
    void AppleAuthentication.isAvailableAsync()
      .then((value) => {
        if (mounted) setAvailable(value);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);
  if (!available) return null;
  const blocked = disabled || loading;
  return (
    <View style={{ marginTop: 14, gap: 10 }}>
      <View pointerEvents={blocked ? 'none' : 'auto'}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            isDarkPalette(palette)
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={{ width: '100%', height: 50 }}
          accessibilityState={{ disabled: blocked, busy: loading }}
          onPress={() => {
            if (!blocked) onPress();
          }}
        />
      </View>
      {loading ? <ActivityIndicator color={palette.primary} /> : null}
    </View>
  );
}
