import assert from 'node:assert/strict';
import test from 'node:test';
import type { GestureResponderEvent } from 'react-native';
import type { Segment } from '../src/content/mushafGeometry';
import type { ContinuousMushafPages } from '../src/features/quran/components/ContinuousMushafPages';
import { createBookViewportGesture } from '../src/features/quran/gestures/bookViewportGestures';
import { componentHarness, elements, loadComponentModule } from './helpers/componentHarness';

type Ref<T> = { current: T | null };
type Frame = ReturnType<typeof createBookViewportGesture>['handlers'] & {
  ref: Ref<{ measureInWindow(measured: (left: number, top: number) => void): void }>;
  onLayout(event: {
    nativeEvent: { layout: { x: number; y: number; width: number; height: number } };
  }): void;
};
type List = {
  ref: Ref<{ scrollToOffset(options: { offset: number }): void }>;
  onContentSizeChange(width: number, height: number): void;
  onScroll(event: { nativeEvent: { contentOffset: { x: number; y: number } } }): void;
  onViewableItemsChanged(event: { viewableItems: { item: number; isViewable: boolean }[] }): void;
};

function touch(x: number, y: number) {
  return {
    nativeEvent: { touches: [{ identifier: 1, pageX: x, pageY: y }] },
  } as unknown as GestureResponderEvent;
}

// Ten square leaves give independent expected offsets. The component and its
// gesture responder are real; only native views, artwork and measurements are supplied.
function reader(initialHighlight?: Segment) {
  const hooks = componentHarness();
  const { ContinuousMushafPages: renderBook } = loadComponentModule<{
    ContinuousMushafPages: typeof ContinuousMushafPages;
  }>(new URL('../src/features/quran/components/ContinuousMushafPages.tsx', import.meta.url), {
    react: hooks.react,
    'react-native': { View: 'View', ScrollView: 'ScrollView', FlatList: 'FlatList' },
    '../../../content/mushafGeometry': { printedPageRatio: () => 1 },
    '../gestures/bookViewportGestures': { createBookViewportGesture },
    '../layout/continuousMushafCrop': {
      continuousMushafCrop: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
    },
    '../layout/mushafCrop': { cropSegment: (segment: Segment) => segment, mushafCropZoom: () => 1 },
    './FullscreenExitButton': { FullscreenExitButton: 'Exit' },
    './PrintedMushafPage': { PrintedMushafPage: 'Page' },
  });
  const visible: number[] = [];
  const xOffsets: number[] = [];
  const yOffsets: number[] = [];
  const zoom = 2;
  const maximum = 10;
  function render(width: number) {
    const tree = hooks.render(() =>
      renderBook({
        edition: 'hafs',
        maximum,
        initialPage: 3,
        initialHighlight,
        width,
        zoom,
        retry: 0,
        onPageChange: (page) => visible.push(page),
        exitLabel: 'Exit',
        onExit() {},
        onZoom() {},
        onSelect() {},
        onError() {},
      }),
    );
    const viewport = elements(tree, 'View').find((el) => el.props.onStartShouldSetResponderCapture);
    assert.ok(viewport);
    const frame = viewport.props as unknown as Frame;
    const list = elements(tree, 'FlatList')[0]!.props as unknown as List;
    const horizontal = elements(tree, 'ScrollView')[0]!.props.ref as Ref<{
      scrollTo(options: { x: number }): void;
    }>;
    frame.ref.current = { measureInWindow: (measured) => measured(0, 0) };
    horizontal.current = { scrollTo: ({ x }) => xOffsets.push(x) };
    list.ref.current = { scrollToOffset: ({ offset }) => yOffsets.push(offset) };
    return {
      frame,
      layout: () => frame.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height: 100 } } }),
      content: (measuredWidth = width * zoom) =>
        list.onContentSizeChange(measuredWidth, maximum * measuredWidth),
      scroll: (y: number) => list.onScroll({ nativeEvent: { contentOffset: { x: 0, y } } }),
      page: (item: number) =>
        list.onViewableItemsChanged({ viewableItems: [{ item, isViewable: true }] }),
    };
  }
  return { render, visible, xOffsets, yOffsets };
}

test('a fullscreen pan that crosses a page publishes the final native page on release', () => {
  const book = reader();
  const view = book.render(100);
  view.layout();
  view.content();
  view.page(3);
  view.frame.onTouchStart(touch(50, 300));
  assert.ok(view.frame.onMoveShouldSetResponderCapture(touch(50, 275)));
  view.frame.onResponderGrant(touch(50, 275));
  view.frame.onResponderMove(touch(50, 60));
  assert.equal(book.yOffsets.at(-1), 640);
  view.scroll(640);
  view.page(4);
  // RN only reports a change in visible items. Releasing cannot supply the same event again.
  view.frame.onResponderRelease();
  assert.equal(book.visible.at(-1), 4);
});

test('a deep-linked highlight is made visible in either initial native layout order', () => {
  const highlight = { surah: 2, ayah: 7, x: 0, y: 0.9, width: 0.5, height: 0.05 };
  const results = [true, false].map((contentFirst) => {
    const book = reader(highlight);
    const view = book.render(100);
    if (contentFirst) {
      view.content();
      view.layout();
    } else {
      view.layout();
      view.content();
    }
    const y = book.yOffsets.at(-1);
    assert.ok(
      y !== undefined && y <= 580 && y + 100 >= 590,
      'the whole highlighted strip is visible',
    );
    return y;
  });
  assert.equal(results[0], results[1]);
});

test('rapid fullscreen width changes preserve both offsets through delayed native measurement', () => {
  const book = reader();
  const first = book.render(100);
  first.layout();
  first.content();
  first.frame.onTouchStart(touch(80, 50));
  assert.ok(first.frame.onMoveShouldSetResponderCapture(touch(60, 50)));
  first.frame.onResponderGrant(touch(60, 50));
  first.frame.onResponderRelease();
  first.scroll(400);
  assert.equal(book.xOffsets.at(-1), 20);
  book.render(150);
  const rotated = book.render(200);
  rotated.layout();
  rotated.content(300); // A late native event from the intermediate width.
  rotated.content();
  assert.equal(book.xOffsets.at(-1), 40);
  assert.equal(book.yOffsets.at(-1), 800, 'the same point on page three stays under the viewport');
});
