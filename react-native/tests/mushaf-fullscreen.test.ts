import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { continuousMushafCrop } from '../src/features/quran/layout/continuousMushafCrop';
import { pageSegments, printedPageRatio } from '../src/content/mushafGeometry';
import { createBookViewportGesture } from '../src/features/quran/gestures/bookViewportGestures';
import { cropSegment, mushafCropZoom } from '../src/features/quran/layout/mushafCrop';

test('continuous fullscreen lays out the whole original book and passes tap/hold to ayah actions', () => {
  const source = readFileSync(
    new URL('../src/features/quran/components/ContinuousMushafPages.tsx', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  // Native event props are exercised through the component produced by the real TSX.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Element = { type: string; props: Record<string, any>; children: Element[] };
  let index = 0;
  const slots: Array<{ current: unknown }> = [];
  const react = {
    createElement: (
      type: string,
      props: Record<string, unknown> | null,
      ...children: Element[]
    ) => ({ type, props: props ?? {}, children }),
    useMemo: (fn: () => unknown) => fn(),
    useRef: (current: unknown) => slots[index++] ?? (slots[index - 1] = { current }),
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': { FlatList: 'FlatList', ScrollView: 'ScrollView', View: 'View' },
    '../../../content/mushafGeometry': { printedPageRatio },
    '../gestures/bookViewportGestures': { createBookViewportGesture },
    '../layout/continuousMushafCrop': { continuousMushafCrop },
    '../layout/mushafCrop': { cropSegment, mushafCropZoom },
    './FullscreenExitButton': { FullscreenExitButton: 'FullscreenExitButton' },
    './PrintedMushafPage': { PrintedMushafPage: 'PrintedMushafPage' },
  };
  const exports: Record<string, (props: Record<string, unknown>) => Element> = {};
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const seen: number[] = [];
  const selected: unknown[][] = [];
  let exits = 0;
  const props = {
    edition: 'hafs',
    initialPage: 100,
    maximum: 604,
    width: 400,
    retry: 0,
    zoom: 1,
    onZoom: () => {},
    onPageChange: (n: number) => seen.push(n),
    onExit: () => exits++,
    exitLabel: 'Exit',
    onError: () => {},
    onSelect: (...value: unknown[]) => selected.push(value),
  };
  const render = (initialPage: number) => {
    index = 0;
    return exports.ContinuousMushafPages!({ ...props, initialPage });
  };
  function find(root: Element, type: string): Element | undefined {
    if (root.type === type) return root;
    for (const child of root.children) {
      const match = find(child, type);
      if (match) return match;
    }
  }
  const first = find(render(100), 'FlatList')!;
  first.props.onViewableItemsChanged({
    viewableItems: [
      { item: 100, isViewable: false },
      { item: 101, isViewable: true },
    ],
  });
  assert.deepEqual(seen, [101]);
  const root = render(101);
  const list = find(root, 'FlatList')!;
  assert.equal(
    list.props.initialScrollIndex,
    99,
    'reporting a new visible page must not reset the entry',
  );
  assert.equal(list.props.data[0], 1);
  assert.equal(list.props.data.at(-1), 604);
  assert.equal(list.props.showsVerticalScrollIndicator, false);
  const one = list.props.getItemLayout(list.props.data, 0);
  const two = list.props.getItemLayout(list.props.data, 1);
  const crop = continuousMushafCrop('hafs', 1);
  assert.equal(one.offset, 0);
  assert.equal(two.offset, one.length);
  assert.ok(
    Math.abs(
      one.length -
        (((400 * 917) / 622) * (1 - crop.top - crop.bottom)) / (1 - crop.left - crop.right),
    ) < 1e-8,
  );
  const row = list.props.renderItem({ item: 101 });
  assert.equal(row.type, 'PrintedMushafPage');
  assert.equal(row.props.page, 101);
  assert.equal(row.props.onLongPressSelect, true);
  const segment = pageSegments('hafs', 101, 'original')[0]!;
  row.props.onSelect(segment, 101);
  assert.deepEqual(selected, [[segment, 101]]);
  assert.equal(exits, 0);
  const button = find(root, 'FullscreenExitButton')!;
  assert.equal(button.props.label, 'Exit');
  button.props.onExit();
  assert.equal(exits, 1);
});

test('continuous Medina crop retains every mapped ayah and never applies to other editions', () => {
  for (let page = 1; page <= 604; page++) {
    const crop = continuousMushafCrop('hafs', page);
    for (const row of pageSegments('hafs', page, 'original')) {
      assert.ok(crop.left <= row.x + 0.0001);
      assert.ok(crop.right <= Math.max(0, 1 - row.x - row.width) + 0.0001);
      assert.ok(crop.top <= row.y + 0.0001);
      assert.ok(crop.bottom <= Math.max(0, 1 - row.y - row.height) + 0.0001);
    }
  }
  for (const edition of ['muhammadi', 'warsh_maknoon', 'hafs_maknoon'] as const)
    assert.deepEqual(continuousMushafCrop(edition, 1), { left: 0, right: 0, top: 0, bottom: 0 });
});
