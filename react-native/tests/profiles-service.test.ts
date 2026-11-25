import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createProfileService } from '../src/services/profiles/profiles';
import type { ProfileAccount } from '../src/services/profiles/types';

const account: ProfileAccount = {
  id: 'reader',
  email: 'reader@example.test',
  displayName: 'Identity name',
  avatarUrl: 'identity-photo',
};

function profiles(withCache = false) {
  const writes: unknown[] = [];
  const uploads: Array<{ path: string; bytes: Uint8Array; options: unknown }> = [];
  let row: Record<string, unknown> | null = null;
  let loadError: unknown = null;
  let saveError: unknown = null;
  let uploadError: unknown = null;
  let photoReadable = true;
  let cacheFailure = false;
  let pendingLoad: Promise<{ data: Record<string, unknown> | null; error: unknown }> | undefined;
  let pendingSave: Promise<{ error: unknown }> | undefined;
  const cached = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => cached.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      if (cacheFailure) throw new Error('cache full');
      cached.set(key, value);
    },
    removeItem: async (key: string) => {
      cached.delete(key);
    },
  };
  const client = {
    from(table: string) {
      assert.equal(table, 'profiles');
      return {
        select(columns: string) {
          assert.equal(columns, 'display_name,avatar_url');
          return {
            eq(key: string, id: string) {
              assert.equal(key, 'id');
              assert.ok(id);
              return { maybeSingle: async () => pendingLoad ?? { data: row, error: loadError } };
            },
          };
        },
        async upsert(value: unknown, options: unknown) {
          writes.push({ value, options });
          return pendingSave ?? { error: saveError };
        },
      };
    },
    storage: {
      from(bucket: string) {
        assert.equal(bucket, 'avatars');
        return {
          async upload(path: string, bytes: Uint8Array, options: unknown) {
            uploads.push({ path, bytes, options });
            return { error: uploadError };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://photos.test/${path}` } };
          },
        };
      },
    },
  };
  const createService = () =>
    createProfileService(client as unknown as SupabaseClient, {
      ...(withCache ? { storage } : {}),
      now: () => 1234,
      readPhoto: async (uri) => {
        assert.equal(uri, 'file:///photo');
        return new Response(new Uint8Array([1, 2, 3]), { status: photoReadable ? 200 : 404 });
      },
    });
  const service = createService();
  return {
    service,
    recreate: createService,
    cached,
    failCache: () => {
      cacheFailure = true;
    },
    pendingLoad: (value: typeof pendingLoad) => {
      pendingLoad = value;
    },
    pendingSave: (value: typeof pendingSave) => {
      pendingSave = value;
    },
    writes,
    uploads,
    row: (value: typeof row) => {
      row = value;
    },
    loadError: (value: unknown) => {
      loadError = value;
    },
    saveError: (value: unknown) => {
      saveError = value;
    },
    uploadError: (value: unknown) => {
      uploadError = value;
    },
    unreadable: () => {
      photoReadable = false;
    },
  };
}

test('profiles merge valid online fields with identity fallback and tolerate unavailable reads', async () => {
  const p = profiles();
  assert.deepEqual(await p.service.load(account), {
    displayName: 'Identity name',
    avatarUrl: 'identity-photo',
  });
  p.row({ display_name: 'Community name', avatar_url: '  ' });
  assert.deepEqual(await p.service.load(account), {
    displayName: 'Community name',
    avatarUrl: 'identity-photo',
  });
  p.row({ display_name: null, avatar_url: 'community-photo' });
  assert.deepEqual(await p.service.load(account), {
    displayName: 'Identity name',
    avatarUrl: 'community-photo',
  });
  p.loadError(new Error('offline'));
  assert.deepEqual(await p.service.load(account), {
    displayName: 'Identity name',
    avatarUrl: 'identity-photo',
  });
});

test('saved custom profile survives service restart and an unavailable profile server', async () => {
  const p = profiles(true);
  const saved = await p.service.saveAvatar(account, 'My custom name', { uri: 'file:///photo' });
  p.loadError(new Error('offline'));
  assert.deepEqual(await p.recreate().load(account), saved);
});

test('name-only cache updates preserve the cached photo and never cross account IDs', async () => {
  const p = profiles(true);
  const saved = await p.service.saveAvatar(account, 'Old name', { uri: 'file:///photo' });
  await p.service.saveName(account.id, ' New name ');
  p.loadError(new Error('offline'));
  assert.deepEqual(await p.recreate().load(account), { ...saved, displayName: 'New name' });
  assert.deepEqual(await p.recreate().load({ ...account, id: 'different-reader' }), {
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
  });
  assert.equal(
    (await p.recreate().load({ ...account, email: 'changed@example.test' })).displayName,
    'New name',
  );
});

test('online custom fields precede cached fields, while missing fields retain them offline', async () => {
  const p = profiles(true);
  const saved = await p.service.saveAvatar(account, 'Saved', { uri: 'file:///photo' });
  p.row({ display_name: 'New online name', avatar_url: null });
  assert.deepEqual(await p.service.load(account), { ...saved, displayName: 'New online name' });
  p.loadError(new Error('offline'));
  assert.deepEqual(await p.recreate().load(account), { ...saved, displayName: 'New online name' });
});

test('provider copies in the online row never overwrite an uploaded cached profile', async () => {
  const p = profiles(true);
  const saved = await p.service.saveAvatar(account, 'Uploaded custom name', {
    uri: 'file:///photo',
  });
  p.row({ display_name: account.displayName, avatar_url: account.avatarUrl });
  assert.deepEqual(await p.service.load(account), saved);
  p.row({
    display_name: account.displayName.toUpperCase(),
    avatar_url: 'https://lh3.googleusercontent.com/provider-photo',
  });
  assert.deepEqual(await p.service.load(account), saved);
});

test('rejected remote saves never poison the last successful cached name', async () => {
  const p = profiles(true);
  await p.service.saveName(account.id, 'Saved');
  p.saveError(new Error('denied'));
  await assert.rejects(p.service.saveName(account.id, 'Rejected'), /denied/);
  p.loadError(new Error('offline'));
  assert.equal((await p.recreate().load(account)).displayName, 'Saved');
});

test('corrupt cache and cache write failures do not make successful online profile operations fail', async () => {
  const p = profiles(true);
  await p.service.saveName(account.id, 'Saved');
  p.cached.set([...p.cached.keys()][0]!, '{broken');
  p.loadError(new Error('offline'));
  assert.equal((await p.recreate().load(account)).displayName, account.displayName);
  p.failCache();
  assert.equal(await p.service.saveName(account.id, 'Remote success'), 'Remote success');
});

test('late remote hydration cannot overwrite the cache of a newer profile save', async () => {
  const p = profiles(true);
  let resolve!: (value: { data: Record<string, unknown>; error: null }) => void;
  p.pendingLoad(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const loading = p.service.load(account);
  await new Promise((done) => setImmediate(done));
  await p.service.saveName(account.id, 'New name');
  resolve({ data: { display_name: 'Stale server snapshot', avatar_url: null }, error: null });
  await loading;
  p.pendingLoad(undefined);
  p.loadError(new Error('offline'));
  assert.equal((await p.recreate().load(account)).displayName, 'New name');
});

test('account deletion clears its cache and prevents a pending save from recreating it', async () => {
  const p = profiles(true);
  await p.service.saveName(account.id, 'Old name');
  let resolve!: (value: { error: null }) => void;
  p.pendingSave(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const saving = p.service.saveName(account.id, 'Pending name');
  await p.service.clearCache(account.id);
  resolve({ error: null });
  await saving;
  assert.equal(p.cached.size, 0);
  p.loadError(new Error('offline'));
  assert.equal((await p.recreate().load(account)).displayName, account.displayName);
});

test('name-only saves normalize names, omit the avatar column and propagate rejection', async () => {
  const p = profiles();
  const saved = await p.service.saveName(account.id, `  ${'N'.repeat(50)}  `);
  assert.equal(saved, 'N'.repeat(40));
  assert.deepEqual(p.writes[0], {
    value: { id: 'reader', display_name: 'N'.repeat(40) },
    options: { onConflict: 'id' },
  });
  await assert.rejects(p.service.saveName(account.id, ' '), /profile_name_required/);
  assert.equal(p.writes.length, 1);
  const error = { message: 'write denied' };
  p.saveError(error);
  await assert.rejects(p.service.saveName(account.id, saved), (value) => value === error);
});

for (const [mimeType, extension] of [
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
] as const)
  test(`avatar ${extension} upload preserves user path, bytes and cache-busting profile URL`, async () => {
    const p = profiles();
    const saved = await p.service.saveAvatar(account, '  ', { uri: 'file:///photo', mimeType });
    assert.deepEqual(p.uploads, [
      {
        path: `reader/avatar.${extension}`,
        bytes: new Uint8Array([1, 2, 3]),
        options: { contentType: mimeType, upsert: true },
      },
    ]);
    assert.deepEqual(saved, {
      displayName: 'reader',
      avatarUrl: `https://photos.test/reader/avatar.${extension}?v=1234`,
    });
    assert.equal(p.writes.length, 1);
  });

test('photo reads and uploads must succeed before any profile URL is saved', async () => {
  const p = profiles();
  const error = { message: 'upload denied' };
  p.uploadError(error);
  await assert.rejects(
    p.service.saveAvatar(account, 'Reader', { uri: 'file:///photo' }),
    (value) => value === error,
  );
  assert.equal(p.writes.length, 0);
  assert.equal(p.uploads[0]!.path, 'reader/avatar.jpg');
  p.unreadable();
  await assert.rejects(
    p.service.saveAvatar(account, 'Reader', { uri: 'file:///photo' }),
    /Could not read photo/,
  );
  assert.equal(p.uploads.length, 1);
  assert.equal(p.writes.length, 0);
});
