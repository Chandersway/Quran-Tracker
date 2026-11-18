import { Directory, File, Paths } from 'expo-file-system';
import { NativeModules, Platform } from 'react-native';
import { gunzipSync } from 'fflate';
import type { DownloadEdition, MushafDownloadPort } from './library';
import {
  importLegacyPackage,
  optionFor,
  validMushafHeader,
  validMushafTail,
  type LegacyMushafPort,
} from './library';

function directory(id: DownloadEdition) {
  return new Directory(Paths.document, 'downloaded_mushafs', id);
}
function target(id: DownloadEdition, page?: number) {
  const option = optionFor(id);
  return new File(
    directory(id),
    page ? `${String(page).padStart(3, '0')}.${option.type}` : 'mushaf.pdf',
  );
}
function legacyFiles(id: DownloadEdition, page?: number): File[] {
  if (Platform.OS !== 'android') return [];
  const option = optionFor(id);
  const raw: unknown = NativeModules.LegacyMushafPaths?.externalFiles;
  const external =
    typeof raw === 'string' && raw.startsWith('/') ? new Directory(`file://${raw}`) : null;
  if (page)
    return external
      ? [new File(external, id, `${String(page).padStart(3, '0')}.${option.type}`)]
      : [];
  return [
    ...(external ? [new File(external, `${id}.pdf`)] : []),
    new File(Paths.document, 'downloaded_mushafs', `${id}.pdf`),
  ];
}
function ignored(id: DownloadEdition) {
  return new File(Paths.document, 'downloaded_mushafs', `.ignore-${id}`);
}
async function validFile(file: File, type: 'png' | 'svgz' | 'pdf'): Promise<boolean> {
  const handle = file.open();
  let header: Uint8Array;
  let tail: Uint8Array | null = null;
  try {
    header = await handle.readBytes(4096);
    if (type !== 'svgz') {
      handle.offset = Math.max(0, file.size - 4096);
      tail = await handle.readBytes(4096);
    }
  } finally {
    handle.close();
  }
  if (
    !validMushafHeader(header, type) ||
    (type !== 'svgz' && (!tail || !validMushafTail(tail, type)))
  )
    return false;
  if (type === 'svgz' && header[0] === 0x1f && header[1] === 0x8b) {
    if (file.size > 10 * 1024 * 1024) return false;
    try {
      return validMushafHeader(gunzipSync(await file.bytes()), 'svgz');
    } catch {
      return false;
    }
  }
  return true;
}
export const mushafDownloadPort: MushafDownloadPort = {
  async has(id, page) {
    const file = target(id, page);
    const type = optionFor(id).type;
    if (!file.exists || file.size <= 0 || type === 'bundled') return false;
    try {
      return await validFile(file, type);
    } catch {
      return false;
    }
  },
  async fetch(id, url, type, signal, page, onBytes) {
    const dir = directory(id);
    dir.create({ intermediates: true, idempotent: true });
    const file = target(id, page);
    const temp = new File(dir, page ? `${page}.download` : 'mushaf.download');
    if (temp.exists) temp.delete();
    let committed = false;
    try {
      await File.downloadFileAsync(url, temp, {
        signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Wirdna/1.0)' },
        onProgress: (data) => onBytes?.(data.bytesWritten, data.totalBytes),
      });
      if (!(await validFile(temp, type))) throw new Error('Invalid downloaded file');
      if (signal.aborted) throw new Error('Download cancelled');
      if (file.exists && file.size > 0 && (await validFile(file, type))) return;
      if (file.exists) file.delete();
      await temp.move(file);
      committed = true;
    } finally {
      if (!committed && temp.exists) temp.delete();
    }
  },
};
export function mushafFile(id: DownloadEdition, page?: number): File {
  return target(id, page);
}
export function removeMushaf(id: DownloadEdition) {
  const parent = new Directory(Paths.document, 'downloaded_mushafs');
  parent.create({ intermediates: true, idempotent: true });
  const marker = ignored(id);
  if (!marker.exists) marker.create();
  const dir = directory(id);
  if (dir.exists) dir.delete();
}
let migrationQueue: Promise<void> = Promise.resolve();
/** Copy only complete, signature-validated legacy packages. Source files are never changed. */
export function importLegacyMushafs(signal: AbortSignal): Promise<void> {
  const work = migrationQueue.catch(() => undefined).then(() => importLegacyUnlocked(signal));
  migrationQueue = work;
  return work;
}
async function importLegacyUnlocked(signal: AbortSignal): Promise<void> {
  if (Platform.OS !== 'android') return;
  const port: LegacyMushafPort = {
    async ignored(id) {
      return ignored(id).exists;
    },
    async hasCurrent(id, page) {
      const file = target(id, page);
      return file.exists && file.size > 0;
    },
    async validatedSource(id, page) {
      const type = optionFor(id).type;
      if (type === 'bundled') return null;
      const source = legacyFiles(id, page).find((file) => file.exists && file.size > 0);
      if (!source) return null;
      try {
        return (await validFile(source, type)) ? source.uri : null;
      } catch {
        return null;
      }
    },
    async copyAtomic(id, sourceUri, page) {
      const dir = directory(id);
      dir.create({ intermediates: true, idempotent: true });
      const destination = target(id, page);
      if (destination.exists && destination.size > 0) return;
      const temp = new File(dir, `legacy-${page ?? 1}.download`);
      if (temp.exists) temp.delete();
      let committed = false;
      try {
        await new File(sourceUri).copy(temp);
        if (signal.aborted) return;
        if (destination.exists) destination.delete();
        await temp.move(destination);
        committed = true;
      } finally {
        if (!committed && temp.exists) temp.delete();
      }
    },
  };
  for (const id of [
    'hafs_maknoon',
    'warsh_maknoon',
    'hafs_madina_pdf',
    'hafs_indopak_15',
  ] as const) {
    await importLegacyPackage(id, port, signal);
  }
}
