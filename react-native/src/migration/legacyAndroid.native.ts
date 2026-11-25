import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';
import { initialState, type AppState } from '../state/models';
import {
  importLegacyRoomRows,
  noLegacyDataResult,
  parseAndroidPreferencesXml,
  type LegacyImportResult,
  type LegacyRoomRows,
  type SqlRow,
} from './legacyRoom';

const databaseName = 'quran_database';
const expectedRoomHashV20 = 'd807c4c90332044786d4a6f78f604ab3';
const baseTables = [
  'quran_progress',
  'reading_history',
  'daily_goal',
  'planning_items',
  'reading_journey',
  'ayah_notes',
] as const;
const preferenceFiles = [
  'settings',
  'reader_state',
  'reader_bookmarks',
  'reading_checklist_v1',
  'independent_reading_plan',
  'notification_preferences_v1',
] as const;

export type LegacyAndroidImportResult = LegacyImportResult & { warnings: string[] };

function legacyDatabaseDirectory(): string {
  const defaultDirectory = SQLite.defaultDatabaseDirectory;
  if (typeof defaultDirectory !== 'string' || !defaultDirectory.endsWith('/files/SQLite')) {
    throw new Error('Expo SQLite default Android directory did not match the app data layout');
  }
  return defaultDirectory.slice(0, -'/files/SQLite'.length) + '/databases';
}

function appDataDirectory(): string {
  const defaultDirectory = SQLite.defaultDatabaseDirectory;
  if (typeof defaultDirectory !== 'string' || !defaultDirectory.endsWith('/files/SQLite')) {
    throw new Error('Expo SQLite default Android directory did not match the app data layout');
  }
  return defaultDirectory.slice(0, -'/files/SQLite'.length);
}

async function readPreferenceFiles(): Promise<{
  files: Record<string, Record<string, string | number | boolean | string[]>>;
  warnings: string[];
}> {
  const root = appDataDirectory();
  const files: Record<string, Record<string, string | number | boolean | string[]>> = {};
  const warnings: string[] = [];
  for (const name of preferenceFiles) {
    const file = new File(`file://${root}/shared_prefs/${name}.xml`);
    try {
      if (!file.exists) continue;
      files[name] = parseAndroidPreferencesXml(await file.text());
    } catch {
      warnings.push(`Could not read the legacy ${name} preference file. It was left untouched.`);
    }
  }
  return { files, warnings };
}

async function existingRoomDatabase(): Promise<File | null> {
  const file = new File(`file://${legacyDatabaseDirectory()}/${databaseName}`);
  try {
    return file.exists ? file : null;
  } catch {
    throw new Error('Could not inspect the Android Room database path');
  }
}

async function getTables(db: SQLite.SQLiteDatabase): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table'",
  );
  return new Set(rows.map((row) => row.name));
}

async function readRows<T extends SqlRow>(db: SQLite.SQLiteDatabase, table: string): Promise<T[]> {
  return db.getAllAsync<T>(`SELECT * FROM "${table}"`);
}

async function readLegacyRoom(): Promise<LegacyRoomRows | null> {
  if (Platform.OS !== 'android') return null;
  const source = await existingRoomDatabase();
  if (!source) return null;
  // query_only does not prevent SQLite from checkpointing a WAL when its last
  // connection closes. Never open the legacy files with the SQLite engine.
  const snapshot = new Directory(
    Paths.cache,
    `legacy-room-import-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  snapshot.create();
  let db: SQLite.SQLiteDatabase | undefined;
  try {
    await source.copy(new File(snapshot, databaseName));
    // Room is no longer running during the upgrade. Preserve committed WAL data
    // and any crash-recovery journal; SQLite reconstructs SHM only in the copy.
    for (const suffix of ['-wal', '-journal']) {
      const sidecar = new File(source.uri + suffix);
      if (sidecar.exists) await sidecar.copy(new File(snapshot, databaseName + suffix));
    }
    db = await SQLite.openDatabaseAsync(
      databaseName,
      { useNewConnection: true },
      decodeURIComponent(snapshot.uri.replace(/^file:\/\//, '')),
    );
    await db.execAsync('PRAGMA query_only = ON');
    const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = Number(versionRow?.user_version);
    if (!Number.isInteger(version) || version < 16 || version > 20) {
      throw new Error(
        `Unsupported Android Room schema version ${String(versionRow?.user_version ?? 'unknown')}`,
      );
    }
    const existingTables = await getTables(db);
    const requiredTables = [
      ...baseTables,
      ...(version >= 18 ? ['goal_days'] : []),
      ...(version >= 20 ? ['checkin_requests'] : []),
    ];
    const missing = requiredTables.filter((name) => !existingTables.has(name));
    if (missing.length)
      throw new Error(`Android Room schema is missing required tables: ${missing.join(', ')}`);
    if (version === 20) {
      if (!existingTables.has('room_master_table'))
        throw new Error('Android Room metadata table was missing');
      const roomRows = await readRows<{ id: number; identity_hash: string }>(
        db,
        'room_master_table',
      );
      const identity = roomRows.find((row) => Number(row.id) === 42)?.identity_hash;
      if (!identity || identity !== expectedRoomHashV20)
        throw new Error('Android Room version 20 identity hash did not match the bundled schema');
    }
    const [progress, history, dailyGoals, goalDays, plans, journey, notes, checkinRequests] =
      await Promise.all([
        readRows(db, 'quran_progress'),
        readRows(db, 'reading_history'),
        readRows(db, 'daily_goal'),
        existingTables.has('goal_days') ? readRows(db, 'goal_days') : Promise.resolve([]),
        readRows(db, 'planning_items'),
        readRows(db, 'reading_journey'),
        readRows(db, 'ayah_notes'),
        existingTables.has('checkin_requests')
          ? readRows(db, 'checkin_requests')
          : Promise.resolve([]),
      ]);
    return {
      version,
      progress,
      history,
      dailyGoals,
      goalDays,
      plans,
      journey,
      notes,
      checkinRequests,
    };
  } finally {
    try {
      await db?.closeAsync();
    } finally {
      // This unique cache directory was created above; source files are untouched.
      if (snapshot.exists) snapshot.delete();
    }
  }
}

/**
 * Read old in-place Android Room/SharedPreferences data into a new RN initial state.
 * This never runs Room migrations or executes a write against the old DB. The caller must only
 * invoke it when the RN state key does not exist and must persist `result.state` before setting
 * a migration marker.
 */
export async function importLegacyAndroidData(
  initial: AppState = initialState,
): Promise<LegacyAndroidImportResult> {
  if (Platform.OS !== 'android') return { ...noLegacyDataResult(initial), warnings: [] };
  let roomFound = false;
  try {
    const { files, warnings } = await readPreferenceFiles();
    const existing = await existingRoomDatabase();
    roomFound = existing !== null;
    const rows = roomFound ? await readLegacyRoom() : null;
    const hasPreferences = Object.keys(files).some(
      (name) => Object.keys(files[name] ?? {}).length > 0,
    );
    if (!rows && !hasPreferences) return { ...noLegacyDataResult(initial), warnings };
    const emptyRows: LegacyRoomRows = {
      version: 0,
      progress: [],
      history: [],
      dailyGoals: [],
      goalDays: [],
      plans: [],
      journey: [],
      notes: [],
      checkinRequests: [],
    };
    const state = importLegacyRoomRows(initial, rows ?? emptyRows, files);
    return {
      state,
      imported: state !== initial,
      sourceFound: true,
      ...(rows ? { sourceVersion: rows.version } : {}),
      warnings,
    };
  } catch (error) {
    return {
      state: initial,
      imported: false,
      sourceFound: true,
      warnings: [error instanceof Error ? error.message : 'Legacy Android data could not be read.'],
    };
  }
}
