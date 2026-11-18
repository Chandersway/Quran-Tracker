import type { MushafEdition, ReadingEntry } from '../state/models';
import { hafsReferences, pageSegments, type Edition } from '../content/mushafGeometry';
import { verseIndex, versePoint } from './checklist';

export function mushafPageRange(edition: MushafEdition, page: number): ReadingEntry['ayahRange'] {
  if (!['hafs', 'hafs_maknoon', 'warsh_maknoon', 'muhammadi'].includes(edition)) return undefined;
  const indexes: number[] = [];
  for (const segment of pageSegments(edition as Edition, page)) {
    try {
      for (const ayah of hafsReferences(edition as Edition, segment.surah, segment.ayah))
        indexes.push(verseIndex(segment.surah, ayah));
    } catch {
      return undefined;
    }
  }
  return indexes.length
    ? { start: versePoint(Math.min(...indexes)), end: versePoint(Math.max(...indexes)) }
    : undefined;
}
/** Quran book spreads read right to left: next/even page left, odd page right. */
export function mushafSpread(page: number, maximum: number, twoPages: boolean): number[] {
  const safe = Math.max(1, Math.min(maximum, Number.isFinite(page) ? Math.trunc(page) : 1));
  if (!twoPages) return [safe];
  const right = safe % 2 === 0 ? safe - 1 : safe;
  return right + 1 <= maximum ? [right + 1, right] : [right];
}
export function mushafPageEntry(
  edition: MushafEdition,
  page: number,
  sourceKey: string,
  title: string,
  now: number,
  date: string,
): ReadingEntry {
  const ayahRange = mushafPageRange(edition, page);
  if (!ayahRange) throw new Error('This page has no verified Quran content range');
  return {
    id: sourceKey,
    sourceKey,
    type: 'page',
    contentType: 'page',
    action: 'read',
    amount: 1,
    surahId: ayahRange?.start.surah ?? 0,
    surahName: title,
    timestamp: now,
    dateKey: date,
    ownerId: '',
    ayahRange,
    mushafPage: { edition, page },
  };
}

/** A reversible page mark is separate from previous session, imported and bulk reads. */
export function mushafPageMarkKey(edition: MushafEdition, page: number, ownerId: string): string {
  return `mushaf-page-mark:v1:${JSON.stringify([ownerId, edition, page])}`;
}

export function mushafPageMark(
  history: readonly ReadingEntry[],
  edition: MushafEdition,
  page: number,
  ownerId: string,
): ReadingEntry | undefined {
  const key = mushafPageMarkKey(edition, page, ownerId);
  return history.find(
    (row) =>
      row.id === key &&
      row.sourceKey === key &&
      row.ownerId === ownerId &&
      row.type === 'page' &&
      row.contentType === 'page' &&
      row.action === 'read' &&
      row.amount === 1 &&
      row.mushafPage?.edition === edition &&
      row.mushafPage.page === page,
  );
}

export type MushafPageMarkChange = {
  edition: MushafEdition;
  pages: readonly { page: number; title: string }[];
  marked: boolean;
  ownerId: string;
  now: number;
  date: string;
};

/** Set the intended state atomically; repeated callbacks cannot double-count or undo a new mark. */
export function setMushafPageMarks(
  history: ReadingEntry[],
  change: MushafPageMarkChange,
): ReadingEntry[] {
  const pages = [...new Map(change.pages.map((item) => [item.page, item])).values()].sort(
    (a, b) => a.page - b.page,
  );
  if (
    pages.length === 0 ||
    !Number.isFinite(change.now) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(change.date) ||
    pages.some(
      (item) => !Number.isInteger(item.page) || !mushafPageRange(change.edition, item.page),
    )
  )
    return history;

  const marks = pages.map(({ page }) =>
    mushafPageMark(history, change.edition, page, change.ownerId),
  );
  if (!change.marked) {
    // Delete only the exact records represented by the visible checks. Older page
    // sessions and historical coverage never become implicit deletion targets.
    const removing = new Set(marks.filter((row) => row !== undefined));
    return removing.size ? history.filter((row) => !removing.has(row)) : history;
  }
  const adding: ReadingEntry[] = [];
  for (const [index, { page, title }] of pages.entries()) {
    if (marks[index]) continue;
    const key = mushafPageMarkKey(change.edition, page, change.ownerId);
    // A malformed or unrelated row with this identity is user data too. Never
    // overwrite it, or create an ambiguous duplicate that unmark could remove.
    if (history.some((row) => row.id === key || row.sourceKey === key)) return history;
    adding.unshift({
      ...mushafPageEntry(change.edition, page, key, title, change.now, change.date),
      ownerId: change.ownerId,
    });
  }
  return adding.length ? [...adding, ...history] : history;
}
