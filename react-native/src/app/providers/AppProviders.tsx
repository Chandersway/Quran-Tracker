import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { NotoKufiArabic_400Regular } from '@expo-google-fonts/noto-kufi-arabic/400Regular';
import { NotoKufiArabic_700Bold } from '@expo-google-fonts/noto-kufi-arabic/700Bold';
import { useFonts } from 'expo-font';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import qpcWarshFont from '../../../assets/fonts/UthmanicWarsh-v-3.0.ttf';
import { AudioProvider } from '../../features/audio/providers/AudioProvider';
import { FocusProvider } from '../../features/practice/providers/FocusProvider';
import { ThemeProvider } from '../../shared/theme';
import { DirectionView } from '../../shared/components/DirectionView';
import { AppStoreProvider, useAppStore } from '../../state/store';
import { ErrorBoundary } from '../components/AppErrorBoundary';
function RuntimeProviders({ children }: React.PropsWithChildren) {
  const { ready } = useAppStore();
  if (!ready) return <>{children}</>;
  return (
    <FocusProvider>
      <AudioProvider>
        <>{children}</>
      </AudioProvider>
    </FocusProvider>
  );
}
export function AppProviders({ children }: React.PropsWithChildren) {
  const [generation, setGeneration] = useState(0);
  const [loaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Amiri_400Regular,
    QpcWarshOriginal: qpcWarshFont,
    NotoKufiArabic_400Regular,
    NotoKufiArabic_700Bold,
  });
  if (!loaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F6F4EB',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#245C44" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <ErrorBoundary key={generation} onRetry={() => setGeneration((n) => n + 1)}>
        <AppStoreProvider>
          <ThemeProvider>
            <DirectionView style={{ flex: 1 }}>
              <RuntimeProviders>{children}</RuntimeProviders>
            </DirectionView>
          </ThemeProvider>
        </AppStoreProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
