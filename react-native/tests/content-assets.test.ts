import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { chapters, getAyahs } from '../src/content/quran';
import { parseAudioCatalog, type RawAudioOption } from '../src/services/audio/audio-catalog';

const androidAssets = path.resolve(process.cwd(), '../app/src/main/assets');

test('synchronous Quran rows contain only text, page, and translations', () => {
  assert.equal(chapters.length, 114);
  assert.equal(
    chapters.reduce((total, chapter) => total + chapter.verseCount, 0),
    6236,
  );
  for (let surah = 1; surah <= chapters.length; surah++) {
    const rows = getAyahs(surah);
    assert.equal(rows.length, chapters[surah - 1]?.verseCount);
    assert.ok(rows.every((row) => !('words' in row) && !('irab' in row)));
  }
  assert.throws(() => getAyahs(115), RangeError);
});

test('async study asset generation preserves every source word field and grammar string', () => {
  for (let surah = 1; surah <= chapters.length; surah++) {
    const generated = JSON.parse(
      readFileSync(
        path.resolve(process.cwd(), `src/content/study-details/surah-${surah}.quran`),
        'utf8',
      ),
    ) as Array<{ number: number; words: unknown[]; irab: string }>;
    const source = JSON.parse(
      readFileSync(path.join(androidAssets, `word_by_word_surah_${surah}.json`), 'utf8'),
    ) as Array<{ ayah: number; words: unknown[]; e3rab?: string }>;
    const originalByAyah = new Map(source.map((row) => [row.ayah, row]));
    assert.equal(
      generated.length,
      chapters[surah - 1]?.verseCount,
      `study rows for surah ${surah}`,
    );
    for (const row of generated) {
      const original = originalByAyah.get(row.number);
      assert.deepEqual(row.words, original?.words ?? [], `words ${surah}:${row.number}`);
      assert.equal(row.irab, original?.e3rab ?? '', `grammar ${surah}:${row.number}`);
    }
  }
});

test('all reciter catalogs remain bundled and valid as offline JSON assets', () => {
  for (let surah = 1; surah <= 114; surah++) {
    const rows = JSON.parse(
      readFileSync(path.resolve(process.cwd(), `src/content/audio/surah_${surah}.quran`), 'utf8'),
    ) as RawAudioOption[];
    assert.equal(rows.length, 158, `reciter options in surah ${surah}`);
    assert.equal(parseAudioCatalog(surah, rows).length, rows.length);
  }
});
