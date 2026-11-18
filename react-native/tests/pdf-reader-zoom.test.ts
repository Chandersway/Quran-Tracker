import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as zoom from '../src/features/quran/layout/pdfZoom';
import * as readerCopy from '../src/features/quran/model/readerCopy';
import * as pdfCrop from '../src/features/quran/layout/pdfCrop';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay real PDF component handlers without a native renderer.
type Node = { type: string; props: Record<string, any>; children: unknown[] };

function pdfHarness(
  options: {
    size?: number;
    nativeAvailable?: boolean;
    cached?: string;
    prepare?: (signal: AbortSignal) => Promise<string>;
  } = {},
) {
  const slots: unknown[] = [];
  const selected: number[][] = [];
  const text: number[][] = [];
  const chrome: boolean[] = [];
  const header: boolean[] = [];
  const routeParams: unknown[] = [];
  const preparations: AbortSignal[] = [];
  const effects: (() => void)[] = [];
  let focused = true;
  let back: (() => boolean) | undefined;
  const navigation = {
    setOptions: (options: { headerShown: boolean }) => header.push(options.headerShown),
    setParams: (params: unknown) => routeParams.push(params),
  };
  const setChrome = (value: boolean) => chrome.push(value);
  let index = 0;
  const effect = (run: () => (() => void) | void, deps: unknown[]) => {
    const slot = index++;
    const previous = slots[slot] as { deps: unknown[]; cleanup?: () => void } | undefined;
    if (previous && previous.deps.every((value, i) => value === deps[i])) return;
    const current: { deps: unknown[]; cleanup?: () => void } = { deps };
    slots[slot] = current;
    effects.push(() => {
      previous?.cleanup?.();
      current.cleanup = run() ?? undefined;
    });
  };
  const react = {
    lazy: () => 'Pdf',
    Suspense: 'Suspense',
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useState(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof value === 'function' ? value() : value;
      return [
        slots[slot],
        (next: unknown) => {
          slots[slot] = typeof next === 'function' ? next(slots[slot]) : next;
        },
      ];
    },
    useEffect: effect,
    useLayoutEffect: effect,
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      View: 'View',
      ActivityIndicator: 'ActivityIndicator',
      BackHandler: {
        addEventListener: (_: string, handler: () => boolean) => {
          back = handler;
          return {
            remove: () => {
              back = undefined;
            },
          };
        },
      },
    },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-file-system': {
      File: class {
        exists = true;
        size = options.size ?? 100;
        modificationTime = 1;
        constructor(readonly uri: string) {}
      },
    },
    '@react-navigation/native': { useIsFocused: () => focused, useNavigation: () => navigation },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 16 }) },
    '../../../app/providers/AppChromeContext': { useAppChrome: () => setChrome },
    '../../../state/store': {
      useAppStore: () => ({ state: { mushafBookmarks: [] }, dispatch: () => undefined }),
    },
    '../../../state/reducer': { newId: () => 'pdf-test-session' },
    '../../../shared/components': {
      ...Object.fromEntries(
        ['Button', 'Field', 'IconButton', 'Notice', 'Screen', 'Sheet', 'T'].map((value) => [
          value,
          value,
        ]),
      ),
      s: { row: {} },
    },
    '../../../i18n': {
      useI18n: () => ({
        locale: 'nl',
        t: (value: string) => value,
        format: (value: string) => value,
      }),
    },
    '../../../services/mushaf/storage': {
      mushafFile: () => ({ exists: true, uri: 'file:///fixture-original.pdf' }),
    },
    '../../../services/mushaf/pdfCrop': {
      nativePdfCropAvailable: () => options.nativeAvailable ?? false,
    },
    './ReadingModeSwitch': { ReadingModeSwitch: 'ReadingModeSwitch' },
    './MushafReadingActions': { MushafReadingActions: 'MushafReadingActions' },
    './MushafFooter': { MushafFooter: 'MushafFooter' },
    './ReaderListenButton': { ReaderListenButton: 'ReaderListenButton' },
    '../../audio/providers/audioContext': { useAudio: () => ({ play: () => undefined }) },
    '../../../services/audio/audio': { createAudioService: () => ({ listSurah: async () => [] }) },
    '../layout/pdfZoom': zoom,
    '../model/readerCopy': readerCopy,
    '../model/croppedPdf': {
      cachedCroppedPdfUri: () => options.cached ?? null,
      prepareCroppedPdf: async (_file: unknown, signal: AbortSignal) => {
        preparations.push(signal);
        return options.prepare?.(signal) ?? options.cached ?? 'file:///cropped-fixture.pdf';
      },
    },
    '../layout/pdfCrop': pdfCrop,
  };
  const source = readFileSync(
    new URL('../src/features/quran/components/DownloadedPdfMushaf.native.tsx', import.meta.url),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: { DownloadedPdfMushaf?: (props: unknown) => Node } = {};
  vm.runInNewContext(compiled, {
    exports,
    process: { env: {} },
    AbortController,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  function render() {
    index = 0;
    const tree = exports.DownloadedPdfMushaf!({
      id: 'hafs_indopak_15',
      surah: 1,
      initialPage: 1,
      shortLandscape: false,
      onSelectable: (page: number, zoom: number) => selected.push([page, zoom]),
      onText: (page: number, zoom: number) => text.push([page, zoom]),
    });
    const nodes: Node[] = [];
    function visit(value: unknown) {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      const node = value as Node;
      nodes.push(node);
      visit(node.children);
    }
    visit(tree);
    for (const run of effects.splice(0)) run();
    return (type: string) =>
      nodes.find(
        (node) =>
          node.type === type ||
          node.props.testID === type ||
          node.props.name === type ||
          node.props.title === type,
      )!;
  }
  return {
    render,
    selected,
    text,
    chrome,
    header,
    routeParams,
    preparations,
    focus: (value: boolean) => {
      focused = value;
    },
    back: () => back,
  };
}

test('PDF footer follows native pinch zoom, applies bounded zoom commands and preserves original page order', async () => {
  const { render, selected, text, chrome, header, routeParams, focus, back } = pdfHarness();
  let find = render();
  assert.equal(find('Pdf'), undefined, 'original margins are not flashed before preparation');
  await new Promise<void>((resolve) => setImmediate(resolve));
  find = render();
  assert.equal(find('Pdf').props.source.uri, 'file:///cropped-fixture.pdf');
  assert.equal(find('Pdf').props.enableRTL, undefined);
  assert.equal(find('Pdf').props.enableDoubleTapZoom, true);
  assert.equal(find('Pdf').props.page, 1);
  assert.ok(
    find('MushafFooter'),
    'the actual footer footprint must exist before the PDF reports its count',
  );
  assert.equal(find('pdf-footer-layout').props.pointerEvents, 'none');
  assert.equal(find('pdf-footer-layout').props.style.opacity, 0);
  assert.equal(find('pdf-footer-layout').props.accessibilityElementsHidden, true);
  find('MushafFooter').props.onZoomIn();
  find('MushafFooter').props.onNext();
  find = render();
  assert.equal(
    find('Pdf').props.scale,
    1,
    'loading footer cannot issue zoom commands during geometry setup',
  );
  assert.equal(find('Pdf').props.page, 1);
  find('Pdf').props.onLoadComplete(612);
  find = render();
  assert.equal(find('pdf-footer-layout').props.pointerEvents, 'auto');
  assert.equal(find('pdf-footer-layout').props.style.opacity, 1);
  assert.equal(find('MushafFooter').props.maximum, 612);
  find('Pdf').props.onScaleChanged(2);
  find = render();
  assert.equal(find('Pdf').props.scale, 2);
  assert.equal(find('MushafFooter').props.zoom, 2);
  find('MushafFooter').props.onZoomIn();
  find = render();
  assert.equal(find('Pdf').props.scale, 2.25);
  for (const value of [NaN, Infinity, 0, 2.25000001]) find('Pdf').props.onScaleChanged(value);
  find = render();
  assert.equal(find('Pdf').props.scale, 2.25);
  find('Pdf').props.onScaleChanged(10);
  find = render();
  assert.equal(find('Pdf').props.scale, 3);
  find('MushafFooter').props.onNext();
  find = render();
  assert.equal(find('Pdf').props.page, 2);
  find('MushafFooter').props.onPrevious();
  find = render();
  assert.equal(find('Pdf').props.page, 1);
  find('Pdf').props.onPageChanged(73);
  find('Pdf').props.onScaleChanged(2.25);
  find = render();
  find('pdf-selectable').props.onPress();
  find('ReadingModeSwitch').props.onText();
  assert.deepEqual(
    selected,
    [[73, 2.25]],
    'Select passes the actual native page and zoom, never initialPage',
  );
  assert.deepEqual(text, [[73, 2.25]], 'Text switches also retain the actual print position');
  assert.ok(find('ReaderListenButton'), 'PDF has a visible primary Listen action');
  find('maximize').props.onPress();
  find = render();
  assert.equal(header.at(-1), false);
  assert.equal(chrome.at(-1), true);
  assert.equal(find('StatusBar').props.hidden, true);
  assert.equal(
    find('pdf-reading-actions'),
    undefined,
    'fullscreen removes permanent explanatory toolbar',
  );
  assert.equal(find('Pdf').props.page, 73);
  assert.equal(find('Pdf').props.scale, 2.25);
  assert.ok(find('MushafFooter').props.onZoomIn, 'fullscreen keeps +/- and real page navigation');
  assert.equal((routeParams.at(-1) as { fullscreen: boolean }).fullscreen, true);
  focus(false);
  find = render();
  assert.equal(chrome.at(-1), false, 'hidden retained PDF does not own global immersive chrome');
  assert.equal(back(), undefined);
  focus(true);
  find = render();
  assert.equal(chrome.at(-1), true);
  assert.equal(back()!(), true, 'Android back exits fullscreen before leaving the document');
  find = render();
  assert.equal(header.at(-1), true);
  assert.equal(chrome.at(-1), false);
  assert.ok(find('pdf-reading-actions'));
  assert.equal(find('Pdf').props.page, 73);
  assert.equal(find('Pdf').props.scale, 2.25);
  assert.equal((routeParams.at(-1) as { fullscreen: boolean }).fullscreen, false);
  find('Pdf').props.onError();
  find = render();
  assert.equal(
    find('Pdf').props.source.uri,
    'file:///fixture-original.pdf',
    'native crop decode failure recovers to the preserved original',
  );
  assert.equal(find('Pdf').props.page, 73);
  assert.equal(find('Pdf').props.scale, 2.25);
});

test('large PDFs open immediately in old shells and iOS, with explicit preparation still available', async () => {
  const reader = pdfHarness({ size: 51_351_963 });
  let find = reader.render();
  assert.equal(find('Pdf').props.source.uri, 'file:///fixture-original.pdf');
  assert.equal(reader.preparations.length, 0, 'no large automatic JS allocation or wait');
  find('more-horizontal').props.onPress();
  find = reader.render();
  find(readerCopy.readerCopy('nl').preparePdfCrop).props.onPress();
  find = reader.render();
  assert.equal(find('Pdf'), undefined, 'explicit preparation uses the existing progress view');
  assert.equal(reader.preparations.length, 1);
  await new Promise<void>((resolve) => setImmediate(resolve));
  find = reader.render();
  assert.equal(find('Pdf').props.source.uri, 'file:///cropped-fixture.pdf');
});

test('installed native worker automatically prepares large books and old shells reuse completed caches', async () => {
  const native = pdfHarness({ size: 51_351_963, nativeAvailable: true });
  let find = native.render();
  assert.equal(find('Pdf'), undefined);
  assert.equal(native.preparations.length, 1);
  await new Promise<void>((resolve) => setImmediate(resolve));
  find = native.render();
  assert.equal(find('Pdf').props.source.uri, 'file:///cropped-fixture.pdf');

  const cached = pdfHarness({ size: 51_351_963, cached: 'file:///already-cropped.pdf' });
  find = cached.render();
  assert.equal(find('Pdf').props.source.uri, 'file:///already-cropped.pdf');
  await new Promise<void>((resolve) => setImmediate(resolve));
  find = cached.render();
  assert.equal(find('Pdf').props.source.uri, 'file:///already-cropped.pdf');
});

test('original action cancels native preparation and late results cannot replace it', async () => {
  let finish!: (uri: string) => void;
  const reader = pdfHarness({
    size: 51_351_963,
    nativeAvailable: true,
    prepare: () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  });
  let find = reader.render();
  assert.equal(reader.preparations.length, 1);
  find(readerCopy.readerCopy('nl').originalPdf).props.onPress();
  find = reader.render();
  assert.equal(reader.preparations[0]!.aborted, true);
  assert.equal(find('Pdf').props.source.uri, 'file:///fixture-original.pdf');
  finish('file:///late-crop.pdf');
  await new Promise<void>((resolve) => setImmediate(resolve));
  find = reader.render();
  assert.equal(find('Pdf').props.source.uri, 'file:///fixture-original.pdf');
});

test('the JavaScript crop budget includes 32 MiB exactly and native preparation bypasses it', () => {
  assert.equal(pdfCrop.shouldAutomaticallyCropPdf(32 * 1024 * 1024, false), true);
  assert.equal(pdfCrop.shouldAutomaticallyCropPdf(32 * 1024 * 1024 + 1, false), false);
  assert.equal(pdfCrop.shouldAutomaticallyCropPdf(51_351_963, true), true);
});
