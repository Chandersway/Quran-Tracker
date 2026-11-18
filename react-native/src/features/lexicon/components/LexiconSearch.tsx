import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Button, Field, Notice, Screen, Segments, T, s } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { usePalette } from '../../../shared/theme';

export type LexiconSearchResult = { id: string; arabic: string; occurrenceCount: number };
const copy = {
  en: {
    title: 'Quran lexicon',
    root: 'Roots',
    lemma: 'Lemmas',
    label: 'Arabic or case-sensitive Buckwalter',
    search: 'Search',
    hint: 'Search a root or lemma, or search without text to browse the complete corpus.',
    empty: 'No matching entries were found.',
    error: 'Roots could not be searched. Try again.',
    count: 'occurrences',
  },
  nl: {
    title: 'Quran-lexicon',
    root: 'Wortels',
    lemma: 'Lemma’s',
    label: 'Arabisch of hoofdlettergevoelige Buckwalter',
    search: 'Zoeken',
    hint: 'Zoek een wortel of lemma, of zoek zonder tekst om de volledige bron te bekijken.',
    empty: 'Geen overeenkomende trefwoorden gevonden.',
    error: 'Wortels konden niet worden doorzocht. Probeer opnieuw.',
    count: 'voorkomens',
  },
  ar: {
    root: 'الجذور',
    lemma: 'اللِّمم',
    title:
      '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u062c\u0630\u0648\u0631 \u0627\u0644\u0642\u0631\u0622\u0646',
    label:
      '\u0627\u0644\u062c\u0630\u0631 \u0627\u0644\u0639\u0631\u0628\u064a \u0623\u0648 \u0646\u0642\u0644\u0647 \u0627\u0644\u0635\u0648\u062a\u064a',
    search: '\u0628\u062d\u062b',
    hint: '\u0623\u062f\u062e\u0644 \u062c\u0630\u0631\u064b\u0627 \u0644\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0645\u0635\u062f\u0631 \u0627\u0644\u0645\u0648\u062b\u0642.',
    empty:
      '\u0644\u0645 \u062a\u064f\u0639\u062b\u0631 \u0639\u0644\u0649 \u062c\u0630\u0648\u0631 \u0645\u0637\u0627\u0628\u0642\u0629.',
    error:
      '\u062a\u0639\u0630\u0631 \u0627\u0644\u0628\u062d\u062b. \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.',
    count: '\u0645\u0648\u0636\u0639\u064b\u0627',
  },
};
export function LexiconSearch({
  kind,
  onKind,
  query,
  onChange,
  onSearch,
  onOpen,
  status,
  results,
}: {
  kind: 'root' | 'lemma';
  onKind: (kind: 'root' | 'lemma') => void;
  query: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onOpen: (id: string) => void;
  status: 'idle' | 'loading' | 'error' | 'ready';
  results: LexiconSearchResult[];
}) {
  const { locale } = useI18n();
  const text = copy[locale];
  const p = usePalette();
  return (
    <Screen scroll={false}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <T translate={false} size={30} bold>
              {text.title}
            </T>
            <View style={{ marginTop: 20 }}>
              <Segments
                value={kind}
                options={[
                  { value: 'root', label: text.root },
                  { value: 'lemma', label: text.lemma },
                ]}
                onChange={onKind}
                translateLabels={false}
              />
              <Field label={text.label} value={query} onChangeText={onChange} autoCorrect={false} />
              <Button title={text.search} loading={status === 'loading'} onPress={onSearch} />
            </View>
            {status === 'error' ? (
              <Notice error message={text.error} onRetry={onSearch} />
            ) : status === 'idle' || (status === 'ready' && !results.length) ? (
              <T translate={false} muted style={{ marginTop: 18 }}>
                {status === 'idle' ? text.hint : text.empty}
              </T>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.arabic}, ${item.occurrenceCount.toLocaleString(locale)} ${text.count}`}
            onPress={() => onOpen(item.id)}
            style={[s.listRow, { borderBottomColor: p.line }]}
          >
            <T arabic size={25} style={{ flex: 1 }}>
              {item.arabic}
            </T>
            <T
              translate={false}
              muted
            >{`${item.occurrenceCount.toLocaleString(locale)} ${text.count}`}</T>
          </Pressable>
        )}
      />
    </Screen>
  );
}
