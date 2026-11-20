/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { patchPdfSources } = require('./pdfRuntime/patchPdf');

module.exports = function withPdfRuntime(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const packageFile = require.resolve('react-native-pdf/package.json', {
        paths: [mod.modRequest.projectRoot],
      });
      const root = path.dirname(packageFile);
      const buildGradle = fs.readFileSync(path.join(root, 'android', 'build.gradle'), 'utf8');
      if (!buildGradle.includes("implementation 'com.github.zacharee:AndroidPdfViewer:4.0.1'"))
        throw new Error(
          'PDF leading tiles require AndroidPdfViewer 4.0.1; review before upgrading.',
        );
      const directory = path.join(root, 'android', 'src', 'main', 'java', 'org', 'wonday', 'pdf');
      const viewFile = path.join(directory, 'PdfView.java');
      const managerFile = path.join(directory, 'PdfManager.java');
      const view = fs.readFileSync(viewFile, 'utf8');
      const manager = fs.readFileSync(managerFile, 'utf8');
      const result = patchPdfSources(
        JSON.parse(fs.readFileSync(packageFile, 'utf8')).version,
        view,
        manager,
      );
      if (view !== result.view) fs.writeFileSync(viewFile, result.view, 'utf8');
      if (manager !== result.manager) fs.writeFileSync(managerFile, result.manager, 'utf8');
      const tilesSource = fs.readFileSync(
        path.join(__dirname, 'pdfRuntime', 'LeadingPdfTiles.java'),
        'utf8',
      );
      const tilesDirectory = path.join(
        root,
        'android',
        'src',
        'main',
        'java',
        'com',
        'github',
        'barteksc',
        'pdfviewer',
      );
      const tilesFile = path.join(tilesDirectory, 'LeadingPdfTiles.java');
      if (
        fs.existsSync(tilesFile) &&
        fs.readFileSync(tilesFile, 'utf8').replace(/\r\n/g, '\n') !==
          tilesSource.replace(/\r\n/g, '\n')
      )
        throw new Error(
          'Unexpected LeadingPdfTiles.java source; refusing to overwrite local edits.',
        );
      fs.mkdirSync(tilesDirectory, { recursive: true });
      fs.writeFileSync(tilesFile, tilesSource, 'utf8');
      return mod;
    },
  ]);
};
