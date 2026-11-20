import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createGroupOperations } from '../../src/services/groups/groupOperations';
import type { Group } from '../../src/services/backend/types';
import type { GroupOperationPort } from '../../src/services/groups/groupTypes';

const directory = new URL('../../.tooling/supabase-qa/', import.meta.url);
const status = JSON.parse(readFileSync(new URL('credentials.json', directory), 'utf8'));
const fixtures = JSON.parse(readFileSync(new URL('fixtures.credentials.json', directory), 'utf8'));
assert.equal(new URL(status.API_URL).origin, 'http://127.0.0.1:55431');
const guardedFetch: typeof fetch = (input, init) => {
  assert.equal(
    new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
      .origin,
    'http://127.0.0.1:55431',
  );
  return fetch(input, { ...init, redirect: 'error' });
};
const result = <T,>(value: { data: T; error: { message: string } | null }): T => {
  if (value.error) throw new Error(value.error.message);
  return value.data;
};
const one = <T,>(rows: T | T[]) => (Array.isArray(rows) ? rows[0]! : rows);
async function signIn(role: string) {
  const actor = createClient(status.API_URL, status.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: guardedFetch },
  });
  result(
    await actor.auth.signInWithPassword({
      email: fixtures.users[role].email,
      password: fixtures.users[role].password,
    }),
  );
  return actor;
}
const owner = await signIn('owner'),
  member = await signIn('member');
const group = one(
  result(await owner.rpc('get_group_detail_v3', { p_code: fixtures.groupCode })),
) as Group;
assert.equal(group.id, fixtures.groupId);
const heading = 'LOCAL QA ONLY — Group-scoped discussion';
const existing = result(
  await owner
    .from('group_posts')
    .select('*')
    .eq('group_id', group.id)
    .eq('content', heading)
    .eq('status', 'published'),
);
const post =
  existing[0] ??
  one(
    result(
      await owner.rpc('create_group_text_post_v2', {
        p_group_id: group.id,
        p_content: heading,
        p_display_name: 'QA owner',
      }),
    ),
  );
const reply = 'LOCAL QA ONLY — reply inside this group thread';
const replies = result(
  await member
    .from('post_comments')
    .select('id')
    .eq('group_id', group.id)
    .eq('post_id', post.id)
    .eq('content', reply)
    .eq('status', 'published'),
);
if (!replies.length)
  result(
    await member.rpc('add_group_post_comment_v2', {
      p_group_id: group.id,
      p_post_id: post.id,
      p_content: reply,
      p_display_name: 'QA group alias',
    }),
  );
result(
  await member.rpc('toggle_group_post_reaction_v2', {
    p_group_id: group.id,
    p_post_id: post.id,
    p_reaction: 'dua',
  }),
);
const port: GroupOperationPort = {
  rpc: async <T,>(name: string, params?: Record<string, unknown>) =>
    result(await owner.rpc(name, params)) as T,
  group: async (code) => {
    assert.equal(code, group.code);
    return group;
  },
  userId: async () => fixtures.users.owner.id,
  members: async () => [],
  feed: async () => [],
  select: async () => [],
  upload: async (bucket, path, bytes, mime, upsert) => {
    result(await owner.storage.from(bucket).upload(path, bytes, { contentType: mime, upsert }));
  },
  remove: async (bucket, path) => {
    result(await owner.storage.from(bucket).remove([path]));
  },
  signedUrl: async (bucket, path, seconds) =>
    result(await owner.storage.from(bucket).createSignedUrl(path, seconds)).signedUrl,
  publicUrl: (bucket, path) => owner.storage.from(bucket).getPublicUrl(path).data.publicUrl,
  uuid: () => crypto.randomUUID(),
};
const operations = createGroupOperations(port);
const caption = 'LOCAL QA ONLY — fabricated group media';
const media =
  (await operations.listMedia(group.code)).find((row) => row.caption === caption) ??
  (await operations.uploadMedia(group.code, {
    bytes: new Uint8Array(
      readFileSync(new URL('../../assets/quran-tracker-symbol.png', directory)),
    ),
    mimeType: 'image/png',
    fileName: 'local-qa-brand-symbol.png',
    caption,
  }));
fixtures.nativeQa = { postId: post.id, mediaId: media.id, seeded: true };
writeFileSync(new URL('fixtures.credentials.json', directory), JSON.stringify(fixtures, null, 2));
console.log(
  'Native QA discussion, collapsed comment and private media prepared; credentials remain in ignored fixture file.',
);
