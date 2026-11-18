import type { RootStack } from '../../../app/navigation/types';
import { resolveBookEntry, type BookEntryState } from '../../../domain/bookPresentation';

type Point = { surah: number; ayah?: number };
/** Preserve explicit page only while still at the text position it came from. */
export function textToBook(
  context: RootStack['Reader'],
  current: Point,
  state: BookEntryState,
): RootStack['Mushaf'] {
  const samePoint = current.surah === context.surah && current.ayah === (context.ayah ?? 1);
  return resolveBookEntry(
    state,
    {
      ...context,
      ...current,
      page: samePoint ? context.page : undefined,
      ...(samePoint || !context.bookView ? {} : { bookView: undefined }),
    },
    context.bookPresentation ?? state.preferences.bookPresentation,
  );
}
/** The caller must supply an actually mapped point or a clearly identified last-known position. */
export function bookToText(
  context: RootStack['Mushaf'],
  current: Point,
  edition: RootStack['Mushaf']['edition'],
  page: number,
): RootStack['Reader'] {
  return { ...context, ...current, edition, page };
}
