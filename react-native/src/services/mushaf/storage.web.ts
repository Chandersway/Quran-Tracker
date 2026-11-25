import type { DownloadEdition, MushafDownloadPort } from './library';
export const mushafDownloadPort: MushafDownloadPort = {
  async has() {
    return false;
  },
  async fetch() {
    throw new Error('Downloads are available in the mobile app.');
  },
};
export function mushafFile(
  _id: DownloadEdition,
  _page?: number,
): { exists: boolean; uri: string; bytes: () => Promise<Uint8Array> } {
  return { exists: false, uri: '', bytes: async () => new Uint8Array() };
}
export function removeMushaf(_id: DownloadEdition) {
  /* Web stores no downloaded packages. */
}
export async function importLegacyMushafs(_signal: AbortSignal): Promise<void> {
  /* No Android legacy storage on web. */
}
