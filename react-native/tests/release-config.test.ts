import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const configKeys = [
  'EXPO_PROJECT_ID',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
] as const;
const projectId = '00000000-0000-4000-8000-000000000001';
const clientKey = [
  'e30',
  Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url'),
  'test',
].join('.');

function check(local: string, overrides: Record<string, string> = {}, configProject?: string) {
  const root = mkdtempSync(join(tmpdir(), 'wirdna-release-config-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'node_modules', 'expo', 'bin'), { recursive: true });
    copyFileSync('scripts/check-config.mjs', join(root, 'scripts', 'check-config.mjs'));
    writeFileSync(join(root, '.env.local'), local);
    writeFileSync(
      join(root, 'node_modules', 'expo', 'bin', 'cli'),
      `console.log(JSON.stringify({android:{package:'com.Ameender.qurantracker'},ios:{bundleIdentifier:'com.Ameender.qurantracker'},extra:{eas:{projectId:${configProject ? JSON.stringify(configProject) : 'process.env.EXPO_PROJECT_ID'}}}}));`,
    );
    const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production' };
    for (const name of configKeys) delete env[name];
    const result = spawnSync(process.execPath, ['scripts/check-config.mjs', '--release'], {
      cwd: root,
      env: { ...env, ...overrides },
      encoding: 'utf8',
    });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const localConfig = [
  `EXPO_PROJECT_ID=${projectId}`,
  'EXPO_PUBLIC_SUPABASE_URL=https://example.test',
  `EXPO_PUBLIC_SUPABASE_ANON_KEY=${clientKey}`,
].join('\n');

test('release check reads ignored local configuration and does not print client values', () => {
  const result = check(localConfig);
  assert.equal(result.status, 0, result.output);
  assert.ok(!result.output.includes(clientKey));
  assert.ok(!result.output.includes(projectId));
  assert.ok(!result.output.includes('https://example.test'));
});

test('CI environment takes precedence over local files and server keys are rejected', () => {
  const privateKey = 'sb_' + 'secret_invalid_example_for_validation';
  const result = check(localConfig, { EXPO_PUBLIC_SUPABASE_ANON_KEY: privateKey });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /server secret key cannot be included/);
  assert.ok(!result.output.includes(privateKey));
});

test('legacy service-role JWT is rejected without printing the credential', () => {
  const serverKey = [
    'e30',
    Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'),
    'test',
  ].join('.');
  const result = check(localConfig, { EXPO_PUBLIC_SUPABASE_ANON_KEY: serverKey });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Only an anon\/publishable/);
  assert.ok(!result.output.includes(serverKey));
});

test('release check refuses a config linked to a different Expo project', () => {
  const result = check(localConfig, {}, '00000000-0000-4000-8000-000000000002');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /must match the EXPO_PROJECT_ID/);
});

test('release check rejects opaque, incomplete and role-less client configuration', () => {
  for (const key of ['definitely-not-a-client-key', 'sb_publishable_', 'e30.e30.fixture']) {
    const result = check(localConfig, { EXPO_PUBLIC_SUPABASE_ANON_KEY: key });
    assert.notEqual(result.status, 0, `Accepted invalid key shape: ${key}`);
    assert.ok(!result.output.includes(key));
  }
});

test('surrounding whitespace cannot hide a server secret from release checks', () => {
  const key = '  sb_' + 'secret_invalid_example_for_validation  ';
  const result = check(localConfig, { EXPO_PUBLIC_SUPABASE_ANON_KEY: key });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /server secret key cannot be included/);
  assert.ok(!result.output.includes(key.trim()));
});

test('publishable client configuration passes without exposing it', () => {
  const key = 'sb_' + 'publishable_example_for_structure_validation';
  const result = check(localConfig, { EXPO_PUBLIC_SUPABASE_ANON_KEY: key });
  assert.equal(result.status, 0, result.output);
  assert.ok(!result.output.includes(key));
});
