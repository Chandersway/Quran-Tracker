import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scripts, '../..');
const qaRoot = join(projectRoot, '.tooling/supabase-qa');
const upstream = resolve(projectRoot, '../supabase');
assert.ok(
  qaRoot.startsWith(join(projectRoot, '.tooling') + (process.platform === 'win32' ? '\\' : '/')),
);
mkdirSync(join(qaRoot, 'supabase/migrations'), { recursive: true });
mkdirSync(join(qaRoot, 'original-migrations'), { recursive: true });
mkdirSync(join(qaRoot, 'source-tests'), { recursive: true });
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = readdirSync(join(upstream, 'migrations'))
  .filter((name) => name.endsWith('.sql'))
  .map((file) => ({ file, sha256: sha(readFileSync(join(upstream, 'migrations', file))) }));
const previousManifest = join(qaRoot, 'source-migrations.json');
if (existsSync(previousManifest)) {
  const previous = JSON.parse(readFileSync(previousManifest, 'utf8').replace(/^\uFEFF/, ''));
  for (const row of previous)
    assert.equal(
      manifest.find((current) => current.file === row.file)?.sha256,
      row.sha256,
      'Existing QA migration bytes changed. Preserve its volumes and review a new isolated project; do not reset it.',
    );
}
const configPath = join(qaRoot, 'supabase/config.toml');
const existingConfig = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
const projectId =
  /^project_id\s*=\s*"([a-z0-9-]+)"/m.exec(existingConfig)?.[1] ??
  'qurantracker-qa-' + sha(projectRoot.toLowerCase()).slice(0, 10);
assert.match(projectId, /^[a-z0-9-]+$/);
if (!existingConfig)
  writeFileSync(
    configPath,
    `project_id = "${projectId}"
[api]
enabled = true
port = 55431
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = 55432
shadow_port = 55430
major_version = 17
[db.pooler]
enabled = false
port = 55439
[db.seed]
enabled = false
[realtime]
enabled = false
[studio]
enabled = false
port = 55433
[local_smtp]
enabled = false
port = 55434
[storage]
enabled = true
file_size_limit = "50MiB"
[storage.s3_protocol]
enabled = false
[storage.vector]
enabled = false
[auth]
enabled = true
site_url = "http://127.0.0.1:55431"
enable_signup = true
[auth.email]
enable_signup = true
enable_confirmations = false
[edge_runtime]
enabled = false
[analytics]
enabled = false
port = 55437
[functions.group-push]
verify_jwt = false
`,
  );

// Explicit local QA opt-in. Retain the existing isolated project and all volumes.
if (process.argv.includes('--realtime')) {
  const config = readFileSync(configPath, 'utf8');
  assert.equal(/^project_id\s*=\s*"([a-z0-9-]+)"/m.exec(config)?.[1], projectId);
  assert.match(config, /\[realtime\]\s*\r?\nenabled\s*=\s*(?:false|true)/);
  writeFileSync(
    configPath,
    config.replace(/(\[realtime\]\s*\r?\n)enabled\s*=\s*(?:false|true)/, '$1enabled = true'),
  );
}

let totalHttpCalls = 0,
  replacements = 0,
  schedulesDisabled = 0;
const audit = [];
for (const row of manifest) {
  const original = readFileSync(join(upstream, 'migrations', row.file));
  writeFileSync(join(qaRoot, 'original-migrations', row.file), original);
  let working = original.toString('utf8');
  totalHttpCalls += (working.match(/\bnet\.http_(?:post|get)\s*\(/g) ?? []).length;
  let urlReplacements = 0,
    cronDisabled = 0;
  working = working.replace(
    /(net\.http_post\(url\s*:=\s*)'https?:\/\/[^']+'/g,
    (_match, prefix) => {
      replacements++;
      urlReplacements++;
      return prefix + "'http://127.0.0.1:9/discard'";
    },
  );
  working = working.replace(/^select cron\.schedule\('group-push-dispatch-v1'.*$/gm, () => {
    schedulesDisabled++;
    cronDisabled++;
    return '-- QA ONLY: source dispatcher cron disabled before SQL execution.';
  });
  writeFileSync(join(qaRoot, 'supabase/migrations', row.file), working);
  if (urlReplacements || cronDisabled)
    audit.push({
      file: row.file,
      sourceSha256: row.sha256,
      workingSha256: sha(working),
      urlReplacements,
      cronDisabled,
    });
}
assert.equal(totalHttpCalls, replacements, 'Unreviewed outbound HTTP call: local startup refused');
assert.equal(
  replacements,
  2,
  'Dispatcher contract changed: review QA egress guards before starting',
);
assert.equal(schedulesDisabled, 1, 'Dispatcher cron contract changed: local startup refused');
writeFileSync(
  join(qaRoot, 'supabase/migrations/20260801000000_qa_empty_legacy_dependencies.sql'),
  readFileSync(join(scripts, 'bootstrap.sql')),
);
writeFileSync(
  join(qaRoot, 'supabase/migrations/20261113999999_qa_disable_outbound_push.sql'),
  readFileSync(join(scripts, 'disable-outbound.sql')),
);
for (const name of readdirSync(join(upstream, 'tests')).filter((name) => name.endsWith('.sql')))
  writeFileSync(join(qaRoot, 'source-tests', name), readFileSync(join(upstream, 'tests', name)));
writeFileSync(join(qaRoot, 'source-config.toml'), readFileSync(join(upstream, 'config.toml')));
writeFileSync(previousManifest, JSON.stringify(manifest, null, 2));
writeFileSync(join(qaRoot, 'qa-egress-audit.json'), JSON.stringify(audit, null, 2));
writeFileSync(
  join(qaRoot, 'metadata.json'),
  JSON.stringify({ projectId, apiOrigin: 'http://127.0.0.1:55431', cliVersion: '3.1.0' }, null, 2),
);
console.log(
  'Prepared isolated QA project ' +
    projectId +
    '; source migrations preserved; outbound dispatch disabled.',
);
