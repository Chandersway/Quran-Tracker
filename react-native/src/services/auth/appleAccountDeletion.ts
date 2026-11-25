import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppleOAuth } from './appleIdentity';

/** Fresh Apple authorization stays inside adapters and is sent only to the protected function. */
export async function deleteAppleAccount(
  client: SupabaseClient,
  apple: AppleOAuth,
  accountId: string,
  confirmationEmail: string,
): Promise<{ manualAppleRevocation: boolean }> {
  const initial = await client.auth.getSession();
  if (initial.error) throw initial.error;
  if (initial.data.session?.user.id !== accountId) throw new Error('Account identity changed');
  const status = await client
    .rpc('account_deletion_status_v1')
    .setHeader('Authorization', `Bearer ${initial.data.session.access_token}`);
  if (status.error) throw status.error;
  if (status.data !== 'ready') throw new Error(String(status.data || 'APPLE_DELETE_NOT_READY'));
  const available = await apple.isAvailable();
  const credential = available ? await apple.signIn() : null;
  if (available && !credential) throw new Error('APPLE_REQUEST_CANCELED');
  if (credential && !credential.authorizationCode) {
    // Even the manual path must not accept a prompt for another Apple account.
    // `providerUserId` is returned by Apple's native framework, not decoded JWT input.
    const actor = await client.auth.getUser();
    if (actor.error || actor.data.user?.id !== accountId)
      throw new Error('Account identity changed');
    if (
      !credential.providerUserId ||
      !actor.data.user.identities?.some(
        (identity) =>
          identity.provider === 'apple' &&
          identity.identity_data?.sub === credential.providerUserId,
      )
    )
      throw new Error('APPLE_DELETE_IDENTITY_MISMATCH');
  }
  const session = await client.auth.getSession();
  if (session.error) throw session.error;
  if (session.data.session?.user.id !== accountId) throw new Error('Account identity changed');
  if (!credential?.authorizationCode) {
    // Apple's TN3194 allows account deletion with manual revocation when no code
    // is available. Preserve SQL's current-session and recent-auth requirements.
    const result = await client
      .rpc('delete_my_account_v1', { confirmation_email: confirmationEmail.trim() })
      .setHeader('Authorization', `Bearer ${session.data.session.access_token}`);
    if (result.error) throw result.error;
    return { manualAppleRevocation: true };
  }
  const result = await client.functions.invoke('apple-account-delete', {
    headers: { Authorization: `Bearer ${session.data.session.access_token}` },
    body: {
      accountId,
      confirmationEmail: confirmationEmail.trim(),
      identityToken: credential.identityToken,
      nonce: credential.nonce,
      authorizationCode: credential.authorizationCode,
    },
  });
  if (result.error) {
    // Only public, allowlisted server codes are exposed; never echo tokens/provider responses.
    const body = await result.error.context?.json?.().catch(() => null);
    const code = body?.code;
    if (
      typeof code === 'string' &&
      /^(?:APPLE_[A-Z_]+|owns_groups|linked_data|recent_login_required)$/.test(code)
    )
      throw new Error(code);
    throw new Error('APPLE_DELETE_UNAVAILABLE');
  }
  if (result.data?.deleted !== true || result.data?.accountId !== accountId)
    throw new Error('APPLE_DELETE_UNAVAILABLE');
  return { manualAppleRevocation: false };
}
