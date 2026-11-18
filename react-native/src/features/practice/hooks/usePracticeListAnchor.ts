import { useCallback, useEffect, useRef } from 'react';
import type { FlatList } from 'react-native';

/** Restore a virtualized section without repeatedly moving it after ordinary user actions. */
export function usePracticeListAnchor(index: number | null, resetKey: string) {
  const list = useRef<FlatList<number>>(null);
  const desired = useRef(index);
  desired.current = index;
  const pending = useRef<number | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = index !== null;
  const cancel = useCallback(() => {
    pending.current = null;
    if (retry.current !== null) clearTimeout(retry.current);
  }, []);
  const scroll = useCallback(() => {
    if (pending.current !== null)
      list.current?.scrollToIndex({ index: pending.current, animated: false });
  }, []);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index?: number | null }> }) => {
      if (viewableItems.some((item) => item.index === pending.current)) cancel();
    },
    [cancel],
  );
  useEffect(() => {
    pending.current = desired.current;
    scroll();
    return cancel;
  }, [resetKey, ready, scroll, cancel]);
  const onScrollToIndexFailed = useCallback(
    ({ index: failedIndex, averageItemLength }: { index: number; averageItemLength: number }) => {
      if (pending.current !== failedIndex) return;
      list.current?.scrollToOffset({ offset: averageItemLength * failedIndex, animated: false });
      if (retry.current !== null) clearTimeout(retry.current);
      retry.current = setTimeout(scroll, 100);
    },
    [scroll],
  );
  return {
    cancel,
    listProps: {
      ref: list,
      onContentSizeChange: scroll,
      onScrollBeginDrag: cancel,
      onViewableItemsChanged,
      onScrollToIndexFailed,
    },
  };
}
