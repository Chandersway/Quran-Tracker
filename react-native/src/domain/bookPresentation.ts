import { getAyahs } from '../content/quran';
import { printedHafsPage } from '../content/mushafGeometry';
import type { BookSelectionOrigin, MushafReadingContext, ReadingContext } from './readingContext';
import type { AppState, BookPresentation, MushafEdition, Preferences } from '../state/models';
import { mushafPageRange } from './mushafReading';

export type BookEntryState = Pick<AppState, 'preferences' | 'cursor' | 'mushafPositions'>;
export type ResolvedBookEntry = MushafReadingContext & {
  edition: MushafEdition;
  originalEdition: MushafEdition;
  bookPresentation: BookPresentation;
  selectablePage: boolean;
};

export function normalizeBookPresentation(value: unknown): BookPresentation {
  return value === 'original' ? 'original' : 'selectable';
}

export function preferredMushafEdition(value: Preferences['mushaf']): MushafEdition {
  return value === 'text' || value === 'hafs_ayahinfo_1260' ? 'hafs' : value;
}

function canonicalHafsPage(surah: number, ayah: number): number {
  const page = getAyahs(surah).find((verse) => verse.number === ayah)?.page;
  if (!page) throw new RangeError('A known canonical Quran position is required');
  return page;
}

function verifiedHafsPage(page: number | undefined, surah: number, ayah: number): page is number {
  if (!Number.isInteger(page) || !page || page < 1 || page > 604) return false;
  const range = mushafPageRange('hafs', page);
  if (!range) return false;
  const key = surah * 1_000 + ayah;
  return (
    key >= range.start.surah * 1_000 + range.start.ayah &&
    key <= range.end.surah * 1_000 + range.end.ayah
  );
}

/** One book-entry policy. PDF indices never become Hafs pages; Warsh remains Warsh. */
export function resolveBookEntry(
  state: BookEntryState,
  context: ReadingContext,
  presentation?: BookPresentation,
): ResolvedBookEntry {
  const currentEdition = context.edition ?? preferredMushafEdition(state.preferences.mushaf);
  const originalEdition =
    currentEdition === 'hafs' && context.bookPresentation === 'selectable'
      ? (context.originalEdition ?? currentEdition)
      : currentEdition;
  const requested = normalizeBookPresentation(
    presentation ?? context.bookPresentation ?? state.preferences.bookPresentation,
  );
  // Warsh Maknoon has its own Unicode representation. Only an explicit route
  // choice enables it; an inherited global Hafs preference must not change the
  // default presentation or convert Warsh to Hafs.
  if (
    originalEdition === 'warsh_maknoon' &&
    requested === 'selectable' &&
    context.bookPresentation === 'selectable'
  ) {
    return {
      ...context,
      edition: originalEdition,
      originalEdition,
      page:
        currentEdition === originalEdition ? context.page : state.mushafPositions[originalEdition],
      bookPresentation: 'selectable',
      selectablePage: true,
    };
  }
  const warsh = originalEdition === 'warsh_maknoon' || originalEdition === 'muhammadi';
  const originalPage =
    currentEdition === 'hafs' &&
    originalEdition === 'hafs' &&
    context.bookPresentation === 'selectable' &&
    requested === 'original'
      ? printedHafsPage(context.surah, context.ayah ?? 1)
      : currentEdition === originalEdition
        ? context.page
        : state.mushafPositions[originalEdition];
  // An explicit library/resume choice can open the beginning of the PDF. A canonical
  // passage cannot use that index: IndoPak has no verified verse-to-page map.
  const canOpenOriginal =
    originalEdition !== 'hafs_indopak_15' ||
    originalPage !== undefined ||
    presentation === 'original';
  if ((requested === 'original' && canOpenOriginal) || warsh) {
    return {
      ...context,
      edition: originalEdition,
      originalEdition,
      page: originalPage ?? (originalEdition === 'hafs_indopak_15' ? 1 : undefined),
      bookPresentation: 'original',
      selectablePage: false,
    };
  }
  const canonical = canonicalHafsPage(context.surah, context.ayah ?? 1);
  const existingHafsPage = currentEdition === 'hafs' ? context.page : undefined;
  const explicitPage =
    context.bookPresentation === 'selectable' &&
    context.ayah === undefined &&
    existingHafsPage !== undefined
      ? mushafPageRange('hafs', existingHafsPage, 'selectable')
      : undefined;
  return {
    ...context,
    ...(explicitPage ? explicitPage.start : {}),
    edition: 'hafs',
    originalEdition,
    page:
      explicitPage || verifiedHafsPage(existingHafsPage, context.surah, context.ayah ?? 1)
        ? existingHafsPage
        : canonical,
    bookPresentation: 'selectable',
    selectablePage: true,
  };
}

/** Select is a temporary tool. The native original remains mounted below its pushed route. */
export function beginBookSelection(
  state: BookEntryState,
  context: MushafReadingContext & { edition: MushafEdition; page: number },
  routeKey?: string,
): ResolvedBookEntry {
  const original = resolveBookEntry(state, context);
  const selectionOrigin: BookSelectionOrigin = context.selectionOrigin ?? {
    routeKey,
    edition: original.edition,
    originalEdition: original.originalEdition,
    bookPresentation: original.bookPresentation,
    page: context.page,
    surah: context.surah,
    ayah: context.ayah,
    fullscreen: context.fullscreen,
    bookView: context.bookView,
  };
  return {
    ...resolveBookEntry(state, { ...original, bookPresentation: 'selectable' }, 'selectable'),
    selectionMode: true,
    selectionOrigin,
    bookView: undefined,
  };
}

/** Snapshot fallback for a restored navigation state whose original route no longer exists. */
export function restoreBookSelection(context: MushafReadingContext): MushafReadingContext {
  const { selectionOrigin, ...current } = context;
  if (!selectionOrigin) return { ...current, selectionMode: false };
  const { routeKey: _routeKey, ...original } = selectionOrigin;
  // A deliberate page turn can carry back only within this same verified
  // edition. A reconstructed Hafs page is never a PDF or another print's index.
  const crossesHafsLayouts =
    current.edition === 'hafs' &&
    original.edition === 'hafs' &&
    current.bookPresentation !== original.bookPresentation;
  const originPoint =
    original.ayah === undefined
      ? mushafPageRange(original.edition, original.page, original.bookPresentation)?.start
      : { surah: original.surah, ayah: original.ayah };
  const correspondingPage =
    crossesHafsLayouts && originPoint
      ? (current.bookPresentation === 'original' ? printedHafsPage : canonicalHafsPage)(
          originPoint.surah,
          originPoint.ayah,
        )
      : original.page;
  const changedPage = current.edition === original.edition && current.page !== correspondingPage;
  const changedRange =
    changedPage && current.page
      ? mushafPageRange(original.edition, current.page, current.bookPresentation)
      : null;
  return {
    ...current,
    ...original,
    selectablePage: original.bookPresentation === 'selectable',
    selectionMode: false,
    ...(changedRange
      ? {
          page: crossesHafsLayouts
            ? (original.bookPresentation === 'original' ? printedHafsPage : canonicalHafsPage)(
                changedRange.start.surah,
                changedRange.start.ayah,
              )
            : current.page,
          ...changedRange.start,
          bookView: original.bookView
            ? { ...original.bookView, horizontalOffset: 0, verticalAnchor: 0 }
            : undefined,
        }
      : {}),
  };
}

/** Only an earlier Mushaf with this exact key may receive the return; never pop an unrelated route. */
export function bookSelectionReturnDistance(
  context: MushafReadingContext,
  routes: readonly { key: string; name: string }[],
  currentIndex: number,
): number {
  const key = context.selectionOrigin?.routeKey;
  const index = key
    ? routes.findIndex((route) => route.key === key && route.name === 'Mushaf')
    : -1;
  return index >= 0 && index < currentIndex ? currentIndex - index : 0;
}
