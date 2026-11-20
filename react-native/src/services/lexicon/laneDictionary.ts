import { openReadOnlyAssetDatabase } from '../storage/readOnlyAssetDatabase';
import type { LexiconReadPort } from './lexiconRepository';
import type { LexicalDefinition, LexicalDefinitionProvider } from './lexiconTypes';
import laneProvenance from '../../../assets/lexicon/lane-provenance.json';

export const laneSource = {
  name: "Lane's Arabic-English Lexicon",
  url: 'https://github.com/laneslexicon/LexiconDatabase',
  version: 'XML v1.0-8-ge077468-359; database 36eec5999bcc6bf9',
  license: 'GPL-3.0',
  notice:
    'Original LexiconDatabase source entries; GNU General Public License version 3. Full license and reproducible source provenance are bundled with this application. Definitions remain English and Arabic as published.',
};

/** Exact published heading joins only. Never derive a definition from a gloss. */
export function createLaneDictionary(port: LexiconReadPort): LexicalDefinitionProvider {
  return {
    async lookupDefinitions(rootIdsBW) {
      if (!rootIdsBW.length) return [];
      const rows = await port.all<{
        id: number;
        headword: string;
        definition: string;
        xml: string;
        root: string;
        nodeid: string;
        page: number;
        file: string;
        supplement: number;
      }>(
        `SELECT DISTINCT d.* FROM definitions d JOIN root_definitions link ON link.definition_id=d.id
         WHERE link.root_id IN (${rootIdsBW.map(() => '?').join(',')}) ORDER BY d.supplement,d.page,d.id`,
        rootIdsBW,
      );
      return rows.map(
        (row): LexicalDefinition => ({
          id: String(row.id),
          headword: row.headword,
          definition: row.definition,
          html: row.xml,
          locator: `${row.supplement ? 'Supplement; ' : ''}p. ${row.page}; ${row.file}; ${row.nodeid}; root ${row.root}`,
          source: { ...laneSource, locator: row.nodeid },
        }),
      );
    },
  };
}

let dictionary: Promise<LexicalDefinitionProvider> | undefined;
export function getLaneDictionary(): Promise<LexicalDefinitionProvider> {
  if (!dictionary)
    dictionary = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const assetId = require('../../../assets/lexicon/lane-qac.db');
      const db = await openReadOnlyAssetDatabase({
        assetId,
        name: `lane-qac-${laneProvenance.databaseSha256.slice(0, 16)}.db`,
        expected: { schemaVersion: 1, mappedRoots: 1296, definitions: 20354 },
      });
      return createLaneDictionary({
        all: (sql, parameters = []) => db.getAllAsync(sql, ...parameters),
      });
    })().catch((error) => {
      dictionary = undefined;
      throw error;
    });
  return dictionary;
}
