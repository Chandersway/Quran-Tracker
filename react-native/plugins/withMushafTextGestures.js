/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Observe the existing native TextView. Never consume its events, alter text,
// replace its selection action mode, or request responder/interception ownership.
module.exports = function withMushafTextGestures(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const dir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'Ameender',
        'qurantracker',
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(
        path.join(__dirname, 'mushafTextGestures', 'MushafTextGestures.kt'),
        path.join(dir, 'MushafTextGestures.kt'),
      );
      const appFile = path.join(dir, 'MainApplication.kt');
      const app = fs.readFileSync(appFile, 'utf8');
      if (!app.includes('add(MushafTextGesturesPackage())')) {
        const marker = '// add(MyReactNativePackage())';
        if (!app.includes(marker)) throw new Error('Could not register MushafTextGesturesPackage');
        fs.writeFileSync(
          appFile,
          app.replace(marker, marker + '\n          add(MushafTextGesturesPackage())'),
          'utf8',
        );
      }
      return mod;
    },
  ]);
};
