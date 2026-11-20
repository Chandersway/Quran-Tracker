import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

const expectedAndroidPackage = 'com.Ameender.qurantracker';
const expectedIosBundleId = 'com.Ameender.qurantracker';
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const expoCli = join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');

// Match Expo's local-file precedence without printing values. Existing shell/CI
// values win, so a checked-out local file cannot override GitHub environment secrets.
const environment = process.env.NODE_ENV || 'development';
for (const name of [`.env.${environment}.local`, '.env.local', `.env.${environment}`, '.env']) {
  const file = join(projectRoot, name);
  if (existsSync(file)) loadEnvFile(file);
}

const localMode = process.argv.includes('--local');
const strictRelease = process.argv.includes('--release');
const result = spawnSync(process.execPath, [expoCli, 'config', '--type', 'public', '--json'], {
  cwd: projectRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});

if (result.error) {
  console.error(`Could not start Expo config: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

let config;
try {
  config = JSON.parse(result.stdout);
} catch {
  console.error('Expo config did not return valid JSON.');
  process.exit(1);
}

const errors = [];
if (config.android?.package !== expectedAndroidPackage) {
  errors.push(`android.package must remain ${expectedAndroidPackage}`);
}
if (config.ios?.bundleIdentifier !== expectedIosBundleId) {
  errors.push(`ios.bundleIdentifier must be ${expectedIosBundleId}`);
}
const projectId = config.extra?.eas?.projectId;
if (
  strictRelease &&
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    process.env.EXPO_PROJECT_ID ?? '',
  )
) {
  errors.push('EXPO_PROJECT_ID must identify a real linked Expo project.');
}
if (strictRelease) {
  for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
    if (!process.env[name]?.trim())
      errors.push(`Set the ${name} GitHub environment secret before release.`);
  }
  try {
    if (new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').protocol !== 'https:')
      throw new Error();
  } catch {
    errors.push('EXPO_PUBLIC_SUPABASE_URL must be an HTTPS project endpoint.');
  }
}
const clientKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
if (clientKey.startsWith('sb_secret_'))
  errors.push('A server secret key cannot be included in mobile configuration.');
else if (clientKey && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(clientKey)) {
  try {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(clientKey)) throw new Error();
    const role = JSON.parse(
      Buffer.from(clientKey.split('.')[1], 'base64url').toString('utf8'),
    ).role;
    if (role !== 'anon')
      errors.push('Only an anon/publishable Supabase key may be included in a mobile build.');
  } catch {
    errors.push('The Supabase client key is not a valid publishable configuration value.');
  }
}
if (strictRelease && !process.env.EXPO_PROJECT_ID) {
  errors.push('Set the EXPO_PROJECT_ID GitHub environment secret before building.');
}
if (!localMode && !projectId && !process.env.EXPO_PROJECT_ID) {
  errors.push('Set EXPO_PROJECT_ID and expose it as extra.eas.projectId in Expo config.');
}
if (strictRelease && projectId !== process.env.EXPO_PROJECT_ID) {
  errors.push('Expo config extra.eas.projectId must match the EXPO_PROJECT_ID environment secret.');
}

if (errors.length) {
  console.error('Expo release configuration is incomplete:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Expo release configuration is valid.');
