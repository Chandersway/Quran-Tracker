import React, { useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import { useI18n } from '../../../i18n';

export type MushafVerticalRailPosition = { update(offset: number): void };

/** A scroll control bound to measured content and viewport heights. */
export function MushafVerticalRail({
  offset,
  maximum,
  onScroll,
  positionRef,
}: {
  offset: number;
  maximum: number;
  onScroll: (offset: number) => void;
  positionRef?: React.Ref<MushafVerticalRailPosition>;
}) {
  const { t, format } = useI18n();
  const [height, setHeight] = useState(0);
  const [liveOffset, setLiveOffset] = useState(offset);
  React.useEffect(() => setLiveOffset(offset), [offset]);
  React.useImperativeHandle(positionRef, () => ({ update: setLiveOffset }), []);
  const drag = useRef<{ top: number; touch: number } | null>(null);
  const limit = Number.isFinite(maximum) ? Math.max(0, maximum) : 0;
  const enabled = limit > 0;
  const position = Number.isFinite(liveOffset) ? Math.min(limit, Math.max(0, liveOffset)) : 0;
  const update = (event: GestureResponderEvent) => {
    const current = drag.current;
    if (!enabled || !current || height <= 0) return;
    const touch = event.nativeEvent.changedTouches.find(
      (item) => item.identifier === current.touch,
    );
    if (touch)
      onScroll(Math.max(0, Math.min(limit, ((touch.pageY - current.top) / height) * limit)));
  };
  const cancel = () => {
    drag.current = null;
  };
  return (
    <View
      testID="mushaf-vertical-rail"
      pointerEvents={enabled ? 'auto' : 'none'}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('ui.mushaf.scrollPosition')}
      accessibilityState={{ disabled: !enabled }}
      accessibilityValue={{
        min: 0,
        max: Math.round(limit),
        now: Math.round(position),
        text: enabled
          ? format('ui.mushaf.scrollPercent', Math.round((position / limit) * 100))
          : t('ui.mushaf.scrollFits'),
      }}
      accessibilityActions={enabled ? [{ name: 'increment' }, { name: 'decrement' }] : []}
      onAccessibilityAction={({ nativeEvent }) => {
        const direction =
          nativeEvent.actionName === 'increment'
            ? 1
            : nativeEvent.actionName === 'decrement'
              ? -1
              : 0;
        if (enabled && direction)
          onScroll(Math.max(0, Math.min(limit, position + direction * Math.max(40, limit / 10))));
      }}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => enabled}
      onMoveShouldSetResponder={() => enabled}
      onResponderTerminationRequest={() => !enabled}
      onResponderGrant={(event) => {
        const touch = event.nativeEvent.changedTouches[0];
        if (!enabled || !touch) return;
        drag.current = { top: touch.pageY - touch.locationY, touch: touch.identifier };
        update(event);
      }}
      onResponderMove={update}
      onResponderRelease={(event) => {
        update(event);
        cancel();
      }}
      onResponderTerminate={cancel}
      onTouchCancel={cancel}
      style={{ width: 48, height: '100%', justifyContent: 'center', alignItems: 'center' }}
    >
      <View
        pointerEvents="none"
        style={{
          width: 3,
          height: '100%',
          borderRadius: 2,
          backgroundColor: enabled ? '#53685D' : '#8F8B80',
          opacity: 0.35,
        }}
      />
      <View
        testID="mushaf-vertical-thumb"
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 6,
          height: 28,
          borderRadius: 3,
          backgroundColor: enabled ? '#1D493A' : '#8F8B80',
          top: enabled ? (position / limit) * Math.max(0, height - 28) : 0,
        }}
      />
    </View>
  );
}
