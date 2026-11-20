import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import type { LexiconEntry } from '../src/services/lexicon/lexiconTypes';
import type { LexiconState } from '../src/features/lexicon/components/LexiconDetail';

type Element = { type: string; props: Record<string, unknown>; children: unknown[] };

function renderComponent(
  name: 'LexiconDetail' | 'LexiconSearch',
  props: Record<string, unknown>,
  locale: 'nl' | 'en' | 'ar',
) {
  const react = {
    Fragment: 'Fragment',
    createElement: (type: string, props: Record<string, unknown> | null, ...children: unknown[]) =>
      ({ type, props: props ?? {}, children }) satisfies Element,
    useState: (value: unknown) => [value, () => {}],
  };
  const dependencies: Record<string, unknown> = {
    react,
    'react-native': { FlatList: 'FlatList', View: 'View', Pressable: 'Pressable', Linking: {} },
    '../../../shared/components': {
      Button: 'Button',
      Card: 'Card',
      Notice: 'Notice',
      Screen: 'Screen',
      T: 'Text',
      Field: 'Field',
      Segments: 'Segments',
      s: {},
    },
    '../../../i18n': { useI18n: () => ({ locale }) },
    '../../../shared/theme': { usePalette: () => ({ line: '#000' }) },
    '../../../../assets/lexicon/lane-license.json': { text: 'Fixture license' },
  };
  const code = ts.transpileModule(
    readFileSync(`src/features/lexicon/components/${name}.tsx`, 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
  ).outputText;
  const exports: Record<string, (props: Record<string, unknown>) => Element> = {};
  vm.runInNewContext(code, {
    exports,
    require: (id: string) => {
      assert.ok(id in dependencies, `Unexpected dependency ${id}`);
      return dependencies[id];
    },
  });
  return exports[name]!(props);
}

const render = (state: LexiconState, locale: 'nl' | 'en' | 'ar') =>
  renderComponent(
    'LexiconDetail',
    { state, onRetry() {}, onOccurrence() {}, onRoot() {}, onLemma() {} },
    locale,
  );

function assertNativeText(node: unknown, textParent = false, path = 'LexiconDetail'): void {
  if (node === null || node === undefined || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    node.forEach((child) => assertNativeText(child, textParent, path));
    return;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    assert.ok(textParent, `Native raw text ${JSON.stringify(node)} under ${path}`);
    return;
  }
  const element = node as Element;
  const nextPath = `${path}/${element.type}`;
  element.children.forEach((child) => assertNativeText(child, element.type === 'Text', nextPath));
  if (element.type === 'FlatList') {
    assertNativeText(element.props.ListHeaderComponent, false, `${nextPath}/header`);
    assertNativeText(element.props.ListFooterComponent, false, `${nextPath}/footer`);
    for (const item of element.props.data as unknown[]) {
      assertNativeText(
        (element.props.renderItem as (props: { item: unknown }) => unknown)({ item }),
        false,
        `${nextPath}/item`,
      );
    }
  }
}

test('native lexicon screen renders every raw text child inside Text, including ready list boundaries', () => {
  const source = {
    name: 'Fixture',
    url: 'https://example.invalid',
    version: '1',
    license: 'Fixture',
    notice: 'Fixture',
  };
  const entry: LexiconEntry = {
    kind: 'word',
    word: 'Fixture',
    reference: { surah: 1, ayah: 1, word: 3 },
    transliteration: 'fixture',
    roots: [{ id: 'fixture', arabic: 'Fixture' }],
    lemmas: [{ id: 'fixture', arabic: 'Fixture' }],
    contextualMeanings: ['Fixture'],
    occurrences: [{ surah: 1, ayah: 1, word: 3, arabic: 'Fixture', gloss: 'Fixture' }],
    morphology: [
      { segment: 1, form: 'Fixture', arabic: 'Fixture', sourcePosTag: 'N', features: 'N' },
    ],
    lexicalDefinitions: [{ id: 'fixture', headword: 'Fixture', definition: 'Fixture', source }],
    lexicalDefinitionStatus: 'available',
    source,
    contextualMeaningSource: source,
    alignment: 'verified',
  };
  for (const locale of ['nl', 'en', 'ar'] as const) {
    for (const state of [
      { status: 'loading' },
      { status: 'error' },
      { status: 'unavailable' },
      { status: 'ready', value: entry },
      {
        status: 'ready',
        value: {
          ...entry,
          roots: [],
          lemmas: [],
          morphology: [],
          lexicalDefinitions: [],
          lexicalDefinitionStatus: 'unmapped',
        },
      },
    ] satisfies LexiconState[])
      assertNativeText(render(state, locale));
  }
});

test('native root and lemma search render only Text children across list and search states', () => {
  for (const locale of ['nl', 'en', 'ar'] as const) {
    for (const kind of ['root', 'lemma']) {
      for (const status of ['idle', 'loading', 'error', 'ready']) {
        for (const results of [[], [{ id: 'fixture', arabic: 'Fixture', occurrenceCount: 1 }]]) {
          assertNativeText(
            renderComponent(
              'LexiconSearch',
              {
                locale,
                kind,
                status,
                results,
                query: '',
                onKind() {},
                onChange() {},
                onSearch() {},
                onOpen() {},
              },
              locale,
            ),
            false,
            'LexiconSearch',
          );
        }
      }
    }
  }
});
