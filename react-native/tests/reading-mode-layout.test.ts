import test from 'node:test';
import assert from 'node:assert/strict';
import { isShortLandscape, useBookSpread } from '../src/features/quran/layout/readingLayout';
import { bookToText, textToBook } from '../src/features/quran/providers/readingModeContext';
import { initialState } from '../src/state/models';

test('phone landscape fits a single width-scrolling page; actual tablets may spread', () => {
  assert.equal(isShortLandscape(800, 360), true);
  assert.equal(isShortLandscape(900, 550), true);
  assert.equal(useBookSpread(900, 550, 860, 400), false);
  assert.equal(useBookSpread(1024, 768, 984, 600), true);
  assert.equal(useBookSpread(768, 1024, 728, 850), false);
});
test('mode switches preserve edition, page, plan and range without reusing a stale page', () => {
  const book = {
    surah: 2,
    ayah: 5,
    endSurah: 3,
    endAyah: 8,
    edition: 'muhammadi' as const,
    page: 4,
    planId: 'plan',
    readingTarget: { kind: 'hizb' as const, number: 2, name: 'Hizb 2' },
    bookPresentation: 'original' as const,
    originalEdition: 'muhammadi' as const,
    selectablePage: false,
  };
  const text = bookToText(book, { surah: 2, ayah: 5 }, book.edition, book.page);
  assert.deepEqual(textToBook(text, { surah: 2, ayah: 5 }, initialState), book);
  assert.deepEqual(textToBook(text, { surah: 2, ayah: 9 }, initialState), {
    ...book,
    ayah: 9,
    page: undefined,
  });
});
