import * as SecureStore from 'expo-secure-store';
import { createSecureSessionStorage } from './secureStorageCore';

export const sessionStorage = createSecureSessionStorage({
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    }),
  remove: (key) => SecureStore.deleteItemAsync(key),
});
