import assert from 'node:assert/strict';
import test from 'node:test';
import * as checklist from '../src/domain/checklist';
import * as quran from '../src/domain/quran';
import * as content from '../src/content/quran';
import * as noteEditor from '../src/features/notes/editor/noteEditor';
import type { NoteLabels } from '../src/i18n/notes';
import type { usePracticeListAnchor } from '../src/features/practice/hooks/usePracticeListAnchor';
import { light } from '../src/shared/theme/colors';
import {
  change,
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

const copy = loadComponentModule<{ notesWords: { en: NoteLabels } }>(
  new URL('../src/i18n/notes.ts', import.meta.url),
  { './index': {} },
).notesWords.en;
const i18n = {
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
    format: (key: string, ...values: unknown[]) => `${key}:${values.join(',')}`,
  }),
};

test('checklist restores its saved stop, exposes quarter controls, and does not jump after a checkbox or stop change', async () => {
  const hooks = componentHarness();
  let saved: checklist.ChecklistState = { coverage: [], position: { scope: 'rub', number: 157 } };
  const scrolls: number[] = [];
  const anchorHook = loadComponentModule<{ usePracticeListAnchor: typeof usePracticeListAnchor }>(
    new URL('../src/features/practice/hooks/usePracticeListAnchor.ts', import.meta.url),
    { react: hooks.react },
    { setTimeout, clearTimeout },
  );
  const { ChecklistScreen } = loadComponentModule<{ ChecklistScreen: () => TestElement }>(
    new URL('../src/features/practice/screens/ChecklistScreen.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { View: 'View', Pressable: 'Pressable', FlatList: 'FlatList' },
      '@react-native-async-storage/async-storage': {
        getItem: async () => JSON.stringify(saved),
        setItem: async (_key: string, raw: string) => {
          saved = JSON.parse(raw);
        },
      },
      '../../../content/quran': content,
      '../../../domain/checklist': checklist,
      '../../../shared/components': { ...sharedComponents, s: {} },
      '../../../shared/theme': { usePalette: () => light },
      '../../../app/navigation/types': { useAppNavigation: () => ({ navigate() {} }) },
      '../../../i18n': i18n,
      '../hooks/usePracticeListAnchor': anchorHook,
    },
    { setTimeout, clearTimeout },
  );
  function renderChecklist() {
    const tree = hooks.render(ChecklistScreen);
    const list = elements(tree, 'FlatList')[0]!;
    // Native FlatList renders its header separately from renderItem. The generic
    // callback harness only expands rows, so expand the real header here too.
    const header = list.props.ListHeaderComponent;
    assert.ok(header, 'The introduction and mode controls scroll with the checklist');
    list.props.children = [list.props.children, typeof header === 'function' ? header() : header];
    return tree;
  }
  let tree = renderChecklist();
  const ref = elements(tree, 'FlatList')[0]!.props.ref as { current: unknown };
  ref.current = { scrollToIndex: ({ index }: { index: number }) => scrolls.push(index) };
  await new Promise(setImmediate);
  tree = renderChecklist();
  assert.equal(elements(tree, 'Segments')[0]!.props.value, 'hizb');
  assert.deepEqual(scrolls, [39]);
  const child = findElement(tree, 'View', 'testID', 'part-rub-157');
  press(elements(child, 'Pressable').find((node) => node.props.accessibilityRole === 'checkbox')!);
  await new Promise(setImmediate);
  tree = renderChecklist();
  assert.deepEqual(
    saved.coverage,
    checklist.toggleCoverage([], { scope: 'rub', number: 157 }, true),
  );
  const parent = findElement(tree, 'View', 'testID', 'part-hizb-40');
  const check = elements(parent, 'Pressable').find(
    (node) => node.props.accessibilityRole === 'checkbox',
  )!;
  assert.equal((check.props.accessibilityState as { checked: string }).checked, 'mixed');
  const nextChild = findElement(tree, 'View', 'testID', 'part-rub-158');
  press(findElement(nextChild, 'Button', 'title', 'checklist.stop'));
  await new Promise(setImmediate);
  tree = renderChecklist();
  (elements(tree, 'FlatList')[0]!.props.onContentSizeChange as () => void)();
  assert.deepEqual(scrolls, [39]);
  assert.deepEqual(saved.position, { scope: 'rub', number: 158 });
  change(elements(tree, 'Segments')[0]!, 'juz');
  tree = renderChecklist();
  assert.deepEqual(scrolls, [39, 19]);
  for (const number of [153, 154, 155, 156, 157, 158, 159, 160])
    assert.ok(findElement(tree, 'View', 'testID', `part-rub-${number}`));
});

test('note reference summaries use the same canonical opening text in every supported scope', () => {
  const hooks = componentHarness();
  const { NoteTargetSummary } = loadComponentModule<{
    NoteTargetSummary: (props: { target: quran.QuranNoteTarget }) => TestElement;
  }>(new URL('../src/features/notes/components/NoteTargetSummary.tsx', import.meta.url), {
    react: hooks.react,
    'react-native': { View: 'View' },
    '../../../content/quran': content,
    '../../../domain/checklist': checklist,
    '../../../domain/quran': quran,
    '../../../i18n': i18n,
    '../../../i18n/notes': { useNotesCopy: () => copy },
    '../../../shared/components': sharedComponents,
    '../editor/noteEditor': noteEditor,
  });
  for (const target of [
    { scope: 'juz', number: 30 },
    { scope: 'hizb', number: 60 },
    { scope: 'rub', number: 240 },
    { scope: 'surah', number: 114 },
    { scope: 'ayah', number: 2, ayah: 255 },
  ] as const) {
    const start =
      target.scope === 'ayah'
        ? { surah: 2, ayah: 255 }
        : checklist.versePoint(checklist.checklistRange(target)[0]);
    const tree = NoteTargetSummary({ target });
    const text = findElement(tree, 'T', 'arabic', true);
    assert.equal(
      (text.props.children as string[]).join(''),
      content.getAyahs(start.surah).find((row) => row.number === start.ayah)!.text,
    );
    if (target.scope !== 'ayah')
      assert.match(JSON.stringify(tree), new RegExp(`${start.surah}:${start.ayah}`));
  }
  assert.equal(
    elements(NoteTargetSummary({ target: { scope: 'ayah', number: 114, ayah: 999 } }), 'T')[0]!
      .props.arabic,
    undefined,
  );
});
