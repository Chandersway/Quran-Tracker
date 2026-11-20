import AsyncStorage from '@react-native-async-storage/async-storage';

// Web has no device-bound native backup store. Preserve its existing storage.
export const deviceStorage = AsyncStorage;
