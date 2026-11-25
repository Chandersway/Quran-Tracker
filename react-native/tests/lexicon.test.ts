import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import { normalizeLexiconText } from '../src/services/lexicon/lexiconNormalization';
import {
  createLexiconRepository,
  type LexiconBinding,
} from '../src/services/lexicon/lexiconRepository';
import type { LexiconEntry } from '../src/services/lexicon/lexiconTypes';

const path = 'assets/lexicon/qac-0.4.db';
const sha256 = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const initialHash = sha256(readFileSync(path));
const db = new DatabaseSync(path, { readOnly: true });
db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF;');
const repository = createLexiconRepository({
  all: async <T extends object>(sql: string, parameters: readonly LexiconBinding[] = []) =>
    db.prepare(sql).all(...parameters) as T[],
});
const raw = readFileSync('data/lexicon/quranic-corpus-morphology-0.4.txt');
const corpus = raw.toString('utf8').replace(/^\uFEFF/, '');
const provenance = JSON.parse(readFileSync('assets/lexicon/provenance.json', 'utf8')) as {
  inputSha256: string;
  databaseSha256: string;
  studySha256: Record<string, string>;
  orthographicVariants: {
    reference: { surah: number; ayah: number; word: number };
    study: string;
    corpus: string;
  }[];
};

after(() => {
  db.close();
  assert.equal(
    sha256(readFileSync(path)),
    initialHash,
    'read-only lookups changed source DB bytes',
  );
});

test('offline QAC corpus preserves input copyright and all canonical counts', () => {
  assert.equal(sha256(raw), 'a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46');
  assert.equal(provenance.inputSha256, sha256(raw));
  assert.equal(provenance.databaseSha256, initialHash);
  const expected = { words: 77429, roots: 1642, lemmas: 4832, segments: 128219, ayah_counts: 6236 };
  for (const [table, count] of Object.entries(expected))
    assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count, count);
  const header = corpus.slice(0, corpus.indexOf('LOCATION\tFORM\tTAG\tFEATURES'));
  assert.equal(readFileSync('assets/lexicon/QAC-NOTICE.txt', 'utf8'), header);
  assert.equal(db.prepare("SELECT notice FROM sources WHERE id='qac'").get()?.notice, header);
  assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('every QAC segment retains exact canonical position, FORM, TAG, FEATURES, ROOT and LEM', () => {
  const rows = db
    .prepare(
      'SELECT w.surah,w.ayah,w.word,s.* FROM segments s JOIN words w ON w.id=s.word_id ORDER BY w.surah,w.ayah,w.word,s.segment',
    )
    .iterate();
  let count = 0;
  for (const line of corpus.split(/\r?\n/)) {
    if (!line.startsWith('(')) continue;
    const [location, form, tag, features] = line.split('\t') as [string, string, string, string];
    const [surah, ayah, word, segment] = location.match(/\d+/g)!.map(Number);
    const row = rows.next().value!;
    assert.deepEqual([row.surah, row.ayah, row.word, row.segment], [surah, ayah, word, segment]);
    assert.equal(row.form, form);
    assert.equal(row.tag, tag);
    assert.equal(row.features, features);
    const fields = Object.fromEntries(
      features
        .split('|')
        .filter((part) => part.includes(':'))
        .map((part) => {
          const colon = part.indexOf(':');
          return [part.slice(0, colon), part.slice(colon + 1)];
        }),
    );
    assert.equal(row.root_id, fields.ROOT ?? null);
    assert.equal(row.lemma_id, fields.LEM ?? null);
    assert.equal(row.pos, fields.POS ?? null);
    count++;
  }
  assert.equal(count, 128219);
  assert.equal(rows.next().done, true);
});

test('all 77,429 original Study words/glosses/transliterations and every ayah word count are exact', () => {
  const rows = db.prepare('SELECT * FROM words ORDER BY surah,ayah,word').iterate();
  const ayahCount = db.prepare('SELECT word_count FROM ayah_counts WHERE surah=? AND ayah=?');
  let count = 0;
  for (let surah = 1; surah <= 114; surah++) {
    const assetPath = `src/content/study-details/surah-${surah}.quran`;
    const bytes = readFileSync(assetPath);
    assert.equal(sha256(bytes), provenance.studySha256[assetPath]);
    const ayahs = JSON.parse(bytes.toString('utf8')) as {
      number: number;
      words: { position: number; arabic: string; translation: string; transliteration: string }[];
    }[];
    for (const ayah of ayahs) {
      assert.equal(ayahCount.get(surah, ayah.number)?.word_count, ayah.words.length);
      for (const word of ayah.words) {
        const row = rows.next().value!;
        assert.deepEqual([row.surah, row.ayah, row.word], [surah, ayah.number, word.position]);
        assert.equal(row.arabic, word.arabic);
        assert.equal(row.gloss, word.translation);
        assert.equal(row.transliteration, word.transliteration);
        assert.equal(row.normalized_study, normalizeLexiconText(word.arabic));
        assert.equal(row.normalized_corpus, normalizeLexiconText(row.corpus_arabic as string));
        count++;
      }
    }
  }
  assert.equal(count, 77429);
  assert.equal(rows.next().done, true);
});

test('word lookup exposes exact stem annotations rather than inferring a root from prefixes', async () => {
  const entry = await repository.lookupLexiconWord({ surah: 1, ayah: 1, word: 1 });
  assert.ok(entry);
  assert.equal(entry.word, 'بِسْمِ');
  assert.deepEqual(
    entry.roots.map((root) => root.id),
    ['smw'],
  );
  assert.deepEqual(
    entry.lemmas.map((lemma) => lemma.id),
    ['{som'],
  );
  assert.deepEqual(
    entry.morphology.map((segment) => segment.sourcePosTag),
    ['P', 'N'],
  );
  assert.equal(entry.morphology[0]!.rootId, undefined);
  assert.equal(entry.morphology[1]!.rootId, 'smw');
  assert.equal(entry.morphology[1]!.features, 'STEM|POS:N|LEM:{som|ROOT:smw|M|GEN');
  assert.equal(entry.transliteration, "bis'mi");
  assert.equal(entry.contextualMeanings.includes('In (the) name'), true);
  assert.deepEqual(
    entry.lexicalDefinitions,
    [],
    'a contextual gloss is never a dictionary definition',
  );
  assert.equal(entry.source.name, 'Quranic Arabic Corpus');
  assert.equal(entry.contextualMeaningSource.name, 'Original bundled word-by-word data');
});

test('root/lemma concordance includes all exact occurrences in canonical order', async () => {
  for (const [id, count] of [
    ['rHm', 339],
    ['qwl', 1722],
    ['Alh', 2851],
  ] as const) {
    const entry = await repository.lookupLexiconRoot(id);
    assert.ok(entry);
    assert.equal(entry.kind, 'root');
    assert.equal(entry.occurrences.length, count);
    assert.deepEqual(
      entry.roots.map((root) => root.id),
      [id],
    );
    const refs = entry.occurrences.map((row) => row.surah * 1000000 + row.ayah * 1000 + row.word);
    assert.deepEqual(
      refs,
      [...refs].sort((a, b) => a - b),
    );
    assert.equal(new Set(refs).size, count);
  }
  const lemma = await repository.lookupLexiconLemma('r~aHiym');
  assert.ok(lemma);
  assert.equal(lemma.kind, 'lemma');
  assert.deepEqual(
    lemma.lemmas.map((row) => row.id),
    ['r~aHiym'],
  );
  const expected = db
    .prepare('SELECT COUNT(*) count FROM word_lemmas WHERE lemma_id=?')
    .get('r~aHiym')!.count;
  assert.equal(lemma.occurrences.length, expected);
  assert.ok(await repository.lookupLexiconLemma('maE2'), 'source homograph IDs remain distinct');
});

test('the five spelling pairs are pinned and both exact source spellings verify at their own position', async () => {
  assert.deepEqual(
    provenance.orthographicVariants.map((row) => Object.values(row.reference)),
    [
      [11, 13, 3],
      [12, 39, 1],
      [12, 41, 1],
      [27, 26, 8],
      [80, 25, 1],
    ],
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) count FROM words WHERE alignment='orthographic-variant'").get()
      ?.count,
    5,
  );
  for (const variant of provenance.orthographicVariants) {
    assert.notEqual(normalizeLexiconText(variant.study), normalizeLexiconText(variant.corpus));
    for (const candidate of [variant.study, variant.corpus]) {
      const result = await repository.verifyLexiconWord(variant.reference, candidate);
      assert.equal(result.status, 'verified');
      if (result.status === 'verified')
        assert.equal(result.entry.alignment, 'orthographic-variant');
    }
  }
});

test('candidate verification fails closed without shifting to a neighbouring word or ayah', async () => {
  assert.equal(
    (await repository.verifyLexiconWord({ surah: 1, ayah: 1, word: 1 }, 'ٱللَّهِ')).status,
    'unavailable',
  );
  assert.equal(
    (await repository.verifyLexiconWord({ surah: 1, ayah: 1, word: 99 }, 'بِسْمِ')).status,
    'unavailable',
  );
  assert.equal(
    (await repository.verifyLexiconWord({ surah: 1, ayah: 1, word: 1 }, 'َ ُ')).status,
    'unavailable',
  );
  assert.equal(
    (await repository.verifyLexiconWord({ surah: 1, ayah: 1, word: 1 }, 'بسم')).status,
    'verified',
  );
  for (const ref of [
    { surah: 0, ayah: 1, word: 1 },
    { surah: 115, ayah: 1, word: 1 },
    { surah: 1, ayah: 999, word: 1 },
    { surah: 1, ayah: 1, word: 1.5 },
  ])
    assert.equal(await repository.lookupLexiconWord(ref), undefined);
  assert.equal(await repository.lookupLexiconRoot('not-a-root'), undefined);
  assert.equal(await repository.lookupLexiconLemma('not-a-lemma'), undefined);
});

test('strict normalization preserves hamza and letter distinctions', () => {
  assert.equal(normalizeLexiconText('ٱلرَّحْمَـٰنِ'), 'الرحمن');
  assert.equal(normalizeLexiconText('ـٔ'), 'ء');
  assert.notEqual(normalizeLexiconText('أَنَّا'), normalizeLexiconText('انَّا'));
  assert.notEqual(normalizeLexiconText('على'), normalizeLexiconText('علي'));
  assert.notEqual(normalizeLexiconText('رحمة'), normalizeLexiconText('رحمه'));
  assert.equal(normalizeLexiconText('ا\u0654'), normalizeLexiconText('أ'));
});

test('root search supports Arabic with vowels and case-sensitive Buckwalter using bound parameters', async () => {
  for (const query of ['رحم', 'رَحْم', 'rHm']) {
    const results = await repository.searchLexiconRoots(query);
    assert.equal(results[0]!.id, 'rHm');
    assert.equal(results[0]!.occurrenceCount, 339);
  }
  assert.equal(
    (await repository.searchLexiconRoots('rhm')).some((row) => row.id === 'rHm'),
    false,
  );
  assert.deepEqual(await repository.searchLexiconRoots("rHm' OR 1=1 --"), []);
  assert.equal((await repository.searchLexiconRoots('')).length, 1642);
});

test('read-only database rejects writes and the repository rejects unsupported schema metadata', async () => {
  assert.throws(() => db.exec('DELETE FROM words'), /readonly/i);
  const invalid = createLexiconRepository({
    all: async <T extends object>(sql: string) => {
      if (sql === 'PRAGMA user_version') return [{ user_version: 99 }] as T[];
      return [{ value: JSON.stringify({ schemaVersion: 99 }) }] as T[];
    },
  });
  await assert.rejects(
    invalid.lookupLexiconWord({ surah: 1, ayah: 1, word: 1 }),
    /schema is invalid/,
  );
});

// Keep aggregate morphology intentionally empty: a root is not an inflected word.
test('aggregate roots keep contextual translations separate from word-specific morphology', async () => {
  const entry: LexiconEntry | undefined = await repository.lookupLexiconRoot('rHm');
  assert.ok(entry);
  assert.equal(entry.reference, undefined);
  assert.deepEqual(entry.morphology, []);
  assert.deepEqual(entry.lexicalDefinitions, []);
  assert.equal(new Set(entry.contextualMeanings).size, entry.contextualMeanings.length);
  assert.equal(
    entry.occurrences.some((word) => word.surah === 1 && word.ayah === 1 && word.word === 3),
    true,
  );
});
