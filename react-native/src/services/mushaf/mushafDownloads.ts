import { createMushafDownloadManager } from './downloadManager';
import { importLegacyMushafs, mushafDownloadPort } from './storage';
import { backgroundMushafPort } from './background';

export { createMushafDownloadManager } from './downloadManager';
export type { ActiveMushafDownload, MushafDownloadSnapshot } from './downloadManager';
export const mushafDownloads = createMushafDownloadManager(mushafDownloadPort, {
  background: backgroundMushafPort,
  prepare: () => importLegacyMushafs(new AbortController().signal),
});
