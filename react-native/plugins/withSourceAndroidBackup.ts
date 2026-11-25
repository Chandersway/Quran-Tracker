import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  type ConfigPlugin,
} from 'expo/config-plugins';

export const sourceBackupResources = {
  full: 'quran_tracker_backup_rules',
  extraction: 'quran_tracker_data_extraction_rules',
} as const;

/** Keep user data coverage; bundled reference copies are reproducible from app assets. */
export function sourceBackupXml() {
  const paths = [
    'pending_navigation.xml',
    'firebase_device.xml',
    'group_push_delivered.xml',
    'SecureStore',
  ];
  const exclusions = (indent: string) =>
    [
      ...paths.map((path) => `${indent}<exclude domain="sharedpref" path="${path}" />`),
      // Expo SQLite stores its default directory under Android filesDir, not databasesDir.
      `${indent}<exclude domain="file" path="SQLite/read-only-content" />`,
    ].join('\n');
  return {
    full: `<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content>\n${exclusions('  ')}\n</full-backup-content>\n`,
    extraction: `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n  <cloud-backup>\n${exclusions('    ')}\n  </cloud-backup>\n  <device-transfer>\n${exclusions('    ')}\n  </device-transfer>\n</data-extraction-rules>\n`,
  };
}

export function applySourceBackupManifest(application: AndroidConfig.Manifest.ManifestApplication) {
  application.$['android:allowBackup'] = 'true';
  application.$['android:fullBackupContent'] = `@xml/${sourceBackupResources.full}`;
  application.$['android:dataExtractionRules'] = `@xml/${sourceBackupResources.extraction}`;
}

const withSourceAndroidBackup: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, (mod) => {
    applySourceBackupManifest(AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults));
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const directory = join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      mkdirSync(directory, { recursive: true });
      const xml = sourceBackupXml();
      writeFileSync(join(directory, `${sourceBackupResources.full}.xml`), xml.full, 'utf8');
      writeFileSync(
        join(directory, `${sourceBackupResources.extraction}.xml`),
        xml.extraction,
        'utf8',
      );
      return mod;
    },
  ]);
};
export default withSourceAndroidBackup;
