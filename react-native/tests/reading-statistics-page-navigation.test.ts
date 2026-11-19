import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterById } from '../src/content/quran';
import { resolveBookEntry } from '../src/domain/bookPresentation';
import { localDate } from '../src/domain/localDate';
import { mushafPageEntry } from '../src/domain/mushafReading';
import type { MushafReadingContext } from '../src/domain/readingContext';
import * as statistics from '../src/domain/statistics';
import { light } from '../src/shared/theme/colors';
import { initialState, type BookPresentation, type ReadingEntry } from '../src/state/models';
import {
  componentHarness,
  elements,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

test('tapping page history reopens printed and selectable Hafs plus legacy marks in their saved editions', () => {
  const cases: {
    edition: 'hafs' | 'hafs_maknoon';
    stored?: BookPresentation;
    expected: BookPresentation;
  }[] = [
    { edition: 'hafs', stored: 'original', expected: 'original' },
    { edition: 'hafs', stored: 'selectable', expected: 'selectable' },
    { edition: 'hafs', expected: 'selectable' },
    { edition: 'hafs_maknoon', expected: 'original' },
  ];
  const page = 121;
  const history = cases.map(({ edition, stored }, i) =>
    mushafPageEntry(edition, page, `mark-${i}`, 'Page 121', i, '2026-11-19', stored),
  );
  assert.deepEqual(history[0]!.ayahRange!.start, { surah: 5, ayah: 78 });
  assert.deepEqual(history[1]!.ayahRange!.start, { surah: 5, ayah: 77 });

  const hooks = componentHarness();
  const state = { ...initialState, history };
  const opened: { route: string; target: MushafReadingContext }[] = [];
  const { ReadingStatisticsOverview } = loadComponentModule<{
    ReadingStatisticsOverview: (props: { home: boolean }) => unknown;
  }>(
    new URL('../src/features/practice/components/ReadingStatisticsOverview.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': {
        View: 'View',
        Pressable: 'Pressable',
        Modal: 'Modal',
        FlatList: 'FlatList',
        StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 },
      },
      'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
      '../../../content/quran': { chapterById },
      '../../../domain/statistics': statistics,
      '../../../domain/localDate': { localDate },
      '../../../state/store': { useAppStore: () => ({ state }) },
      '../../../app/navigation/types': {
        useAppNavigation: () => ({
          navigate: (route: string, target: MushafReadingContext) =>
            opened.push({ route, target: { ...target } }),
        }),
      },
      '../../../i18n': {
        sourceText: (key: string) => key,
        useI18n: () => ({ locale: 'en', t: (key: string) => key, format: (key: string) => key }),
      },
      '../../../shared/components': { ...sharedComponents, s: {} },
      '../../../shared/components/ProgressRing': { ProgressRing: 'ProgressRing' },
      '../../../shared/theme': { usePalette: () => light },
      './ReadingDistributionRing': { ReadingDistributionRing: 'ReadingDistributionRing' },
      './ReadingStatisticsSummary': { ReadingStatisticsSummary: 'ReadingStatisticsSummary' },
      './StatisticsSurface': { StatisticsSurface: 'StatisticsSurface' },
      '../components/ArabicWatermark': { ArabicWatermark: 'ArabicWatermark' },
      '../components/StatisticsHistory': { StatisticsHistory: 'StatisticsHistory' },
    },
  );
  const tree = hooks.render(() => ReadingStatisticsOverview({ home: false }));
  const list = elements(tree, 'StatisticsHistory')[0]!;
  assert.equal(list.props.history, history);
  const renderRow = list.props.renderRow as (entry: ReadingEntry) => TestElement;
  history.forEach((entry) => {
    const row = renderRow(entry);
    assert.equal(row.props.disabled, false);
    press(row);
  });
  assert.equal(opened.length, cases.length);
  for (const [i, { edition, expected }] of cases.entries()) {
    const { route, target } = opened[i]!;
    assert.equal(route, 'Mushaf');
    assert.deepEqual(target, {
      edition,
      page,
      bookPresentation: expected,
      ...history[i]!.ayahRange!.start,
    });
    const resolved = resolveBookEntry(state, target);
    assert.equal(resolved.edition, edition);
    assert.equal(resolved.bookPresentation, expected);
    assert.equal(resolved.page, page);
  }
});
