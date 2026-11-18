import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import boundaryFixtures from './fixtures/selectable-mushaf-v1-boundaries.json';
import * as selectableDomain from '../src/domain/selectableMushaf';
import {
  buildSelectableMushafPage,
  parseMushafResponse,
  verifyMushafWord,
} from '../src/domain/selectableMushaf';

function word(id: number, position: number, line = 3, page = 2) {
  return {
    id,
    position,
    page_number: page,
    v1_page: page,
    line_number: line,
    char_type_name: 'word' as const,
    text_qpc_hafs: 'كَلِمَةٌ',
    text_uthmani: 'كَلِمَةٌ',
  };
}
function response(verses: unknown[]) {
  return { verses, pagination: { next_page: null } };
}

test('Unicode Mushaf retains real line slots and exact UTF16 token offsets', () => {
  const verses = [{ verse_key: '2:1', words: [word(1, 1), word(2, 2)] }];
  const parsed = parseMushafResponse(response(verses));
  const page = buildSelectableMushafPage(2, parsed.verses);
  assert.equal(page.lines.length, 15);
  assert.deepEqual(
    page.lines.slice(0, 3).map((line) => line.kind),
    ['surah_name', 'basmallah', 'ayah'],
  );
  const line = page.lines[2]!;
  for (const token of line.tokens)
    assert.equal(line.text.slice(token.start, token.end), token.text);
  assert.equal(line.tokens[1]!.start, line.tokens[0]!.end + 1);
  assert.equal(line.tokens[0]!.alignment.status, 'unavailable');
});

test('source mismatch stays unavailable and a correct position alone is insufficient', () => {
  const ref = { surah: 2, ayah: 1, word: 1 };
  assert.equal(verifyMushafWord(ref, 'أ', { position: 1, arabic: 'ب' }).status, 'unavailable');
  assert.equal(verifyMushafWord(ref, 'أ', { position: 2, arabic: 'أ' }).status, 'unavailable');
  assert.equal(verifyMushafWord(ref, 'أ', { position: 1, arabic: 'أ' }).status, 'verified');
});

test('end markers cannot become lexical words and crossing verses use word-level pages', () => {
  const verses = [
    {
      verse_key: '2:2',
      words: [
        { ...word(1, 1, 15, 1), page_number: 2 },
        { ...word(2, 2, 1), page_number: 1 },
        {
          ...word(3, 3, 1),
          char_type_name: 'end' as const,
          text_qpc_hafs: '٢',
          text_uthmani: '٢',
        },
      ],
    },
  ];
  const page = buildSelectableMushafPage(
    2,
    parseMushafResponse(response(verses)).verses,
    (reference) => ({
      status: 'verified',
      reference,
    }),
  );
  assert.equal(page.lines[0]!.tokens.length, 2);
  assert.equal(page.lines[0]!.tokens[0]!.candidate.word, 2);
  assert.deepEqual(page.lines[0]!.tokens[1]!.alignment, {
    status: 'unavailable',
    reason: 'end-marker',
  });
});

test('Quran page rejects duplicate words, wrong order and invented heading placement', () => {
  assert.throws(
    () => buildSelectableMushafPage(2, [{ verse_key: '2:2', words: [word(1, 1), word(1, 2)] }]),
    /Duplicate/,
  );
  assert.throws(
    () => buildSelectableMushafPage(2, [{ verse_key: '2:2', words: [word(1, 2), word(2, 1)] }]),
    /order/,
  );
  assert.throws(
    () => buildSelectableMushafPage(2, [{ verse_key: '2:1', words: [word(1, 1, 1)] }]),
    /heading/,
  );
  assert.throws(() => buildSelectableMushafPage(605, []), RangeError);
});

test('glyph-only or malformed API data cannot masquerade as selectable Unicode', () => {
  for (const replacement of [
    { line_number: 16 },
    { text_qpc_hafs: '\uE001' },
    { text_qpc_hafs: '' },
  ])
    assert.throws(
      () =>
        parseMushafResponse(
          response([{ verse_key: '2:2', words: [{ ...word(1, 1), ...replacement }] }]),
        ),
      /Invalid Unicode/,
    );
  assert.throws(
    () => parseMushafResponse({ verses: [], pagination: { next_page: null } }),
    /Missing/,
  );
});

test('At-Tawbah reserves a heading without adding an unsupported basmallah', () => {
  const page = buildSelectableMushafPage(187, [{ verse_key: '9:1', words: [word(1, 1, 2, 187)] }]);
  assert.equal(page.lines[0]!.kind, 'surah_name');
  assert.equal(
    page.lines.some((line) => line.kind === 'basmallah'),
    false,
  );
});

test('live V1 boundary excerpts retain 5:90 and 98:6–7 despite contradictory generic page numbers', () => {
  for (const fixture of boundaryFixtures.pages) {
    const parsed = parseMushafResponse(fixture);
    const page = buildSelectableMushafPage(fixture.page, parsed.verses);
    const tokens = page.lines.flatMap((line) => line.tokens);
    const expectedWords = fixture.verses.flatMap((verse) => verse.words);
    assert.equal(page.sourceMushafId, 2, 'V1 layout identity stays distinct from QPC Unicode text');
    assert.equal(tokens.length, expectedWords.length);
    assert.deepEqual(
      [...new Set(tokens.map((token) => `${token.candidate.surah}:${token.candidate.ayah}`))],
      fixture.verses.map((verse) => verse.verse_key),
      'no ayah returned for this V1 page can disappear through a V2 page filter',
    );
    assert.deepEqual(
      tokens.map((token) => token.text),
      expectedWords.map((word) => word.text_qpc_hafs),
    );
    for (const verse of parsed.verses)
      assert.ok(verse.words.every((word) => word.page_number === fixture.page));
    const previouslyDropped = fixture.verses
      .filter((verse) => verse.words.every((word) => word.page_number !== fixture.page))
      .map((verse) => verse.verse_key);
    assert.deepEqual(previouslyDropped, fixture.page === 123 ? ['5:90'] : ['98:6', '98:7']);
  }
});

test('missing V1 metadata fails closed instead of falling back to the contradictory generic field', () => {
  for (const v1_page of [undefined, null, 0, 605, '2'])
    assert.throws(
      () =>
        parseMushafResponse(response([{ verse_key: '2:2', words: [{ ...word(1, 1), v1_page }] }])),
      /QCF V1 page metadata/,
    );
});

test('the real loader explicitly requests matching V1 page and line metadata while rendering Unicode', async () => {
  const source = readFileSync(
    new URL('../src/services/mushaf/selectableMushaf.ts', import.meta.url),
    'utf8',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const requests: URL[] = [];
  let invalidNextBoundary = true;
  const modules: Record<string, unknown> = {
    '../../domain/selectableMushaf': selectableDomain,
    '../../content/study': { getStudyAyahs: async () => [] },
    './warshMushaf': {
      loadWarshMushafPage: () => {
        throw new Error('Unexpected Warsh request');
      },
    },
  };
  const exports: {
    loadSelectableMushafPage?: (page: number) => Promise<selectableDomain.SelectableMushafPageData>;
  } = {};
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    AbortController,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    fetch: async (input: string) => {
      const url = new URL(input);
      requests.push(url);
      const fixture = boundaryFixtures.pages.find((page) =>
        url.pathname.endsWith(`/${page.page}`),
      )!;
      if (fixture.page === 598 && invalidNextBoundary) {
        invalidNextBoundary = false;
        return {
          ok: true,
          json: async () => ({
            ...fixture,
            verses: fixture.verses.map((verse) => ({
              ...verse,
              words: verse.words.map((word) => ({ ...word, v1_page: undefined })),
            })),
          }),
        };
      }
      return { ok: true, json: async () => fixture };
    },
  });
  const page = await exports.loadSelectableMushafPage!(123);
  assert.equal(requests.length, 1);
  const params = requests[0]!.searchParams;
  assert.equal(params.get('mushaf'), '2');
  const fields = params.get('word_fields')!.split(',');
  assert.ok(fields.includes('code_v1') && fields.includes('v1_page'));
  assert.ok(fields.includes('text_qpc_hafs') && fields.includes('text_uthmani'));
  assert.ok(!fields.includes('code_v2') && !fields.includes('page_number'));
  assert.deepEqual(page.lines[0]!.tokens[0]!.candidate, { surah: 5, ayah: 90, word: 1 });
  assert.equal(page.lines.flatMap((line) => line.tokens).length, 12);
  assert.equal(await exports.loadSelectableMushafPage!(123), page);
  assert.equal(requests.length, 1, 'verified normalized pages can use the session cache');
  await assert.rejects(exports.loadSelectableMushafPage!(598), /QCF V1 page metadata/);
  const boundary = await exports.loadSelectableMushafPage!(598);
  assert.equal(requests.length, 3, 'an invalid layout cannot poison the page cache');
  assert.equal(boundary.lines.flatMap((line) => line.tokens).length, 24);
  assert.equal(await exports.loadSelectableMushafPage!(598), boundary);
  assert.equal(requests.length, 3);
});
