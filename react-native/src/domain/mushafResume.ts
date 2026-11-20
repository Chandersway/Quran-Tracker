import type { AppState, BookPresentation, MushafEdition } from '../state/models';
import {
  normalizeBookPresentation,
  preferredMushafEdition,
  resolveBookEntry,
} from './bookPresentation';

type SavedPositions = Pick<AppState, 'mushafPositions' | 'mushafPositionPresentations'>;

/** Older Hafs positions lack a layout. Their canonical cursor can still locate the passage. */
export function savedMushafPage(
  state: SavedPositions,
  edition: MushafEdition,
  presentation: BookPresentation,
) {
  if (edition === 'hafs' && state.mushafPositionPresentations?.hafs !== presentation)
    return undefined;
  return state.mushafPositions[edition];
}

/** Shared normal entry for the dock and Continue Reading, using the durable presentation choice. */
export function mushafResume(state: SavedPositions & Pick<AppState, 'preferences' | 'cursor'>) {
  const edition = preferredMushafEdition(state.preferences.mushaf);
  const selectable =
    normalizeBookPresentation(state.preferences.bookPresentation) === 'selectable' &&
    edition !== 'warsh_maknoon' &&
    edition !== 'muhammadi';
  return resolveBookEntry(
    state,
    selectable
      ? {
          ...state.cursor,
          edition: 'hafs',
          originalEdition: edition,
          bookPresentation: 'selectable',
          page: savedMushafPage(state, 'hafs', 'selectable'),
        }
      : { ...state.cursor, edition, page: savedMushafPage(state, edition, 'original') },
    state.preferences.bookPresentation,
  );
}
