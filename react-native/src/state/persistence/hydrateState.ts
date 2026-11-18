import { initialState, type AppState } from '../models';
import { legacyChecklistToState, type LegacyImportResult } from '../../migration/legacyRoom';
import { decodeState } from './decodeState';
import { importedPresentation } from './importedPresentation';

export const stateStorageKey = 'wirdna:state:v1';
export const legacyMigrationKey = 'wirdna:migration:android-room-v1:complete';
const checklistKey = 'wirdna:checklist:v1';

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};

async function finishLegacyMigration(
  storage: Storage,
  state: AppState,
  databaseVersion = state.legacyAndroid?.databaseVersion ?? 0,
): Promise<void> {
  const checklist = legacyChecklistToState(state.legacyAndroid?.readingChecklist ?? null);
  if (checklist && (await storage.getItem(checklistKey)) === null)
    await storage.setItem(checklistKey, JSON.stringify(checklist));
  await storage.setItem(
    legacyMigrationKey,
    JSON.stringify({
      completedAt: Date.now(),
      databaseVersion,
    }),
  );
}

/** Hydrate before mounting the writable store. Failures leave the original snapshot intact. */
export async function hydrateState(
  storage: Storage,
  importLegacy: (initial: AppState) => Promise<LegacyImportResult>,
): Promise<AppState> {
  const raw = await storage.getItem(stateStorageKey);
  if (raw !== null) {
    // Decode before any sidecar writes. An empty or damaged saved value is still user
    // data: it must never trigger a fresh migration or be replaced with defaults.
    const state = decodeState(raw);
    if (state.legacyAndroid && !(await storage.getItem(legacyMigrationKey)))
      await finishLegacyMigration(storage, state);
    return state;
  }

  const migration = await importLegacy(initialState);
  if (migration.warnings.length)
    throw new Error(
      `Legacy local data could not be migrated safely. ${migration.warnings.join(' ')}`,
    );
  if (migration.sourceFound && !migration.imported)
    throw new Error(
      'Legacy local data was found but could not be imported. Existing data is still present.',
    );
  if (migration.imported) {
    const state = importedPresentation(migration.state);
    // Durable app state first, checklist sidecar second, completion marker last.
    // Retry after an interrupted write resumes from this snapshot, never from Room.
    await storage.setItem(stateStorageKey, JSON.stringify(state));
    await finishLegacyMigration(storage, state, migration.sourceVersion ?? 0);
    return state;
  }
  return migration.state;
}
