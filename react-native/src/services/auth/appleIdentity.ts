export type AppleIdentity = {
  identityToken: string;
  /** Kept inside auth adapters; Supabase checks its SHA-256 against Apple's token. */
  nonce: string;
  firstSignInName: string | null;
  authorizationCode: string | null;
  providerUserId?: string | null;
};
export type AppleOAuth = {
  isAvailable(): Promise<boolean>;
  signIn(): Promise<AppleIdentity | null>;
  watchRevocation?(listener: () => void): () => void;
  isCredentialRevoked?(providerUserId: string): Promise<boolean>;
};
export type AppleNativePort = {
  isAvailable(): Promise<boolean>;
  randomValues(bytes: Uint8Array): Uint8Array;
  sha256(value: string): Promise<string>;
  request(input: { nonce: string; state: string }): Promise<{
    identityToken: string | null;
    state: string | null;
    fullName: string | null;
    authorizationCode?: string | null;
    providerUserId?: string | null;
  }>;
};

/** Native-only challenge binding. Cancellation never becomes a backend sign-in. */
export function createAppleOAuth(port: AppleNativePort): AppleOAuth {
  let pending = false;
  const random = () => {
    const bytes = port.randomValues(new Uint8Array(32));
    if (bytes.length !== 32) throw new Error('APPLE_SECURE_RANDOM_UNAVAILABLE');
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  };
  return {
    isAvailable: () => port.isAvailable(),
    async signIn() {
      if (pending) throw new Error('APPLE_SIGN_IN_BUSY');
      pending = true;
      try {
        if (!(await port.isAvailable())) throw new Error('APPLE_SIGN_IN_UNAVAILABLE');
        const nonce = random();
        const state = random();
        const hashedNonce = (await port.sha256(nonce)).toLowerCase();
        if (!/^[a-f\d]{64}$/.test(hashedNonce)) throw new Error('APPLE_NONCE_HASH_INVALID');
        const credential = await port.request({ nonce: hashedNonce, state });
        if (credential.state !== state) throw new Error('APPLE_STATE_MISMATCH');
        if (!credential.identityToken?.trim()) throw new Error('APPLE_ID_TOKEN_MISSING');
        return {
          identityToken: credential.identityToken,
          nonce,
          firstSignInName: credential.fullName?.trim().slice(0, 40) || null,
          authorizationCode: credential.authorizationCode ?? null,
          providerUserId: credential.providerUserId ?? null,
        };
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'ERR_REQUEST_CANCELED'
        )
          return null;
        throw error;
      } finally {
        pending = false;
      }
    },
  };
}
