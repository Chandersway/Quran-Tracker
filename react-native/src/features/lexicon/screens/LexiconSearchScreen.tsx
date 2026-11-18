import React, { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../../../app/navigation/types';
import { searchLexiconLemmas, searchLexiconRoots } from '../../../services/lexicon/lexicon';
import { LexiconSearch, type LexiconSearchResult } from '../components/LexiconSearch';

export function LexiconSearchScreen() {
  const navigation = useAppNavigation();
  const [kind, setKind] = useState<'root' | 'lemma'>('root');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [results, setResults] = useState<LexiconSearchResult[]>([]);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );
  const clear = () => {
    request.current += 1;
    setResults([]);
    setStatus('idle');
  };
  const search = async () => {
    const generation = ++request.current;
    setStatus('loading');
    setResults([]);
    try {
      const found = await (kind === 'root'
        ? searchLexiconRoots(query)
        : searchLexiconLemmas(query));
      if (request.current === generation) {
        setResults(found);
        setStatus('ready');
      }
    } catch {
      if (request.current === generation) setStatus('error');
    }
  };
  return (
    <LexiconSearch
      kind={kind}
      onKind={(value) => {
        clear();
        setKind(value);
      }}
      query={query}
      onChange={(value) => {
        clear();
        setQuery(value);
      }}
      onSearch={() => void search()}
      onOpen={(id) => navigation.navigate('Lexicon', { kind, id })}
      status={status}
      results={results}
    />
  );
}
