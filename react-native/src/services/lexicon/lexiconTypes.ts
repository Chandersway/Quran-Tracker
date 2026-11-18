export type LexiconReference = { surah: number; ayah: number; word: number };
export type LexiconSource = {
  name: string;
  url: string;
  version: string;
  license: string;
  notice: string;
  locator?: string;
};
export type LexiconIdentifier = { id: string; arabic: string };
export type LexiconOccurrence = LexiconReference & { arabic: string; gloss: string };
export type LexicalDefinition = {
  id: string;
  headword: string;
  definition: string;
  html?: string;
  locator?: string;
  source: LexiconSource;
};
/** A separate, source-attributed dictionary can enrich QAC without rewriting it. */
export type LexicalDefinitionProvider = {
  lookupDefinitions: (rootIdsBW: readonly string[]) => Promise<LexicalDefinition[]>;
};
export type LexiconMorphology = {
  segment: number;
  form: string;
  arabic: string;
  sourcePosTag: string;
  features: string;
  pos?: string;
  rootId?: string;
  lemmaId?: string;
};
export type LexiconEntry = {
  kind: 'word' | 'root' | 'lemma';
  word: string;
  reference?: LexiconReference;
  transliteration?: string;
  buckwalter?: string;
  roots: LexiconIdentifier[];
  lemmas: LexiconIdentifier[];
  morphology: LexiconMorphology[];
  contextualMeanings: string[];
  occurrences: LexiconOccurrence[];
  lexicalDefinitions: LexicalDefinition[];
  lexicalDefinitionStatus?: 'not-configured' | 'available' | 'unavailable' | 'unmapped';
  source: LexiconSource;
  contextualMeaningSource: LexiconSource;
  alignment: 'verified' | 'orthographic-variant';
};
export type LexiconRootSummary = LexiconIdentifier & { occurrenceCount: number };
export type LexiconVerification =
  | { status: 'verified'; entry: LexiconEntry }
  | { status: 'unavailable' };
