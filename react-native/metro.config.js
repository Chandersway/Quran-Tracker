const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db', 'wasm', 'quran');
// Toolchains, emulators and the server audio mirror are not mobile source files.
// Keeping them out of Metro prevents a multi-gigabyte crawl on local startup.
const rootPattern = __dirname
  .split(/[\\/]/)
  .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('[/\\\\]');
const localArtifacts = new RegExp(
  `^${rootPattern}[/\\\\](?:\\.tooling|audio-cache|dist[^/\\\\]*|output|design-preview|android|ios)(?:[/\\\\]|$)`,
);
// Gradle also writes inside native dependency projects. On Windows its transient
// deletes can keep the fallback watcher scanning every registered directory.
// Keep package build/*.js and native source visible; exclude native outputs only.
const nativeDependencyArtifacts = new RegExp(
  `^${rootPattern.replace(/^[a-z]:/i, (drive) => `[${drive[0].toUpperCase()}${drive[0].toLowerCase()}]:`)}[/\\\\]node_modules[/\\\\](?:@[^/\\\\]+[/\\\\])?[^/\\\\]+[/\\\\](?:android|ReactAndroid)[/\\\\](?:build|\\.cxx|\\.gradle)(?:[/\\\\]|$)`,
);
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  localArtifacts,
  nativeDependencyArtifacts,
];
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(request, response, next);
};
module.exports = config;
