import { normalizeLexiconText } from './lexiconNormalization';
import canonicalHeads from '../../../assets/lexicon/qac-canonical-heads.json';
import type {
  LexiconEntry,
  LexiconIdentifier,
  LexiconMorphology,
  LexiconReference,
  LexiconRootSummary,
  LexiconSource,
  LexiconVerification,
} from './lexiconTypes';

export type LexiconBinding = string | number | null;
export type LexiconReadPort = {
  all: <T extends object>(sql: string, parameters?: readonly LexiconBinding[]) => Promise<T[]>;
};
type WordRow = LexiconReference & {
  id: number;
  arabic: string;
  corpus_arabic: string;
  normalized_study: string;
  normalized_corpus: string;
  gloss: string;
  transliteration: string;
  buckwalter: string;
  alignment: LexiconEntry['alignment'];
};
type Selection = { sql: string; parameters: LexiconBinding[] };
const publishedHeads: Record<string, string> = canonicalHeads;
const canonicalRoot = <T extends LexiconIdentifier>(root: T): T => ({
  ...root,
  arabic: publishedHeads[root.id] ?? root.arabic,
});

export function validLexiconReference(reference: LexiconReference): boolean {
  return (
    [reference?.surah, reference?.ayah, reference?.word].every(Number.isSafeInteger) &&
    reference.surah >= 1 &&
    reference.surah <= 114 &&
    reference.ayah >= 1 &&
    reference.word >= 1
  );
}

/** A read-only SQL port keeps content lookup independent from Expo and user storage. */
export function createLexiconRepository(port: LexiconReadPort) {
  let sourcesPromise: Promise<{ qac: LexiconSource; study: LexiconSource }> | undefined;
  async function sources() {
    if (!sourcesPromise) {
      sourcesPromise = (async () => {
        const versions = await port.all<{ user_version: number }>('PRAGMA user_version');
        const metadata = await port.all<{ value: string }>(
          'SELECT value FROM metadata WHERE key=?',
          ['manifest'],
        );
        const manifest = JSON.parse(metadata[0]?.value ?? 'null') as {
          schemaVersion?: number;
          words?: number;
          roots?: number;
          lemmas?: number;
        } | null;
        if (
          versions[0]?.user_version !== 1 ||
          manifest?.schemaVersion !== 1 ||
          manifest.words !== 77429 ||
          manifest.roots !== 1642 ||
          manifest.lemmas !== 4832
        )
          throw new Error('Bundled lexicon schema is invalid');
        const rows = await port.all<LexiconSource & { id: string }>('SELECT * FROM sources');
        const qac = rows.find((row) => row.id === 'qac');
        const study = rows.find((row) => row.id === 'study');
        if (!qac?.notice || !study?.notice)
          throw new Error('Bundled lexicon attribution is missing');
        return { qac, study };
      })().catch((error) => {
        sourcesPromise = undefined;
        throw error;
      });
    }
    return sourcesPromise;
  }

  async function wordAt(reference: LexiconReference): Promise<WordRow | undefined> {
    if (!validLexiconReference(reference)) return undefined;
    await sources();
    return (
      await port.all<WordRow>('SELECT * FROM words WHERE surah=? AND ayah=? AND word=?', [
        reference.surah,
        reference.ayah,
        reference.word,
      ])
    )[0];
  }

  async function identifiers(kind: 'roots' | 'lemmas', selection: Selection) {
    const column = kind === 'roots' ? 'root_id' : 'lemma_id';
    const rows = await port.all<LexiconIdentifier>(
      `SELECT DISTINCT i.id,i.arabic FROM ${kind} i
       JOIN word_${kind} link ON link.${column}=i.id
       JOIN (${selection.sql}) chosen ON chosen.id=link.word_id ORDER BY i.id COLLATE BINARY`,
      selection.parameters,
    );
    return kind === 'roots' ? rows.map(canonicalRoot) : rows;
  }

  function matchingSelection(kind: 'roots' | 'lemmas', ids: readonly string[]): Selection {
    const column = kind === 'roots' ? 'root_id' : 'lemma_id';
    return {
      sql: `SELECT DISTINCT w.* FROM words w JOIN word_${kind} link ON link.word_id=w.id
            WHERE link.${column} IN (${ids.map(() => '?').join(',')})`,
      parameters: [...ids],
    };
  }

  async function makeEntry(
    kind: LexiconEntry['kind'],
    word: string,
    selection: Selection,
    original?: WordRow,
  ): Promise<LexiconEntry> {
    const [attribution, rows, roots, lemmas] = await Promise.all([
      sources(),
      port.all<WordRow>(`${selection.sql} ORDER BY surah,ayah,word`, selection.parameters),
      identifiers('roots', selection),
      identifiers('lemmas', selection),
    ]);
    const morphology = original
      ? await port.all<{
          segment: number;
          form: string;
          arabic: string;
          tag: string;
          features: string;
          pos: string | null;
          root_id: string | null;
          lemma_id: string | null;
        }>('SELECT * FROM segments WHERE word_id=? ORDER BY segment', [original.id])
      : [];
    return {
      kind,
      word,
      ...(original
        ? {
            reference: { surah: original.surah, ayah: original.ayah, word: original.word },
            transliteration: original.transliteration,
            buckwalter: original.buckwalter,
          }
        : {}),
      roots,
      lemmas,
      morphology: morphology.map(
        (segment): LexiconMorphology => ({
          segment: segment.segment,
          form: segment.form,
          arabic: segment.arabic,
          sourcePosTag: segment.tag,
          features: segment.features,
          ...(segment.pos ? { pos: segment.pos } : {}),
          ...(segment.root_id ? { rootId: segment.root_id } : {}),
          ...(segment.lemma_id ? { lemmaId: segment.lemma_id } : {}),
        }),
      ),
      contextualMeanings: Array.from(
        new Set(rows.map((row) => row.gloss).filter((gloss) => gloss.trim())),
      ),
      occurrences: rows.map(({ surah, ayah, word: position, arabic, gloss }) => ({
        surah,
        ayah,
        word: position,
        arabic,
        gloss,
      })),
      lexicalDefinitions: [],
      source: attribution.qac,
      contextualMeaningSource: attribution.study,
      alignment:
        original?.alignment ??
        (rows.some((row) => row.alignment === 'orthographic-variant')
          ? 'orthographic-variant'
          : 'verified'),
    };
  }

  async function entryForWord(original: WordRow): Promise<LexiconEntry> {
    const own: Selection = { sql: 'SELECT * FROM words WHERE id=?', parameters: [original.id] };
    const roots = await identifiers('roots', own);
    const lemmas = await identifiers('lemmas', own);
    const related = roots.length
      ? matchingSelection(
          'roots',
          roots.map((root) => root.id),
        )
      : lemmas.length
        ? matchingSelection(
            'lemmas',
            lemmas.map((lemma) => lemma.id),
          )
        : own;
    const entry = await makeEntry('word', original.arabic, related, original);
    // A selected word has only its own annotated roots/lemmas, never inferred
    // from other forms that happen to share a root or contextual translation.
    return { ...entry, roots, lemmas };
  }

  return {
    async lookupLexiconWord(reference: LexiconReference): Promise<LexiconEntry | undefined> {
      const row = await wordAt(reference);
      return row ? entryForWord(row) : undefined;
    },
    async lookupLexiconRoot(rootIdBW: string): Promise<LexiconEntry | undefined> {
      await sources();
      const root = (
        await port.all<LexiconIdentifier>('SELECT id,arabic FROM roots WHERE id=? COLLATE BINARY', [
          rootIdBW,
        ])
      )[0];
      if (!root) return undefined;
      const head = canonicalRoot(root);
      const entry = await makeEntry('root', head.arabic, matchingSelection('roots', [root.id]));
      return { ...entry, roots: [head] };
    },
    async lookupLexiconLemma(lemmaIdBW: string): Promise<LexiconEntry | undefined> {
      await sources();
      const lemma = (
        await port.all<LexiconIdentifier>(
          'SELECT id,arabic FROM lemmas WHERE id=? COLLATE BINARY',
          [lemmaIdBW],
        )
      )[0];
      if (!lemma) return undefined;
      const entry = await makeEntry('lemma', lemma.arabic, matchingSelection('lemmas', [lemma.id]));
      return { ...entry, lemmas: [lemma] };
    },
    async searchLexiconRoots(query: string): Promise<LexiconRootSummary[]> {
      await sources();
      const original = query.trim();
      const normalized = normalizeLexiconText(original);
      const canonicalIds = Object.entries(publishedHeads)
        .filter(([, arabic]) => normalized && normalizeLexiconText(arabic).includes(normalized))
        .map(([id]) => id);
      const canonicalClause = canonicalIds.length
        ? ` OR r.id IN (${canonicalIds.map(() => '?').join(',')})`
        : '';
      const rows = await port.all<LexiconRootSummary>(
        `SELECT r.id,r.arabic,COUNT(link.word_id) AS occurrenceCount
         FROM roots r JOIN word_roots link ON link.root_id=r.id
         WHERE ?='' OR instr(r.id,?)>0 OR instr(r.normalized,?)>0${canonicalClause}
         GROUP BY r.id,r.arabic
         ORDER BY CASE WHEN r.id=? OR r.normalized=? THEN 0 ELSE 1 END,r.id COLLATE BINARY`,
        [original, original, normalized, ...canonicalIds, original, normalized],
      );
      return rows.map(canonicalRoot);
    },
    async searchLexiconLemmas(query: string): Promise<LexiconRootSummary[]> {
      await sources();
      const original = query.trim();
      const normalized = normalizeLexiconText(original);
      return port.all<LexiconRootSummary>(
        `SELECT i.id,i.arabic,COUNT(link.word_id) AS occurrenceCount
         FROM lemmas i JOIN word_lemmas link ON link.lemma_id=i.id
         WHERE ?='' OR instr(i.id,?)>0 OR instr(i.normalized,?)>0
         GROUP BY i.id,i.arabic
         ORDER BY CASE WHEN i.id=? OR i.normalized=? THEN 0 ELSE 1 END,i.id COLLATE BINARY`,
        [original, original, normalized, original, normalized],
      );
    },
    async verifyLexiconWord(
      reference: LexiconReference,
      candidateText: string,
    ): Promise<LexiconVerification> {
      const row = await wordAt(reference);
      const normalized = normalizeLexiconText(candidateText);
      if (
        !row ||
        !normalized ||
        (normalized !== row.normalized_study && normalized !== row.normalized_corpus)
      )
        return { status: 'unavailable' };
      return { status: 'verified', entry: await entryForWord(row) };
    },
  };
}

export type LexiconRepository = ReturnType<typeof createLexiconRepository>;
