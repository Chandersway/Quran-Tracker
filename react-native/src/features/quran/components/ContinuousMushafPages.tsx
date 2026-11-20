import React, { useMemo, useRef } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { FullscreenExitButton } from './FullscreenExitButton';
import { printedPageRatio, type Edition, type Segment } from '../../../content/mushafGeometry';
import { createBookViewportGesture } from '../gestures/bookViewportGestures';
import { continuousMushafCrop } from '../layout/continuousMushafCrop';
import { cropSegment, mushafCropZoom } from '../layout/mushafCrop';
import { PrintedMushafPage } from './PrintedMushafPage';

/** Lay out the full book using original image dimensions; only visible artwork is mounted. */
export function ContinuousMushafPages({
  edition,
  initialPage,
  initialHighlight,
  maximum,
  width,
  retry,
  zoom,
  onZoom,
  onPageChange,
  onExit,
  exitLabel,
  onError,
  selected,
  onSelect,
}: {
  edition: Edition;
  initialPage: number;
  initialHighlight?: Segment | null;
  maximum: number;
  width: number;
  retry: number;
  zoom: number;
  onZoom: (value: number) => void;
  onPageChange: (page: number) => void;
  onExit: () => void;
  exitLabel: string;
  onError: (message: string) => void;
  selected?: { segment: Segment; page: number } | null;
  onSelect: (segment: Segment | null, page: number) => void;
}) {
  const start = useRef(Math.max(1, Math.min(maximum, initialPage)));
  const highlight = useRef(initialHighlight);
  const vertical = useRef<FlatList<number>>(null);
  const horizontal = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const frame = useRef<React.ComponentRef<typeof View>>(null);
  const origin = useRef({ left: 0, top: 0 });
  const viewportHeight = useRef(0);
  const book = useMemo(() => {
    const pages = Array.from({ length: maximum }, (_, i) => i + 1);
    let height = 0;
    const units = pages.map((page) => {
      const edge = continuousMushafCrop(edition, page);
      const length =
        (printedPageRatio(edition, page) * (1 - edge.top - edge.bottom)) /
        (1 - edge.left - edge.right);
      const offset = height;
      height += length;
      return { length, offset };
    });
    return { pages, units, height };
  }, [edition, maximum]);
  const scale = width * zoom;
  const scroll = useRef({ x: 0, y: book.units[start.current - 1]!.offset * scale });
  const live = useRef({ width, zoom, scale, blocked: Boolean(selected), onZoom });
  live.current = { width, zoom, scale, blocked: Boolean(selected), onZoom };
  const scrollTo = (x: number, y: number) => {
    scroll.current = { x, y };
    horizontal.current?.scrollTo({ x, animated: false });
    vertical.current?.scrollToOffset({ offset: y, animated: false });
  };
  const gesture = useRef(
    createBookViewportGesture({
      state: () => {
        const current = live.current;
        const height = book.height * current.scale;
        return {
          zoom: current.zoom,
          blocked: current.blocked,
          selection: false,
          ...scroll.current,
          maximumX: Math.max(0, current.scale - current.width),
          maximumY: Math.max(0, height - viewportHeight.current),
          geometry: { ...origin.current, insetX: 0, insetY: 0, width: current.scale, height },
        };
      },
      zoom: (value) => live.current.onZoom(value),
      scroll: scrollTo,
      claimed: () => {},
    }),
  );
  const firstLayout = useRef(true);
  const contentWidth = useRef(0);
  const callback = useRef(onPageChange);
  callback.current = onPageChange;
  const pendingVisible = useRef<number | null>(null);
  const publishVisible = () => {
    if (pendingVisible.current !== null && !pendingRotation.current && !gesture.current.active) {
      callback.current(pendingVisible.current);
      pendingVisible.current = null;
    }
  };
  const previousWidth = useRef(width);
  const pendingRotation = useRef<{ x: number; y: number } | null>(null);
  if (previousWidth.current !== width) {
    const factor = width / previousWidth.current;
    const anchor = pendingRotation.current ?? scroll.current;
    pendingRotation.current = { x: anchor.x * factor, y: anchor.y * factor };
    previousWidth.current = width;
  }
  const restoreLayout = () => {
    if (!viewportHeight.current || Math.abs(contentWidth.current - scale) > 1) return;
    if (firstLayout.current) {
      firstLayout.current = false;
      const target = highlight.current;
      if (target) {
        const edge = continuousMushafCrop(edition, start.current);
        const row = cropSegment(target, mushafCropZoom(edition));
        const page = book.units[start.current - 1]!;
        const top =
          Math.max(0, (row.y - edge.top) / (1 - edge.top - edge.bottom)) * page.length * scale;
        const rowHeight = (row.height / (1 - edge.top - edge.bottom)) * page.length * scale;
        if (top + rowHeight > viewportHeight.current)
          scrollTo(0, page.offset * scale + Math.max(0, top - viewportHeight.current * 0.18));
      }
    }
    if (pendingRotation.current) {
      const { x, y } = pendingRotation.current;
      pendingRotation.current = null;
      gesture.current.cancel();
      scrollTo(
        Math.min(x, scale - width),
        Math.min(y, Math.max(0, book.height * scale - viewportHeight.current)),
      );
      publishVisible();
    } else gesture.current.layout();
  };
  const visible = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: number; isViewable: boolean }> }) => {
      const first = viewableItems.find((item) => item.isViewable);
      if (first) {
        pendingVisible.current = first.item;
        publishVisible();
      }
    },
  );
  return (
    <View style={{ flex: 1 }}>
      <View
        ref={frame}
        style={{ flex: 1, direction: 'ltr' }}
        {...gesture.current.handlers}
        onResponderRelease={() => {
          gesture.current.handlers.onResponderRelease();
          publishVisible();
        }}
        onResponderTerminate={() => {
          gesture.current.cancel();
          publishVisible();
        }}
        onResponderReject={() => {
          gesture.current.cancel();
          publishVisible();
        }}
        onTouchCancel={() => {
          gesture.current.cancel();
          publishVisible();
        }}
        onLayout={({ nativeEvent }) => {
          viewportHeight.current = nativeEvent.layout.height;
          frame.current?.measureInWindow((left, top) => {
            origin.current = { left, top };
          });
          restoreLayout();
        }}
      >
        <ScrollView
          ref={horizontal}
          horizontal
          scrollEnabled={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ width: scale }}
          showsHorizontalScrollIndicator={false}
        >
          <FlatList
            ref={vertical}
            testID="mushaf-fullscreen-pages"
            data={book.pages}
            keyExtractor={String}
            initialScrollIndex={start.current - 1}
            getItemLayout={(_data, index) => ({
              index,
              length: book.units[index]!.length * scale,
              offset: book.units[index]!.offset * scale,
            })}
            scrollEnabled={zoom === 1}
            onScroll={({ nativeEvent }) => {
              scroll.current.y = nativeEvent.contentOffset.y;
            }}
            onContentSizeChange={(size) => {
              contentWidth.current = size;
              restoreLayout();
            }}
            scrollEventThrottle={16}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={visible.current}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            style={{ flex: 1, width: scale, backgroundColor: '#FFFEF5', direction: 'ltr' }}
            renderItem={({ item }) => (
              <PrintedMushafPage
                edition={edition}
                page={item}
                maxWidth={width}
                maxHeight={100000}
                zoom={zoom}
                retry={retry}
                continuous
                selected={
                  selected?.page === item
                    ? selected.segment
                    : item === start.current
                      ? (highlight.current ?? null)
                      : null
                }
                onSelect={onSelect}
                onLongPressSelect
                onError={onError}
              />
            )}
          />
        </ScrollView>
      </View>
      <FullscreenExitButton label={exitLabel} onExit={onExit} />
    </View>
  );
}
