import { getLexiconRepository } from './lexiconDatabase';
import { getLaneDictionary } from './laneDictionary';
import type {
  LexicalDefinitionProvider,
  LexiconEntry,
  LexiconReference,
  LexiconVerification,
} from './lexiconTypes';

export type * from './lexiconTypes';
export { normalizeLexiconText } from './lexiconNormalization';

let dictionary: LexicalDefinitionProvider | undefined;

/** Independent dictionaries keep their own source, license and full definition text. */
export function configureLexicalDefinitionProvider(
  provider: LexicalDefinitionProvider | undefined,
) {
  dictionary = provider;
}

async function enrich(entry: LexiconEntry | undefined): Promise<LexiconEntry | undefined> {
  if (!entry) return undefined;
  try {
    const provider = dictionary ?? (await getLaneDictionary());
    const definitions = await provider.lookupDefinitions(entry.roots.map((root) => root.id));
    return {
      ...entry,
      lexicalDefinitions: definitions,
      lexicalDefinitionStatus: definitions.length ? 'available' : 'unmapped',
    };
  } catch {
    // A dictionary failure must not turn contextual translations into definitions.
    return { ...entry, lexicalDefinitions: [], lexicalDefinitionStatus: 'unavailable' };
  }
}

export async function lookupLexiconWord(reference: LexiconReference) {
  return enrich(await (await getLexiconRepository()).lookupLexiconWord(reference));
}

export async function lookupLexiconRoot(rootIdBW: string) {
  return enrich(await (await getLexiconRepository()).lookupLexiconRoot(rootIdBW));
}

export async function lookupLexiconLemma(lemmaIdBW: string) {
  return enrich(await (await getLexiconRepository()).lookupLexiconLemma(lemmaIdBW));
}

export async function searchLexiconRoots(query: string) {
  return (await getLexiconRepository()).searchLexiconRoots(query);
}

export async function searchLexiconLemmas(query: string) {
  return (await getLexiconRepository()).searchLexiconLemmas(query);
}

export async function verifyLexiconWord(
  reference: LexiconReference,
  candidateText: string,
): Promise<LexiconVerification> {
  const result = await (await getLexiconRepository()).verifyLexiconWord(reference, candidateText);
  if (result.status === 'unavailable') return result;
  const entry = await enrich(result.entry);
  return entry ? { status: 'verified', entry } : { status: 'unavailable' };
}
