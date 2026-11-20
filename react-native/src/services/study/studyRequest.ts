import { isValidAyah, type AsbabAvailability } from './studyProviders';

export type StudyReference = { surah: number; ayah: number };
export type StudyRequest = StudyReference & { kind: 'tafsir' | 'irab' | 'asbab'; source: string };
export type StudyLoadState<T> =
  | { status: 'idle'; key: string }
  | { status: 'loading'; key: string }
  | { status: 'ready'; key: string; value: T }
  | { status: 'error'; key: string; error: unknown };

export function studyRequestKey(request: StudyRequest): string {
  return JSON.stringify([request.kind, request.surah, request.ayah, request.source]);
}

export function fixedStudyReferences(references: readonly StudyReference[]): StudyReference[] {
  const seen = new Set<string>();
  return references
    .filter((ref) => {
      if (!isValidAyah(ref.surah, ref.ayah)) return false;
      const key = `${ref.surah}:${ref.ayah}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((ref) => ({ ...ref }));
}

/** Missing commentary never authorizes substituting another selected verse. */
export function hasStudySource(
  index: AsbabAvailability,
  book: number,
  reference: StudyReference,
): boolean {
  return index.get(book)?.get(reference.surah)?.includes(reference.ayah) ?? false;
}

/** Abort plus generation checks also protect against fetchers that ignore abort. */
export function createStudyRequestController<T>() {
  let generation = 0;
  let controller: AbortController | undefined;
  return {
    cancel() {
      generation += 1;
      controller?.abort();
      controller = undefined;
    },
    async run(
      key: string,
      load: (signal: AbortSignal) => Promise<T>,
      update: (state: StudyLoadState<T>) => void,
    ) {
      const token = ++generation;
      controller?.abort();
      const current = new AbortController();
      controller = current;
      update({ status: 'loading', key });
      try {
        const value = await load(current.signal);
        if (token === generation && !current.signal.aborted)
          update({ status: 'ready', key, value });
      } catch (error) {
        if (token === generation && !current.signal.aborted)
          update({ status: 'error', key, error });
      }
    },
  };
}
