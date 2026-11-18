import assert from 'node:assert/strict';
import { assertLocalQaScope } from './scope.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const metadata = JSON.parse(readFileSync(new URL('metadata.json', directory), 'utf8'));
assertLocalQaScope(metadata, readFileSync(new URL('supabase/config.toml', directory), 'utf8'));
assert.equal(metadata.apiOrigin, 'http://127.0.0.1:55431');
const input = readFileSync(new URL('./progress-parity.sql', import.meta.url), 'utf8');
const result = spawnSync(
  'docker',
  [
    'exec',
    '-i',
    `supabase_db_${metadata.projectId}`,
    'psql',
    '-X',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    'postgres',
    '-d',
    'postgres',
  ],
  { input, encoding: 'utf8', timeout: 30000 },
);
const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
writeFileSync(new URL('progress-parity.log', directory), output);
assert.equal(
  result.status,
  0,
  output
    .split(/\r?\n/)
    .filter((line) => /ERROR:/.test(line))
    .join('\n'),
);
console.log(
  'PASS isolated SQL: private save, denied-share rollback, explicit atomic share, revoked permission. All fixture changes rolled back.',
);
