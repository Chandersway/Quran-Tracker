import React, { useRef, useState } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { useI18n } from '../../../i18n';
import type { RootStack } from '../../../app/navigation/types';
import type { MushafEdition } from '../../../state/models';
import { mushafPageDensity } from '../../../content/mushafPageMetrics';
import { Icon, IconButton, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { MushafReadingActions } from './MushafReadingActions';
import {
  pageAtRailPosition,
  railPositionForPage,
  tickForPage,
  tickPageRanges,
} from '../layout/mushafScrubber';

/**
 * Optional aggregate data for the inclusive page range represented by one tick.
 * Density is normalized from 0 (least text) to 1 (most text); `read` means
 * the whole range has been read. Missing metrics keep the neutral tick style.
 */
export type MushafTickMetrics = { textDensity?: number; read?: boolean };

/** Exact-page scrubber, shared by the standard footer and the full-screen overlay. */
export function MushafPageRail({
  page,
  maximum,
  edition,
  onPageChange,
  getTickMetrics,
  onPreviewChange,
  onPaper = false,
}: {
  page: number;
  maximum: number;
  edition?: MushafEdition;
  onPageChange: (page: number) => void;
  getTickMetrics?: (firstPage: number, lastPage: number) => MushafTickMetrics | undefined;
  onPreviewChange?: (page: number | null) => void;
  onPaper?: boolean;
}) {
  const p = usePalette();
  const { t, format } = useI18n();
  const [width, setWidth] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const drag = useRef<{ left: number; start: number; current: number; touch: number } | null>(null);
  const displayPage = preview ?? page;
  const fraction = railPositionForPage(displayPage, maximum);
  const tickCount = Math.min(maximum, Math.max(2, Math.min(70, Math.floor(width / 7))));
  const ranges = React.useMemo(() => tickPageRanges(maximum, tickCount), [maximum, tickCount]);
  const activeTick = tickForPage(displayPage, maximum, tickCount);
  const delta = preview === null || !drag.current ? null : preview - drag.current.start;
  const cancelDrag = () => {
    drag.current = null;
    setPreview(null);
    onPreviewChange?.(null);
  };
  const update = (event: GestureResponderEvent) => {
    const current = drag.current;
    if (!current) return;
    const touch = event.nativeEvent.changedTouches.find(
      (item) => item.identifier === current.touch,
    );
    if (!touch) return;
    current.current = pageAtRailPosition(touch.pageX - current.left, width, maximum);
    setPreview(current.current);
    onPreviewChange?.(current.current);
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('ui.mushaf.scrubberLabel')}
      accessibilityHint={t('ui.mushaf.scrubberHint')}
      accessibilityValue={{
        min: 1,
        max: maximum,
        now: displayPage,
        text: format('bookReader.pageLabel', displayPage, maximum),
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'increment' && page < maximum) onPageChange(page + 1);
        if (nativeEvent.actionName === 'decrement' && page > 1) onPageChange(page - 1);
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => maximum > 1}
      onMoveShouldSetResponder={() => maximum > 1}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        const touch = event.nativeEvent.changedTouches[0];
        if (!touch) return;
        drag.current = {
          left: touch.pageX - touch.locationX,
          start: page,
          current: page,
          touch: touch.identifier,
        };
        update(event);
      }}
      onResponderMove={update}
      onResponderRelease={(event) => {
        update(event);
        const target = drag.current?.current;
        drag.current = null;
        setPreview(null);
        onPreviewChange?.(null);
        if (target !== undefined && target !== page) onPageChange(target);
      }}
      onResponderTerminate={cancelDrag}
      onTouchCancel={cancelDrag}
      style={{ flex: 1, height: 52, justifyContent: 'center' }}
    >
      <View
        pointerEvents="none"
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 30,
        }}
      >
        {Array.from({ length: tickCount }, (_, index) => {
          // Ticks run from the last page at the left to page one at the right.
          const { firstPage, lastPage } = ranges[index]!;
          const metrics = getTickMetrics?.(firstPage, lastPage);
          const density =
            metrics?.textDensity ??
            (edition ? mushafPageDensity(edition, maximum, firstPage, lastPage) : undefined);
          const thickness =
            density === undefined || !Number.isFinite(density)
              ? 1.5
              : 1.25 + Math.sqrt(Math.max(0, Math.min(1, density))) * 3;
          return (
            <View
              key={index}
              style={{
                width: thickness,
                height: index === activeTick ? 28 : 20,
                borderRadius: 2,
                backgroundColor: onPaper
                  ? index === activeTick
                    ? '#1D493A'
                    : metrics?.read
                      ? '#1D493A'
                      : '#53685D'
                  : index === activeTick
                    ? p.primary
                    : metrics?.read
                      ? p.primary
                      : p.muted,
                opacity: index === activeTick ? 1 : metrics?.read ? 0.85 : 0.55,
              }}
            />
          );
        })}
      </View>
      {delta !== null && width > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -12,
            left: Math.max(0, Math.min(width - 42, fraction * width - 21)),
            width: 42,
            alignItems: 'center',
            backgroundColor: p.surface,
            borderRadius: 8,
          }}
        >
          <T bold size={12} translate={false}>
            {delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : '0'}
          </T>
        </View>
      )}
    </View>
  );
}

/** The rail previews locally and only changes the reader page when released. */
export function MushafFooter({
  page,
  maximum,
  onPageChange,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
  zoom,
  onZoomIn,
  onZoomOut,
  edition,
  pages,
  context,
  onJump,
  getTickMetrics,
  readingSessionId,
  compact = false,
}: {
  page: number;
  maximum: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canNext: boolean;
  canPrevious: boolean;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  edition: MushafEdition;
  pages: number[];
  context?: RootStack['Mushaf'];
  onJump: () => void;
  getTickMetrics?: (firstPage: number, lastPage: number) => MushafTickMetrics | undefined;
  readingSessionId?: string;
  compact?: boolean;
}) {
  const p = usePalette();
  const { t, format } = useI18n();
  const [preview, setPreview] = useState<number | null>(null);
  const displayPage = preview ?? page;
  if (compact)
    return (
      <View
        testID="mushaf-compact-footer"
        style={{
          borderTopWidth: 1,
          borderTopColor: p.line,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 4,
          direction: 'ltr',
          backgroundColor: p.background,
        }}
      >
        <IconButton
          name="chevron-left"
          label={t('ui.books.next')}
          disabled={!canNext}
          onPress={onNext}
        />
        <MushafPageRail
          page={page}
          maximum={maximum}
          edition={edition}
          onPageChange={onPageChange}
          getTickMetrics={getTickMetrics}
          onPreviewChange={setPreview}
        />
        <IconButton
          name="chevron-right"
          label={t('ui.books.previous')}
          disabled={!canPrevious}
          onPress={onPrevious}
        />
        {onZoomIn && onZoomOut && zoom !== undefined && (
          <>
            <IconButton
              name="plus"
              label={t('ui.books.zoomIn')}
              disabled={zoom >= 3}
              onPress={onZoomIn}
            />
            <IconButton
              name="minus"
              label={t('ui.books.zoomOut')}
              disabled={zoom <= 1}
              onPress={onZoomOut}
            />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={format('bookReader.pageLabel', displayPage, maximum)}
          accessibilityHint={t('ui.mushaf.jumpHint')}
          onPress={onJump}
          style={{ minWidth: 76, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <T bold size={14} translate={false}>{`${displayPage} / ${maximum}`}</T>
        </Pressable>
        <MushafReadingActions
          edition={edition}
          pages={pages}
          context={context}
          sessionId={readingSessionId}
          compact
        />
      </View>
    );
  return (
    <View
      style={{ borderTopWidth: 1, borderTopColor: p.line, paddingHorizontal: 8, paddingBottom: 4 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', direction: 'ltr' }}>
        <IconButton
          name="chevron-left"
          label={t('ui.books.next')}
          disabled={!canNext}
          onPress={onNext}
        />
        <MushafPageRail
          page={page}
          maximum={maximum}
          edition={edition}
          onPageChange={onPageChange}
          getTickMetrics={getTickMetrics}
          onPreviewChange={setPreview}
        />
        <IconButton
          name="chevron-right"
          label={t('ui.books.previous')}
          disabled={!canPrevious}
          onPress={onPrevious}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', direction: 'ltr' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {onZoomIn && onZoomOut && zoom !== undefined && (
            <>
              {(
                [
                  ['plus', 'ui.books.zoomIn', zoom >= 3, onZoomIn],
                  ['minus', 'ui.books.zoomOut', zoom <= 1, onZoomOut],
                ] as const
              ).map(([name, label, disabled, onPress]) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={t(label)}
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  onPress={onPress}
                  style={({ pressed }) => ({
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: p.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={name} size={19} color={p.primary} />
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={format('bookReader.pageLabel', displayPage, maximum)}
          accessibilityHint={t('ui.mushaf.jumpHint')}
          onPress={onJump}
          style={{ minWidth: 70, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <T bold size={14} translate={false}>{`${displayPage} / ${maximum}`}</T>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <MushafReadingActions
            edition={edition}
            pages={pages}
            context={context}
            sessionId={readingSessionId}
            compact
          />
        </View>
      </View>
      <View
        pointerEvents="none"
        accessible={false}
        style={{ flexDirection: 'row', direction: 'ltr', alignItems: 'center', height: 14 }}
      >
        <View style={{ flex: 1, width: 96 }}>
          {onZoomIn && onZoomOut && zoom !== undefined && (
            <T muted size={10} style={{ width: 96, textAlign: 'center', lineHeight: 14 }}>
              {t('ui.mushaf.zoomCaption')}
            </T>
          )}
        </View>
        <T muted size={10} style={{ width: 70, textAlign: 'center', lineHeight: 14 }}>
          {t('ui.mushaf.pageCaption')}
        </T>
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}
