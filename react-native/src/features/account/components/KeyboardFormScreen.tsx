import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

/** Account forms have a scrollable viewport independent of the keyboard. */
export function KeyboardFormScreen({ children }: React.PropsWithChildren) {
  const headerHeight = useHeaderHeight();
  const p = usePalette();
  const root = useRef<React.ComponentRef<typeof View> | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const scrollY = useRef(0);
  const frame = useRef<number | null>(null);
  const mounted = useRef(true);
  const focused = useRef<ReturnType<typeof TextInput.State.currentlyFocusedInput>>(undefined);
  const keyboardTop = useRef<number | undefined>(Keyboard.metrics()?.screenY);
  const [windowTop, setWindowTop] = useState(headerHeight);
  const ensureFocusedVisible = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const input = focused.current;
      const viewport = scroll.current;
      if (
        !mounted.current ||
        !input ||
        input !== TextInput.State.currentlyFocusedInput() ||
        !viewport
      )
        return;
      viewport.measureInWindow((_x, top, _width, height) => {
        if (!mounted.current || input !== TextInput.State.currentlyFocusedInput() || height <= 0)
          return;
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (!mounted.current || input !== TextInput.State.currentlyFocusedInput()) return;
          const bottom = Math.min(top + height, keyboardTop.current ?? Infinity) - 12;
          const above = top + 12;
          const delta =
            inputHeight > bottom - above || inputTop < above
              ? inputTop - above
              : Math.max(0, inputTop + inputHeight - bottom);
          const target = Math.max(0, scrollY.current + delta);
          if (Math.abs(target - scrollY.current) < 1) return;
          scrollY.current = target;
          viewport.scrollTo({ y: target, animated: false });
        });
      });
    });
  }, []);
  useEffect(() => {
    mounted.current = true;
    const update = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      ensureFocusedVisible();
    };
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', update),
      Keyboard.addListener('keyboardDidHide', () => {
        keyboardTop.current = undefined;
        ensureFocusedVisible();
      }),
      ...(Platform.OS === 'ios' ? [Keyboard.addListener('keyboardWillChangeFrame', update)] : []),
    ];
    return () => {
      mounted.current = false;
      subscriptions.forEach((subscription) => subscription.remove());
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [ensureFocusedVisible]);
  return (
    <View
      ref={root}
      style={{ flex: 1, backgroundColor: p.background }}
      onLayout={() => {
        // KAV compares a parent-relative frame with Keyboard's window coordinates.
        // The native-stack header alone omits App's outer safe area and banners.
        root.current?.measureInWindow((_x, top) => {
          if (mounted.current && Number.isFinite(top)) setWindowTop(top);
        });
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={windowTop}
        style={{ flex: 1 }}
        onLayout={ensureFocusedVisible}
      >
        <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.screen}
            onFocus={() => {
              focused.current = TextInput.State.currentlyFocusedInput();
              ensureFocusedVisible();
            }}
            onLayout={ensureFocusedVisible}
            onContentSizeChange={ensureFocusedVisible}
            onScroll={(event) => {
              scrollY.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
