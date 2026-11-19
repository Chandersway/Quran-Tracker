import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../shared/components';
import type { IconName } from '../../../shared/components/Icon';
import { usePalette } from '../../../shared/theme';

const SIZE = 48;
const MARGIN = 12;
const TAP_SLOP = 6;

/** A tap exits; a drag moves the control without forwarding touches to the book. */
export function FloatingReaderButton({
  label,
  onPress,
  icon = 'minimize',
  initialCorner = 'topLeft',
  testID = 'fullscreen-exit-button',
  disabled = false,
  emphasized = false,
  visible = true,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  initialCorner?: 'topLeft' | 'bottomRight';
  testID?: string;
  disabled?: boolean;
  /** Audio is a primary entry; the fullscreen exit retains its discreet default. */
  emphasized?: boolean;
  visible?: boolean;
}) {
  const palette = usePalette();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const position = useRef(
    initialCorner === 'bottomRight'
      ? {
          x: Math.max(MARGIN, window.width - insets.left - insets.right - SIZE - MARGIN),
          y: Math.max(MARGIN, window.height - insets.top - insets.bottom - SIZE - MARGIN - 12),
        }
      : { x: MARGIN, y: MARGIN + insets.top },
  );
  const origin = useRef(position.current);
  const dragged = useRef(false);
  const offset = useRef(new Animated.ValueXY(position.current)).current;
  const latest = useRef(onPress);
  latest.current = () => {
    if (!disabled) onPress();
  };
  const minimumY = MARGIN + insets.top;
  const bounds = useRef({ x: MARGIN, y: minimumY, minimumY });
  bounds.current = {
    x: Math.max(MARGIN, window.width - insets.left - insets.right - SIZE - MARGIN),
    y: Math.max(minimumY, window.height - insets.bottom - SIZE - MARGIN),
    minimumY,
  };
  const move = useMemo(
    () => (x: number, y: number) => {
      position.current = {
        x: Math.max(MARGIN, Math.min(bounds.current.x, x)),
        y: Math.max(bounds.current.minimumY, Math.min(bounds.current.y, y)),
      };
      offset.setValue(position.current);
    },
    [offset],
  );
  useEffect(() => {
    move(position.current.x, position.current.y);
  }, [window.width, window.height, insets.top, insets.bottom, insets.left, insets.right, move]);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          origin.current = { ...position.current };
          dragged.current = false;
        },
        onPanResponderMove: (_event, gesture) => {
          if (Math.hypot(gesture.dx, gesture.dy) > TAP_SLOP) dragged.current = true;
          if (dragged.current) move(origin.current.x + gesture.dx, origin.current.y + gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          const wasDragged = dragged.current || Math.hypot(gesture.dx, gesture.dy) > TAP_SLOP;
          if (wasDragged) move(origin.current.x + gesture.dx, origin.current.y + gesture.dy);
          else latest.current();
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          dragged.current = true;
        },
      }),
    [move],
  );
  if (!visible) return null;
  return (
    <Animated.View
      {...responder.panHandlers}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityTap={() => latest.current()}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') latest.current();
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        transform: offset.getTranslateTransform(),
      }}
    >
      <View
        pointerEvents="none"
        style={{
          width: emphasized ? 44 : 32,
          height: emphasized ? 44 : 32,
          borderRadius: emphasized ? 22 : 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: emphasized ? palette.primary + 'F2' : palette.surface + 'A6',
          ...(emphasized ? { borderWidth: 1, borderColor: palette.onPrimary + 'B3' } : {}),
        }}
      >
        <Icon
          name={icon}
          size={emphasized ? 22 : 17}
          color={emphasized ? palette.onPrimary : undefined}
        />
      </View>
    </Animated.View>
  );
}
