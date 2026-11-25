import { initialState, type AppState } from '../state/models';
import { noLegacyDataResult, type LegacyImportResult } from './legacyRoom';

/** Fallback for non-platform tooling; Metro selects the native or web sibling at runtime. */
export async function importLegacyAndroidData(
  initial: AppState = initialState,
): Promise<LegacyImportResult> {
  return noLegacyDataResult(initial);
}
