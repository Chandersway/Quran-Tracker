import type { AuthCallback } from './authCallback';

/** Only account information needed by application callers; never session credentials. */
export type AuthUser = {
  id: string;
  email: string | null;
  provider: string;
  /** An Apple identity needs provider revocation as well as account deletion. */
  appleLinked?: true;
  displayName: string;
  avatarUrl: string | null;
};
export type AuthSession = { user: AuthUser };
export type AppleSignInResult = { user: AuthUser; firstSignInName: string | null };
export type AuthCallbackCredentials = Extract<AuthCallback, { kind: 'code' | 'otp' | 'session' }>;

export type AuthService = {
  getSession(): Promise<AuthSession | null>;
  getUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<string>;
  /** Native iOS; null means the user dismissed Apple's prompt. No credentials escape. */
  signInWithApple(): Promise<AppleSignInResult | null>;
  signUp(email: string, password: string, displayName?: string): Promise<AuthUser | null>;
  resendSignUpConfirmation(email: string, redirectTo?: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<void>;
  requestPasswordChangeCode(): Promise<void>;
  completePasswordRecovery(newPassword: string): Promise<void>;
  verifyPassword(email: string, password: string): Promise<void>;
  updateUserPassword(newPassword: string, currentPassword?: string, nonce?: string): Promise<void>;
  updateUserEmail(newEmail: string, currentPassword: string, redirectTo?: string): Promise<void>;
  accountDeletionStatus(): Promise<string>;
  deleteOwnAccount(
    confirmationEmail: string,
    currentPassword?: string,
  ): Promise<{ manualAppleRevocation: boolean } | void>;
  completeCallback(callback: AuthCallbackCredentials): Promise<{ recovery: boolean }>;
  onLifecycle(listener: (event: 'recovery' | 'signedOut') => void): () => void;
  setRefreshActive(active: boolean): void;
  onChange(listener: (session: AuthSession | null) => void): () => void;
};
