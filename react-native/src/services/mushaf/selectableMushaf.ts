import {
  buildSelectableMushafPage,
  parseMushafResponse,
  verifyMushafWord,
  SELECTABLE_MUSHAF,
  type SelectableMushafPageData,
  type SourceMushafVerse,
  type SelectableMushafEdition,
} from '../../domain/selectableMushaf';
import { getStudyAyahs } from '../../content/study';
import { loadWarshMushafPage } from './warshMushaf';

const cache = new Map<string, { loadedAt: number; data: SelectableMushafPageData }>();
const CACHE_MS = 60 * 60 * 1_000;

/** Session-only edition/page cache. Source responses never become an offline content bundle. */
export async function loadSelectableMushafPage(
  page: number,
  signal?: AbortSignal,
  edition: SelectableMushafEdition = 'hafs',
): Promise<SelectableMushafPageData> {
  if (!Number.isInteger(page) || page < 1 || page > 604)
    throw new RangeError('Invalid Mushaf page');
  signal?.throwIfAborted();
  if (edition !== 'hafs' && edition !== 'warsh_maknoon')
    throw new RangeError('Unsupported selectable Mushaf edition');
  const key = `${edition}:${page}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) return cached.data;
  cache.delete(key);
  const data =
    edition === 'warsh_maknoon'
      ? await loadWarshMushafPage(page, signal)
      : await loadHafsMushafPage(page, signal);
  signal?.throwIfAborted();
  cache.set(key, { loadedAt: Date.now(), data });
  while (cache.size > 8) cache.delete(cache.keys().next().value!);
  return data;
}

async function loadHafsMushafPage(
  page: number,
  signal?: AbortSignal,
): Promise<SelectableMushafPageData> {
  const verses: SourceMushafVerse[] = [];
  let responsePage: number | null = 1;
  const visited = new Set<number>();
  while (responsePage !== null) {
    if (visited.has(responsePage) || visited.size >= 10)
      throw new Error('Invalid Mushaf pagination');
    visited.add(responsePage);
    const parameters = new URLSearchParams({
      mushaf: String(SELECTABLE_MUSHAF.mushafId),
      words: 'true',
      // code_v1 selects the V1 line layout; only Unicode text is rendered.
      // Explicit v1_page is authoritative because legacy page_number can be V2.
      word_fields: 'text_qpc_hafs,text_uthmani,code_v1,v1_page,line_number,position',
      per_page: '50',
      page: String(responsePage),
    });
    const request = new AbortController();
    const abort = () => request.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const deadline = setTimeout(abort, 20_000);
    try {
      signal?.throwIfAborted();
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_page/${page}?${parameters}`,
        {
          signal: request.signal,
          redirect: 'error',
          headers: { Accept: 'application/json' },
        },
      );
      if (!response.ok) throw new Error(`Mushaf source returned ${response.status}`);
      const parsed = parseMushafResponse(await response.json());
      verses.push(...parsed.verses);
      responsePage = parsed.nextPage;
    } finally {
      clearTimeout(deadline);
      signal?.removeEventListener('abort', abort);
    }
  }
  const surahs = [...new Set(verses.map((verse) => Number(verse.verse_key.split(':')[0])))];
  const study = new Map(
    await Promise.all(surahs.map(async (surah) => [surah, await getStudyAyahs(surah)] as const)),
  );
  signal?.throwIfAborted();
  const data = buildSelectableMushafPage(page, verses, (reference, text) => {
    const original = study
      .get(reference.surah)
      ?.find((ayah) => ayah.number === reference.ayah)
      ?.words.find((word) => word.position === reference.word);
    return verifyMushafWord(reference, text, original);
  });
  return data;
}
