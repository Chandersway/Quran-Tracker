import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import { createLaneDictionary } from '../src/services/lexicon/laneDictionary';
import {
  createLexiconRepository,
  type LexiconBinding,
} from '../src/services/lexicon/lexiconRepository';
import {
  lexiconReaderTarget,
  lexiconTargetKey,
} from '../src/features/lexicon/model/lexiconNavigation';

const lane = new DatabaseSync('assets/lexicon/lane-qac.db', { readOnly: true });
const qac = new DatabaseSync('assets/lexicon/qac-0.4.db', { readOnly: true });
const port = (db: DatabaseSync) => ({
  all: async <T extends object>(sql: string, parameters: readonly LexiconBinding[] = []) =>
    db.prepare(sql).all(...parameters) as T[],
});
const dictionary = createLaneDictionary(port(lane));
const corpus = createLexiconRepository(port(qac));
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
after(() => {
  lane.close();
  qac.close();
});

test('Lane bundle has complete exact-heading coverage, source metadata and original GPL bytes', () => {
  const provenance = JSON.parse(readFileSync('assets/lexicon/lane-provenance.json', 'utf8'));
  assert.equal(hash('assets/lexicon/lane-qac.db'), provenance.databaseSha256);
  assert.equal(lane.prepare('SELECT COUNT(*) count FROM definitions').get()?.count, 20354);
  assert.equal(
    lane.prepare("SELECT COUNT(*) count FROM roots WHERE status='exact-canonical-heading'").get()
      ?.count,
    1296,
  );
  assert.equal(
    lane.prepare("SELECT COUNT(*) count FROM roots WHERE status='unmapped'").get()?.count,
    346,
  );
  const mapping = JSON.parse(readFileSync('data/lexicon/lane-root-mapping.json', 'utf8'));
  for (const row of mapping.records) {
    const definitions = lane
      .prepare(
        'SELECT d.id,d.root,d.xml,d.definition FROM definitions d JOIN root_definitions r ON r.definition_id=d.id WHERE r.root_id=? ORDER BY d.id',
      )
      .all(row.qacRootIdBW);
    assert.deepEqual(
      definitions.map((item) => item.id),
      [...row.laneEntryIds].sort((a, b) => a - b),
    );
    for (const entry of definitions) {
      assert.equal(String(entry.root).normalize('NFC'), row.publishedCanonicalArabic);
      assert.ok(String(entry.xml).startsWith('<entryFree'));
      assert.ok(String(entry.definition).length > 0);
    }
  }
  const license = readFileSync('assets/lexicon/LANE-LICENSE.txt', 'utf8');
  assert.equal(JSON.parse(readFileSync('assets/lexicon/lane-license.json', 'utf8')).text, license);
  assert.match(license, /GNU GENERAL PUBLIC LICENSE/);
  assert.equal(provenance.sourceSha256, mapping.laneInputSha256);
});

test('dictionary returns whole attributed source entries once, including page/node and original XML', async () => {
  const definitions = await dictionary.lookupDefinitions(['rHm', 'rHm']);
  assert.ok(definitions.length > 0);
  assert.equal(new Set(definitions.map((entry) => entry.id)).size, definitions.length);
  assert.ok(definitions.some((entry) => /mercy|merciful|compassion/i.test(entry.definition)));
  for (const entry of definitions) {
    const raw = lane.prepare('SELECT * FROM definitions WHERE id=?').get(Number(entry.id))!;
    assert.equal(entry.html, raw.xml);
    assert.equal(entry.definition, raw.definition);
    assert.match(entry.locator!, /p\. \d+; .*; n\d+/);
    assert.equal(entry.source.license, 'GPL-3.0');
  }
});

test('unmapped doubled, hamza and weak-letter headings fail closed rather than borrowing a meaning', async () => {
  for (const root of ['rbb', 'Amn', 'hdy', 'not-a-root'])
    assert.deepEqual(await dictionary.lookupDefinitions([root]), []);
  assert.deepEqual(await dictionary.lookupDefinitions([]), []);
});

test('canonical root spelling and lemma search retain precise IDs and all occurrences', async () => {
  assert.equal((await corpus.lookupLexiconRoot('qrA'))?.word, '\u0642\u0631\u0623');
  assert.ok(
    (await corpus.searchLexiconRoots('\u0642\u0631\u0623')).some((entry) => entry.id === 'qrA'),
  );
  const selected = await corpus.lookupLexiconWord({ surah: 1, ayah: 1, word: 3 });
  assert.ok(selected?.lemmas[0]);
  const lemma = selected.lemmas[0];
  assert.ok((await corpus.searchLexiconLemmas(lemma.id)).some((entry) => entry.id === lemma.id));
  const family = await corpus.lookupLexiconRoot(selected.roots[0]!.id);
  assert.ok(family!.lemmas.length > 1);
  assert.ok(
    family!.occurrences.some((item) => item.surah === 1 && item.ayah === 1 && item.word === 3),
  );
});

test('lexicon navigation preserves canonical positions and selected text identity', () => {
  assert.deepEqual(lexiconReaderTarget({ surah: 7, ayah: 204, word: 2 }), {
    surah: 7,
    ayah: 204,
    edition: 'hafs',
  });
  const target = {
    kind: 'word' as const,
    reference: { surah: 7, ayah: 204, word: 2 },
    candidateText: 'exact',
  };
  assert.notEqual(
    lexiconTargetKey(target),
    lexiconTargetKey({ ...target, candidateText: 'other' }),
  );
  assert.notEqual(
    lexiconTargetKey(target),
    lexiconTargetKey({ ...target, reference: { ...target.reference, word: 3 } }),
  );
});
