import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';
import { Icon } from '../../../shared/components';

export function NoteDragHandle({
  label,
  onStart,
  onMove,
  onDrop,
  onCancel,
  onChoose,
}: {
  label: string;
  onStart: () => void;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onCancel: () => void;
  onChoose: () => void;
}) {
  const offset = useRef(new Animated.ValueXY()).current;
  const latest = useRef({ onStart, onMove, onDrop, onCancel, onChoose });
  latest.current = { onStart, onMove, onDrop, onCancel, onChoose };
  const dragged = useRef(false);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragged.current = false;
          latest.current.onStart();
        },
        onPanResponderMove: (_event, gesture) => {
          if (Math.hypot(gesture.dx, gesture.dy) > 6) dragged.current = true;
          offset.setValue({ x: gesture.dx, y: gesture.dy });
          latest.current.onMove(gesture.moveX, gesture.moveY);
        },
        onPanResponderRelease: (_event, gesture) => {
          offset.setValue({ x: 0, y: 0 });
          if (dragged.current || Math.hypot(gesture.dx, gesture.dy) > 6)
            latest.current.onDrop(gesture.moveX, gesture.moveY);
          else {
            latest.current.onCancel();
            latest.current.onChoose();
          }
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          offset.setValue({ x: 0, y: 0 });
          latest.current.onCancel();
        },
      }),
    [offset],
  );
  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onClick={(event) => {
        // The web button dispatches a click without a pointer for keyboard/assistive activation.
        if (
          Platform.OS === 'web' &&
          'detail' in event.nativeEvent &&
          event.nativeEvent.detail === 0
        )
          latest.current.onChoose();
      }}
      onAccessibilityTap={() => latest.current.onChoose()}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') latest.current.onChoose();
      }}
      style={{
        width: 44,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        transform: offset.getTranslateTransform(),
      }}
    >
      <Icon name="move" size={20} />
    </Animated.View>
  );
}
