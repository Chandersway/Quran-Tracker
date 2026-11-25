import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import catalog from '../src/i18n/book-metadata.json';
import { formatSource, sourceCatalog } from '../src/i18n';

test('all seven curated book definitions retain exact Kotlin content and field provenance', () => {
  assert.equal(catalog.length, 7);
  assert.equal(new Set(catalog.map((book) => book.id)).size, 7);
  for (const book of catalog) {
    for (const [field, provenance] of Object.entries(book.provenance)) {
      const source = fs.readFileSync(path.join(process.cwd(), '..', provenance.path), 'utf8');
      const line = source.split(/\r?\n/)[provenance.line - 1]!;
      const literal = line.match(/=\s*("(?:\\.|[^"\\])*")/);
      assert.ok(literal, `${book.id}.${field}`);
      const expected: string = JSON.parse(literal[1]!);
      const value = field.startsWith('summary')
        ? book.summary[
            ({ En: 'en', Nl: 'nl', Ar: 'ar', Fr: 'fr' } as const)[
              field.slice(7) as 'En' | 'Nl' | 'Ar' | 'Fr'
            ]
          ]
        : field === 'assetFile'
          ? `books/${book.assetFile}`
          : book[field as 'id' | 'author' | 'titleAr' | 'titleEn'];
      assert.equal(value, expected, `${book.id}.${field}`);
    }
    const summary = sourceCatalog[`bookMetadata.${book.id}.summary`];
    assert.deepEqual(summary?.values, book.summary);
  }
});

test('book page and result labels format complete original sentences in every active locale', () => {
  for (const language of ['en', 'nl', 'ar'] as const) {
    assert.ok(!formatSource('bookReader.pageLabel', language, [23, 650]).includes('%s'));
    assert.ok(!formatSource('bookReader.searchResults', language, [12]).includes('%s'));
  }
  assert.equal(formatSource('bookReader.pageLabel', 'nl', [23, 650]), 'Pagina 23 / 650');
});
