/** Read-only requests through the actual provider service; no private account or mirror. */
import { writeFileSync } from 'node:fs';
import {
  loadTafsir,
  loadIrab,
  loadAsbabAvailability,
  tafsirProviders,
} from '../../src/services/study/studyProviders';

async function probe(name: string, operation: () => Promise<unknown>) {
  const started = Date.now();
  try {
    const result = await operation();
    return { name, status: 'ok', milliseconds: Date.now() - started, result };
  } catch (error) {
    return {
      name,
      status: 'error',
      milliseconds: Date.now() - started,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const results = await Promise.all([
    ...tafsirProviders.map((source) =>
      probe(source.slug, async () => ({
        characters: (await loadTafsir(1, 1, source.slug)).length,
      })),
    ),
    ...[316, 309].map((book) =>
      probe(`irab-${book}`, async () => {
        const result = await loadIrab(1, 1, book);
        return {
          book: result.id,
          fragments: result.fragments.length,
          characters: result.fragments.reduce((sum, part) => sum + part.html.length, 0),
        };
      }),
    ),
    probe('asbab-index-and-indexed-excerpts', async () => {
      const index = await loadAsbabAvailability();
      return Promise.all(
        [2919, 460].map(async (book) => {
          const chapters = index.get(book);
          const [surah, ayahs] = chapters ? [...chapters].sort((a, b) => a[0] - b[0])[0]! : [];
          if (!surah || !ayahs?.length) throw new Error(`No coverage for ${book}`);
          const excerpt = await loadIrab(surah, ayahs[0]!, book);
          return {
            book,
            coveredSurahs: chapters!.size,
            reference: `${surah}:${ayahs[0]}`,
            fragments: excerpt.fragments.length,
          };
        }),
      );
    }),
  ]);
  const report = {
    date: new Date().toISOString(),
    mutation: 'none; public GET requests only',
    results,
  };
  writeFileSync(
    new URL('./reader-provider-probe.json', import.meta.url),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
}
void main();
