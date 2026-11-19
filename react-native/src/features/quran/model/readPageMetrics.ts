import type { BookPresentation, MushafEdition, ReadingEntry } from '../../../state/models';
import { mushafPageRange } from '../../../domain/mushafReading';
import { statsHistoryRange } from '../../../domain/statistics';
import { verseIndex } from '../../../domain/checklist';

/**
 * A page registration proves only that printed edition's page. Its inclusive
 * ayah range may contain an ayah continued on the next page, so it must never
 * imply whole-ayah coverage in a different edition or on an adjacent page.
 * Whole-surah/ayah registrations can safely cover verified page ranges.
 */
export function readPageMetrics(
  history: readonly ReadingEntry[],
  edition: MushafEdition,
  maximum: number,
  pageRange: typeof mushafPageRange = mushafPageRange,
  bookPresentation?: BookPresentation,
) {
  const pages = new Set<number>();
  const ranges: [number, number][] = [];
  for (const row of history) {
    if (row.action !== 'read') continue;
    if (row.mushafPage) {
      if (
        row.mushafPage.edition === edition &&
        (edition !== 'hafs' ||
          (row.mushafPage.bookPresentation ?? 'selectable') === (bookPresentation ?? 'selectable'))
      )
        pages.add(row.mushafPage.page);
      continue;
    }
    const range = statsHistoryRange(row);
    if (range)
      ranges.push([
        verseIndex(range.start.surah, range.start.ayah),
        verseIndex(range.end.surah, range.end.ayah),
      ]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1] + 1) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([...range]);
  }
  const coverage = new Map<number, boolean | undefined>();
  for (let page = 1; page <= maximum; page++) {
    const range = pageRange(edition, page, bookPresentation);
    if (!range) {
      coverage.set(page, undefined);
      continue;
    }
    const start = verseIndex(range.start.surah, range.start.ayah);
    const end = verseIndex(range.end.surah, range.end.ayah);
    coverage.set(page, pages.has(page) || merged.some(([a, b]) => a <= start && b >= end));
  }
  return (firstPage: number, lastPage: number): { read: boolean } | undefined => {
    if (!Number.isInteger(firstPage) || !Number.isInteger(lastPage) || firstPage > lastPage)
      return undefined;
    let read = true;
    for (let page = firstPage; page <= lastPage; page++) {
      const value = coverage.get(page);
      if (value === undefined) return undefined;
      read &&= value;
    }
    return { read };
  };
}
