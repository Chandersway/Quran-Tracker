import React, { useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
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
  reveal = true,
}: React.PropsWithChildren<{
  scroll?: boolean;
  /** False keeps every card in place while scrolling (no scroll-linked fold-in). */
  reveal?: boolean;
  style?: StyleProp<ViewStyle>;
  avoidKeyboard?: boolean;
  keyboardRevealRef?: React.RefObject<React.ComponentRef<typeof View> | null>;
}>) {
  const p = usePalette();
  const { locale } = useI18n();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const keyboard = useKeyboardScroll(scrollRef, avoidKeyboard && scroll, keyboardRevealRef);
  const contentStyle = StyleSheet.flatten([s.screen, style]) ?? {};
  const scrollProps = {
    keyboardShouldPersistTaps: 'handled' as const,
    keyboardDismissMode: avoidKeyboard ? ('on-drag' as const) : undefined,
    onFocus: keyboard.focus,
    onLayout: keyboard.reveal,
    onContentSizeChange: keyboard.reveal,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      keyboard.scrolled(event.nativeEvent.contentOffset.y),
    scrollEventThrottle: 16,
    contentContainerStyle: [
      s.screen,
      style,
      keyboard.bottomInset > 0 && {
        paddingBottom:
          (Number(contentStyle.paddingBottom ?? contentStyle.padding) || 0) + keyboard.bottomInset,
      },
    ],
  };
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, backgroundColor: p.background, direction: layoutDirection(locale) }}
    >
      {scroll && reveal ? (
        <RevealScrollView scrollRef={scrollRef} {...scrollProps}>
          {children}
        </RevealScrollView>
      ) : scroll ? (
        // Without the reveal context every RevealBlock renders flat.
        <ScrollView ref={scrollRef} {...scrollProps}>
          {children}
        </ScrollView>
      ) : (
        <View style={[s.screen, { flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
