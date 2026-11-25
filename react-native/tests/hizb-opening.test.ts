import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getHizbOpening } from '../src/content/hizb';
import { getAyahTranslation, resolveTranslationLanguage } from '../src/content/translations';

test('all sixty Hizb openings have complete source translations, not snippets or word glosses', () => {
  for (const [language, file] of [
    ['nl', 'nl_siregar'],
    ['en', 'en_sahih'],
  ] as const) {
    const source = JSON.parse(
      readFileSync(
        path.resolve(process.cwd(), `../app/src/main/assets/translations/${file}.json`),
        'utf8',
      ),
    ) as { surah: number; ayah: number; text: string }[];
    const translations = new Map(source.map((row) => [`${row.surah}:${row.ayah}`, row.text]));
    for (let number = 1; number <= 60; number++) {
      const { start, chapter, ayah } = getHizbOpening(number);
      const reference = `${start.surah}:${start.ayah}`;
      assert.equal(chapter.id, start.surah);
      assert.equal(ayah.number, start.ayah);
      assert.match(ayah.text, /[\u0600-\u06ff]/, reference);
      assert.ok(chapter.name && chapter.nameAr, reference);
      assert.ok(translations.get(reference), reference);
      assert.equal(getAyahTranslation(ayah, language), translations.get(reference), reference);
    }
  }
});

test('opening previews use existing Hizb boundaries, including the first and last Hizb', () => {
  assert.deepEqual(
    [1, 2, 60].map((number) => {
      const { start } = getHizbOpening(number);
      return [start.surah, start.ayah];
    }),
    [
      [1, 1],
      [2, 75],
      [87, 1],
    ],
  );
  for (const number of [0, 61, 1.5, NaN]) assert.throws(() => getHizbOpening(number), RangeError);
});

test('optional previews respect saved translation choice and reader-off locale fallback', () => {
  assert.equal(resolveTranslationLanguage('en', 'nl'), 'en');
  assert.equal(resolveTranslationLanguage('nl', 'en'), 'nl');
  assert.equal(resolveTranslationLanguage('off', 'nl'), 'nl');
  assert.equal(resolveTranslationLanguage('off', 'en'), 'en');
  assert.equal(resolveTranslationLanguage('off', 'ar'), 'en');
  assert.equal(resolveTranslationLanguage('off', 'future-locale'), 'en');
});
