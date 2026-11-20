import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, ProfileAccount, ProfileService } from './types';
import { initializeProviderName } from './initializeProviderName';

type ProfileStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};

function profileForAccount(account: ProfileAccount): Profile {
  return { displayName: account.displayName, avatarUrl: account.avatarUrl };
}

/** Profiles table, storage paths and uploaded photo details stay inside this adapter. */
export function createProfileService(
  client: SupabaseClient,
  {
    readPhoto = fetch,
    now = Date.now,
    storage,
  }: { readPhoto?: typeof fetch; now?: () => number; storage?: ProfileStorage } = {},
): ProfileService {
  // The authenticated actor ID survives email edits and never shares another account's cache.
  const cacheKey = (accountId: string) =>
    `wirdna:profile-cache:v1:${encodeURIComponent(accountId)}`;
  const queued = new Map<string, Promise<unknown>>();
  const revisions = new Map<string, number>();
  const deleted = new Map<string, number>();
  const revision = (accountId: string) => revisions.get(accountId) ?? 0;
  const deletion = (accountId: string) => deleted.get(accountId) ?? 0;

  async function readStored(accountId: string): Promise<Partial<Profile>> {
    try {
      const raw = await storage?.getItem(cacheKey(accountId));
      const value: unknown = raw ? JSON.parse(raw) : null;
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      const profile = value as Record<string, unknown>;
      return {
        ...(typeof profile.displayName === 'string' && profile.displayName.trim()
          ? { displayName: profile.displayName.trim().slice(0, 40) }
          : {}),
        ...(typeof profile.avatarUrl === 'string' && profile.avatarUrl.trim()
          ? { avatarUrl: profile.avatarUrl }
          : {}),
      };
    } catch {
      return {};
    }
  }

  function queueCache(accountId: string, work: () => Promise<unknown>): Promise<unknown> {
    const next = (queued.get(accountId) ?? Promise.resolve()).catch(() => undefined).then(work);
    queued.set(accountId, next);
    void next
      .finally(() => {
        if (queued.get(accountId) === next) queued.delete(accountId);
      })
      .catch(() => undefined);
    return next;
  }

  async function cacheProfile(accountId: string, patch: Partial<Profile>) {
    if (!storage) return;
    // A remote save remains successful if this disposable local copy cannot be written.
    await queueCache(accountId, async () => {
      const previous = await readStored(accountId);
      await storage.setItem(cacheKey(accountId), JSON.stringify({ ...previous, ...patch }));
    }).catch(() => undefined);
  }

  async function saveAvatarProfile(accountId: string, profile: Profile): Promise<Profile> {
    const clean = { ...profile, displayName: profile.displayName.trim().slice(0, 40) };
    if (!clean.displayName) throw new Error('profile_name_required');
    const { error } = await client
      .from('profiles')
      .upsert(
        { id: accountId, display_name: clean.displayName, avatar_url: clean.avatarUrl },
        { onConflict: 'id' },
      );
    if (error) throw error;
    return clean;
  }
  return {
    async load(account) {
      const startedAt = revision(account.id);
      await queued.get(account.id)?.catch(() => undefined);
      const cached = await readStored(account.id);
      const fallback = { ...profileForAccount(account), ...cached };
      try {
        const { data, error } = await client
          .from('profiles')
          .select('display_name,avatar_url')
          .eq('id', account.id)
          .maybeSingle();
        if (error || !data) return fallback;
        const customName =
          typeof data.display_name === 'string' &&
          data.display_name.trim() &&
          data.display_name.trim().toLowerCase() !== account.displayName.trim().toLowerCase();
        const avatarBase =
          typeof data.avatar_url === 'string' ? (data.avatar_url.split('?')[0] ?? '') : '';
        const customAvatar =
          avatarBase.trim() &&
          avatarBase !== account.avatarUrl?.split('?')[0] &&
          !avatarBase.toLowerCase().includes('googleusercontent.com');
        const custom: Partial<Profile> = {
          ...(customName ? { displayName: data.display_name } : {}),
          ...(customAvatar ? { avatarUrl: data.avatar_url } : {}),
        };
        if (revision(account.id) === startedAt) await cacheProfile(account.id, custom);
        return { ...fallback, ...custom };
      } catch {
        return fallback;
      }
    },
    async saveName(accountId, displayName) {
      const cleanName = displayName.trim().slice(0, 40);
      if (!cleanName) throw new Error('profile_name_required');
      revisions.set(accountId, revision(accountId) + 1);
      const generation = deletion(accountId);
      const { error } = await client
        .from('profiles')
        .upsert({ id: accountId, display_name: cleanName }, { onConflict: 'id' });
      if (error) throw error;
      if (generation === deletion(accountId))
        await cacheProfile(accountId, { displayName: cleanName });
      return cleanName;
    },
    async saveAvatar(account, displayName, photo) {
      revisions.set(account.id, revision(account.id) + 1);
      const generation = deletion(account.id);
      const mimeType = photo.mimeType ?? 'image/jpeg';
      const extension =
        mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const response = await readPhoto(photo.uri);
      if (!response.ok) throw new Error('Could not read photo');
      const bytes = new Uint8Array(await response.arrayBuffer());
      const path = `${account.id}/avatar.${extension}`;
      const bucket = client.storage.from('avatars');
      const { error } = await bucket.upload(path, bytes, { contentType: mimeType, upsert: true });
      if (error) throw error;
      const avatarUrl = `${bucket.getPublicUrl(path).data.publicUrl}?v=${now()}`;
      const saved = await saveAvatarProfile(account.id, {
        displayName:
          displayName.trim().slice(0, 40) || String(account.email?.split('@')[0] ?? 'Reader'),
        avatarUrl,
      });
      if (generation === deletion(account.id)) await cacheProfile(account.id, saved);
      return saved;
    },
    async clearCache(accountId) {
      revisions.set(accountId, revision(accountId) + 1);
      deleted.set(accountId, deletion(accountId) + 1);
      if (storage) await queueCache(accountId, () => storage.removeItem(cacheKey(accountId)));
    },
    async rememberProviderName(accountId, displayName) {
      const startedAt = revision(accountId);
      const saved = await initializeProviderName(client, accountId, displayName);
      if (saved && revision(accountId) === startedAt) {
        revisions.set(accountId, startedAt + 1);
        await cacheProfile(accountId, { displayName: saved });
      }
      return saved;
    },
  };
}
