/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const nativeRoot = path.join(__dirname, 'quranGoalWidget');
const provider = '.QuranGoalWidgetProvider';

function patchApplication(source) {
  if (source.includes('add(QuranGoalWidgetPackage())')) return source;
  const marker = '// add(MyReactNativePackage())';
  if (!source.includes(marker)) throw new Error('Could not register QuranGoalWidgetPackage');
  return source.replace(marker, marker + '\n          add(QuranGoalWidgetPackage())');
}

/** Android home-screen widget showing today's reading goal; data comes from HomeWidgetSync. */
function configureManifest(manifest) {
  const application = manifest.manifest.application[0];
  const receivers = (application.receiver ??= []);
  if (!receivers.some((receiver) => receiver.$['android:name'] === provider))
    receivers.push({
      $: {
        'android:name': provider,
        'android:exported': 'false',
        'android:label': '@string/quran_goal_widget_label',
      },
      'intent-filter': [
        {
          action: [
            'android.appwidget.action.APPWIDGET_UPDATE',
            'android.intent.action.TIME_SET',
            'android.intent.action.TIMEZONE_CHANGED',
            'android.intent.action.MY_PACKAGE_REPLACED',
          ].map((name) => ({ $: { 'android:name': name } })),
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/quran_goal_widget_info',
          },
        },
      ],
    });
  return manifest;
}

function copyTree(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(target, { recursive: true });
      copyTree(source, target);
    } else fs.copyFileSync(source, target);
  }
}

module.exports = function withQuranGoalWidget(config) {
  config = withAndroidManifest(config, (mod) => {
    mod.modResults = configureManifest(mod.modResults);
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const root = mod.modRequest.platformProjectRoot;
      const directory = path.join(root, 'app/src/main/java/com/Ameender/qurantracker');
      fs.mkdirSync(directory, { recursive: true });
      fs.copyFileSync(
        path.join(nativeRoot, 'QuranGoalWidget.kt'),
        path.join(directory, 'QuranGoalWidget.kt'),
      );
      copyTree(path.join(nativeRoot, 'res'), path.join(root, 'app/src/main/res'));
      const application = path.join(directory, 'MainApplication.kt');
      fs.writeFileSync(application, patchApplication(fs.readFileSync(application, 'utf8')), 'utf8');
      return mod;
    },
  ]);
};
module.exports.patchApplication = patchApplication;
module.exports.configureManifest = configureManifest;
