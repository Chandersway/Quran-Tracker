import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildSelectableWarshPage,
  parseWarshMushafResponse,
  printedWarshPageAyahs,
  warshBasmallah,
} from '../src/domain/selectableWarsh';
import fixtures from './fixtures/warsh-unicode-excerpts.json';
import provenance from '../assets/warsh-unicode/provenance.json';
import illustrations from '../assets/surah-cards/provenance.json';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('all 604 bundled Warsh pages pass the original normative source validation offline', () => {
  let count = 0;
  const opening = JSON.parse(
    readFileSync(path.resolve('assets/warsh-unicode/page-1.quran'), 'utf8'),
  );
  const basmallah = warshBasmallah(parseWarshMushafResponse(opening, 1, printedWarshPageAyahs(1)))!;
  assert.equal(
    basmallah,
    warshBasmallah(parseWarshMushafResponse(fixtures.opening, 1, printedWarshPageAyahs(1))),
  );
  for (let page = 1; page <= 604; page++) {
    const name = `page-${page}.quran`;
    const bytes = readFileSync(path.resolve('assets/warsh-unicode', name));
    assert.equal(sha256(bytes), provenance.sha256[name as keyof typeof provenance.sha256]);
    const words = parseWarshMushafResponse(
      JSON.parse(bytes.toString('utf8')),
      page,
      printedWarshPageAyahs(page),
    );
    count += words.length;
    const built = buildSelectableWarshPage(page, words, basmallah);
    assert.ok(
      built.lines
        .flatMap((line) => line.tokens)
        .every((word) => word.alignment.status === 'unavailable'),
    );
  }
  assert.equal(count, 77431);
  assert.equal(count, provenance.words);
  for (const [page, fixture] of [
    [1, fixtures.opening],
    [2, fixtures.second],
    [158, fixtures.subset],
  ] as const) {
    const value = JSON.parse(
      readFileSync(path.resolve(`assets/warsh-unicode/page-${page}.quran`), 'utf8'),
    );
    assert.deepEqual(
      value.words,
      fixture.words,
      `untouched original codepoints and metadata on page ${page}`,
    );
  }
});

test('each restored optional illustration is byte-identical to the Kotlin source', () => {
  assert.equal(Object.keys(illustrations.files).length, 114);
  for (const [name, expected] of Object.entries(illustrations.files)) {
    const bytes = readFileSync(path.resolve('assets/surah-cards', name));
    assert.equal(bytes.length, expected.bytes);
    assert.equal(sha256(bytes), expected.sha256);
    assert.equal(
      sha256(readFileSync(path.resolve('../app/src/main/res/drawable', name))),
      expected.sha256,
    );
  }
});
