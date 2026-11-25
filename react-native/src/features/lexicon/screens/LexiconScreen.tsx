import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStack } from '../../../app/navigation/types';
import { useAppNavigation } from '../../../app/navigation/types';
import {
  lookupLexiconLemma,
  lookupLexiconRoot,
  verifyLexiconWord,
} from '../../../services/lexicon/lexicon';
import { LexiconDetail, type LexiconState } from '../components/LexiconDetail';
import { lexiconReaderTarget, lexiconTargetKey } from '../model/lexiconNavigation';

export function LexiconScreen({ route }: NativeStackScreenProps<RootStack, 'Lexicon'>) {
  const navigation = useAppNavigation();
  const key = lexiconTargetKey(route.params);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; state: LexiconState }>();
  useEffect(() => {
    let active = true;
    const target = route.params;
    setResult({ key, state: { status: 'loading' } });
    const load = async () => {
      if (target.kind === 'word') {
        const verified = await verifyLexiconWord(target.reference, target.candidateText);
        return verified.status === 'verified' ? verified.entry : undefined;
      }
      return target.kind === 'root' ? lookupLexiconRoot(target.id) : lookupLexiconLemma(target.id);
    };
    void load()
      .then((value) => {
        if (active)
          setResult({ key, state: value ? { status: 'ready', value } : { status: 'unavailable' } });
      })
      .catch(() => {
        if (active) setResult({ key, state: { status: 'error' } });
      });
    return () => {
      active = false;
    };
  }, [key, retry, route.params]);
  return (
    <LexiconDetail
      state={result?.key === key ? result.state : { status: 'loading' }}
      onRetry={() => setRetry((value) => value + 1)}
      onOccurrence={(item) => navigation.navigate('Reader', lexiconReaderTarget(item))}
      onRoot={(id) => navigation.push('Lexicon', { kind: 'root', id })}
      onLemma={(id) => navigation.push('Lexicon', { kind: 'lemma', id })}
    />
  );
}
