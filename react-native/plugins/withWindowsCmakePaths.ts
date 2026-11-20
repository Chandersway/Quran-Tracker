import { withAppBuildGradle, type ConfigPlugin } from 'expo/config-plugins';

/** CMake hashes long object filenames before Windows Ninja reaches MAX_PATH. */
const withWindowsCmakePaths: ConfigPlugin = (config) => {
  if (process.platform !== 'win32') return config;
  return withAppBuildGradle(config, (result) => {
    const marker = '// Wirdna: keep generated C++ paths within Windows MAX_PATH.';
    if (!result.modResults.contents.includes(marker)) {
      result.modResults.contents += `\n${marker}\nandroid {\n    defaultConfig {\n        externalNativeBuild {\n            cmake {\n                arguments "-DCMAKE_OBJECT_PATH_MAX=240"\n            }\n        }\n    }\n    if (System.getenv("WIRDNA_NATIVE_BUILD_DIR")) {\n        externalNativeBuild {\n            cmake {\n                buildStagingDirectory file(System.getenv("WIRDNA_NATIVE_BUILD_DIR"))\n            }\n        }\n    }\n}\n`;
    }
    return result;
  });
};
export default withWindowsCmakePaths;
