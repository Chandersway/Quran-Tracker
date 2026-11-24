import { type LinkingOptions } from '@react-navigation/native';
import type { RootStack } from './types';

const verse = { surah: Number, ayah: Number, endSurah: Number, endAyah: Number };

export const linking: LinkingOptions<RootStack> = {
  prefixes: ['qurantracker://', 'https://qurantracker-8f775.web.app'],
  config: {
    // A link opened from outside (widget, notification) keeps Home underneath, so Back stays in the app.
    initialRouteName: 'Main',
    screens: {
      Account: 'auth',
      Group: 'group/:code',
      Goals: 'goals',
      Main: { screens: { Plan: 'plan' } },
      Reader: { path: 'read/:surah', parse: verse },
      // Home-screen widget: qurantracker://mushaf/2?ayah=142[&endSurah=..&endAyah=..&planId=..]
      Mushaf: { path: 'mushaf/:surah', parse: verse },
    },
  },
};
