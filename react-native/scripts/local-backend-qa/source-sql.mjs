import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = new URL('../../.tooling/supabase-qa/', import.meta.url);
const status = JSON.parse(readFileSync(new URL('credentials.json', root), 'utf8'));
assert.equal(new URL(status.API_URL).origin, 'http://127.0.0.1:55431');
const windowsDocker =
  (process.env.ProgramFiles ?? 'C:/Program Files') + '/Docker/Docker/resources/bin/docker.exe';
const docker = process.platform === 'win32' && existsSync(windowsDocker) ? windowsDocker : 'docker';
const metadata = JSON.parse(readFileSync(new URL('metadata.json', root), 'utf8'));
assert.match(metadata.projectId, /^[a-z0-9-]+$/);
const container = 'supabase_db_' + metadata.projectId;
const excluded = new Set(['group_reply_push.sql', 'group_reply_push_ios.sql']);
const results = [];
for (const name of readdirSync(new URL('source-tests/', root)).filter((name) =>
  name.endsWith('.sql'),
)) {
  if (excluded.has(name)) {
    results.push({ name, skipped: 'Outbound dispatcher deliberately disabled in isolated QA' });
    continue;
  }
  const sql = readFileSync(new URL('source-tests/' + name, root), 'utf8');
  const result = spawnSync(
    docker,
    [
      'exec',
      '-i',
      container,
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
  writeFileSync(
    new URL('source-' + name + '.log', root),
    String(result.stdout ?? '') + '\n' + String(result.stderr ?? ''),
  );
  const failure = String(result.stderr ?? '')
    .split(/\r?\n/)
    .find((line) => /ERROR:/.test(line));
  results.push({ name, passed: result.status === 0, error: failure, exitCode: result.status });
  console.log((result.status === 0 ? 'PASS ' : 'FAIL ') + name + (failure ? ': ' + failure : ''));
}
writeFileSync(new URL('source-sql-results.json', root), JSON.stringify(results, null, 2));
console.log(
  JSON.stringify({
    passed: results.filter((row) => row.passed).length,
    failed: results.filter((row) => row.passed === false).length,
    skipped: results.filter((row) => row.skipped).length,
  }),
);
process.exitCode = results.some((row) => row.passed === false) ? 1 : 0;
