import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionStorage } from './sessionStorage';
import { createDeviceStorage } from './deviceStorageCore';

export const deviceStorage = createDeviceStorage(AsyncStorage, sessionStorage);
// Migrate only the fixed five device keys on startup. Failed writes leave the
// original untouched and are retried by the next operation; no values are logged.
void deviceStorage.migrate().catch(() => undefined);
