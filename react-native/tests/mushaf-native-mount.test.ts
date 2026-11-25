import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { buildSelectableMushafPage } from '../src/domain/selectableMushaf';
import * as pageDomain from '../src/domain/selectableMushaf';
import * as pageText from '../src/domain/selectableMushafText';
import * as gestures from '../src/features/quran/gestures/mushafTextGestures';
import * as pageTurn from '../src/features/quran/gestures/mushafPageTurn';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Native component lifecycle replay without a renderer.
type Node = { type: string; props: Record<string, any>; children: unknown[] };
type Effect = { deps: unknown[]; cleanup?: () => void };

function textBuffer(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textBuffer).join('');
  return value && typeof value === 'object' ? textBuffer((value as Node).children) : '';
}

function wordSpan(value: unknown): Node | undefined {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = wordSpan(child);
      if (found) return found;
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  const node = value as Node;
  return node.props?.key === 7 ? node : wordSpan(node.children);
}

function findMarker(value: unknown): Node | undefined {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findMarker(child);
      if (found) return found;
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  const node = value as Node;
  return node.props?.key === -7 ? node : findMarker(node.children);
}

test('each cached page reveals only its final fit, then binds after native layout and disposes its observer', async () => {
  const attached: number[] = [];
  const detached: number[] = [];
  const source = readFileSync(
    new URL('../src/features/quran/components/SelectableMushafPage.tsx', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  function mount(
    page: number,
    platform = 'android',
    edition = 'hafs',
    fontReady = true,
    markerReady = fontReady,
  ) {
    let slot = 0;
    const slots: unknown[] = [];
    const effects: Array<() => void> = [];
    const reports: unknown[] = [];
    const turns: number[] = [];
    let swipeNative: ((direction: 1 | -1) => void) | undefined;
    let surface: Node;
    let wordCalls = 0;
    const react = {
      Fragment: 'Fragment',
      createElement: (type: string, props: Node['props'], ...children: unknown[]) => {
        if (props?.ref)
          props.ref.current = {
            tag: props.testID === 'selectable-mushaf-page' ? page + 1000 : page,
            measure: (callback: (...values: number[]) => void) => callback(0, 0, 380, 560, 0, 0),
          };
        return { type, props: props ?? {}, children };
      },
      useState(value: unknown) {
        const index = slot++;
        if (!(index in slots)) slots[index] = value;
        return [
          slots[index],
          (next: unknown) => {
            slots[index] = typeof next === 'function' ? next(slots[index]) : next;
          },
        ];
      },
      useRef(value: unknown) {
        const index = slot++;
        if (!(index in slots)) slots[index] = { current: value };
        return slots[index];
      },
      useMemo: (fn: () => unknown) => fn(),
      useEffect(fn: () => (() => void) | void, deps: unknown[]) {
        const index = slot++;
        const prior = slots[index] as Effect | undefined;
        if (
          prior &&
          prior.deps.length === deps.length &&
          prior.deps.every((value, i) => value === deps[i])
        )
          return;
        const current: Effect = { deps };
        slots[index] = current;
        effects.push(() => {
          prior?.cleanup?.();
          current.cleanup = fn() ?? undefined;
        });
      },
    };
    function createFixture(requestedPage: number, requestedEdition: string) {
      const hafsFixture = buildSelectableMushafPage(requestedPage, [
        {
          verse_key: '3:2',
          words: [
            {
              id: 7,
              position: 1,
              page_number: requestedPage,
              line_number: 1,
              char_type_name: 'word',
              text_qpc_hafs: 'كَلِمَةٌ',
              text_uthmani: 'كَلِمَةٌ',
            },
          ],
        },
      ]);
      return requestedEdition === 'warsh_maknoon'
        ? {
            ...hafsFixture,
            edition: 'warsh_unicode' as const,
            sourceMushafId: null,
            layout: 'reconstructed' as const,
            sourceUrl: 'https://text.quran.ws/',
            lines: [
              ...hafsFixture.lines,
              { number: 16, kind: 'ayah' as const, centered: false, text: 'last-word', tokens: [] },
              {
                number: 17,
                kind: 'ayah' as const,
                centered: false,
                text: '﴿٥٧﴾',
                tokens: [
                  {
                    id: -7,
                    candidate: { surah: 7, ayah: 57, word: 0 },
                    text: '﴿٥٧﴾',
                    sourceText: '',
                    kind: 'end' as const,
                    line: 17,
                    start: 0,
                    end: 4,
                    alignment: { status: 'unavailable' as const, reason: 'end-marker' as const },
                  },
                ],
              },
            ],
          }
        : hafsFixture;
    }
    const fixture = createFixture(page, edition);
    const modules: Record<string, unknown> = {
      react,
      'react-native': {
        Text: 'Text',
        View: 'View',
        Pressable: 'Pressable',
        ActivityIndicator: 'ActivityIndicator',
        PixelRatio: { get: () => 2.625 },
        Platform: { OS: platform },
      },
      'expo-font': {
        useFonts: (map: Record<string, unknown>) => [
          Object.hasOwn(map, 'Amiri_400Regular') ? markerReady : fontReady,
          null,
        ],
      },
      '@expo-google-fonts/amiri/400Regular': { Amiri_400Regular: 'marker-font' },
      '../../../../assets/fonts/UthmanicHafs_V22.ttf': 'font',
      '../../../../assets/fonts/UthmanicWarsh-v-3.0.ttf': 'warsh-font',
      '../../../content/quran': { chapterById: () => ({ nameAr: '' }) },
      '../../../domain/selectableMushaf': pageDomain,
      '../../../domain/selectableMushafText': pageText,
      '../../../services/mushaf/selectableMushaf': {
        loadSelectableMushafPage: (
          requestedPage: number,
          _signal: unknown,
          requestedEdition: string,
        ) => Promise.resolve(createFixture(requestedPage, requestedEdition)),
      },
      '../gestures/mushafTextGestures': gestures,
      '../gestures/mushafPageTurn': pageTurn,
      '../gestures/mushafTextGestureBridge': {
        observeMushafText: (
          view: { tag: number },
          onSwipe: (direction: 1 | -1) => void,
          _onSelection: (active: boolean) => void,
          pageView: { tag: number },
        ) => {
          if (platform === 'web') return;
          assert.equal(
            pageView.tag,
            page + 1000,
            'native bounds belong to the outer page, not text',
          );
          swipeNative = onSwipe;
          attached.push(view.tag);
          return () => detached.push(view.tag);
        },
      },
    };
    const exports: { SelectableMushafPage?: (props: unknown) => Node } = {};
    vm.runInNewContext(output, {
      exports,
      AbortController,
      require: (name: string) => {
        assert.ok(name in modules, name);
        return modules[name];
      },
    });
    function render(
      maxWidth = 380,
      selectionEnabled = false,
      nextPage = page,
      nextEdition = edition,
    ) {
      slot = 0;
      const tree = exports.SelectableMushafPage!({
        page: nextPage,
        edition: nextEdition,
        maxWidth,
        maxHeight: 10000,
        selectionEnabled,
        labels: { loading: 'source-loading', preparing: 'fit-preparing' },
        onWordPress: () => {
          wordCalls++;
        },
        onUnavailableWord: () => {
          wordCalls++;
        },
        onPageLayout: (report: unknown) => reports.push(report),
        onPageTurn: (direction: number) => turns.push(direction),
      });
      surface = tree;
      effects.splice(0).forEach((effect) => effect());
      function find(value: unknown): Node | undefined {
        if (Array.isArray(value)) {
          for (const child of value) {
            const node = find(child);
            if (node) return node;
          }
          return;
        }
        if (!value || typeof value !== 'object') return;
        const node = value as Node;
        return node.props?.testID === 'selectable-mushaf-text' ? node : find(node.children);
      }
      return find(tree);
    }
    return {
      render,
      fixture,
      reports,
      wordCalls: () => wordCalls,
      turns,
      surface: () => surface,
      nativeSwipe: (direction: 1 | -1) => swipeNative!(direction),
      unmount: () => slots.forEach((value) => (value as Effect)?.cleanup?.()),
    };
  }
  for (const page of [50, 51, 50]) {
    const instance = mount(page);
    instance.render();
    assert.ok(textBuffer(instance.surface()).includes('source-loading'));
    await Promise.resolve();
    let text = instance.render()!;
    assert.ok(
      textBuffer(instance.surface()).includes('fit-preparing'),
      'local font preparation must not claim online downloading',
    );
    assert.equal(textBuffer(instance.surface()).includes('source-loading'), false);
    const originalBuffer = textBuffer(text);
    assert.equal(text.props.style.opacity, 0, 'intermediate font fitting must stay invisible');
    assert.equal(
      text.props.selectable,
      false,
      'measurement and reveal use the same non-selectable browsing host',
    );
    assert.equal(
      text.props.accessible,
      false,
      'hidden measuring text must not accept accessible activation',
    );
    assert.equal(text.props.accessibilityElementsHidden, true);
    wordSpan(text)!.props.onPress();
    assert.equal(
      instance.wordCalls(),
      0,
      'word actions must be disabled while native text is hidden',
    );
    assert.equal(
      attached.length,
      detached.length,
      'source/font readiness alone cannot bind an unmounted native Text',
    );
    text.props.onLayout();
    instance.render();
    assert.equal(
      attached.length,
      detached.length,
      'native layout alone cannot enable gestures while fitting',
    );
    const measured = pageText
      .selectablePageText(instance.fixture, () => '')
      .lines.map((line) => ({ text: line.text, width: 1000 }));
    text.props.onTextLayout({ nativeEvent: { lines: measured } });
    const beforeSize = text.props.style.fontSize;
    text = instance.render()!;
    assert.ok(
      text.props.style.fontSize < beforeSize,
      'native measurement still drives the fitting algorithm',
    );
    assert.equal(text.props.style.opacity, 0, 'resized iterations must also stay invisible');
    assert.equal(textBuffer(text), originalBuffer);
    text.props.onTextLayout({
      nativeEvent: { lines: measured.map((line) => ({ ...line, width: 100 })) },
    });
    text = instance.render()!;
    assert.equal(text.props.style.opacity, 1, 'only a verified final fit is revealed');
    assert.equal(text.props.selectable, false);
    assert.equal(
      textBuffer(text),
      originalBuffer,
      'revealing cannot change the copy/selection buffer',
    );
    assert.equal(attached.at(-1), page);
    const event = (touches: number) => ({
      nativeEvent: {
        pageX: 100,
        pageY: 100,
        touches: Array(touches).fill({ pageX: 100, pageY: 100 }),
      },
    });
    instance.surface().props.onTouchStart(event(1));
    instance.nativeSwipe(1);
    assert.deepEqual(
      instance.turns,
      [],
      'native UP must not unmount word spans before JS responder release',
    );
    instance.surface().props.onTouchEnd(event(0));
    await Promise.resolve();
    assert.deepEqual(instance.turns, [1], 'page turns only after the JS release dispatch finishes');
    instance.surface().props.onTouchStart(event(1));
    instance.nativeSwipe(-1);
    instance.surface().props.onTouchEnd(event(0));
    instance.unmount();
    await Promise.resolve();
    assert.deepEqual(instance.turns, [1], 'unmount cancels a queued page turn');
    assert.deepEqual(
      attached,
      detached,
      'old page observer must detach before the next page binds',
    );
  }
  assert.deepEqual(attached, [50, 51, 50]);
  const browser = mount(50, 'web');
  browser.render();
  await Promise.resolve();
  const browserText = browser.render()!;
  assert.equal(
    browserText.props.style.opacity,
    1,
    'web must remain usable without unsupported onTextLayout',
  );
  assert.equal(browserText.props.selectable, false);
  browserText.props.onLayout();
  browser.render();
  assert.deepEqual(
    JSON.parse(JSON.stringify(browser.reports)),
    [{ page: 50, status: 'expanded', lineCount: 0, scale: 1 }],
    'browser fallback must not claim measured fifteen-line fit',
  );
  browser.unmount();

  const warsh = mount(158, 'android', 'warsh_maknoon');
  warsh.render(380, true);
  await Promise.resolve();
  let warshText = warsh.render(380, true)!;
  assert.equal(warshText.props.style.fontFamily, 'QpcWarshOriginal');
  assert.equal(warshText.props.style.opacity, 1, 'Warsh is exposed as an expanded text layout');
  assert.equal(warshText.props.selectable, true);
  const warshBuffer = textBuffer(warshText);
  assert.equal(findMarker(warshText)?.props.style.fontFamily, 'Amiri_400Regular');
  assert.equal(
    wordSpan(warshText)?.props.style?.fontFamily,
    undefined,
    'source words inherit the Warsh font',
  );
  assert.ok(warshBuffer.includes('﴿٥٧﴾'), 'the marker font must not change copied digits');
  assert.ok(
    warshBuffer.includes('last-word'),
    'extra reconstructed lines remain in the native buffer',
  );
  warshText.props.onTextLayout({ nativeEvent: { lines: [{ text: 'overflow', width: 1000 }] } });
  warshText = warsh.render(380, true)!;
  assert.equal(textBuffer(warshText), warshBuffer, 'wrapping must not discard Warsh text');
  assert.equal(warshText.props.style.opacity, 1);
  warshText.props.onLayout();
  assert.equal((warsh.reports.at(-1) as { status: string }).status, 'expanded');
  warsh.unmount();

  const awaitingWarshFont = mount(158, 'android', 'warsh_maknoon', false);
  awaitingWarshFont.render(380, true);
  await Promise.resolve();
  assert.equal(awaitingWarshFont.render(380, true), undefined);
  assert.ok(textBuffer(awaitingWarshFont.surface()).includes('source-loading'));
  awaitingWarshFont.unmount();

  const awaitingMarkerFont = mount(158, 'android', 'warsh_maknoon', true, false);
  awaitingMarkerFont.render(380, true);
  await Promise.resolve();
  assert.equal(
    awaitingMarkerFont.render(380, true),
    undefined,
    'Warsh markers must not fall back to the wrong glyphs',
  );
  awaitingMarkerFont.unmount();

  const reused = mount(158);
  reused.render();
  await Promise.resolve();
  let reusedText = reused.render()!;
  const reusedLines = pageText
    .selectablePageText(reused.fixture, () => '')
    .lines.map((line) => ({ text: line.text, width: 100 }));
  reusedText.props.onTextLayout({ nativeEvent: { lines: reusedLines } });
  reusedText = reused.render()!;
  assert.equal(reusedText.props.style.opacity, 1);
  assert.equal(
    reused.render(380, true, 158, 'warsh_maknoon'),
    undefined,
    'old Hafs data must not flash in the Warsh font',
  );
  await Promise.resolve();
  reusedText = reused.render(380, true, 158, 'warsh_maknoon')!;
  assert.equal(reusedText.props.style.fontFamily, 'QpcWarshOriginal');
  assert.equal(
    reusedText.props.style.fontSize,
    ((380 * 1.47 - 380 * 0.17) / 15) * 0.73,
    'Hafs fit cannot shrink Warsh',
  );
  assert.ok(textBuffer(reusedText).includes('last-word'));
  assert.equal(
    reused.render(380, true, 159, 'warsh_maknoon'),
    undefined,
    'old page data must not flash on a new page',
  );
  await Promise.resolve();
  reusedText = reused.render(380, true, 159, 'warsh_maknoon')!;
  assert.equal(
    reusedText.props.key,
    'warsh_maknoon:159:select',
    'the native selection host is replaced for a new page',
  );
  reused.unmount();

  const mode = mount(52);
  mode.render();
  await Promise.resolve();
  let modeText = mode.render()!;
  modeText.props.onLayout();
  mode.render();
  modeText.props.onTextLayout({
    nativeEvent: {
      lines: pageText
        .selectablePageText(mode.fixture, () => '')
        .lines.map((line) => ({ text: line.text, width: 100 })),
    },
  });
  modeText = mode.render()!;
  assert.equal(attached.at(-1), 52);
  const browseBuffer = textBuffer(modeText);
  const event = (touches: number) => ({
    nativeEvent: { pageX: 100, pageY: 100, touches: Array(touches).fill({}) },
  });
  mode.surface().props.onTouchStart(event(1));
  mode.nativeSwipe(1);
  mode.surface().props.onTouchEnd(event(0));
  modeText = mode.render(380, true)!;
  assert.equal(modeText.props.selectable, true);
  assert.equal(modeText.props.key, 'hafs:52:select');
  assert.equal(wordSpan(modeText)!.props.onPress, undefined);
  assert.deepEqual(attached, detached, 'selection detaches the passive page observer');
  await Promise.resolve();
  assert.deepEqual(mode.turns, [], 'a queued browsing turn cannot fire after entering selection');
  modeText.props.onLayout();
  mode.render(380, true);
  mode.nativeSwipe(1);
  await Promise.resolve();
  assert.deepEqual(mode.turns, [], 'a late detached-observer event cannot turn selection pages');
  assert.equal(textBuffer(modeText), browseBuffer);
  modeText = mode.render(380, false)!;
  assert.equal(
    modeText.props.key,
    'hafs:52:browse',
    'leaving selection replaces the native selection host',
  );
  assert.equal(modeText.props.selectable, false);
  assert.deepEqual(attached, detached, 'new browsing host must lay out before observing it');
  modeText.props.onLayout();
  mode.render();
  assert.equal(attached.length, detached.length + 1);
  mode.unmount();
  assert.deepEqual(attached, detached);
});
