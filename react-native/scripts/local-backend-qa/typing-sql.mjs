import assert from 'node:assert/strict';
import { assertLocalQaScope } from './scope.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const metadata = JSON.parse(readFileSync(new URL('metadata.json', directory), 'utf8'));
const credentials = JSON.parse(readFileSync(new URL('credentials.json', directory), 'utf8'));
assertLocalQaScope(metadata, readFileSync(new URL('supabase/config.toml', directory), 'utf8'));
assert.equal(metadata.apiOrigin, 'http://127.0.0.1:55431');
assert.equal(credentials.API_URL, 'http://127.0.0.1:55431');
const binary = `${process.env.ProgramFiles ?? 'C:/Program Files'}/Docker/Docker/resources/bin/docker.exe`;
const docker = process.platform === 'win32' && existsSync(binary) ? binary : 'docker';
const test = process.argv.includes('--test');
const source = test
  ? 'tests/group_typing_private.sql'
  : 'migrations/20261115090000_group_typing_private.sql';
const sql = readFileSync(new URL('../../../supabase/' + source, import.meta.url), 'utf8');
const result = spawnSync(
  docker,
  [
    'exec',
    '-i',
    'supabase_db_' + metadata.projectId,
    'psql',
    '-X',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    'postgres',
    '-d',
    'postgres',
  ],
  { input: sql, encoding: 'utf8', timeout: 30000 },
);
const output = String(result.stdout ?? '') + '\n' + String(result.stderr ?? '');
writeFileSync(new URL(test ? 'typing-sql-test.log' : 'typing-sql-apply.log', directory), output);
assert.equal(
  result.status,
  0,
  output
    .split(/\r?\n/)
    .filter((line) => /ERROR:/.test(line))
    .join('\n'),
);
console.log(
  test
    ? 'PASS isolated typing SQL privacy assertions'
    : 'APPLIED typing migration only to isolated localhost QA',
);
