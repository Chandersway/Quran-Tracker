import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Metadata only: no Quran text is written to the app's content bundle.
const commit = '7bdefdead812bc2020644b3be91f22c875a70827';
const sha256 = '2ad99415cf4ba9e06b5fba670244d98c3a66e9ba182f14d9e5c189d53175b6ed';
const bytes = readFileSync(process.argv[2] ?? '.tooling/warsh-font-validation/warsh.json');
if (createHash('sha256').update(bytes).digest('hex') !== sha256)
  throw new Error('Warsh source must match the reviewed normative release');
const source = JSON.parse(bytes.toString('utf8'));
if (
  source.mushaf.key !== 'warsh' ||
  source.page_starts.length !== 604 ||
  source.ayah_starts.length !== 6214 ||
  source.numbering.written_joined.length
)
  throw new Error('Unsupported Warsh source shape');
const missing = new Set(source.numbering.missing);
const numbers = Array.from({ length: source.numbering.total }, (_, i) => i + 1).filter(
  (number) => !missing.has(number),
);
if (numbers.length !== source.words.length) throw new Error('Warsh source word count mismatch');
const pages = source.page_starts.map((start, index) => {
  const end = source.page_starts[index + 1] ?? numbers.length;
  return [numbers[start], numbers[end - 1], end - start];
});
const ayahEndNumbers = source.ayah_starts.map(
  (_start, index) => numbers[(source.ayah_starts[index + 1] ?? numbers.length) - 1],
);
const manifest = {
  source: `https://github.com/quran-ws/quran-text/blob/${commit}/data/mushaf/warsh.json`,
  sourceSha256: sha256,
  attribution:
    'Quran.ws (CC BY 4.0; product attribution waiver). Metadata only; Quran text is not bundled.',
  pageColumns: ['firstWordNumber', 'lastWordNumber', 'wordCount'],
  openingWords: source.ayah_starts[0],
  missingWordNumbers: source.numbering.missing,
  surahAyahCounts: source.surahs.map((surah) => surah.ayah_count),
  pages,
  ayahEndNumbers,
};
writeFileSync(
  resolve('src/content/generated/warsh-page-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  `Verified metadata: ${pages.length} pages, ${ayahEndNumbers.length} printed ayahs; no text exported.`,
);
