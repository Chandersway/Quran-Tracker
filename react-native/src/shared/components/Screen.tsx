import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RevealScrollView } from './RevealBlock';
import { usePalette } from '../theme';
import { s } from './styles';
import { useKeyboardScroll } from '../forms/useKeyboardScroll';
import { useI18n } from '../../i18n';
import { layoutDirection } from '../../domain/layoutDirection';

export function Screen({
  children,
  scroll = true,
  style,
  avoidKeyboard = false,
  keyboardRevealRef,
}: React.PropsWithChildren<{
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  avoidKeyboard?: boolean;
  keyboardRevealRef?: React.RefObject<React.ComponentRef<typeof View> | null>;
}>) {
  const p = usePalette();
  const { locale } = useI18n();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const keyboard = useKeyboardScroll(scrollRef, avoidKeyboard && scroll, keyboardRevealRef);
  const contentStyle = StyleSheet.flatten([s.screen, style]) ?? {};
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, backgroundColor: p.background, direction: layoutDirection(locale) }}
    >
      {scroll ? (
        <RevealScrollView
          scrollRef={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={avoidKeyboard ? 'on-drag' : undefined}
          onFocus={keyboard.focus}
          onLayout={keyboard.reveal}
          onContentSizeChange={keyboard.reveal}
          onScroll={(event) => keyboard.scrolled(event.nativeEvent.contentOffset.y)}
          contentContainerStyle={[
            s.screen,
            style,
            keyboard.bottomInset > 0 && {
              paddingBottom:
                (Number(contentStyle.paddingBottom ?? contentStyle.padding) || 0) +
                keyboard.bottomInset,
            },
          ]}
        >
          {children}
        </RevealScrollView>
      ) : (
        <View style={[s.screen, { flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
