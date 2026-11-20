import assert from 'node:assert/strict';
import test from 'node:test';
import { getAyahs } from '../src/content/quran';
import { getAyahTranslation } from '../src/content/translations';
import { bookTranslationVerses } from '../src/domain/bookTranslation';

test('book translations use complete original Dutch and English text at the verified page', () => {
  const verses = bookTranslationVerses('hafs', [42]);
  const throne = verses.find((item) => item.key === '2:255');
  assert.ok(throne);
  for (const language of ['nl', 'en'] as const) {
    assert.equal(
      getAyahTranslation(throne.ayah, language),
      getAyahTranslation(getAyahs(2)[254]!, language),
    );
    assert.ok(getAyahTranslation(throne.ayah, language).length > 350);
  }
});

test('book spread translation follows Quran order, deduplicates pages and includes surah boundaries', () => {
  const single = bookTranslationVerses('hafs', [604]);
  assert.deepEqual([...new Set(single.map((item) => item.surah))], [112, 113, 114]);
  assert.equal(single[0]?.key, '112:1');
  assert.equal(single.at(-1)?.key, '114:6');
  const spread = bookTranslationVerses('hafs', [604, 603, 604]);
  assert.equal(new Set(spread.map((item) => item.key)).size, spread.length);
  assert.ok(spread[0]!.surah < 112);
  assert.deepEqual(spread.slice(-single.length), single);
});

test('an unmapped PDF never receives a guessed Hafs translation', () => {
  assert.deepEqual(bookTranslationVerses('hafs_indopak_15', [3]), []);
  assert.deepEqual(bookTranslationVerses('hafs_madina_pdf', [50]), []);
  assert.deepEqual(bookTranslationVerses('hafs', [0, -1, NaN, 605]), []);
});
