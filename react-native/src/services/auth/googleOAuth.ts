import type { SupabaseClient } from '@supabase/supabase-js';
import { AUTH_REDIRECT_URL, trustedGoogleOAuthUrl } from './authCallback';
import { requireSecurePkce } from './authCrypto';

export async function googleOAuthUrl(
  auth: Pick<SupabaseClient['auth'], 'signInWithOAuth'>,
  backendUrl: string,
): Promise<string> {
  requireSecurePkce();
  const result = await auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true },
  });
  if (result.error) throw result.error;
  if (!result.data.url) throw new Error('Google sign in returned no URL');
  return trustedGoogleOAuthUrl(result.data.url, backendUrl);
}
