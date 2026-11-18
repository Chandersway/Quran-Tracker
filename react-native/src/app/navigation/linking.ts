import { type LinkingOptions } from '@react-navigation/native';
import type { RootStack } from './types';
export const linking: LinkingOptions<RootStack> = {
  prefixes: ['qurantracker://', 'https://qurantracker-8f775.web.app'],
  config: {
    screens: {
      Account: 'auth',
      Group: 'group/:code',
      Goals: 'goals',
      Main: { screens: { Plan: 'plan' } },
      Reader: {
        path: 'read/:surah',
        parse: { surah: Number, ayah: Number, endSurah: Number, endAyah: Number },
      },
    },
  },
};
