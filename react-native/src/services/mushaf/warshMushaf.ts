import {
  buildSelectableWarshPage,
  parseWarshMushafResponse,
  printedWarshPageAyahs,
  warshBasmallah,
  warshNeedsBasmallah,
} from '../../domain/selectableWarsh';
import { loadBundledWarshWords } from './warshOffline';

let openingBasmallah: string | undefined;

async function fetchWarshWords(page: number, signal?: AbortSignal) {
  const query = new URLSearchParams({
    edition: 'warsh',
    page: String(page),
    by: 'word',
    format: 'json',
    fields: 'surah,ayah,page,line,position,number',
    signs: 'attached',
    header: 'false',
  });
  const request = new AbortController();
  const abort = () => request.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const deadline = setTimeout(abort, 20_000);
  try {
    signal?.throwIfAborted();
    const response = await fetch(`https://text.quran.ws/download?${query}`, {
      signal: request.signal,
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Warsh source returned ${response.status}`);
    const words = parseWarshMushafResponse(
      await response.json(),
      page,
      printedWarshPageAyahs(page),
    );
    signal?.throwIfAborted();
    return words;
  } finally {
    clearTimeout(deadline);
    signal?.removeEventListener('abort', abort);
  }
}

async function loadWords(page: number, signal?: AbortSignal) {
  try {
    return await loadBundledWarshWords(page, signal);
  } catch {
    signal?.throwIfAborted();
    // Corrupt or unavailable packaged assets may retry the same verified source.
    return fetchWarshWords(page, signal);
  }
}

/** Offline first; both packaged and recovery responses pass identical source validation. */
export async function loadWarshMushafPage(page: number, signal?: AbortSignal) {
  const words = await loadWords(page, signal);
  openingBasmallah = warshBasmallah(words) ?? openingBasmallah;
  // The publisher stores the basmallah once, outside numbered ayahs on page 1.
  // Reuse those exact Warsh codepoints at other surah openings, never Hafs text.
  if (warshNeedsBasmallah(words) && !openingBasmallah) {
    openingBasmallah = warshBasmallah(await loadWords(1, signal));
    if (!openingBasmallah) throw new Error('Missing Warsh opening text');
  }
  signal?.throwIfAborted();
  return buildSelectableWarshPage(page, words, openingBasmallah);
}
