import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveLocale, sourceText, type Locale } from '../../i18n';
export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ onRetry: () => void }>,
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) return <ErrorFallback onRetry={this.props.onRetry} />;
    return this.props.children;
  }
}
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const [locale, setLocale] = useState<Locale>('en');
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem('wirdna:state:v1')
      .then((raw) => {
        if (active && raw) setLocale(resolveLocale(JSON.parse(raw)?.preferences?.language));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const rtl = locale === 'ar';
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F3EFE4', justifyContent: 'center', padding: 28 }}
    >
      <Text
        style={{
          color: '#18382E',
          fontSize: 20,
          lineHeight: 32,
          textAlign: rtl ? 'right' : 'left',
          marginBottom: 24,
        }}
      >
        {sourceText('inline.HamburgerMenu.95e54805c2', locale)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={{
          minHeight: 52,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1D493A',
          borderRadius: 10,
          padding: 12,
        }}
      >
        <Text style={{ color: '#FFF9EB', fontSize: 16 }}>{sourceText('audio.retry', locale)}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
