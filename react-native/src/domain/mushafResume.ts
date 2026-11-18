import type { AppState } from '../state/models';
import {
  normalizeBookPresentation,
  preferredMushafEdition,
  resolveBookEntry,
} from './bookPresentation';

/** Shared normal entry for the dock and Continue Reading, using the durable presentation choice. */
export function mushafResume(state: Pick<AppState, 'preferences' | 'cursor' | 'mushafPositions'>) {
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
          page: state.mushafPositions.hafs,
        }
      : { ...state.cursor, edition, page: state.mushafPositions[edition] },
    state.preferences.bookPresentation,
  );
}
