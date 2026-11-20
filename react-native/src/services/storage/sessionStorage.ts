// Web fallback. Metro chooses sessionStorage.native.ts on Android and iOS.
import AsyncStorage from '@react-native-async-storage/async-storage';
export const sessionStorage = AsyncStorage;
