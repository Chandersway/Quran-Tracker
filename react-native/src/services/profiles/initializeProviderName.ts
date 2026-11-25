import type { SupabaseClient } from '@supabase/supabase-js';

/** Seed an optional first-provider name without changing existing custom fields. */
export async function initializeProviderName(
  client: SupabaseClient,
  accountId: string,
  displayName: string,
): Promise<string | null> {
  const clean = displayName.trim().slice(0, 40);
  if (!clean) return null;
  try {
    const actor = await client.auth.getUser();
    if (actor.error || actor.data.user?.id !== accountId) return null;
    const profile = client.from('profiles');
    const existing = await profile.select('display_name').eq('id', accountId).maybeSingle();
    if (existing.error) return null;
    const current = existing.data?.display_name;
    if (typeof current === 'string' && current.trim()) return null;
    if (existing.data && current !== null && typeof current !== 'string') return null;
    let write;
    if (existing.data) {
      const update = profile.update({ display_name: clean }).eq('id', accountId);
      // Compare-and-set: a custom edit committed after the read must win.
      write =
        current === null ? update.is('display_name', null) : update.eq('display_name', current);
    } else {
      write = profile.upsert(
        { id: accountId, display_name: clean },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    }
    const saved = await write.select('display_name').maybeSingle();
    return !saved.error && saved.data?.display_name === clean ? clean : null;
  } catch {
    // A name is optional profile enrichment, never a failed authentication.
    return null;
  }
}
