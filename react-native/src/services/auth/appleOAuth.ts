import type { AppleOAuth } from './appleIdentity';

/** Web and Android have no native Apple sign-in surface. */
export const appleOAuth: AppleOAuth = {
  isAvailable: async () => false,
  async signIn() {
    throw new Error('APPLE_SIGN_IN_UNAVAILABLE');
  },
};
