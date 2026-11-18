/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Read-only path bridge; it exposes no arbitrary filesystem operation.
module.exports = function withLegacyMushafPaths(config) {
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
      fs.writeFileSync(
        path.join(dir, 'LegacyMushafPaths.kt'),
        `package com.Ameender.qurantracker

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager

class LegacyMushafPaths(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "LegacyMushafPaths"
  override fun getConstants(): Map<String, Any> = mapOf(
    "externalFiles" to (reactApplicationContext.getExternalFilesDir("downloaded_mushafs")?.absolutePath ?: "")
  )
}
class LegacyMushafPathsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(LegacyMushafPaths(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
`,
        'utf8',
      );
      const appFile = path.join(dir, 'MainApplication.kt');
      let app = fs.readFileSync(appFile, 'utf8');
      if (!app.includes('add(LegacyMushafPathsPackage())')) {
        const marker = '// add(MyReactNativePackage())';
        if (!app.includes(marker)) throw new Error('Could not register LegacyMushafPathsPackage');
        app = app.replace(marker, `${marker}\n          add(LegacyMushafPathsPackage())`);
        fs.writeFileSync(appFile, app, 'utf8');
      }
      return mod;
    },
  ]);
};
