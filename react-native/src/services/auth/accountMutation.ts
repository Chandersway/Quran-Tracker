import {
  AuthClient,
  type Session,
  type UserAttributes,
  type UserResponse,
} from '@supabase/supabase-js';

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
export type AccountMutation = (
  session: Session,
  attributes: UserAttributes,
  options?: { emailRedirectTo?: string },
) => Promise<UserResponse>;

let mutationSequence = 0;

/** A request owns its captured account; SDK writes must never replace the active session. */
export function createAccountMutation(input: {
  backendUrl: string;
  publicKey: string;
  storageKey: string;
  storage: Storage;
  fetcher?: typeof fetch;
}): AccountMutation {
  const authUrl = `${input.backendUrl.replace(/\/$/, '')}/auth/v1`;
  return async (session, attributes, options) => {
    const accessToken = session.access_token;
    const isolatedKey = `${input.storageKey}.edit-${++mutationSequence}`;
    const memory = new Map([[isolatedKey, JSON.stringify(session)]]);
    // Only PKCE verifiers survive this request, so the normal callback handler can
    // complete the emailed confirmation. Session and user records remain private.
    const verifierKey = (key: string) =>
      attributes.email != null &&
      key.startsWith(`${isolatedKey}-`) &&
      key.endsWith('-code-verifier')
        ? input.storageKey + key.slice(isolatedKey.length)
        : null;
    const isolated = new AuthClient({
      url: authUrl,
      headers: { apikey: input.publicKey },
      storageKey: isolatedKey,
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      experimental: { appendPkceFlowIdToRedirects: true },
      storage: {
        getItem: async (key) => {
          const shared = verifierKey(key);
          return shared ? input.storage.getItem(shared) : (memory.get(key) ?? null);
        },
        setItem: async (key, value) => {
          const shared = verifierKey(key);
          if (shared) await input.storage.setItem(shared, value);
          else memory.set(key, value);
        },
        removeItem: async (key) => {
          const shared = verifierKey(key);
          if (shared) await input.storage.removeItem(shared);
          else memory.delete(key);
        },
      },
      fetch: async (url, init) => {
        // getSession on the main client already refreshed the captured session.
        // Never rotate its refresh token from this isolated, short-lived client.
        if (String(url).split('?')[0] !== `${authUrl}/user` || init?.method !== 'PUT')
          return new Response(JSON.stringify({ msg: 'Account session expired; sign in again' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        const headers = new Headers(init.headers);
        headers.set('Authorization', `Bearer ${accessToken}`);
        return (input.fetcher ?? fetch)(url, { ...init, headers });
      },
    });
    try {
      return await isolated.updateUser(attributes, options);
    } finally {
      await isolated.dispose();
      memory.clear();
    }
  };
}
