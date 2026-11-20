import { strFromU8 } from 'fflate';

export type LibraryEdition =
  | 'hafs'
  | 'hafs_maknoon'
  | 'warsh_maknoon'
  | 'hafs_madina_pdf'
  | 'hafs_indopak_15';
export type DownloadEdition = Exclude<LibraryEdition, 'hafs'>;
export type MushafOption = {
  id: LibraryEdition;
  title: string;
  subtitle: string;
  source: string;
  type: 'bundled' | 'png' | 'svgz' | 'pdf';
  url?: string;
  pages?: number;
};
// These titles, descriptions and URLs are the Kotlin library's exact source literals.
export const mushafOptions: readonly MushafOption[] = [
  {
    id: 'hafs_maknoon',
    title: 'Hafs - Maknoon',
    subtitle: "Losse Hafs-pagina's, scherp en snel",
    source: 'maknoon.com',
    type: 'png',
    pages: 604,
    url: 'https://maknoon.com/download/quran/hafs',
  },
  {
    id: 'hafs',
    title: 'Hafs - Medina',
    subtitle: 'Standaard mushaf in de app',
    source: 'Lokaal pakket',
    type: 'bundled',
    pages: 604,
  },
  {
    id: 'warsh_maknoon',
    title: 'Warsh - Maknoon',
    subtitle: "Losse Warsh-pagina's, netter uitgelijnd",
    source: 'maknoon.com',
    type: 'svgz',
    pages: 604,
    url: 'https://maknoon.com/quran/warsh',
  },
  {
    id: 'hafs_madina_pdf',
    title: 'Hafs - Madinah PDF',
    subtitle: 'Complete Hafs Madani mushaf als downloadpakket',
    source: 'pdf.quran.ws',
    type: 'pdf',
    url: 'https://pdf.quran.ws/pdfs/hafs/quran-hafs-mushaf.pdf',
  },
  {
    id: 'hafs_indopak_15',
    title: 'Hafs - IndoPak 15-line',
    subtitle: 'Bekende IndoPak-layout voor hifz en herhaling',
    source: 'downloadthequran.com',
    type: 'pdf',
    url: 'https://downloadthequran.com/wp-content/uploads/2023/01/15-Line-Standard-Quran-PDF.pdf',
  },
];
export function optionFor(id: LibraryEdition): MushafOption {
  const option = mushafOptions.find((item) => item.id === id);
  if (!option) throw new Error('Unknown Mushaf edition');
  return option;
}
export function validMushafHeader(bytes: Uint8Array, type: 'png' | 'svgz' | 'pdf'): boolean {
  if (type === 'pdf')
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (type === 'png')
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return (bytes[0] === 0x1f && bytes[1] === 0x8b) || /<svg(?:\s|>)/i.test(strFromU8(bytes, true));
}
export function validMushafTail(bytes: Uint8Array, type: 'png' | 'pdf'): boolean {
  const text = strFromU8(bytes, true);
  return type === 'pdf' ? text.includes('%%EOF') : text.includes('IEND');
}
export type MushafDownloadPort = {
  has(id: DownloadEdition, page?: number): Promise<boolean>;
  fetch(
    id: DownloadEdition,
    url: string,
    type: 'png' | 'svgz' | 'pdf',
    signal: AbortSignal,
    page?: number,
    onBytes?: (done: number, total: number) => void,
  ): Promise<void>;
};
export type MushafTransferProgress = {
  phase: 'checking' | 'downloading';
  completed: number;
  total: number | null;
  unit: 'pages' | 'bytes';
  /** Network work in this attempt; cached pages never inflate the rate. */
  transferred: number;
};
export async function downloadMushaf(
  id: DownloadEdition,
  port: MushafDownloadPort,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
  onTransfer?: (progress: MushafTransferProgress) => void,
): Promise<void> {
  const option = optionFor(id);
  if (!option.url || option.type === 'bundled') throw new Error('No download available');
  const total = option.pages ?? 1;
  const missing: number[] = [];
  let cached = 0;
  for (let n = 1; n <= total; n++) {
    if (signal.aborted) throw new Error('Download cancelled');
    const page = option.type === 'pdf' ? undefined : n;
    if (await port.has(id, page)) cached++;
    else missing.push(n);
  }
  if (signal.aborted) throw new Error('Download cancelled');
  onProgress(cached, total);
  if (option.type !== 'pdf')
    onTransfer?.({ phase: 'downloading', completed: cached, total, unit: 'pages', transferred: 0 });
  else if (missing.length)
    onTransfer?.({
      phase: 'downloading',
      completed: 0,
      total: null,
      unit: 'bytes',
      transferred: 0,
    });
  for (const n of missing) {
    if (signal.aborted) throw new Error('Download cancelled');
    const page = option.type === 'pdf' ? undefined : n;
    const url = page ? `${option.url}/${page}.${option.type}` : option.url;
    await port.fetch(
      id,
      url,
      option.type,
      signal,
      page,
      option.type === 'pdf'
        ? (done, size) => {
            const completed = Number.isFinite(done) ? Math.max(0, done) : 0;
            const totalBytes = Number.isFinite(size) && size > 0 ? size : null;
            if (totalBytes !== null) onProgress(completed, totalBytes);
            onTransfer?.({
              phase: 'downloading',
              completed,
              total: totalBytes,
              unit: 'bytes',
              transferred: completed,
            });
          }
        : undefined,
    );
    if (signal.aborted) throw new Error('Download cancelled');
    cached++;
    onProgress(cached, total);
    if (option.type !== 'pdf')
      onTransfer?.({
        phase: 'downloading',
        completed: cached,
        total,
        unit: 'pages',
        transferred: cached - (total - missing.length),
      });
  }
}
export async function installedMushaf(
  id: DownloadEdition,
  port: Pick<MushafDownloadPort, 'has'>,
): Promise<{ ready: boolean; count: number; total: number }> {
  const option = optionFor(id);
  const total = option.pages ?? 1;
  let count = 0;
  for (let n = 1; n <= total; n++)
    if (await port.has(id, option.type === 'pdf' ? undefined : n)) count++;
  return { ready: count === total, count, total };
}
export type LegacyMushafPort = {
  ignored(id: DownloadEdition): Promise<boolean>;
  hasCurrent(id: DownloadEdition, page?: number): Promise<boolean>;
  validatedSource(id: DownloadEdition, page?: number): Promise<string | null>;
  copyAtomic(id: DownloadEdition, source: string, page?: number): Promise<void>;
};
/** Validate the whole legacy package before copying any of it; never mutate its source. */
export async function importLegacyPackage(
  id: DownloadEdition,
  port: LegacyMushafPort,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted || (await port.ignored(id))) return;
  const option = optionFor(id);
  const total = option.pages ?? 1;
  const isPdf = option.type === 'pdf';
  const pageFor = (n: number) => (isPdf ? undefined : n);
  const missing: number[] = [];
  for (let n = 1; n <= total; n++) {
    if (signal.aborted) return;
    if (!(await port.hasCurrent(id, pageFor(n)))) missing.push(n);
  }
  if (!missing.length) return;
  const sources: string[] = [];
  for (let n = 1; n <= total; n++) {
    if (signal.aborted) return;
    const source = await port.validatedSource(id, pageFor(n));
    if (!source) return;
    sources.push(source);
  }
  for (const n of missing) {
    if (signal.aborted) return;
    await port.copyAtomic(id, sources[n - 1]!, pageFor(n));
  }
}
