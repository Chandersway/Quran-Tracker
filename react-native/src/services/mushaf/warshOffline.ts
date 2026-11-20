import { readBundledJson } from '../../content/bundledAsset';
import { warshPageAssets } from '../../content/generated/warsh-page-assets';
import { parseWarshMushafResponse, printedWarshPageAyahs } from '../../domain/selectableWarsh';

/** Full original Unicode corpus, packaged locally; never substituted with Hafs. */
export async function loadBundledWarshWords(page: number, signal?: AbortSignal) {
  const loader = warshPageAssets[page];
  if (!loader) throw new RangeError('Invalid Warsh page');
  signal?.throwIfAborted();
  const value = await readBundledJson(loader());
  signal?.throwIfAborted();
  return parseWarshMushafResponse(value, page, printedWarshPageAyahs(page));
}
