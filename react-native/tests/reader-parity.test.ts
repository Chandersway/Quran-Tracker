import * as continuousCrop from '../src/features/quran/layout/continuousMushafCrop';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import * as quran from '../src/content/quran';
import * as geometry from '../src/content/mushafGeometry';
import * as crop from '../src/features/quran/layout/mushafCrop';
import * as selection from '../src/domain/ayahSelection';
import * as asbab from '../src/domain/asbabDiscovery';
import { resolveReaderEntry, resolveRubStart, searchQuran } from '../src/domain/quranNavigation';
import { mushafPageRange } from '../src/domain/mushafReading';
import { initialState } from '../src/state/models';
import warshStarts from '../src/content/generated/warsh_rub_starts.json';
import { PDFDocument, degrees } from 'pdf-lib';
import { croppedPdfBox, cropPdfBytes } from '../src/features/quran/layout/pdfCrop';
import * as studyDomain from '../src/domain/study';
import * as studyRequest from '../src/services/study/studyRequest';
import * as studyProviders from '../src/services/study/studyProviders';
import similarData from '../src/content/generated/mutashabiha_data.json';

// Execute real component handlers while replacing only React/native and external I/O.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Element = { type: unknown; props: Record<string, any>; children: unknown[] };
function evaluate(
  path: string,
  modules: Record<string, unknown>,
  fallback?: (name: string) => unknown,
) {
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exports: Record<string, any> = {};
  new Function('require', 'exports', compiled)((name: string) => {
    if (name in modules) return modules[name];
    if (fallback) return fallback(name);
    throw new Error(`Unexpected dependency ${name}`);
  }, exports);
  return exports;
}
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const element = value as Element;
  return [element, ...nodes(element.children)];
}
const react = {
  createElement: (
    type: unknown,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ) => ({ type, props: props ?? {}, children }),
  useState: (initial: unknown) => [initial, () => {}],
  useEffect: () => {},
  memo: (component: unknown) => component,
};
const i18n = {
  useI18n: () => ({
    locale: 'en',
    t: (key: string) => key,
    format: (key: string, ...values: unknown[]) => `${key}:${values.join(',')}`,
  }),
};

function hookHarness() {
  let cursor = 0;
  const slots: unknown[] = [];
  const effects: Array<() => void> = [];
  const memo = <T>(factory: () => T, deps: unknown[]) => {
    const slot = cursor++;
    const old = slots[slot] as { deps: unknown[]; value: T } | undefined;
    if (old && deps.length === old.deps.length && deps.every((value, i) => value === old.deps[i]))
      return old.value;
    const value = factory();
    slots[slot] = { deps, value };
    return value;
  };
  return {
    react: {
      ...react,
      useState: (initial: unknown) => {
        const slot = cursor++;
        if (!(slot in slots)) slots[slot] = initial;
        return [
          slots[slot],
          (value: unknown) => {
            slots[slot] = typeof value === 'function' ? value(slots[slot]) : value;
          },
        ];
      },
      useMemo: memo,
      useEffect: (effect: () => void, deps: unknown[]) =>
        memo(() => {
          effects.push(effect);
        }, deps),
    },
    render: (run: () => unknown) => {
      cursor = 0;
      const tree = nodes(run());
      effects.splice(0).forEach((effect) => effect());
      return tree;
    },
  };
}

test('all 240 Warsh rub entries land on the validated printed ayah/page; direct hizb/juz routes are unchanged', () => {
  for (const expected of warshStarts.starts) {
    const actual = resolveRubStart('warsh_maknoon', expected.hizb, expected.quarter);
    assert.deepEqual(actual, {
      surah: expected.surah,
      ayah: expected.ayah,
      page: expected.page,
      printedAyah: expected.printedAyah,
    });
    const resolved = geometry.findMushafAyah('warsh_maknoon', actual.surah, actual.ayah)!;
    assert.equal(resolved.page, expected.page);
    assert.equal(resolved.segment.ayah, expected.printedAyah);
    const canonical = quran.divisions[expected.id - 1]!;
    const entry = resolveReaderEntry(
      {
        surah: canonical.surah,
        ayah: canonical.ayah,
        readingTarget: {
          kind: 'rub' as const,
          number: expected.hizb,
          subId: expected.quarter,
          name: '',
        },
      },
      'warsh_maknoon',
    );
    assert.equal(entry.surah, expected.surah);
    assert.equal(entry.ayah, expected.ayah);
  }
  for (const kind of ['hizb', 'juz'] as const) {
    for (let number = 1; number <= (kind === 'hizb' ? 60 : 30); number++) {
      const start = quran.divisions[(number - 1) * (kind === 'hizb' ? 4 : 8)]!;
      const context = {
        surah: start.surah,
        ayah: start.ayah,
        readingTarget: { kind, number, name: '' },
      };
      assert.strictEqual(resolveReaderEntry(context, 'warsh_maknoon'), context);
    }
  }
  assert.throws(() => resolveRubStart('warsh_maknoon', 10, 5), /Invalid rub/);
});

test('surah resume is independent for every surah and never overrides explicit navigation intent', () => {
  const positions = { '2': 255, '7': 58, '112': 3, '1': 88 };
  for (const [surah, ayah] of [
    [2, 255],
    [7, 58],
    [112, 3],
  ])
    assert.equal(resolveReaderEntry({ surah: surah! }, 'hafs', positions).ayah, ayah);
  assert.equal(resolveReaderEntry({ surah: 1 }, 'hafs', positions).ayah, undefined);
  for (const context of [
    { surah: 2, ayah: 1 },
    { surah: 2, page: 3 },
    { surah: 2, endSurah: 2, endAyah: 10 },
  ])
    assert.strictEqual(resolveReaderEntry(context, 'hafs', positions), context);
});

test('global search finds unvowelled Arabic and both preserved translations outside the current surah', () => {
  for (const [query, surah, ayah, language] of [
    ['قل هو الله احد', 112, 1, 'ar'],
    ['He neither begets nor is born', 112, 3, 'en'],
    ['Hij heeft niet verwekt', 112, 3, 'nl'],
  ] as const) {
    const match = searchQuran(query).find((row) => row.surah === surah && row.number === ayah);
    assert.ok(match, query);
    assert.equal(match.matched, language);
  }
  assert.equal(searchQuran('الله', 40).length, 40);
  assert.deepEqual(searchQuran('   '), []);
});

const assets = evaluate('src/content/generated/printedPages.ts', {}, (name) => {
  assert.ok(name.endsWith('.png'));
  return name;
}).printedPages;
const printedModules = {
  react: {
    ...react,
    useState: (initial: unknown) => [initial === null ? '<svg/>' : initial, () => {}],
  },
  'react-native': {
    ActivityIndicator: 'ActivityIndicator',
    Image: 'Image',
    Platform: { OS: 'android' },
    Pressable: 'Pressable',
    View: 'View',
  },
  'react-native-svg': { SvgXml: 'SvgXml' },
  fflate: {},
  'expo-file-system': {},
  '../../../content/generated/printedPages': { printedPages: assets },
  '../../../content/quran': quran,
  '../../../content/mushafGeometry': geometry,
  '../../../services/mushaf/storage': {
    mushafFile: () => ({ uri: 'file:///hafs.png', exists: true }),
  },
  '../../../shared/components': { T: 'T' },
  '../../../i18n': i18n,
  '../layout/mushafCrop': crop,
  '../layout/continuousMushafCrop': continuousCrop,
};
const PrintedMushafPage = evaluate(
  'src/features/quran/components/PrintedMushafPage.tsx',
  printedModules,
).PrintedMushafPage;

test('all 638 Muhammadi asset entries render the matching bundled original image', () => {
  assert.equal(Object.keys(assets.muhammadi).length, 638);
  for (let page = 1; page <= 638; page++) {
    const tree = nodes(
      PrintedMushafPage({
        edition: 'muhammadi',
        page,
        maxWidth: 400,
        maxHeight: 800,
        zoom: 1,
        retry: 0,
        selected: null,
        onSelect: () => {},
        onError: () => assert.fail('Unexpected image error'),
      }),
    );
    assert.equal(tree.find((node) => node.type === 'Image')?.props.source, assets.muhammadi[page]);
    assert.equal(
      tree.some((node) => node.type === 'T' && node.children.includes('rub.open.error')),
      false,
    );
  }
});

test('all original Hafs Maknoon and Medina PNGs match publisher pagination at their own physical coordinates', () => {
  for (let page = 1; page <= 604; page++) {
    assert.deepEqual(
      mushafPageRange('hafs_maknoon', page),
      mushafPageRange('hafs', page, 'original'),
    );
  }
  assert.equal(mushafPageRange('hafs_indopak_15', 50), undefined);
});

test('Maknoon 115%/112% crops transform original tap regions and highlights together at every user zoom', () => {
  assert.equal(crop.mushafCropZoom('hafs_maknoon'), 1.15);
  assert.equal(crop.mushafCropZoom('warsh_maknoon'), 1.12);
  for (const edition of ['hafs_maknoon', 'warsh_maknoon'] as const) {
    const segment = geometry
      .pageSegments(edition, 50)
      .find((row) => row.x > 0.1 && row.x < 0.8 && row.y > 0.1 && row.y < 0.8)!;
    const transformed = crop.cropSegment(segment, crop.mushafCropZoom(edition));
    for (const zoom of [1, 1.5, 3]) {
      let selected: geometry.Segment | null = null;
      const tree = nodes(
        PrintedMushafPage({
          edition,
          page: 50,
          maxWidth: 400,
          maxHeight: 800,
          zoom,
          retry: 0,
          selected: segment,
          onSelect: (value: geometry.Segment) => {
            selected = value;
          },
          onError: () => {},
        }),
      );
      const page = tree.find((node) => node.type === 'Pressable')!;
      page.props.onPress({
        nativeEvent: {
          locationX: (transformed.x + transformed.width / 2) * page.props.style.width,
          locationY: (transformed.y + transformed.height / 2) * page.props.style.height,
        },
      });
      assert.ok(selected);
      assert.equal((selected as geometry.Segment).ayah, segment.ayah);
      const highlight = tree.find((node) => node.props.style?.backgroundColor === '#D5B56B44')!;
      assert.ok(highlight);
      const selectedFirstStrip = crop.cropSegment(
        geometry
          .pageSegments(edition, 50)
          .find((row) => row.surah === segment.surah && row.ayah === segment.ayah)!,
        crop.mushafCropZoom(edition),
      );
      assert.equal(highlight.props.style.left, selectedFirstStrip.x * page.props.style.width);
    }
  }
});

test('continuous printed crop keeps click, long-press and highlight on the same original aya', () => {
  for (const edition of ['hafs', 'hafs_maknoon', 'warsh_maknoon'] as const) {
    const pageNumber = 50;
    const segment = geometry
      .pageSegments(edition, pageNumber, 'original')
      .find((row) => row.x > 0.1 && row.x < 0.8 && row.y > 0.1 && row.y < 0.8)!;
    const edge = continuousCrop.continuousMushafCrop(edition, pageNumber);
    const transformed = crop.cropSegment(segment, crop.mushafCropZoom(edition));
    const selected: Array<{ segment: geometry.Segment | null; page: number }> = [];
    const tree = nodes(
      PrintedMushafPage({
        edition,
        page: pageNumber,
        maxWidth: 400,
        maxHeight: 100000,
        zoom: 1,
        retry: 0,
        continuous: true,
        onLongPressSelect: true,
        selected: segment,
        onSelect: (value: geometry.Segment | null, page: number) =>
          selected.push({ segment: value, page }),
        onError: () => {},
      }),
    );
    const surface = tree.find((node) => node.type === 'Pressable')!;
    const originalWidth = surface.props.style.width / (1 - edge.left - edge.right);
    const originalHeight = surface.props.style.height / (1 - edge.top - edge.bottom);
    const event = {
      nativeEvent: {
        locationX: (transformed.x + transformed.width / 2 - edge.left) * originalWidth,
        locationY: (transformed.y + transformed.height / 2 - edge.top) * originalHeight,
      },
    };
    surface.props.onPress(event);
    surface.props.onLongPress(event);
    assert.equal(selected.length, 2);
    for (const value of selected) {
      assert.equal(value.page, pageNumber);
      assert.equal(value.segment?.surah, segment.surah);
      assert.equal(value.segment?.ayah, segment.ayah);
    }
    const firstStrip = geometry
      .pageSegments(edition, pageNumber, 'original')
      .find((row) => row.surah === segment.surah && row.ayah === segment.ayah)!;
    const shownStrip = crop.cropSegment(firstStrip, crop.mushafCropZoom(edition));
    const highlight = tree.find((node) => node.props.style?.backgroundColor === '#D5B56B44')!;
    assert.ok(highlight);
    assert.equal(highlight.props.style.left, (shownStrip.x - edge.left) * originalWidth);
    assert.equal(highlight.props.style.top, (shownStrip.y - edge.top) * originalHeight);
  }
});

test('measured source pixels hit the printed verse after continuous crop and zoom, excluding illuminated ornament', () => {
  for (const [filename, digest] of [
    [
      'hafs_madina_page_001.png',
      '9e6def8f0b5ef74547ccfca26e7964450365b62686626b067dec42298a61dc86',
    ],
    [
      'hafs_madina_page_050.png',
      '863544700d81412d202f79b09f976b801fe641eaaab0aa63e4188ec35bb198c2',
    ],
    ['warsh_page_001.png', '8fe254234b24a1a58c0ffa176d621aa965f6e661021b47d00d73dbfc0920d70f'],
    ['warsh_page_046.png', '876365c78d38003161f73539ddeeaad644b61cd6fec3bc81009ec980bfb9f97b'],
  ])
    assert.equal(
      createHash('sha256')
        .update(readFileSync(`assets/mushaf/${filename}`))
        .digest('hex'),
      digest,
    );
  const fixtures = [
    ['hafs', 1, 622, 917, 245, 408, [1, 1]],
    ['hafs', 1, 622, 917, 216, 442, [1, 2]],
    ['hafs', 1, 622, 917, 246, 147, null],
    ['hafs', 50, 622, 917, 509, 197, [3, 1]],
    ['hafs', 50, 622, 917, 245, 198, [3, 2]],
    ['hafs_maknoon', 50, 944, 1549, 798, 361, [3, 1]],
    ['hafs_maknoon', 50, 944, 1549, 366, 362, [3, 2]],
    ['muhammadi', 1, 850, 1223, 344, 470, [1, 1]],
    ['muhammadi', 1, 850, 1223, 200, 802, null],
    ['muhammadi', 2, 850, 1245, 190, 810, null],
    ['muhammadi', 3, 865, 1273, 502, 150, [2, 5]],
    ['muhammadi', 46, 850, 1245, 400, 900, [2, 281]],
  ] as const;
  for (const [edition, page, nativeWidth, nativeHeight, px, py, expected] of fixtures) {
    const edge = continuousCrop.continuousMushafCrop(edition, page);
    const magnification = crop.mushafCropZoom(edition);
    const received: Array<geometry.Segment | null> = [];
    const render = (selected: geometry.Segment | null) =>
      nodes(
        PrintedMushafPage({
          edition,
          page,
          maxWidth: 400,
          maxHeight: 100000,
          zoom: 1.75,
          retry: 0,
          selected,
          onSelect: (row: geometry.Segment | null) => received.push(row),
          onError: () => {},
          continuous: true,
          onLongPressSelect: true,
        }),
      );
    const surface = render(null).find((node) => node.type === 'Pressable')!;
    const scale = surface.props.style.width / (1 - edge.left - edge.right) / nativeWidth;
    const locationX =
      ((px - nativeWidth / 2) * magnification + nativeWidth / 2 - edge.left * nativeWidth) * scale;
    const locationY =
      ((py - nativeHeight / 2) * magnification + nativeHeight / 2 - edge.top * nativeHeight) *
      scale;
    const event = { nativeEvent: { locationX, locationY } };
    surface.props.onPress(event);
    surface.props.onLongPress(event);
    assert.equal(received.length, 2);
    for (const row of received)
      assert.deepEqual(
        row ? [row.surah, row.ayah] : null,
        expected,
        `${edition} ${page} @ ${px},${py}`,
      );
    if (!expected) continue;
    const highlights = render(received[0]!).filter(
      (node) => node.props.style?.backgroundColor === '#D5B56B44',
    );
    assert.ok(
      highlights.some(
        ({ props: { style } }) =>
          locationX >= style.left &&
          locationX <= style.left + style.width &&
          locationY >= style.top &&
          locationY <= style.top + style.height,
      ),
    );
  }
  for (const edition of ['hafs', 'hafs_maknoon'] as const)
    assert.equal(geometry.findMushafAyah(edition, 0, 0, 'original'), null);
});

test('unavailable original artwork cannot select an invisible mapped verse', () => {
  const missing = evaluate('src/features/quran/components/PrintedMushafPage.tsx', {
    ...printedModules,
    react,
    '../../../services/mushaf/storage': {
      mushafFile: () => ({ uri: 'file:///missing', exists: false }),
    },
  }).PrintedMushafPage;
  for (const edition of ['warsh_maknoon', 'hafs_maknoon'] as const) {
    const surface = nodes(
      missing({
        edition,
        page: 1,
        zoom: 1,
        maxWidth: 400,
        maxHeight: 800,
        retry: 0,
        selected: null,
        onSelect: () => assert.fail('invisible aya'),
        onError: () => {},
        onLongPressSelect: true,
      }),
    ).find((node) => node.type === 'Pressable')!;
    const event = { nativeEvent: { locationX: 200, locationY: 180 } };
    surface.props.onPress(event);
    surface.props.onLongPress(event);
  }
});

test('actual merged Warsh copy/share and word-details callbacks carry every canonical verse', async () => {
  let copied = '';
  let shared = '';
  const routes: unknown[][] = [];
  const exports = evaluate('src/features/quran/components/AyahActionsSheet.tsx', {
    react,
    'react-native': {
      View: 'View',
      Share: {
        share: async ({ message }: { message: string }) => {
          shared = message;
        },
      },
    },
    'expo-clipboard': {
      setStringAsync: async (message: string) => {
        copied = message;
      },
    },
    '../../../content/quran': quran,
    '../../../content/translations': { getAyahTranslation: () => '' },
    '../../../state/store': { useAppStore: () => ({ state: initialState, dispatch: () => {} }) },
    '../../../app/navigation/types': {
      useAppNavigation: () => ({ navigate: (...args: unknown[]) => routes.push(args) }),
    },
    '../../../shared/components': { Button: 'Button', Sheet: 'Sheet', T: 'T' },
    '../../../i18n': i18n,
    './ReadingModeSwitch': { TranslationControl: 'TranslationControl' },
    '../../../domain/ayahSelection': selection,
    '../../../domain/asbabDiscovery': asbab,
    '../../../services/study/studyProviders': { loadAsbabAvailability: async () => new Map() },
  });
  const verses = geometry
    .hafsReferences('warsh_maknoon', 1, 1)
    .map((number) => ({ ...quran.getAyahs(1)[number - 1]!, surah: 1 }));
  const tree = nodes(
    exports.AyahActionsSheet({
      ayah: verses[0],
      relatedAyahs: verses,
      onClose: () => {},
      onError: () => {},
    }),
  );
  for (const icon of ['copy', 'share-2', 'layers'])
    tree.find((node) => node.props.icon === icon)!.props.onPress();
  await Promise.resolve();
  for (const verse of verses) {
    assert.ok(copied.includes(verse.text));
    assert.ok(copied.includes(`1:${verse.number}`));
  }
  assert.equal(shared, copied);
  assert.deepEqual(routes[0], [
    'Study',
    {
      surah: 1,
      ayah: 1,
      mode: 'words',
      fixedReferences: [
        { surah: 1, ayah: 1 },
        { surah: 1, ayah: 2 },
      ],
    },
  ]);
  assert.equal(
    tree.some((node) => node.props.icon === 'sun'),
    false,
    'unindexed Asbab action is hidden',
  );
});

test('Asbab choices contain only indexed books, surahs and ayahs, intersecting a fixed selection', () => {
  const index = new Map([
    [
      2919,
      new Map([
        [2, [5, 10]],
        [3, [7]],
      ]),
    ],
    [460, new Map([[4, [9]]])],
  ]);
  assert.deepEqual(asbab.availableAsbabBooks(index, [{ surah: 2, ayah: 5 }]), [2919]);
  assert.deepEqual(asbab.availableAsbabSurahs(index, 2919), [2, 3]);
  assert.deepEqual(asbab.availableAsbabAyahs(index, 2919, 2), [5, 10]);
  assert.equal(asbab.hasAsbab(index, [{ surah: 2, ayah: 6 }]), false);
  assert.equal(
    asbab.hasAsbab(index, [
      { surah: 2, ayah: 6 },
      { surah: 4, ayah: 9 },
    ]),
    true,
  );
});

test('the actual Study screen retains every merged verse in words, bundled grammar and canonical lexicon routes', async () => {
  const harness = hookHarness();
  const requests: number[][] = [];
  const routes: unknown[][] = [];
  const exports = evaluate('src/features/study/screens/StudyScreen.tsx', {
    react: harness.react,
    'react-native': { Pressable: 'Pressable', View: 'View' },
    '../../../i18n': {
      ...i18n,
      restoreSourceCopy: (_language: unknown, copy: unknown) => copy,
      screenSourceKeys: { study: {} },
    },
    '../../../content/generated/mutashabiha_data.json': similarData,
    '../../../content/quran': quran,
    '../../../content/translations': { getAyahTranslation: () => '' },
    '../../../content/study': {
      getStudyAyah: async (surah: number, ayah: number) => {
        requests.push([surah, ayah]);
        return {
          number: ayah,
          words: [{ position: 1, arabic: `verse-${ayah}`, translation: '', transliteration: '' }],
          irab: `grammar-${surah}:${ayah}`,
        };
      },
    },
    '../../../shared/components': Object.fromEntries(
      ['Button', 'Icon', 'IconButton', 'Notice', 'Screen', 'Segments', 'T'].map((name) => [
        name,
        name,
      ]),
    ),
    '../../../shared/theme': { usePalette: () => ({ primary: 'green', line: 'gray' }) },
    '../../../app/navigation/types': {
      useAppNavigation: () => ({ navigate: (...args: unknown[]) => routes.push(args) }),
    },
    '../../../state/store': { useAppStore: () => ({ state: initialState }) },
    '../../../domain/study': studyDomain,
    '../../../services/study/studyRequest': studyRequest,
  });
  const props = {
    route: {
      params: {
        surah: 1,
        ayah: 1,
        mode: 'words',
        fixedReferences: [
          { surah: 1, ayah: 1 },
          { surah: 1, ayah: 2 },
        ],
      },
    },
  };
  const render = () =>
    harness.render(() => {
      const entry = exports.StudyScreen(props);
      return entry.type(entry.props);
    });
  render();
  await new Promise<void>((resolve) => setImmediate(resolve));
  const tree = render();
  assert.deepEqual(requests, [
    [1, 1],
    [1, 2],
  ]);
  const secondWord = tree.find(
    (node) => node.type === 'Pressable' && node.props.accessibilityLabel?.includes('verse-2'),
  );
  assert.ok(secondWord);
  secondWord.props.onPress();
  assert.deepEqual(routes[0], [
    'Lexicon',
    { kind: 'word', reference: { surah: 1, ayah: 2, word: 1 }, candidateText: 'verse-2' },
  ]);
  for (const verse of quran.getAyahs(1).slice(0, 2))
    assert.ok(tree.some((node) => node.children.includes(verse.text.trim())));
  tree.find((node) => node.type === 'Segments')!.props.onChange('irab');
  const grammar = render();
  for (const ayah of [1, 2]) {
    assert.ok(
      grammar.some((node) => node.children.includes(`grammar-1:${ayah}`)),
      `Merged Warsh selection must retain bundled grammar for canonical 1:${ayah}`,
    );
  }
});

test('actual Asbab source controls expose only indexed choices and retain contextual reference boundaries', async () => {
  const index = new Map([
    [
      2919,
      new Map([
        [2, [5, 10]],
        [3, [7]],
      ]),
    ],
    [460, new Map([[4, [9]]])],
  ]);
  for (const fixed of [false, true]) {
    const harness = hookHarness();
    const exports = evaluate('src/features/study/screens/StudySourceContent.tsx', {
      react: harness.react,
      'react-native': { ActivityIndicator: 'ActivityIndicator', Linking: {}, View: 'View' },
      '../../../i18n': i18n,
      '../../../../assets/translations/en_sahih.json': [],
      '../../../../assets/translations/nl_siregar.json': [],
      '../../../content/quran': quran,
      '../../../shared/components': Object.fromEntries(
        ['Button', 'Card', 'Field', 'Notice', 'Screen', 'Segments', 'T'].map((name) => [
          name,
          name,
        ]),
      ),
      '../../../shared/theme': { usePalette: () => ({ primary: 'green' }) },
      '../../../services/study/studyProviders': {
        ...studyProviders,
        loadAsbabAvailability: async () => index,
      },
      '../../../services/study/studyRequest': studyRequest,
      '../../../domain/asbabDiscovery': asbab,
      '../components/AvailableSourcePicker': { AvailableSourcePicker: 'AvailableSourcePicker' },
    });
    const params = {
      kind: 'asbab',
      surah: 2,
      ayah: 5,
      ...(fixed
        ? {
            fixedReferences: [
              { surah: 2, ayah: 5 },
              { surah: 2, ayah: 6 },
            ],
          }
        : {}),
    };
    const render = () => harness.render(() => exports.StudySourceContent({ params }));
    render();
    await new Promise<void>((resolve) => setImmediate(resolve));
    const tree = render();
    const books = tree.find((node) => node.type === 'Segments' && node.props.value === '2919')!
      .props.options;
    assert.deepEqual(
      books.map((row: { value: string }) => row.value),
      fixed ? ['2919'] : ['2919', '460'],
    );
    if (fixed) {
      const refs = tree.find((node) => node.type === 'Segments' && node.props.value === '2:5')!
        .props.options;
      assert.deepEqual(
        refs.map((row: { value: string }) => row.value),
        ['2:5'],
      );
    } else {
      const pickers = tree.filter((node) => node.type === 'AvailableSourcePicker');
      assert.deepEqual(
        pickers[0]!.props.options.map((row: { value: number }) => row.value),
        [2, 3],
      );
      assert.deepEqual(
        pickers[1]!.props.options.map((row: { value: number }) => row.value),
        [5, 10],
      );
      assert.equal(
        tree.some((node) => node.type === 'Field'),
        false,
      );
    }
  }
});

test('derived PDFs crop each rotated page while preserving original bytes, page count and cancellation', async () => {
  const source = await PDFDocument.create();
  for (const angle of [0, 90, 180, 270]) {
    const page = source.addPage([600, 800]);
    page.setRotation(degrees(angle));
    page.drawText('source text');
  }
  const bytes = await source.save();
  const untouched = Uint8Array.from(bytes);
  const result = await PDFDocument.load(await cropPdfBytes(bytes));
  assert.deepEqual(bytes, untouched);
  assert.equal(result.getPageCount(), 4);
  result.getPages().forEach((page, index) => {
    const expected = croppedPdfBox({ x: 0, y: 0, width: 600, height: 800 }, index * 90);
    assert.deepEqual(page.getCropBox(), expected);
    assert.deepEqual(page.getMediaBox(), expected);
    assert.ok(page.node.Contents(), 'original vector/text/image content remains present');
  });
  const box = result.getPage(0).getCropBox();
  assert.ok(Math.abs(box.x - 33) < 0.000001);
  assert.ok(Math.abs(box.y - 44) < 0.000001);
  assert.ok(Math.abs(box.width - 534) < 0.000001);
  assert.ok(Math.abs(box.height - 720) < 0.000001);
  await assert.rejects(cropPdfBytes(bytes, AbortSignal.abort()), /cancelled/);
});

test('PDF crop cache reuses source versions and never leaves a partial file or changes the original after cancellation', async () => {
  const files = new Map<string, { bytes: Uint8Array; modified: number }>();
  const behavior: {
    duringTransform?: () => void;
    duringWrite?: () => void;
    moveFailure?: boolean;
  } = {};
  class Directory {
    uri: string;
    constructor(...parts: Array<string | { uri: string }>) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    create() {}
  }
  class File extends Directory {
    get exists() {
      return files.has(this.uri);
    }
    get size() {
      return files.get(this.uri)?.bytes.length ?? 0;
    }
    get modificationTime() {
      return files.get(this.uri)?.modified ?? 0;
    }
    async bytes() {
      return Uint8Array.from(files.get(this.uri)!.bytes);
    }
    async write(bytes: Uint8Array) {
      await new Promise<void>((resolve) => setImmediate(resolve));
      files.set(this.uri, { bytes, modified: 1 });
      behavior.duringWrite?.();
    }
    delete() {
      files.delete(this.uri);
    }
    async move(target: File) {
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (behavior.moveFailure) throw new Error('Move failed');
      const entry = files.get(this.uri);
      if (!entry) throw new Error('Temporary file has not been written');
      files.set(target.uri, entry);
      files.delete(this.uri);
      // Expo File.move is asynchronous and mutates the source File object's URI.
      this.uri = target.uri;
    }
  }
  let transforms = 0;
  const exports = evaluate('src/features/quran/model/croppedPdf.ts', {
    'expo-file-system': { File, Directory, Paths: { cache: 'cache' } },
    '../../../services/mushaf/pdfCrop': { prepareNativePdfCrop: async () => false },
    '../layout/pdfCrop': {
      cropPdfBytes: async () => {
        transforms++;
        behavior.duringTransform?.();
        return new Uint8Array([3, 4, 5]);
      },
    },
  });
  const original = new File('original.pdf');
  await original.write(new Uint8Array([1, 2]));
  const first = await exports.prepareCroppedPdf(original, new AbortController().signal);
  assert.notEqual(first, original.uri);
  assert.equal(exports.cachedCroppedPdfUri(original), first);
  assert.equal(await exports.prepareCroppedPdf(original, new AbortController().signal), first);
  assert.equal(transforms, 1);
  assert.deepEqual(await original.bytes(), new Uint8Array([1, 2]));
  files.get(original.uri)!.modified = 2;
  assert.equal(exports.cachedCroppedPdfUri(original), null);
  const controller = new AbortController();
  behavior.duringTransform = () => controller.abort();
  await assert.rejects(exports.prepareCroppedPdf(original, controller.signal), /cancelled/);
  assert.equal(
    [...files.keys()].some((path) => path.endsWith('.partial')),
    false,
  );
  assert.deepEqual(await original.bytes(), new Uint8Array([1, 2]));
  behavior.duringTransform = undefined;
  const previousTransforms = transforms;
  const concurrent = await Promise.all([
    exports.prepareCroppedPdf(original, new AbortController().signal),
    exports.prepareCroppedPdf(original, new AbortController().signal),
  ]);
  assert.equal(concurrent[0], concurrent[1]);
  assert.equal(
    transforms,
    previousTransforms + 1,
    'simultaneous readers share the completed cache and never crop two large copies',
  );
  assert.ok(
    files.has(concurrent[0]),
    'cleanup must not delete the committed target after URI mutation',
  );

  files.get(original.uri)!.modified = 3;
  const writeAbort = new AbortController();
  behavior.duringWrite = () => writeAbort.abort();
  await assert.rejects(exports.prepareCroppedPdf(original, writeAbort.signal), /cancelled/);
  assert.equal(exports.cachedCroppedPdfUri(original), null);
  assert.equal(
    [...files.keys()].some((path) => path.endsWith('.partial')),
    false,
  );
  behavior.duringWrite = undefined;

  behavior.moveFailure = true;
  await assert.rejects(
    exports.prepareCroppedPdf(original, new AbortController().signal),
    /Move failed/,
  );
  assert.equal(
    [...files.keys()].some((path) => path.endsWith('.partial')),
    false,
  );
  assert.equal(exports.cachedCroppedPdfUri(original), null);
  behavior.moveFailure = false;
  const retried = await exports.prepareCroppedPdf(original, new AbortController().signal);
  assert.ok(
    files.has(retried),
    'a failed move can be retried without discarding its committed result',
  );

  files.get(original.uri)!.modified = 4;
  const emptyTarget = `cache/mushaf-crop-v1/${encodeURIComponent(original.uri)}-2-4.pdf`;
  files.set(emptyTarget, { bytes: new Uint8Array(), modified: 1 });
  assert.equal(exports.cachedCroppedPdfUri(original), null);
  assert.equal(
    await exports.prepareCroppedPdf(original, new AbortController().signal),
    emptyTarget,
  );
  assert.equal(files.get(emptyTarget)?.bytes.length, 3, 'an empty derived cache is replaced');
  assert.deepEqual(await original.bytes(), new Uint8Array([1, 2]));
});

test('individual Juz/Rub actions keep count, repeat, removal and cancellation independent from notes/navigation', () => {
  for (const target of [
    { kind: 'juz', number: 1 },
    { kind: 'rub', number: 10, subId: 4 },
  ] as const) {
    const actions: Array<{ type: string }> = [];
    const routes: unknown[][] = [];
    let closes = 0;
    const key = target.kind === 'juz' ? 'juz_1' : 'rub_10_4';
    const exports = evaluate('src/features/quran/components/PartActionsSheet.tsx', {
      react,
      '../../../shared/components': { Button: 'Button', Sheet: 'Sheet', T: 'T' },
      '../../../app/navigation/types': {
        useAppNavigation: () => ({ navigate: (...args: unknown[]) => routes.push(args) }),
      },
      '../../../state/store': {
        useAppStore: () => ({
          state: { progress: { [key]: { isRead: true, readCount: 3 } } },
          dispatch: (action: { type: string }) => actions.push(action),
        }),
      },
      '../../../state/reducer': {
        newId: () => 'new-reading',
        progressKey: (kind: string, number: number, subId: number) =>
          kind === 'rub' ? `${kind}_${number}_${subId}` : `${kind}_${number}`,
      },
      '../../../domain/localDate': { localDate: () => '2026-11-17' },
      '../../../domain/progressActions': { sourceRubName: () => 'Hizb 10 (1)' },
      '../../../i18n': i18n,
    });
    const tree = nodes(
      exports.PartActionsSheet({
        target,
        onClose: () => {
          closes++;
        },
      }),
    );
    assert.ok(
      tree.some((node) =>
        node.children.some((value) => typeof value === 'string' && value.includes('Read 3 times')),
      ),
    );
    tree.find((node) => node.props.title === 'common.cancel')!.props.onPress();
    assert.equal(actions.length, 0);
    assert.equal(closes, 1);
    tree.find((node) => node.props.title === 'common.markAgain')!.props.onPress();
    assert.equal(actions[0]?.type, 'checkIn');
    tree.find((node) => node.props.title === 'Remove read registration')!.props.onPress();
    assert.equal(actions[1]?.type, 'read/unmark');
    tree.find((node) => node.props.icon === 'edit-3')!.props.onPress();
    assert.deepEqual(routes[0], [
      'Notes',
      { target: { scope: target.kind, number: target.kind === 'rub' ? 40 : 1 } },
    ]);
  }
});
