import assert from 'node:assert/strict';
import test from 'node:test';
import counts from '../src/content/generated/hafs-kfqc-page-counts.json';
import { versePoint } from '../src/domain/checklist';
import { bookTranslationVerses } from '../src/domain/bookTranslation';
import { mushafPageRange, setMushafPageMarks } from '../src/domain/mushafReading';
import { readPageMetrics } from '../src/features/quran/model/readPageMetrics';
import { mushafPageAyahCount } from '../src/content/mushafPageMetrics';
import { repeatSelection } from '../src/services/audio/repeatSelection';
import { repeatReciters } from '../src/domain/repeat';
import { initialState } from '../src/state/models';
import { decodeState } from '../src/state/persistence/decodeState';

test('all original Medina page ranges follow the independently verified publisher pagination', () => {
  let first = 0;
  for (let page = 1; page <= 604; page++) {
    const amount = counts.counts[page - 1]!;
    assert.deepEqual(
      mushafPageRange('hafs', page, 'original'),
      {
        start: versePoint(first),
        end: versePoint(first + amount - 1),
      },
      `printed page ${page}`,
    );
    assert.equal(mushafPageAyahCount('hafs', page, 'original'), amount);
    first += amount;
  }
  assert.equal(first, 6236);
});

test('translation, repeated audio and density use the displayed original page rather than its QPC namesake', () => {
  const page = 120;
  const range = mushafPageRange('hafs', page, 'original')!;
  const verses = bookTranslationVerses('hafs', [page], 'original');
  assert.equal(verses.length, 7);
  assert.equal(mushafPageAyahCount('hafs', page, 'selectable'), 6);
  assert.deepEqual({ surah: verses[0]!.surah, ayah: verses[0]!.ayah.number }, range.start);
  assert.deepEqual({ surah: verses.at(-1)!.surah, ayah: verses.at(-1)!.ayah.number }, range.end);
  const selection = repeatSelection(
    {
      mode: 'page',
      surah: range.start.surah,
      warsh: false,
      edition: 'hafs',
      pagePresentation: 'original',
      currentPage: page,
      from: 1,
      to: 1,
      fromPage: page,
      toPage: page,
    },
    repeatReciters.find((item) => item.id === 'alafasy')!,
  );
  assert.equal(selection.points.length, 7);
  assert.deepEqual(selection.points[0], range.start);
  assert.deepEqual(selection.points.at(-1), range.end);
  assert.deepEqual(bookTranslationVerses('hafs_indopak_15', [page], 'original'), []);
});

test('marking and unmarking a printed page cannot remove its independent selectable-page record', () => {
  const base = {
    edition: 'hafs' as const,
    pages: [{ page: 120, title: 'Page 120' }],
    marked: true,
    ownerId: 'presentation-test',
    now: Date.now(),
    date: '2026-11-19',
  };
  const old = setMushafPageMarks([], base);
  assert.equal(old.length, 1);
  assert.deepEqual(readPageMetrics(old, 'hafs', 604, undefined, 'original')(120, 120), {
    read: false,
  });
  const both = setMushafPageMarks(old, { ...base, bookPresentation: 'original' });
  assert.equal(both.length, 2);
  assert.notEqual(both[0]!.id, both[1]!.id);
  assert.notDeepEqual(both[0]!.ayahRange, both[1]!.ayahRange);
  const restored = decodeState(JSON.stringify({ ...initialState, history: both })).history;
  assert.deepEqual(restored, both);
  const remaining = setMushafPageMarks(restored, {
    ...base,
    bookPresentation: 'original',
    marked: false,
  });
  assert.deepEqual(remaining, old);
  assert.deepEqual(readPageMetrics(remaining, 'hafs', 604, undefined, 'selectable')(120, 120), {
    read: true,
  });
  assert.deepEqual(readPageMetrics(remaining, 'hafs', 604, undefined, 'original')(120, 120), {
    read: false,
  });
});
