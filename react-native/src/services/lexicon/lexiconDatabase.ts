import { openReadOnlyAssetDatabase } from '../storage/readOnlyAssetDatabase';
import provenance from '../../../assets/lexicon/provenance.json';
import {
  createLexiconRepository,
  type LexiconBinding,
  type LexiconRepository,
} from './lexiconRepository';

let repository: Promise<LexiconRepository> | undefined;

/** Loaded on the first lookup, never opened in or copied over the user's database. */
export function getLexiconRepository(): Promise<LexiconRepository> {
  if (!repository) {
    repository = (async () => {
      // Metro requires a static literal; the native copy stays outside JS memory.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const assetId = require('../../../assets/lexicon/qac-0.4.db');
      const db = await openReadOnlyAssetDatabase({
        assetId,
        name: `qac-${provenance.databaseSha256.slice(0, 16)}.db`,
        expected: { schemaVersion: 1, words: 77429, roots: 1642, lemmas: 4832, segments: 128219 },
      });
      return createLexiconRepository({
        all: <T extends object>(sql: string, parameters: readonly LexiconBinding[] = []) =>
          db.getAllAsync<T>(sql, ...parameters),
      });
    })().catch((error) => {
      repository = undefined;
      throw error;
    });
  }
  return repository;
}
