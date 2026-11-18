import type { ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const originalFirebaseConfig = resolve(__dirname, '../app/google-services.json');

const config: ExpoConfig = {
  name: 'Quran Tracker',
  slug: 'wirdna',
  scheme: 'qurantracker',
  version: '1.0.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#F6F4EB',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'com.Ameender.qurantracker',
    usesAppleSignIn: true,
    supportsTablet: true,
    infoPlist: { UIBackgroundModes: ['audio'], ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.Ameender.qurantracker',
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ||
      (existsSync(originalFirebaseConfig) ? originalFirebaseConfig : undefined),
    permissions: ['POST_NOTIFICATIONS', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_MEDIA_PLAYBACK'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [{ scheme: 'https', host: 'qurantracker-8f775.web.app', pathPrefix: '/group/' }],
      },
    ],
    predictiveBackGestureEnabled: true,
  },
  web: { name: 'Quran Tracker', bundler: 'metro', favicon: './assets/icon.png' },
  plugins: [
    './plugins/withWindowsCmakePaths',
    './plugins/withLegacyMushafPaths',
    './plugins/withBackgroundMushafDownloads',
    './plugins/withMushafTextGestures',
    './plugins/withPdfRuntime',
    './plugins/withMushafPdfCrop',
    'expo-dev-client',
    'expo-apple-authentication',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow Quran Tracker to access your photos so you can choose a profile picture.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    'expo-font',
    ['expo-audio', { enableBackgroundPlayback: true, microphonePermission: false }],
    ['expo-secure-store', { configureAndroidBackup: false }],
    './plugins/withSourceAndroidBackup',
    [
      'expo-notifications',
      { enableBackgroundRemoteNotifications: true, defaultChannel: 'firebase_messages_v1' },
    ],
    'expo-task-manager',
    '@config-plugins/react-native-blob-util',
    '@config-plugins/react-native-pdf',
    'expo-asset',
    'expo-sharing',
    'expo-sqlite',
  ],
  extra: process.env.EXPO_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PROJECT_ID } } : {},
};

export default config;
