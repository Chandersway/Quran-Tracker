export type SimilarChapter = { id: number; name: string; nameAr: string; verseCount: number };
export type SimilarAyah = { absolute: number; surah: number; ayah: number };
export type SimilarSequence = { ayahs: SimilarAyah[] };
export type SimilarGroup = {
  id: string;
  juz: number;
  source: SimilarSequence;
  matches: SimilarSequence[];
  contextAyahs: number;
  searchTerms: string;
};
export const MUTASHABIHAT_SOURCE_URL = 'https://github.com/Waqar144/Quran_Mutashabihat_Data';

function location(absolute: number, chapters: readonly SimilarChapter[]): SimilarAyah | null {
  if (!Number.isInteger(absolute) || absolute < 1) return null;
  let remaining = absolute;
  for (const chapter of chapters) {
    if (remaining <= chapter.verseCount) return { absolute, surah: chapter.id, ayah: remaining };
    remaining -= chapter.verseCount;
  }
  return null;
}
function sequence(raw: unknown, chapters: readonly SimilarChapter[]): SimilarSequence | null {
  if (!raw || typeof raw !== 'object') return null;
  const ayah = (raw as { ayah?: unknown }).ayah;
  const values = Array.isArray(ayah) ? ayah : typeof ayah === 'number' ? [ayah] : [];
  if (!values.length) return null;
  const ayahs = values.map((value) =>
    typeof value === 'number' ? location(value, chapters) : null,
  );
  return ayahs.some((value) => value === null) ? null : { ayahs: ayahs as SimilarAyah[] };
}

/** MutashabihatRepository.kt: Juz order, source sequence, valid matches, context. */
export function parseMutashabihatGroups(
  raw: unknown,
  chapters: readonly SimilarChapter[],
): SimilarGroup[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Invalid similar-passage data');
  const result: SimilarGroup[] = [];
  for (let juz = 1; juz <= 30; juz++) {
    const entries = (raw as Record<string, unknown>)[String(juz)];
    if (!Array.isArray(entries)) continue;
    entries.forEach((rawEntry, index) => {
      if (!rawEntry || typeof rawEntry !== 'object') return;
      const entry = rawEntry as { src?: unknown; muts?: unknown; ctx?: unknown };
      const source = sequence(entry.src, chapters);
      if (!source || !Array.isArray(entry.muts)) return;
      const matches = entry.muts
        .map((item) => sequence(item, chapters))
        .filter((item): item is SimilarSequence => item !== null);
      if (!matches.length) return;
      let searchTerms = `juz ${juz} `;
      for (const part of [source, ...matches])
        for (const point of part.ayahs) {
          const chapter = chapters[point.surah - 1];
          searchTerms += `${point.surah}:${point.ayah} ${chapter?.name.toLowerCase() ?? ''} ${chapter?.nameAr ?? ''} `;
        }
      result.push({
        id: `${juz}-${source.ayahs[0]!.absolute}-${index}`,
        juz,
        source,
        matches,
        contextAyahs: typeof entry.ctx === 'number' && Number.isInteger(entry.ctx) ? entry.ctx : 0,
        searchTerms,
      });
    });
  }
  return result;
}

/** Source searches references, names and Juz text, never an invented Arabic-text index. */
export function filterMutashabihatGroups(
  groups: readonly SimilarGroup[],
  selectedJuz: number,
  query: string,
): SimilarGroup[] {
  const normalizedQuery = query.trim().toLowerCase();
  return groups.filter(
    (group) =>
      (selectedJuz === 0 || group.juz === selectedJuz) &&
      (!normalizedQuery || group.searchTerms.includes(normalizedQuery)),
  );
}

export function similarReferenceLabel(
  sequence: SimilarSequence,
  chapters: readonly SimilarChapter[],
): string {
  const first = sequence.ayahs[0]!;
  const chapter = chapters[first.surah - 1];
  const name = chapter?.name ?? `Soera ${first.surah}`;
  if (sequence.ayahs.length > 1 && sequence.ayahs.every((point) => point.surah === first.surah))
    return `${name} ${first.surah}:${first.ayah}\u2013${sequence.ayahs.at(-1)!.ayah}`;
  if (sequence.ayahs.length > 1)
    return sequence.ayahs.map((point) => `${point.surah}:${point.ayah}`).join(' \u00b7 ');
  return `${name} ${first.surah}:${first.ayah}`;
}

export function similarSequenceText(
  sequence: SimilarSequence,
  lookup: (surah: number, ayah: number) => string,
): string {
  return sequence.ayahs.map((point) => lookup(point.surah, point.ayah)).join(' \ufd3f \ufd3e ');
}
