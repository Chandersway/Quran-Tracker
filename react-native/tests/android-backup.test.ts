import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applySourceBackupManifest,
  sourceBackupResources,
  sourceBackupXml,
} from '../plugins/withSourceAndroidBackup';
import type { AndroidConfig } from 'expo/config-plugins';

function exclusions(xml: string): string[] {
  return [...xml.matchAll(/<exclude\s+domain="([^"]+)"\s+path="([^"]+)"\s*\/>/g)]
    .map((match) => `${match[1]}:${match[2]}`)
    .sort();
}
test('generated backup XML excludes only reproducible reference copies alongside existing exclusions', () => {
  const original = fs.readFileSync('../app/src/main/res/xml/backup_rules.xml', 'utf8');
  const added = ['sharedpref:SecureStore', 'file:SQLite/read-only-content'];
  const expected = [...exclusions(original), ...added].sort();
  const xml = sourceBackupXml();
  assert.deepEqual(exclusions(xml.full), expected);
  const originalExtraction = fs.readFileSync(
    '../app/src/main/res/xml/data_extraction_rules.xml',
    'utf8',
  );
  for (const section of ['cloud-backup', 'device-transfer']) {
    const source = originalExtraction.match(
      new RegExp(`<${section}>([\\s\\S]*?)</${section}>`),
    )![1]!;
    const generated = xml.extraction.match(
      new RegExp(`<${section}>([\\s\\S]*?)</${section}>`),
    )![1]!;
    assert.deepEqual(exclusions(generated), [...exclusions(source), ...added].sort());
  }
  for (const value of Object.values(xml)) {
    assert.doesNotMatch(value, /<include\b/);
    assert.deepEqual(
      exclusions(value).filter((entry) => !entry.startsWith('sharedpref:')),
      value === xml.full
        ? ['file:SQLite/read-only-content']
        : ['file:SQLite/read-only-content', 'file:SQLite/read-only-content'],
    );
    assert.doesNotMatch(value, /RKStorage|quran_database/);
  }
});

test('reference backup exclusion follows the installed Expo Android filesDir contract', () => {
  const sqliteModule = fs.readFileSync(
    'node_modules/expo-sqlite/android/src/main/java/expo/modules/sqlite/SQLiteModule.kt',
    'utf8',
  );
  assert.match(
    sqliteModule,
    /androidContext\.filesDir\.canonicalPath\s*\+\s*File\.separator\s*\+\s*"SQLite"/,
  );
  const loader = fs.readFileSync('src/services/storage/readOnlyAssetDatabase.ts', 'utf8');
  assert.match(loader, /SQLite\.defaultDatabaseDirectory\}\/read-only-content/);
  for (const xml of Object.values(sourceBackupXml())) {
    assert.doesNotMatch(xml, /<exclude\s+domain="(?:database|root)"/);
    assert.doesNotMatch(xml, /path="(?:\.|SQLite|RKStorage|quran_database)"/);
  }
});

test('manifest enables backup and uses custom resources instead of the restrictive Expo defaults', () => {
  const application: AndroidConfig.Manifest.ManifestApplication = {
    $: { 'android:name': '.MainApplication' },
  };
  applySourceBackupManifest(application);
  assert.equal(application.$['android:allowBackup'], 'true');
  assert.equal(application.$['android:fullBackupContent'], `@xml/${sourceBackupResources.full}`);
  assert.equal(
    application.$['android:dataExtractionRules'],
    `@xml/${sourceBackupResources.extraction}`,
  );
});
