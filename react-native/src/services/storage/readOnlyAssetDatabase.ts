import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Opens versioned reference content separately from user data. Native copies the
 * bundled asset directly to disk; only the browser needs in-memory SQLite.
 */
export async function openReadOnlyAssetDatabase({
  assetId,
  name,
  expected,
}: {
  assetId: number;
  name: string;
  expected: Readonly<Record<string, string | number>>;
}): Promise<SQLiteDatabase> {
  if (!/^[a-z0-9-]+\.db$/.test(name)) throw new Error('Invalid reference database name');
  const [SQLite, { Platform }, { Asset }] = await Promise.all([
    import('expo-sqlite'),
    import('react-native'),
    import('expo-asset'),
  ]);
  const native = Platform.OS !== 'web';
  // iOS defaults to Documents/SQLite, which is backed up. These immutable asset
  // copies are reproducible and belong in Library/Caches; user state stays put.
  const directory =
    Platform.OS === 'ios'
      ? `${(await import('expo-file-system')).Paths.cache.uri.replace(/\/$/, '')}/read-only-content`
      : native
        ? `${SQLite.defaultDatabaseDirectory}/read-only-content`
        : undefined;
  let database: SQLiteDatabase | undefined;
  try {
    if (native) {
      await SQLite.importDatabaseFromAssetAsync(name, { assetId }, directory);
      database = await SQLite.openDatabaseAsync(name, { useNewConnection: true }, directory);
    } else {
      const asset = await Asset.fromModule(assetId).downloadAsync();
      const response = await fetch(asset.localUri ?? asset.uri);
      if (!response.ok) throw new Error('Bundled reference database is unavailable');
      database = await SQLite.deserializeDatabaseAsync(
        new Uint8Array(await response.arrayBuffer()),
      );
    }
    await database.execAsync('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF;');
    const row = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM metadata WHERE key=?',
      'manifest',
    );
    const manifest: unknown = JSON.parse(row?.value ?? 'null');
    if (
      !manifest ||
      typeof manifest !== 'object' ||
      Object.entries(expected).some(
        ([key, value]) => (manifest as Record<string, unknown>)[key] !== value,
      )
    ) {
      throw new Error('Bundled reference database metadata is invalid');
    }
    return database;
  } catch (error) {
    await database?.closeAsync().catch(() => {});
    // Only this hash-versioned reference copy can be removed. User databases
    // and the packaged source are never modified, so a later call can retry.
    if (native) await SQLite.deleteDatabaseAsync(name, directory).catch(() => {});
    throw error;
  }
}
