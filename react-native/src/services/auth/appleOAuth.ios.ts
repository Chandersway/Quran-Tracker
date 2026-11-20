import * as AppleAuthentication from 'expo-apple-authentication';
import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  getRandomValues,
} from 'expo-crypto';
import { createAppleOAuth, type AppleOAuth } from './appleIdentity';

const nativeFlow = createAppleOAuth({
  isAvailable: () => AppleAuthentication.isAvailableAsync(),
  // This native CSPRNG has no Math.random development fallback.
  randomValues: (bytes) => getRandomValues(bytes),
  sha256: (value) =>
    digestStringAsync(CryptoDigestAlgorithm.SHA256, value, { encoding: CryptoEncoding.HEX }),
  async request({ nonce, state }) {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      // Expo forwards nonce unchanged to ASAuthorizationAppleIDRequest.
      nonce,
      state,
    });
    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      providerUserId: credential.user,
      state: credential.state,
      fullName: credential.fullName
        ? AppleAuthentication.formatFullName(credential.fullName)
        : null,
    };
  },
});

export const appleOAuth: AppleOAuth = {
  ...nativeFlow,
  watchRevocation(listener) {
    const subscription = AppleAuthentication.addRevokeListener(listener);
    return () => subscription.remove();
  },
  async isCredentialRevoked(providerUserId) {
    const state = await AppleAuthentication.getCredentialStateAsync(providerUserId);
    return (
      state === AppleAuthentication.AppleAuthenticationCredentialState.REVOKED ||
      state === AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND
    );
  },
};
