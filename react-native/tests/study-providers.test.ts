import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  asbabBooks,
  irabBooks,
  loadAsbabAvailability,
  loadIrab,
  loadTafsir,
  parseAsbabIndex,
  parseIrabResponse,
  plainHtmlText,
  tafsirProviders,
  translationProviders,
  clearAsbabAvailabilityCache,
} from '../src/services/study/studyProviders';

test('source provider catalogs preserve the Android IDs and endpoint slugs', () => {
  assert.deepEqual(
    tafsirProviders.map((item) => item.slug),
    [
      'ar-tafsir-al-tabari',
      'ar-tafsir-ibn-kathir',
      'ar-tafseer-al-saddi',
      'ar-tafsir-al-baghawi',
      'ar-tafseer-al-qurtubi',
      'ar-tafsir-muyassar',
      'ar-tafsir-al-wasit',
      'ar-tafseer-tanwir-al-miqbas',
    ],
  );
  assert.deepEqual(
    translationProviders.map(({ id, assetFile }) => [id, assetFile]),
    [
      ['en.sahih', 'en_sahih.json'],
      ['nl.siregar', 'nl_siregar.json'],
    ],
  );
  assert.deepEqual(
    irabBooks.map(({ id }) => id),
    [316, 309],
  );
  assert.deepEqual(
    asbabBooks.map(({ id }) => id),
    [2919, 460],
  );
});

test('Asbab index accepts gzip payload shape, deduplicates, sorts and rejects invalid Quran refs', () => {
  const index = parseAsbabIndex({
    data: [
      { surah: 2, ayah: 7, asbab: [{ id: 2919 }, { id: 460 }, { id: 18 }] },
      { surah: 2, ayah: 3, asbab: [{ id: 2919 }, { id: 2919 }] },
      { surah: 2, ayah: 287, asbab: [{ id: 2919 }] },
      { surah: 115, ayah: 1, asbab: [{ id: 460 }] },
    ],
  });
  assert.deepEqual(index.get(2919)?.get(2), [3, 7]);
  assert.deepEqual(index.get(460)?.get(2), [7]);
  assert.throws(() => parseAsbabIndex({ data: null }), /Invalid asbab/);
});

test('Asbab endpoint gzip is decompressed and cached after a successful load', async () => {
  clearAsbabAvailabilityCache();
  const bytes = gzipSync(JSON.stringify({ data: [{ surah: 1, ayah: 1, asbab: [{ id: 460 }] }] }));
  let calls = 0;
  const fetcher = (async (input: RequestInfo | URL) => {
    calls += 1;
    assert.equal(String(input), 'https://api.quranpedia.net/dumps/asbab.json.gz');
    return new Response(bytes, { status: 200 });
  }) as typeof fetch;
  const loaded = await loadAsbabAvailability(fetcher);
  assert.deepEqual(loaded.get(460)?.get(1), [1]);
  await loadAsbabAvailability(fetcher);
  assert.equal(calls, 1);
  clearAsbabAvailabilityCache();
});

test('Tafsir fetch uses exact URL and rejects empty/non-success responses', async () => {
  let requested = '';
  const fetcher = (async (input: RequestInfo | URL) => {
    requested = String(input);
    return Response.json({ text: '  ØªÙØ³ÙŠØ±  ' });
  }) as typeof fetch;
  assert.equal(await loadTafsir(2, 255, 'ar-tafsir-ibn-kathir', fetcher), 'ØªÙØ³ÙŠØ±');
  assert.equal(
    requested,
    'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/ar-tafsir-ibn-kathir/2/255.json',
  );
  await assert.rejects(loadTafsir(2, 255, 'bad-provider', fetcher), RangeError);
  await assert.rejects(
    loadTafsir(2, 255, 'ar-tafsir-ibn-kathir', (async () =>
      Response.json({ text: ' ' })) as typeof fetch),
    /EMPTY_TAFSIR/,
  );
});

test('iÊ¿rÄb response validates the selected source and preserves only nonblank HTML fragments', () => {
  const payload = {
    book: { id: 316, name: 'Book', short_name: '', author: { ar_name: 'Author' } },
    content: [
      { text: '<b>Ø§Ù„Ù†Ø­Ùˆ</b>', part: '1', page: '4' },
      { text: '  ', part: '', page: '' },
      { text: 4 },
    ],
  };
  assert.deepEqual(parseIrabResponse(payload, 316), {
    id: 316,
    name: 'Book',
    author: 'Author',
    fragments: [{ html: '<b>Ø§Ù„Ù†Ø­Ùˆ</b>', part: '1', page: '4' }],
  });
  assert.throws(() => parseIrabResponse(payload, 309), /Unexpected/);
  assert.equal(plainHtmlText('<p>A &amp; B</p><br><b>C</b>'), 'A & B\n\nC');
});

test('iÊ¿rÄb fetch keeps the source URL and propagates HTTP 429 distinctly', async () => {
  let requested = '';
  const fetcher = (async (input: RequestInfo | URL) => {
    requested = String(input);
    return Response.json({ book: { id: 309, name: 'al-Ê¿UkbarÄ«' }, content: [] });
  }) as typeof fetch;
  assert.equal((await loadIrab(1, 1, 309, fetcher)).name, 'al-Ê¿UkbarÄ«');
  assert.equal(requested, 'https://api.quranpedia.net/v1/ayah/1/1/book/309');
  await assert.rejects(
    loadIrab(1, 1, 316, (async () => new Response('', { status: 429 })) as typeof fetch),
    /RATE_LIMIT/,
  );
});
