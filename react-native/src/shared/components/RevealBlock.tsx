import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  revealIsInteractive,
  revealScrollRange,
  revealTranslation,
  type RevealBounds,
} from '../animation/revealViewport';

type Registration = { refresh: () => void; dispose: () => void };
type RevealEntry = {
  node: React.ComponentRef<typeof View>;
  update: (bounds: RevealBounds) => void;
  fallback: () => void;
  interaction: (offset: number, height: number) => void;
  timeout?: ReturnType<typeof setTimeout>;
};
type RevealContextValue = {
  reduceMotion: boolean | null;
  scrollY: Animated.Value;
  motionEnabled: Animated.Value;
  height: number;
  register: (entry: RevealEntry) => Registration;
};
const RevealContext = createContext<RevealContextValue | null>(null);
const NestedRevealContext = createContext(false);

/** The native scroll offset, not a timer, drives each card's position. */
export function RevealScrollView({
  children,
  scrollRef,
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEventThrottle = 16,
  ...props
}: React.ComponentProps<typeof ScrollView> & {
  scrollRef?: React.RefObject<React.ComponentRef<typeof ScrollView> | null>;
}) {
  const internalScroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scroll = scrollRef ?? internalScroll;
  const scrollY = useRef(new Animated.Value(0)).current;
  const motionEnabled = useRef(new Animated.Value(0)).current;
  const viewportHeight = useRef(0);
  const offset = useRef(0);
  const entries = useRef(new Set<RevealEntry>()).current;
  const [height, setHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (active) setReduceMotion(enabled);
      },
      () => {
        if (active) setReduceMotion(true);
      },
    );
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    motionEnabled.setValue(reduceMotion === false ? 1 : 0);
  }, [motionEnabled, reduceMotion]);
  const measure = useCallback(
    (entry: RevealEntry) => {
      if (!entries.has(entry)) return;
      const content = scroll.current?.getInnerViewRef();
      if (!content) {
        entry.fallback();
        return;
      }
      if (entry.timeout) clearTimeout(entry.timeout);
      const fail = () => {
        if (entries.has(entry)) entry.fallback();
      };
      entry.timeout = setTimeout(fail, 500);
      try {
        entry.node.measureLayout(
          content,
          (_x, top, _width, itemHeight) => {
            if (!entries.has(entry)) return;
            if (entry.timeout) clearTimeout(entry.timeout);
            entry.timeout = undefined;
            const bounds = { top, height: itemHeight };
            if (!revealScrollRange(bounds, viewportHeight.current)) {
              fail();
              return;
            }
            entry.update(bounds);
            entry.interaction(offset.current, viewportHeight.current);
          },
          fail,
        );
      } catch {
        fail();
      }
    },
    [entries],
  );
  const refreshAll = useCallback(() => {
    entries.forEach(measure);
  }, [entries, measure]);
  const register = useCallback(
    (entry: RevealEntry): Registration => {
      entries.add(entry);
      // Wait for the first layout pass; unmeasured content remains flat.
      const timer = setTimeout(() => measure(entry), 0);
      return {
        refresh: () => measure(entry),
        dispose: () => {
          clearTimeout(timer);
          if (entry.timeout) clearTimeout(entry.timeout);
          entries.delete(entry);
        },
      };
    },
    [entries, measure],
  );
  useEffect(
    () => () => {
      entries.forEach((entry) => {
        if (entry.timeout) clearTimeout(entry.timeout);
      });
      entries.clear();
    },
    [entries],
  );
  const handler = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== 'web',
        listener: (event) => {
          const scrollEvent = event as NativeSyntheticEvent<NativeScrollEvent>;
          offset.current = scrollEvent.nativeEvent.contentOffset.y;
          entries.forEach((entry) => entry.interaction(offset.current, viewportHeight.current));
          onScroll?.(scrollEvent);
        },
      }),
    [entries, onScroll, scrollY],
  );
  const context = useMemo(
    () => ({ reduceMotion, scrollY, motionEnabled, height, register }),
    [reduceMotion, scrollY, motionEnabled, height, register],
  );
  return (
    <RevealContext.Provider value={context}>
      <Animated.ScrollView
        {...props}
        ref={scroll}
        removeClippedSubviews={false}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={handler}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.height;
          viewportHeight.current = next;
          setHeight(next);
          refreshAll();
          onLayout?.(event);
        }}
        onContentSizeChange={(width, contentHeight) => {
          refreshAll();
          onContentSizeChange?.(width, contentHeight);
        }}
      >
        {children}
      </Animated.ScrollView>
    </RevealContext.Provider>
  );
}

/** Blocks keep their normal layout slot. Nested blocks never receive a second fold. */
export function RevealBlock({
  children,
  style,
  keepOpaque = false,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; keepOpaque?: boolean }>) {
  const viewport = useContext(RevealContext);
  const nested = useContext(NestedRevealContext);
  const node = useRef<React.ComponentRef<typeof View>>(null);
  const registration = useRef<Registration | null>(null);
  const [bounds, setBounds] = useState<RevealBounds | null>(null);
  const boundsRef = useRef<RevealBounds | null>(null);
  const [interactive, setInteractive] = useState(true);
  const interactiveRef = useRef(true);
  const updateInteractive = (next: boolean) => {
    if (interactiveRef.current !== next) {
      interactiveRef.current = next;
      setInteractive(next);
    }
  };
  useEffect(() => {
    if (!viewport || nested || !node.current) return;
    registration.current = viewport.register({
      node: node.current,
      update: (value) => {
        boundsRef.current = value;
        setBounds(value);
      },
      fallback: () => {
        boundsRef.current = null;
        setBounds(null);
        updateInteractive(true);
      },
      interaction: (offset, height) => {
        const b = boundsRef.current;
        if (b && height > 0) updateInteractive(revealIsInteractive(b, { offset, height }));
      },
    });
    return () => {
      registration.current?.dispose();
      registration.current = null;
    };
  }, [viewport?.register, nested]);
  const top = bounds?.top;
  const cardHeight = bounds?.height;
  const h = viewport?.height ?? 0;
  const scroll = viewport && !nested ? viewport.scrollY : null;
  const enabled = viewport?.motionEnabled;
  const range = bounds && viewport ? revealScrollRange(bounds, h) : null;
  const active = range && viewport && viewport.reduceMotion === false && !nested;
  const animationStyle = useMemo(() => {
    const measured =
      top === undefined || cardHeight === undefined ? null : { top, height: cardHeight };
    const range = measured ? revealScrollRange(measured, h) : null;
    const translations = measured ? revealTranslation(measured, h) : null;
    return scroll && range && translations && enabled
      ? {
          opacity: Animated.add(
            1,
            Animated.multiply(
              enabled,
              scroll.interpolate({
                inputRange: [range[0], range[0] + h * 0.1, range[1]],
                outputRange: [-1, 0, 0],
                extrapolate: 'clamp',
              }),
            ),
          ),
          transformOrigin: '50% 0%' as const,
          transform: [
            { perspective: Math.max(2400, cardHeight! * 8) },
            {
              translateY: Animated.multiply(
                enabled,
                scroll.interpolate({
                  inputRange: [range[0], range[1], range[2]],
                  outputRange: translations,
                  extrapolate: 'clamp',
                }),
              ),
            },
            {
              scale: Animated.add(
                1,
                Animated.multiply(
                  enabled,
                  scroll.interpolate({
                    inputRange: [range[1], range[2]],
                    outputRange: [-0.12, 0],
                    extrapolate: 'clamp',
                  }),
                ),
              ),
            },
            {
              rotateX: Animated.multiply(
                enabled,
                scroll.interpolate({
                  inputRange: [range[1], range[2]],
                  outputRange: [18, 0],
                  extrapolate: 'clamp',
                }),
              ).interpolate({
                inputRange: [0, 18],
                outputRange: ['0deg', '18deg'],
                extrapolate: 'clamp',
              }),
            },
          ],
        }
      : {
          opacity: 1,
          transformOrigin: '50% 0%' as const,
          transform: [{ translateY: 0 }, { scale: 1 }, { rotateX: '0deg' }],
        };
  }, [top, cardHeight, h, scroll, enabled]);

  return (
    <View
      ref={node}
      collapsable={false}
      onLayout={() => registration.current?.refresh()}
      style={bounds ? { zIndex: Math.max(1, 1000000 - Math.round(bounds.top)) } : undefined}
      pointerEvents={active && !interactive ? 'none' : 'auto'}
      accessibilityElementsHidden={Boolean(active && !interactive)}
      importantForAccessibility={active && !interactive ? 'no-hide-descendants' : 'auto'}
    >
      <NestedRevealContext.Provider value>
        <Animated.View style={[style, animationStyle, keepOpaque && { opacity: 1 }]}>
          {children}
        </Animated.View>
      </NestedRevealContext.Provider>
    </View>
  );
}
