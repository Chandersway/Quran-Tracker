/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const {
  withDangerousMod,
  withSettingsGradle,
  withAppBuildGradle,
} = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const packageEntry = 'add(com.Ameender.qurantracker.pdfcrop.MushafPdfCropPackage())';
function patchApplication(source) {
  if (source.includes(packageEntry)) return source;
  const marker = '// add(MyReactNativePackage())';
  if (!source.includes(marker)) throw new Error('Could not register MushafPdfCropPackage');
  return source.replace(marker, `${marker}\n          ${packageEntry}`);
}
function patchSettings(source) {
  const marker = '// Wirdna: native PDF crop worker.';
  if (source.includes(marker)) return source;
  return `${source}\n${marker}\ninclude ':mushaf-pdf-crop'\nproject(':mushaf-pdf-crop').projectDir = new File(rootProject.projectDir, 'mushaf-pdf-crop')\n`;
}
function patchBuild(source) {
  const marker = '// Wirdna: native PDF crop worker.';
  if (source.includes(marker)) return source;
  return `${source}\n${marker}\ndependencies { implementation project(':mushaf-pdf-crop') }\n`;
}
function installSources(platformRoot) {
  const nativeRoot = path.join(__dirname, 'mushafPdfCrop', 'template');
  fs.cpSync(nativeRoot, path.join(platformRoot, 'mushaf-pdf-crop'), { recursive: true });
  const application = path.join(
    platformRoot,
    'app/src/main/java/com/Ameender/qurantracker/MainApplication.kt',
  );
  fs.writeFileSync(application, patchApplication(fs.readFileSync(application, 'utf8')), 'utf8');
}

module.exports = function withMushafPdfCrop(config) {
  if (config.android?.package !== 'com.Ameender.qurantracker')
    throw new Error('PDF crop worker requires the preserved Android app identity');
  config = withSettingsGradle(config, (mod) => {
    mod.modResults.contents = patchSettings(mod.modResults.contents);
    return mod;
  });
  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = patchBuild(mod.modResults.contents);
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      installSources(mod.modRequest.platformProjectRoot);
      return mod;
    },
  ]);
};
module.exports.patchApplication = patchApplication;
module.exports.patchSettings = patchSettings;
module.exports.patchBuild = patchBuild;
module.exports.installSources = installSources;
