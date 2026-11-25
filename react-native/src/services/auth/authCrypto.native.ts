import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

// auth-js otherwise falls back to Math.random and PKCE plain on native. Expo's
// getRandomValues calls the native CSPRNG directly (unlike getRandomBytes).
const current = globalThis.crypto;
if (!current?.getRandomValues || !current?.subtle?.digest) {
  const algorithms: Record<string, CryptoDigestAlgorithm> = {
    'SHA-256': CryptoDigestAlgorithm.SHA256,
    'SHA-384': CryptoDigestAlgorithm.SHA384,
    'SHA-512': CryptoDigestAlgorithm.SHA512,
    'SHA-1': CryptoDigestAlgorithm.SHA1,
  };
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      ...(current ?? {}),
      getRandomValues,
      subtle: {
        async digest(algorithm: AlgorithmIdentifier, data: BufferSource) {
          const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
          const nativeAlgorithm = algorithms[name.toUpperCase()];
          if (!nativeAlgorithm) throw new Error('Unsupported digest algorithm');
          return digest(nativeAlgorithm, data);
        },
      },
    },
  });
}

export function requireSecurePkce() {
  if (
    !globalThis.crypto?.getRandomValues ||
    !globalThis.crypto?.subtle?.digest ||
    typeof TextEncoder === 'undefined'
  )
    throw new Error('Secure authentication is unavailable');
}
