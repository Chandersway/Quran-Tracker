// Read-only: no account, RPC, table read, write, message content or server key.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';

export const realtimeTables = [
  'group_posts',
  'post_comments',
  'post_reactions',
  'group_media',
  'post_attachments',
];

export function publicRealtimeConfig(env, local = false) {
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key)
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  const parsed = new URL(url);
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/' ||
    (local
      ? parsed.origin !== 'http://127.0.0.1:55431'
      : parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.port)
  )
    throw new Error(
      'Expected a hosted Supabase project origin, or --local with http://127.0.0.1:55431',
    );
  if (!key.startsWith('sb_publishable_')) {
    let role;
    try {
      if (key.split('.').length === 3)
        role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role;
    } catch {
      // Validation below rejects malformed keys without echoing them.
    }
    if (role !== 'anon') throw new Error('Only an anon/publishable key is accepted');
  }
  return { url: parsed.origin, key };
}

export function redactRealtimeError(error, secrets = []) {
  let value = String(error?.message ?? error ?? '');
  for (const secret of secrets) if (secret) value = value.replaceAll(secret, '<REDACTED>');
  return value
    .replace(/https?:\/\/\S+/g, '<URL>')
    .replace(/eyJ[\w.-]+/g, '<TOKEN>')
    .replace(/sb_(?:secret|publishable)_[\w-]+/g, '<KEY>')
    .replace(/Bearer\s+\S+/gi, 'Bearer <REDACTED>')
    .slice(0, 700);
}

/** An anonymous SUBSCRIBED result proves configuration readiness, not member delivery. */
export async function probeRealtimeTable(client, table, secrets = [], timeoutMs = 12_000) {
  if (!realtimeTables.includes(table)) throw new Error('Unknown Realtime table');
  const channel = client.channel(`readonly-readiness:${table}`, {
    config: { postgres_changes_options: { wait: true } },
  });
  let payloadCount = 0;
  for (const event of ['INSERT', 'UPDATE']) {
    channel.on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter: 'group_id=eq.00000000-0000-0000-0000-000000000000',
      },
      () => payloadCount++,
    );
  }
  let timer;
  try {
    const result = await new Promise((done) => {
      timer = setTimeout(() => done({ state: 'PROBE_TIMEOUT', reason: '' }), timeoutMs);
      channel.subscribe((state, error) => {
        if (['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(state))
          done({ state, reason: redactRealtimeError(error, secrets) });
      });
    });
    return { table, ...result, payloadCount };
  } finally {
    clearTimeout(timer);
    await client.removeChannel(channel).catch(() => undefined);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/check-realtime-readiness.mjs [--table TABLE] [--local]');
    console.log(
      'Reads .env, .env.local, then process environment. No authentication or mutations.',
    );
    return;
  }
  let selected;
  let local = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--local') local = true;
    else if (args[index] === '--table') selected = args[++index];
    else throw new Error('Unknown option; use --help');
  }
  if (args.includes('--table') && !realtimeTables.includes(selected))
    throw new Error('Choose a supported table: ' + realtimeTables.join(', '));
  const env = {};
  for (const path of ['.env', '.env.local'])
    if (existsSync(path)) Object.assign(env, parseEnv(readFileSync(path, 'utf8')));
  Object.assign(env, process.env);
  const { url, key } = publicRealtimeConfig(env, local);
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  try {
    const results = await Promise.allSettled(
      (selected ? [selected] : realtimeTables).map((table) =>
        probeRealtimeTable(client, table, [url, key]),
      ),
    );
    const tables = results.map((result, index) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            table: (selected ? [selected] : realtimeTables)[index],
            state: 'PROBE_ERROR',
            reason: redactRealtimeError(result.reason, [url, key]),
          },
    );
    const ready = tables.every((table) => table.state === 'SUBSCRIBED');
    console.log(
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          scope: 'Anonymous configuration readiness; nonexistent group filter; no mutations',
          memberDeliveryVerified: false,
          ready,
          tables,
        },
        null,
        2,
      ),
    );
    process.exitCode = ready ? 0 : 2;
  } finally {
    client.realtime.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(redactRealtimeError(error));
    process.exitCode = 1;
  });
}
