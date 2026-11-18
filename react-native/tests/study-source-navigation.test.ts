import assert from 'node:assert/strict';
import test from 'node:test';
import * as quran from '../src/content/quran';
import * as providers from '../src/services/study/studyProviders';
import * as request from '../src/services/study/studyRequest';
import * as asbab from '../src/domain/asbabDiscovery';
import {
  componentHarness,
  elements,
  loadComponentModule,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

function mount(params: Record<string, unknown>) {
  const loads: Array<[number, number]> = [];
  const harness = componentHarness();
  const module = loadComponentModule<{ StudySourceContent: (props: unknown) => TestElement }>(
    new URL('../src/features/study/screens/StudySourceContent.tsx', import.meta.url),
    {
      react: harness.react,
      'react-native': { ActivityIndicator: 'ActivityIndicator', Linking: {}, View: 'View' },
      '../../../i18n': {
        useI18n: () => ({
          locale: 'en',
          t: (key: string) => key,
          format: (key: string, ...values: unknown[]) => `${key}:${values.join(',')}`,
        }),
      },
      '../../../../assets/translations/en_sahih.json': [],
      '../../../../assets/translations/nl_siregar.json': [],
      '../../../content/quran': quran,
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => ({ primary: 'green' }) },
      '../../../services/study/studyProviders': {
        ...providers,
        loadTafsir: async (surah: number, ayah: number) => {
          loads.push([surah, ayah]);
          return `tafsir-${surah}:${ayah}`;
        },
      },
      '../../../services/study/studyRequest': request,
      '../../../domain/asbabDiscovery': asbab,
      '../components/AvailableSourcePicker': { AvailableSourcePicker: 'AvailableSourcePicker' },
    },
    { fetch },
  );
  let tree = harness.render(() => module.StudySourceContent({ params }));
  const nodes = () =>
    elements(tree).map((node) => ({ ...node, children: node.props.children as unknown[] }));
  const app = {
    get nodes() {
      return nodes();
    },
    find(
      type: string,
      predicate: (node: ReturnType<typeof nodes>[number]) => boolean = () => true,
    ) {
      const found = nodes().find((node) => node.type === type && predicate(node));
      assert.ok(found, `${type} node should exist`);
      return found as typeof found & { props: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    async settle() {
      for (let i = 0; i < 4; i++) {
        tree = harness.render(() => module.StudySourceContent({ params }));
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
    },
  };
  return { app, loads };
}

test('tafsir restores named surah discovery and previous/next ayah reading within chapter bounds', async () => {
  const { app, loads } = mount({ kind: 'tafsir', surah: 1, ayah: 1 });
  const previous = () => app.find('IconButton', (node) => node.props.label === 'ui.study.previous');
  const next = () => app.find('IconButton', (node) => node.props.label === 'ui.study.next');
  assert.equal(previous().props.disabled, true);
  next().props.onPress();
  await app.settle();
  assert.deepEqual(loads, [[1, 2]]);
  assert.ok(app.nodes.some((node) => node.children.includes('tafsir-1:2')));
  previous().props.onPress();
  await app.settle();
  assert.deepEqual(loads, [
    [1, 2],
    [1, 1],
  ]);
  assert.equal(previous().props.disabled, true);
  app
    .find('Field', (node) => String(node.props.label).startsWith('irab.ayah'))
    .props.onChangeText('7');
  await app.settle();
  assert.equal(next().props.disabled, true);
  const surahs = app.find('AvailableSourcePicker');
  assert.equal(surahs.props.options.length, 114);
  assert.ok(surahs.props.options[1].label.includes(quran.chapters[1]!.nameAr));
  surahs.props.onChange(114);
  await app.settle();
  assert.equal(
    app.find('Field', (node) => String(node.props.label).startsWith('irab.ayah')).props.value,
    '1',
  );
  assert.equal(previous().props.disabled, true);
});

test('contextual tafsir keeps its selected canonical set instead of offering unrestricted ayah stepping', async () => {
  const { app } = mount({
    kind: 'tafsir',
    surah: 1,
    ayah: 1,
    fixedReferences: [
      { surah: 1, ayah: 1 },
      { surah: 1, ayah: 2 },
    ],
  });
  await app.settle();
  assert.equal(
    app.nodes.some((node) => node.type === 'IconButton'),
    false,
  );
  assert.equal(
    app.nodes.some((node) => node.type === 'AvailableSourcePicker'),
    false,
  );
  assert.equal(app.find('Segments', (node) => node.props.value === '1:1').props.options.length, 2);
});
