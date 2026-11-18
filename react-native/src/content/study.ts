import { readBundledJson } from './bundledAsset';
import { studyAssetLoaders } from './generated/study-loaders';
import type { StudyAyah } from './types';

const cache = new Map<number, Promise<StudyAyah[]>>();

export function parseStudyAyahs(value: unknown): StudyAyah[] {
  if (!Array.isArray(value)) throw new TypeError('Bundled study content is invalid');
  for (const row of value) {
    if (
      !row ||
      typeof row !== 'object' ||
      !('number' in row) ||
      !('words' in row) ||
      !('irab' in row)
    ) {
      throw new TypeError('Bundled study content is invalid');
    }
  }
  return value as StudyAyah[];
}

/** Loads a surah's word and grammar data from its local bundled `.quran` asset. */
export function getStudyAyahs(surah: number): Promise<StudyAyah[]> {
  const loader = studyAssetLoaders[surah];
  if (!loader) return Promise.reject(new RangeError('Surah must be between 1 and 114'));
  let result = cache.get(surah);
  if (!result) {
    result = readBundledJson(loader())
      .then(parseStudyAyahs)
      .catch((error) => {
        cache.delete(surah);
        throw error;
      });
    cache.set(surah, result);
  }
  return result;
}

export async function getStudyAyah(surah: number, ayah: number): Promise<StudyAyah | undefined> {
  return (await getStudyAyahs(surah)).find((item) => item.number === ayah);
}
