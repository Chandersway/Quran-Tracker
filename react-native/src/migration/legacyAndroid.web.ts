import { initialState, type AppState } from '../state/models';
import { noLegacyDataResult, type LegacyImportResult } from './legacyRoom';

/** Android app-private Room data is not available to web builds. */
export async function importLegacyAndroidData(
  initial: AppState = initialState,
): Promise<LegacyImportResult> {
  return noLegacyDataResult(initial);
}
