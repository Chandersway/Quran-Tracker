import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import fixtures from './fixtures/warsh-unicode-excerpts.json';
import manifest from '../src/content/generated/warsh-page-manifest.json';
import * as warsh from '../src/domain/selectableWarsh';
import * as hafs from '../src/domain/selectableMushaf';
import { selectablePageText, SELECTABLE_BASMALLAH } from '../src/domain/selectableMushafText';

const opening = warsh.parseWarshMushafResponse(fixtures.opening, 1, warsh.printedWarshPageAyahs(1));
const basmallah = warsh.warshBasmallah(opening)!;
const expected = warsh.printedWarshPageAyahs(158);
const parseExcerpt = (value: unknown = fixtures.subset) =>
  warsh.parseWarshMushafResponse(value, 158, expected);

test('Warsh retains exact source letters, attached signs and printed numbering without Hafs lexical aliases', () => {
  const words = parseExcerpt();
  const page = warsh.buildSelectableWarshPage(158, words);
  const tokens = page.lines.flatMap((line) => line.tokens);
  assert.equal(page.edition, 'warsh_unicode');
  assert.equal(page.sourceMushafId, null);
  assert.equal(page.layout, 'reconstructed');
  assert.deepEqual(
    tokens.filter((word) => word.kind === 'word').map((word) => word.text),
    words.map((word) => word.text),
  );
  assert.ok(tokens.every((word) => word.alignment.status === 'unavailable'));
  assert.deepEqual(tokens[0]!.candidate, { surah: 7, ayah: 57, word: 1 });
  assert.equal(tokens[0]!.id, 20173);
  assert.equal(tokens.at(-1)!.text, '﴿٦٦﴾');
  const buffer = selectablePageText(page, () => 'chapter');
  for (const line of buffer.lines)
    for (const part of line.parts) assert.equal(buffer.text.slice(part.start, part.end), part.text);
  assert.ok(words.some((word) => word.text !== word.text.normalize('NFC')));
});

test('opening ayah zero is retained as real Warsh basmallah and reused without Hafs substitution', () => {
  const first = warsh.buildSelectableWarshPage(1, opening);
  assert.equal(
    first.lines.length,
    8,
    'opening page must not be padded or forced into fifteen lines',
  );
  assert.equal(first.lines[1]!.kind, 'basmallah');
  assert.equal(first.lines[1]!.text, basmallah);
  assert.notEqual(basmallah, SELECTABLE_BASMALLAH);
  assert.equal(
    first.lines.flatMap((line) => line.tokens).filter((word) => word.kind === 'word').length,
    29,
  );
  const words = warsh.parseWarshMushafResponse(fixtures.second, 2, warsh.printedWarshPageAyahs(2));
  assert.throws(() => warsh.buildSelectableWarshPage(2, words), /basmallah/);
  const second = warsh.buildSelectableWarshPage(2, words, basmallah);
  assert.equal(second.lines[0]!.kind, 'surah_name');
  assert.equal(second.lines[1]!.text, basmallah);
  assert.ok(selectablePageText(second, () => 'البقرة').text.includes(basmallah));
  const tawbah = words.map((word) => ({ ...word, surah: 9, page: 187 }));
  const ninth = warsh.buildSelectableWarshPage(187, tawbah);
  assert.equal(ninth.lines[0]!.surah, 9);
  assert.equal(
    ninth.lines.some((line) => line.kind === 'basmallah'),
    false,
  );
});

test('unknown or contradictory reconstructed lines preserve every source word in flowing ayah paragraphs', () => {
  for (const line of [null, 0, undefined, 100]) {
    const raw = {
      words: fixtures.subset.words.map((word, index) => (index === 1 ? { ...word, line } : word)),
    };
    const words = parseExcerpt(raw);
    const page = warsh.buildSelectableWarshPage(158, words);
    assert.equal(page.layout, 'flowing');
    assert.equal(page.lines.length, 10);
    assert.deepEqual(
      page.lines
        .flatMap((line) => line.tokens)
        .filter((word) => word.kind === 'word')
        .map((word) => word.text),
      fixtures.subset.words.map((word) => word.text),
    );
    assert.ok(selectablePageText(page, () => '').text.length > 0);
  }
});

test('wrong page, missing ayahs, missing words, duplicate IDs and wrong source order fail closed', () => {
  assert.throws(
    () => warsh.parseWarshMushafResponse(fixtures.subset, 158, [{ surah: 7, ayah: 57 }]),
    /printed edition/,
  );
  const words = fixtures.subset.words;
  for (const invalid of [
    words.map((word, index) => (index === 0 ? { ...word, page: 157 } : word)),
    words.slice(1),
    words.slice(0, -1),
    words.filter((_word, index) => index !== 2),
    [words[0]!, words[0]!, ...words.slice(1)],
    words.map((word, index) => (index === 2 ? { ...word, position: 5 } : word)),
    words.map((word, index) => (index === 0 ? { ...word, text: '\uE001' } : word)),
    words.map((word, index) => (index === 0 ? { ...word, ayah: 0 } : word)),
  ])
    assert.throws(() => parseExcerpt({ words: invalid }), /Warsh/);
  assert.throws(
    () =>
      warsh.parseWarshMushafResponse(
        { words: fixtures.opening.words.slice(1) },
        1,
        warsh.printedWarshPageAyahs(1),
      ),
    /extent/,
  );
});

test('metadata accounts for published omissions and prevents false markers at page continuations', () => {
  assert.deepEqual(manifest.missingWordNumbers, [25685, 60522, 69720]);
  for (const [first, last, count] of manifest.pages) {
    const gaps = manifest.missingWordNumbers.filter(
      (number) => number >= first! && number <= last!,
    ).length;
    assert.equal(count, last! - first! + 1 - gaps);
  }
  const incomplete = manifest.pages.flatMap((extent, index) =>
    manifest.ayahEndNumbers.includes(extent[1]!) ? [] : [index + 1],
  );
  assert.deepEqual(incomplete, [85, 317, 354, 355]);
  for (const page of incomplete) {
    const end = manifest.pages[page - 1]![1]!;
    const built = warsh.buildSelectableWarshPage(page, [
      {
        surah: 4,
        ayah: 1,
        position: 2,
        number: end,
        page,
        line: 15,
        text: 'اختبار',
      },
    ]);
    assert.equal(
      built.lines.flatMap((line) => line.tokens).some((word) => word.kind === 'end'),
      false,
    );
  }
});

function serviceModule(path: string, modules: Record<string, unknown>, fetch: unknown) {
  const output = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports: Record<string, (...args: unknown[]) => Promise<hafs.SelectableMushafPageData>> =
    {};
  vm.runInNewContext(output, {
    exports,
    AbortController,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    fetch,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  return exports;
}

test('Warsh provider requests its own text, preserves signs and obtains its own opening text', async () => {
  const requests: URL[] = [];
  let wrongPage = true;
  const exports = serviceModule(
    '../src/services/mushaf/warshMushaf.ts',
    {
      '../../domain/selectableWarsh': warsh,
      './warshOffline': {
        loadBundledWarshWords: async () => {
          throw new Error('Unavailable local asset');
        },
      },
    },
    async (input: string) => {
      const url = new URL(input);
      requests.push(url);
      const page = Number(url.searchParams.get('page'));
      const body = page === 1 ? fixtures.opening : fixtures.second;
      if (page === 2 && wrongPage) {
        wrongPage = false;
        return {
          ok: true,
          json: async () => ({ words: body.words.map((word) => ({ ...word, page: 3 })) }),
        };
      }
      return { ok: true, json: async () => body };
    },
  );
  await assert.rejects(exports.loadWarshMushafPage!(2), /Warsh/);
  const page = await exports.loadWarshMushafPage!(2);
  assert.equal(page.edition, 'warsh_unicode');
  assert.equal(page.lines[1]!.text, basmallah);
  assert.deepEqual(
    requests.map((url) => url.searchParams.get('page')),
    ['2', '2', '1'],
  );
  for (const url of requests) {
    assert.equal(url.hostname, 'text.quran.ws');
    assert.equal(url.searchParams.get('edition'), 'warsh');
    assert.equal(url.searchParams.get('signs'), 'attached');
  }
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(exports.loadWarshMushafPage!(2, abort.signal));
  assert.equal(requests.length, 3);
});

test('shared session cache cannot return Hafs text for the same numbered Warsh page', async () => {
  let warshCalls = 0,
    hafsCalls = 0,
    studyCalls = 0;
  const exports = serviceModule(
    '../src/services/mushaf/selectableMushaf.ts',
    {
      '../../domain/selectableMushaf': hafs,
      '../../content/study': {
        getStudyAyahs: async () => {
          studyCalls++;
          return [];
        },
      },
      './warshMushaf': {
        loadWarshMushafPage: async () => {
          warshCalls++;
          return warsh.buildSelectableWarshPage(1, opening);
        },
      },
    },
    async () => {
      hafsCalls++;
      return {
        ok: true,
        json: async () => ({
          verses: [
            {
              verse_key: '1:1',
              words: [
                {
                  id: 1,
                  position: 1,
                  v1_page: 1,
                  line_number: 2,
                  char_type_name: 'word',
                  text_qpc_hafs: 'بِسۡمِ',
                  text_uthmani: 'بِسۡمِ',
                },
              ],
            },
          ],
          pagination: { next_page: null },
        }),
      };
    },
  );
  const first = await exports.loadSelectableMushafPage!(1, undefined, 'warsh_maknoon');
  assert.equal(studyCalls, 0, 'Warsh never requests Hafs lexical material');
  const second = await exports.loadSelectableMushafPage!(1);
  assert.equal(first.edition, 'warsh_unicode');
  assert.equal(second.edition, 'qpc_hafs_unicode');
  assert.equal(await exports.loadSelectableMushafPage!(1, undefined, 'warsh_maknoon'), first);
  assert.equal(await exports.loadSelectableMushafPage!(1), second);
  assert.equal(warshCalls, 1);
  assert.equal(hafsCalls, 1);
  assert.equal(studyCalls, 1);
  await assert.rejects(exports.loadSelectableMushafPage!(1, undefined, 'muhammadi'), /Unsupported/);
});
