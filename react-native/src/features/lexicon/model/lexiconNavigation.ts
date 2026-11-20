import type { LexiconReference } from '../../../services/lexicon/lexiconTypes';

export type LexiconTarget =
  | { kind: 'word'; reference: LexiconReference; candidateText: string }
  | { kind: 'root' | 'lemma'; id: string };

export function lexiconTargetKey(target: LexiconTarget): string {
  return target.kind === 'word'
    ? JSON.stringify([
        'word',
        target.reference.surah,
        target.reference.ayah,
        target.reference.word,
        target.candidateText,
      ])
    : JSON.stringify([target.kind, target.id]);
}

/** QAC references are canonical Hafs. Never inherit a Warsh edition. */
export function lexiconReaderTarget(reference: LexiconReference) {
  return { surah: reference.surah, ayah: reference.ayah, edition: 'hafs' as const };
}
