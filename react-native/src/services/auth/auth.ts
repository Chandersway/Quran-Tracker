import type { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js';
import type { AuthService, AuthSession, AuthUser } from './types';
import { googleOAuthUrl } from './googleOAuth';
import { appleOAuth } from './appleOAuth';
import type { AppleOAuth } from './appleIdentity';
import { deleteAppleAccount } from './appleAccountDeletion';
import { AUTH_REDIRECT_URL, verifiedAuthRecovery } from './authCallback';
import type { AccountMutation } from './accountMutation';

function required<T>(value: T | null | undefined, label: string): T {
  if (value == null) throw new Error(`${label} returned no record`);
  return value;
}
function unwrap<T>(result: { data: T; error: { message: string; details?: string } | null }): T {
  if (result.error)
    throw new Error([result.error.message, result.error.details].filter(Boolean).join('\n'));
  return result.data;
}

/** SDK metadata and credentials stay inside this adapter. */
function toAuthUser(user: User): AuthUser {
  const metadata = user.user_metadata;
  return {
    id: user.id,
    email: user.email ?? null,
    provider: String(user.app_metadata.provider ?? 'email').toLowerCase(),
    ...(hasAppleIdentity(user) ? { appleLinked: true as const } : {}),
    displayName: String(
      metadata.display_name ??
        metadata.full_name ??
        metadata.name ??
        user.email?.split('@')[0] ??
        '',
    ),
    avatarUrl:
      typeof metadata.avatar_url === 'string'
        ? metadata.avatar_url
        : typeof metadata.picture === 'string'
          ? metadata.picture
          : null,
  };
}
function hasAppleIdentity(user: User) {
  return (
    user.app_metadata.provider === 'apple' ||
    user.identities?.some((identity) => identity.provider === 'apple') ||
    (Array.isArray(user.app_metadata.providers) && user.app_metadata.providers.includes('apple'))
  );
}
function toAuthSession(session: Session | null): AuthSession | null {
  return session ? { user: toAuthUser(session.user) } : null;
}

/** Account auth operations retain verification and push-recipient revocation ordering. */
export function createAuthService(
  client: SupabaseClient,
  backendUrl: string,
  revokePushDevice: () => Promise<unknown>,
  clearProfileCache: (accountId: string) => Promise<unknown> = async () => undefined,
  apple: AppleOAuth = appleOAuth,
  mutateAccount?: AccountMutation,
): AuthService {
  let applePending = false;
  let revokeMonitor: (() => void) | undefined;
  let authObservers = 0;
  let checkingRevocation = false;
  async function checkAppleRevocation() {
    if (checkingRevocation || !apple.isCredentialRevoked) return;
    checkingRevocation = true;
    try {
      const account = await client.auth.getUser();
      const actor = account.data.user;
      if (account.error || !actor || actor.app_metadata.provider !== 'apple') return;
      const subject = actor.identities?.find((identity) => identity.provider === 'apple')
        ?.identity_data?.sub;
      if (typeof subject !== 'string' || !(await apple.isCredentialRevoked(subject))) return;
      const beforeCleanup = await client.auth.getSession();
      if (beforeCleanup.error || beforeCleanup.data.session?.user.id !== actor.id) return;
      await revokePushDevice().catch(() => undefined);
      const beforeSignOut = await client.auth.getSession();
      if (beforeSignOut.error || beforeSignOut.data.session?.user.id !== actor.id) return;
      await client.auth.signOut();
    } catch {
      // Unavailable credential state (e.g. simulator/offline) is not proof of revocation.
    } finally {
      checkingRevocation = false;
    }
  }
  async function mutateCurrentAccount(
    accountId: string,
    attributes: UserAttributes,
    options?: { emailRedirectTo?: string },
  ) {
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    if (result.data.session?.user.id !== accountId) throw new Error('Account identity changed');
    if (!mutateAccount) throw new Error('Account mutation service is unavailable');
    return mutateAccount(result.data.session, attributes, options);
  }
  const auth: AuthService = {
    async getSession() {
      const result = await client.auth.getSession();
      if (result.error) throw result.error;
      return toAuthSession(result.data.session);
    },
    async getUser() {
      const result = await client.auth.getUser();
      if (result.error?.name === 'AuthSessionMissingError') return null;
      if (result.error) throw result.error;
      return result.data.user ? toAuthUser(result.data.user) : null;
    },
    async signIn(email, password) {
      const result = await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      return toAuthUser(required(result.data.user, 'Sign in'));
    },
    async signInWithGoogle() {
      return googleOAuthUrl(client.auth, backendUrl);
    },
    async signInWithApple() {
      if (applePending) throw new Error('APPLE_SIGN_IN_BUSY');
      applePending = true;
      try {
        const before = await client.auth.getSession();
        if (before.error) throw before.error;
        if (before.data.session) throw new Error('Account identity changed');
        const credential = await apple.signIn();
        if (!credential) return null;
        const current = await client.auth.getSession();
        if (current.error) throw current.error;
        if (current.data.session) throw new Error('Account identity changed');
        const result = await client.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: credential.nonce,
        });
        if (result.error) throw result.error;
        const signedIn = required(result.data.user, 'Apple sign in');
        if (!result.data.session || result.data.session.user.id !== signedIn.id)
          throw new Error('Apple sign in returned no session');
        return { user: toAuthUser(signedIn), firstSignInName: credential.firstSignInName };
      } finally {
        applePending = false;
      }
    },
    async signUp(email, password, displayName) {
      const result = await client.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
          emailRedirectTo: AUTH_REDIRECT_URL,
        },
      });
      if (result.error) throw result.error;
      return result.data.user ? toAuthUser(result.data.user) : null;
    },
    async resendSignUpConfirmation(email, redirectTo = AUTH_REDIRECT_URL) {
      const result = await client.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (result.error) throw result.error;
    },
    async signOut() {
      // The local recipient gate is revoked even if remote cleanup fails while offline.
      await revokePushDevice().catch(() => undefined);
      const result = await client.auth.signOut();
      if (result.error) throw result.error;
    },
    async requestPasswordReset(email, redirectTo = 'qurantracker://auth') {
      const result = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (result.error) throw result.error;
    },
    async requestPasswordChangeCode() {
      const result = await client.auth.reauthenticate();
      if (result.error) throw result.error;
    },
    async completePasswordRecovery(newPassword) {
      if (newPassword.length < 12 || newPassword.length > 128)
        throw new RangeError('Password must be 12 to 128 characters');
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      const result = await mutateCurrentAccount(user.id, { password: newPassword });
      if (result.error) throw result.error;
    },
    async verifyPassword(email, password) {
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      if (!user.email || user.email.trim().toLowerCase() !== email.trim().toLowerCase())
        throw new Error('Account identity changed');
      const result = await client.auth.signInWithPassword({ email: user.email, password });
      if (result.error) throw result.error;
      if (result.data.user?.id !== user.id) throw new Error('Account identity changed');
    },
    async updateUserPassword(newPassword, currentPassword, nonce) {
      if (newPassword.length < 12 || newPassword.length > 128)
        throw new RangeError('Password must be 12 to 128 characters');
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      if (currentPassword !== undefined)
        await auth.verifyPassword(user.email ?? '', currentPassword);
      const result = await mutateCurrentAccount(user.id, {
        password: newPassword,
        nonce: nonce?.trim() || undefined,
      });
      if (result.error) throw result.error;
    },
    async updateUserEmail(newEmail, currentPassword, redirectTo = 'qurantracker://auth') {
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      const email = newEmail.trim();
      if (!email || email.toLowerCase() === user.email?.trim().toLowerCase())
        throw new Error('A different email address is required');
      await auth.verifyPassword(user.email ?? '', currentPassword);
      const result = await mutateCurrentAccount(
        user.id,
        { email },
        { emailRedirectTo: redirectTo },
      );
      if (result.error) throw result.error;
    },
    async accountDeletionStatus() {
      return unwrap(await client.rpc('account_deletion_status_v1')) as string;
    },
    async deleteOwnAccount(confirmationEmail, currentPassword) {
      const user = required((await client.auth.getUser()).data.user, 'Current session');
      if (!user.email || confirmationEmail.trim().toLowerCase() !== user.email.trim().toLowerCase())
        throw new Error('Email confirmation does not match this account');
      if (user.app_metadata.provider === 'email') {
        if (!currentPassword) throw new Error('Current password is required');
        await auth.verifyPassword(user.email, currentPassword);
      }
      let appleDeletion: { manualAppleRevocation: boolean } | undefined;
      if (hasAppleIdentity(user)) {
        appleDeletion = await deleteAppleAccount(client, apple, user.id, confirmationEmail);
      } else {
        unwrap(
          await client.rpc('delete_my_account_v1', {
            confirmation_email: confirmationEmail.trim(),
          }),
        );
      }
      await clearProfileCache(user.id).catch(() => undefined);
      if (hasAppleIdentity(user)) {
        // A different account may have signed in while the provider request was in flight.
        const current = await client.auth.getSession();
        if (current.error || current.data.session?.user.id !== user.id) return appleDeletion;
      }
      await revokePushDevice().catch(() => undefined);
      if (hasAppleIdentity(user)) {
        const current = await client.auth.getSession();
        if (current.error || current.data.session?.user.id !== user.id) return appleDeletion;
      }
      const result = await client.auth.signOut();
      if (result.error) throw result.error;
      return appleDeletion;
    },
    async completeCallback(callback) {
      const result =
        callback.kind === 'otp'
          ? await client.auth.verifyOtp({ token_hash: callback.tokenHash, type: callback.type })
          : callback.kind === 'code'
            ? await client.auth.exchangeCodeForSession(
                callback.code,
                callback.flowId ? { flowId: callback.flowId } : undefined,
              )
            : await client.auth.setSession({
                access_token: callback.accessToken,
                refresh_token: callback.refreshToken,
              });
      if (result.error || !result.data.session) throw new Error('Authentication failed');
      return {
        recovery: verifiedAuthRecovery(
          callback,
          'redirectType' in result.data ? result.data.redirectType : undefined,
        ),
      };
    },
    onLifecycle(listener) {
      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') listener('recovery');
        if (event === 'SIGNED_OUT') listener('signedOut');
      });
      return () => data.subscription.unsubscribe();
    },
    setRefreshActive(active) {
      if (active) void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    },
    onChange(listener) {
      if (++authObservers === 1 && apple.watchRevocation)
        revokeMonitor = apple.watchRevocation(() => {
          void checkAppleRevocation();
        });
      const { data } = client.auth.onAuthStateChange((_event, session) =>
        listener(toAuthSession(session)),
      );
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        data.subscription.unsubscribe();
        if (--authObservers === 0) {
          revokeMonitor?.();
          revokeMonitor = undefined;
        }
      };
    },
  };
  return auth;
}
