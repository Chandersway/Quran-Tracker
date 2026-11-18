import {
  DeviceEventEmitter,
  findNodeHandle,
  NativeModules,
  Platform,
  type Text,
  type View,
} from 'react-native';
import type { ComponentRef } from 'react';
import {
  MUSHAF_GESTURE,
  mushafSwipeDirection,
  type MushafSwipeMetrics,
} from './mushafTextGestures';

type NativeGesture = {
  bindingId: string;
  kind: 'motion' | 'selection';
  active?: boolean;
  motion?: MushafSwipeMetrics;
  edges?: { top: boolean; bottom: boolean };
};
type GestureModule = {
  protocolVersion: number;
  attach(
    tag: number,
    bindingId: string,
    pageTag: number,
    intentDistance: number,
    maxMovementDelay: number,
  ): void;
  detach(bindingId: string): void;
};
let nextBinding = 0;

/** The Android observer reads selection before TextView handles ACTION_DOWN; JS cannot do that reliably. */
export function observeMushafText(
  view: ComponentRef<typeof Text> | null,
  onSwipe: (direction: 1 | -1) => void,
  onSelection: (active: boolean) => void,
  pageView: ComponentRef<typeof View> | null,
): (() => void) | undefined {
  const native = NativeModules.MushafTextGestures as GestureModule | undefined;
  // A stale development binary must retain explicit controls, not invoke an
  // older attach signature or silently use the old anywhere-on-page policy.
  if (Platform.OS !== 'android' || native?.protocolVersion !== 3 || !view || !pageView) return;
  const tag = findNodeHandle(view);
  const pageTag = findNodeHandle(pageView);
  if (!tag || !pageTag) return;
  const bindingId = `mushaf-text-${++nextBinding}`;
  const subscription = DeviceEventEmitter.addListener(
    'MushafTextGesture',
    (event: NativeGesture) => {
      if (event.bindingId !== bindingId) return;
      if (event.kind === 'selection') onSelection(Boolean(event.active));
      else if (event.kind === 'motion' && event.motion) {
        const direction = mushafSwipeDirection(event.motion, event.edges);
        if (direction) onSwipe(direction);
      }
    },
  );
  native.attach(
    tag,
    bindingId,
    pageTag,
    MUSHAF_GESTURE.maxTapDistance,
    MUSHAF_GESTURE.maxMovementDelay,
  );
  return () => {
    subscription.remove();
    native.detach(bindingId);
  };
}
