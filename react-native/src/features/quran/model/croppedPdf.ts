import { Directory, File, Paths } from 'expo-file-system';
import { cropPdfBytes } from '../layout/pdfCrop';
import { prepareNativePdfCrop } from '../../../services/mushaf/pdfCrop';

/** Versioned derived artwork cache; the downloaded original is always kept byte-for-byte. */
function cropFiles(source: File) {
  const directory = new Directory(Paths.cache, 'mushaf-crop-v1');
  const identity = `${encodeURIComponent(source.uri)}-${source.size}-${source.modificationTime ?? 0}`;
  const target = new File(directory, `${identity}.pdf`);
  return { directory, identity, target };
}

export function cachedCroppedPdfUri(source: File): string | null {
  try {
    const { target } = cropFiles(source);
    return target.exists && target.size > 0 ? target.uri : null;
  } catch {
    return null;
  }
}

let preparations: Promise<void> = Promise.resolve();

/** Serialize uncached books so quickly leaving/reopening cannot duplicate large allocations. */
export function prepareCroppedPdf(source: File, signal: AbortSignal): Promise<string> {
  if (signal.aborted) return Promise.reject(new Error('PDF preparation cancelled'));
  const cached = cachedCroppedPdfUri(source);
  if (cached) return Promise.resolve(cached);
  const result = preparations.then(() => prepareUncachedPdf(source, signal));
  preparations = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function prepareUncachedPdf(source: File, signal: AbortSignal): Promise<string> {
  if (signal.aborted) throw new Error('PDF preparation cancelled');
  const { directory, identity, target } = cropFiles(source);
  directory.create({ intermediates: true, idempotent: true });
  if (target.exists && target.size > 0) return target.uri;
  const temporary = new File(
    directory,
    `${identity}-${Date.now()}-${Math.random().toString(36).slice(2)}.partial`,
  );
  // Expo mutates File.uri after move(). Cleanup must retain the pre-move location.
  const temporaryUri = temporary.uri;
  try {
    const nativePrepared = await prepareNativePdfCrop(source.uri, temporaryUri, signal);
    if (signal.aborted) throw new Error('PDF preparation cancelled');
    if (!nativePrepared) {
      const cropped = await cropPdfBytes(await source.bytes(), signal);
      if (signal.aborted) throw new Error('PDF preparation cancelled');
      await temporary.write(cropped);
    }
    if (signal.aborted) throw new Error('PDF preparation cancelled');
    if (!temporary.exists || temporary.size <= 0)
      throw new Error('PDF preparation did not produce a complete file');
    if (!(target.exists && target.size > 0)) {
      if (target.exists) target.delete();
      await temporary.move(target);
    }
    if (signal.aborted) throw new Error('PDF preparation cancelled');
    return target.uri;
  } finally {
    const incomplete = new File(temporaryUri);
    if (incomplete.exists) incomplete.delete();
  }
}
