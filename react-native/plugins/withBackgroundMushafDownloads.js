/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const {
  withDangerousMod,
  withAndroidManifest,
  withAppDelegate,
  withXcodeProject,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const nativeRoot = path.join(__dirname, 'backgroundMushafDownloads');
const packageName = 'com.Ameender.qurantracker';
const sessionID = packageName + '.mushaf-background.v1';

function patchApplication(source) {
  if (source.includes('add(BackgroundMushafDownloadsPackage())')) return source;
  const marker = '// add(MyReactNativePackage())';
  if (!source.includes(marker))
    throw new Error('Could not register BackgroundMushafDownloadsPackage');
  return source.replace(marker, marker + '\n          add(BackgroundMushafDownloadsPackage())');
}
function patchDelegate(source) {
  if (source.includes('// BackgroundMushafDownloads lifecycle')) return source;
  if (source.includes('handleEventsForBackgroundURLSession'))
    throw new Error('Existing background URLSession handler needs explicit integration');
  const match = /class AppDelegate[^\n]*\{/.exec(source);
  if (!match) throw new Error('Could not register Mushaf background session in Swift AppDelegate');
  const method = `
  // BackgroundMushafDownloads lifecycle
  public override func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    if identifier == "${sessionID}" {
      BackgroundMushafDownloads.handleEvents(identifier, completion: completionHandler)
    } else {
      super.application(application, handleEventsForBackgroundURLSession: identifier, completionHandler: completionHandler)
    }
  }
`;
  return source.replace(match[0], match[0] + method);
}
function configureManifest(manifest) {
  const application = manifest.manifest.application[0];
  const permissions = (manifest.manifest['uses-permission'] ??= []);
  for (const name of ['android.permission.INTERNET', 'android.permission.RECEIVE_BOOT_COMPLETED'])
    if (!permissions.some((permission) => permission.$['android:name'] === name))
      permissions.push({ $: { 'android:name': name } });
  const receivers = (application.receiver ??= []);
  if (!receivers.some((receiver) => receiver.$['android:name'] === '.MushafDownloadReceiver'))
    receivers.push({
      // DownloadProvider can have a privileged UID distinct from system. The receiver
      // ignores all supplied IDs/paths and queries only this app's persisted jobs.
      $: { 'android:name': '.MushafDownloadReceiver', 'android:exported': 'true' },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'android.intent.action.DOWNLOAD_COMPLETE' } },
            { $: { 'android:name': 'android.intent.action.DOWNLOAD_NOTIFICATION_CLICKED' } },
          ],
        },
      ],
    });
  const services = (application.service ??= []);
  if (!services.some((service) => service.$['android:name'] === '.MushafDownloadJob'))
    services.push({
      $: {
        'android:name': '.MushafDownloadJob',
        'android:exported': 'true',
        'android:permission': 'android.permission.BIND_JOB_SERVICE',
      },
    });
  return manifest;
}
function configureIos(project, platformRoot, projectName) {
  const directory = path.join(platformRoot, projectName);
  fs.mkdirSync(directory, { recursive: true });
  for (const name of ['BackgroundMushafDownloads.h', 'BackgroundMushafDownloads.m'])
    fs.copyFileSync(path.join(nativeRoot, name), path.join(directory, name));
  fs.copyFileSync(
    path.join(nativeRoot, 'catalog.json'),
    path.join(directory, 'mushaf_download_catalog.json'),
  );
  const utils = IOSConfig.XcodeUtils;
  utils.addBuildSourceFileToGroup({
    filepath: projectName + '/BackgroundMushafDownloads.m',
    groupName: projectName,
    project,
  });
  utils.addResourceFileToGroup({
    filepath: projectName + '/mushaf_download_catalog.json',
    groupName: projectName,
    isBuildFile: true,
    project,
  });
  // zlib is the system inflater; no extra package, CocoaPod or background execution entitlement.
  project.addFramework('libz.tbd', { target: project.getFirstTarget().uuid });
  const bridging = path.join(directory, projectName + '-Bridging-Header.h');
  if (!fs.existsSync(bridging))
    throw new Error('Missing app bridging header for BackgroundMushafDownloads');
  let header = fs.readFileSync(bridging, 'utf8');
  if (!header.includes('#import "BackgroundMushafDownloads.h"')) {
    header += '\n#import "BackgroundMushafDownloads.h"\n';
    fs.writeFileSync(bridging, header, 'utf8');
  }
  return project;
}
module.exports = function withBackgroundMushafDownloads(config) {
  if (config.android?.package !== packageName || config.ios?.bundleIdentifier !== packageName)
    throw new Error('Mushaf download module requires the preserved app identity');
  config = withAndroidManifest(config, (mod) => {
    mod.modResults = configureManifest(mod.modResults);
    return mod;
  });
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const directory = path.join(
        mod.modRequest.platformProjectRoot,
        'app/src/main/java/com/Ameender/qurantracker',
      );
      fs.mkdirSync(directory, { recursive: true });
      fs.copyFileSync(
        path.join(nativeRoot, 'BackgroundMushafDownloads.kt'),
        path.join(directory, 'BackgroundMushafDownloads.kt'),
      );
      const raw = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/raw');
      fs.mkdirSync(raw, { recursive: true });
      fs.copyFileSync(
        path.join(nativeRoot, 'catalog.json'),
        path.join(raw, 'mushaf_download_catalog.json'),
      );
      const application = path.join(directory, 'MainApplication.kt');
      fs.writeFileSync(application, patchApplication(fs.readFileSync(application, 'utf8')), 'utf8');
      return mod;
    },
  ]);
  config = withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') throw new Error('Expected the Expo Swift AppDelegate');
    mod.modResults.contents = patchDelegate(mod.modResults.contents);
    return mod;
  });
  config = withXcodeProject(config, (mod) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
    mod.modResults = configureIos(mod.modResults, mod.modRequest.platformProjectRoot, projectName);
    return mod;
  });
  return config;
};
module.exports.patchApplication = patchApplication;
module.exports.patchDelegate = patchDelegate;
module.exports.configureManifest = configureManifest;
module.exports.configureIos = configureIos;
