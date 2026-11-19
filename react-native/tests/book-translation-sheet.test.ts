import assert from 'node:assert/strict';
import test from 'node:test';
import * as quran from '../src/content/quran';
import * as translations from '../src/content/translations';
import * as translation from '../src/domain/bookTranslation';
import type { BookPresentation } from '../src/state/models';
import { initialState } from '../src/state/models';
import { light } from '../src/shared/theme/colors';
import {
  componentHarness,
  elements,
  loadComponentModule,
  sharedComponents,
} from './helpers/componentHarness';

test('the real translation sheet switches pagination with its displayed book and keeps full NL/EN verses', () => {
  const hooks = componentHarness();
  let bookPresentation: BookPresentation = 'original';
  let language = 'nl';
  const pages = [120];
  const sheet = loadComponentModule<{ BookTranslationSheet: (props: object) => unknown }>(
    new URL('../src/features/quran/components/BookTranslationSheet.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { View: 'View', useWindowDimensions: () => ({ width: 390, height: 844 }) },
      '../../../content/quran': quran,
      '../../../content/translations': translations,
      '../../../domain/bookTranslation': translation,
      '../../../i18n': {
        useI18n: () => ({
          t: (key: string) => key,
          format: (key: string) => key,
          locale: language,
        }),
      },
      '../../../state/store': {
        useAppStore: () => ({
          state: {
            ...initialState,
            preferences: { ...initialState.preferences, translation: language },
          },
          dispatch() {},
        }),
      },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => light },
      '../layout/readingLayout': { isShortLandscape: () => false },
    },
  );
  const render = () =>
    hooks.render(() =>
      sheet.BookTranslationSheet({
        visible: true,
        edition: 'hafs',
        pages,
        bookPresentation,
        onClose() {},
        onReadText() {},
      }),
    );
  const verses = () => elements(render(), 'T').filter((row) => row.props.selectable);
  assert.equal(verses().length, 7);
  const expected = translation.bookTranslationVerses('hafs', pages, 'original');
  assert.deepEqual(
    verses().map((row) => row.props.children),
    expected.map(({ ayah }) => [translations.getAyahTranslation(ayah, 'nl')]),
  );
  language = 'en';
  assert.deepEqual(
    verses().map((row) => row.props.children),
    expected.map(({ ayah }) => [translations.getAyahTranslation(ayah, 'en')]),
  );
  bookPresentation = 'selectable';
  assert.equal(verses().length, 6, 'changing only the presentation invalidates the sheet memo');
});
