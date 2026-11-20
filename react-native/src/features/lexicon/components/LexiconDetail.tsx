import React, { useState } from 'react';
import { FlatList, Linking, Pressable, View } from 'react-native';
import { Button, Card, Notice, Screen, T, s } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { usePalette } from '../../../shared/theme';

import type { LexiconEntry, LexiconOccurrence } from '../../../services/lexicon/lexiconTypes';
import laneLicense from '../../../../assets/lexicon/lane-license.json';

export type LexiconOccurrenceView = LexiconOccurrence;
export type LexiconDetailView = LexiconEntry;
export type LexiconState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unavailable' }
  | { status: 'ready'; value: LexiconDetailView };
// New feature copy, not presented as Kotlin source copy or as a dictionary definition.
const copy = {
  en: {
    unmapped:
      'No verified Lane heading mapping is available for this root. Quran morphology and occurrences remain available.',
    dictionaryError: 'The offline dictionary could not be opened. Try loading this entry again.',
    family: 'Open root family',
    full: 'Read full source entry',
    close: 'Close entry',
    sourceLink: 'Open source',
    selected: 'Selected word gloss (English)',
    linkError: 'The source link could not be opened.',

    title: 'Word information',
    dictionary: 'Dictionary root articles (English / Arabic)',
    morphology: 'Morphology',
    transliteration: 'Transliteration',
    definitionMissing: 'No sourced dictionary definitions are available yet.',
    contextualSource: 'Contextual gloss source',
    root: 'Root',
    lemma: 'Lemma',
    meanings: 'Contextual glosses (English)',
    occurrences: 'Quran occurrences',
    missing: 'No verified information is available for this word.',
    loading: 'Loading word information…',
    error: 'Word information could not be loaded.',
    retry: 'Try again',
    none: 'Not available in this source',
    source: 'Source',
    occurrence: 'Open ayah',
    license: 'Dictionary license and provenance',
    variant: 'Verified orthographic variant',
  },
  nl: {
    unmapped:
      'Voor deze wortel is geen geverifieerde koppeling met een Lane-trefwoord beschikbaar. Morfologie en vindplaatsen blijven beschikbaar.',
    dictionaryError: 'Het offline woordenboek kon niet worden geopend. Laad dit trefwoord opnieuw.',
    family: 'Open woordfamilie',
    full: 'Volledig bronartikel lezen',
    close: 'Artikel sluiten',
    sourceLink: 'Bron openen',
    selected: 'Contextbetekenis van geselecteerd woord (Engels)',
    linkError: 'De bronlink kon niet worden geopend.',

    title: 'Woordgegevens',
    dictionary: 'Woordenboekartikelen bij de wortel (Engels / Arabisch)',
    morphology: 'Morfologie',
    transliteration: 'Transcriptie',
    definitionMissing: 'Er zijn nog geen woordenboekbetekenissen met bron beschikbaar.',
    contextualSource: 'Bron van contextbetekenissen',
    root: 'Wortel',
    lemma: 'Lemma',
    meanings: 'Betekenissen in context (Engels)',
    occurrences: 'Voorkomens in de Quran',
    missing: 'Voor dit woord zijn geen geverifieerde gegevens beschikbaar.',
    loading: 'Woordgegevens laden…',
    error: 'Woordgegevens konden niet worden geladen.',
    retry: 'Opnieuw proberen',
    none: 'Niet beschikbaar in deze bron',
    source: 'Bron',
    occurrence: 'Aya openen',
    license: 'Woordenboeklicentie en herkomst',
    variant: 'Geverifieerde spellingsvariant',
  },
  ar: {
    unmapped:
      'لا تتوفر مطابقة موثقة مع عنوان في معجم لين لهذا الجذر. يبقى التحليل الصرفي والمواضع متاحين.',
    dictionaryError: 'تعذر فتح المعجم المحلي. أعد تحميل المدخل.',
    family: 'فتح عائلة الجذر',
    full: 'قراءة نص المصدر كاملاً',
    close: 'إغلاق المدخل',
    sourceLink: 'فتح المصدر',
    selected: 'معنى الكلمة المحددة في السياق (بالإنجليزية)',
    linkError: 'تعذر فتح رابط المصدر.',

    title: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0643\u0644\u0645\u0629',
    dictionary: 'مقالات الجذر في المعجم (بالإنجليزية والعربية)',
    morphology: '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0635\u0631\u0641\u064a',
    transliteration: '\u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0635\u0648\u062a\u064a',
    definitionMissing:
      '\u0644\u0627 \u062a\u062a\u0648\u0641\u0631 \u062a\u0639\u0631\u064a\u0641\u0627\u062a \u0645\u0639\u062c\u0645\u064a\u0629 \u0645\u0648\u062b\u0642\u0629 \u0628\u0639\u062f.',
    contextualSource:
      '\u0645\u0635\u062f\u0631 \u0627\u0644\u0645\u0639\u0646\u0649 \u0627\u0644\u0633\u064a\u0627\u0642\u064a',
    root: '\u0627\u0644\u062c\u0630\u0631',
    lemma: '\u0627\u0644\u0644\u0645\u0645\u0629',
    meanings:
      '\u0627\u0644\u0645\u0639\u0627\u0646\u064a \u0627\u0644\u0633\u064a\u0627\u0642\u064a\u0629 (\u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629)',
    occurrences:
      '\u0645\u0648\u0627\u0636\u0639 \u0627\u0644\u0643\u0644\u0645\u0629 \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646',
    missing:
      '\u0644\u0627 \u062a\u062a\u0648\u0641\u0631 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0645\u0648\u062b\u0642\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0643\u0644\u0645\u0629.',
    loading:
      '\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0643\u0644\u0645\u0629…',
    error:
      '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0643\u0644\u0645\u0629.',
    retry: '\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629',
    none: '\u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0645\u0635\u062f\u0631',
    source: '\u0627\u0644\u0645\u0635\u062f\u0631',
    occurrence: 'فتح الآية',
    license: 'ترخيص المعجم ومصدره',
    variant:
      '\u0627\u062e\u062a\u0644\u0627\u0641 \u0631\u0633\u0645 \u0645\u062a\u062d\u0642\u0642',
  },
};
export function LexiconDetail({
  state,
  onRetry,
  onOccurrence,
  onRoot,
  onLemma,
}: {
  state: LexiconState;
  onRetry: () => void;
  onOccurrence: (item: LexiconOccurrenceView) => void;
  onRoot: (id: string) => void;
  onLemma: (id: string) => void;
}) {
  const { locale } = useI18n();
  const text = copy[locale];
  const p = usePalette();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const openSource = (url: string) => {
    setLinkError(false);
    void Linking.openURL(url).catch(() => setLinkError(true));
  };
  if (state.status !== 'ready')
    return (
      <Screen>
        <T translate={false} size={30} bold>
          {text.title}
        </T>
        {state.status === 'error' ? (
          <>
            <Notice error message={text.error} />
            <Button title={text.retry} onPress={onRetry} />
          </>
        ) : (
          <T translate={false} muted style={{ marginTop: 20 }}>
            {state.status === 'loading' ? text.loading : text.missing}
          </T>
        )}
      </Screen>
    );
  const detail = state.value;
  return (
    <Screen scroll={false}>
      <FlatList
        data={detail.occurrences}
        keyExtractor={(item) => `${item.surah}:${item.ayah}:${item.word}`}
        initialNumToRender={12}
        windowSize={7}
        ListHeaderComponent={
          <>
            <T translate={false} size={30} bold>
              {text.title}
            </T>
            <Card style={{ marginTop: 20, gap: 8 }}>
              <T arabic selectable size={36}>
                {detail.word}
              </T>
              {detail.transliteration && (
                <T
                  translate={false}
                  selectable
                  muted
                >{`${text.transliteration}: ${detail.transliteration}`}</T>
              )}
              {detail.alignment === 'orthographic-variant' && (
                <T translate={false} muted size={12}>
                  {text.variant}
                </T>
              )}
              <T translate={false} muted>
                {detail.reference
                  ? `${detail.reference.surah}:${detail.reference.ayah}:${detail.reference.word}`
                  : ''}
              </T>
              {detail.reference && (
                <Button
                  title={text.occurrence}
                  icon="book-open"
                  variant="secondary"
                  onPress={() =>
                    onOccurrence({ ...detail.reference!, arabic: detail.word, gloss: '' })
                  }
                />
              )}
            </Card>
            {linkError && <Notice error message={text.linkError} />}
            <View style={{ marginTop: 24, gap: 8 }}>
              <T translate={false} bold size={20}>
                {text.root}
              </T>
              {detail.roots.length ? (
                detail.roots.map((root) => (
                  <Pressable
                    key={root.id}
                    accessibilityRole="button"
                    onPress={() => onRoot(root.id)}
                    style={{ minHeight: 48, justifyContent: 'center' }}
                  >
                    <T arabic size={24}>
                      {root.arabic} · {text.family}
                    </T>
                  </Pressable>
                ))
              ) : (
                <T translate={false} muted>
                  {text.none}
                </T>
              )}
            </View>
            <View style={{ marginTop: 24, gap: 8 }}>
              <T translate={false} bold size={20}>
                {text.lemma}
              </T>
              {detail.lemmas.length ? (
                detail.lemmas.map((lemma) => (
                  <Pressable
                    key={lemma.id}
                    accessibilityRole="button"
                    onPress={() => onLemma(lemma.id)}
                    style={{ minHeight: 48, justifyContent: 'center' }}
                  >
                    <T arabic size={22}>
                      {lemma.arabic}
                    </T>
                  </Pressable>
                ))
              ) : (
                <T translate={false} muted>
                  {text.none}
                </T>
              )}
            </View>
            <View style={{ marginTop: 24, gap: 8 }}>
              <T translate={false} bold size={20}>
                {detail.kind === 'word' ? text.selected : text.meanings}
              </T>
              {detail.contextualMeanings.length ? (
                (detail.kind === 'word' && detail.reference
                  ? [
                      detail.occurrences.find(
                        (item) =>
                          item.surah === detail.reference!.surah &&
                          item.ayah === detail.reference!.ayah &&
                          item.word === detail.reference!.word,
                      )?.gloss ?? '',
                    ].filter(Boolean)
                  : detail.contextualMeanings
                ).map((value, index) => (
                  <T key={`${index}:${value}`} translate={false} selectable>
                    {value}
                  </T>
                ))
              ) : (
                <T translate={false} muted>
                  {text.none}
                </T>
              )}
            </View>
            <View style={{ marginTop: 24, gap: 8 }}>
              <T translate={false} bold size={20}>
                {text.morphology}
              </T>
              {detail.morphology.length ? (
                detail.morphology.map((segment) => (
                  <View
                    key={segment.segment}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: p.line }}
                  >
                    <T arabic selectable size={22}>
                      {segment.arabic}
                    </T>
                    <T translate={false} selectable size={13}>
                      {[segment.pos ?? segment.sourcePosTag, segment.features]
                        .filter(Boolean)
                        .join(' - ')}
                    </T>
                  </View>
                ))
              ) : (
                <T translate={false} muted>
                  {text.none}
                </T>
              )}
            </View>
            <View style={{ marginTop: 24, gap: 8 }}>
              <T translate={false} bold size={20}>
                {text.dictionary}
              </T>
              {detail.lexicalDefinitions.length ? (
                detail.lexicalDefinitions.map((definition) => (
                  <View
                    key={`${definition.source.name}:${definition.id}`}
                    style={{ gap: 6, marginBottom: 12 }}
                  >
                    <T translate={false} bold selectable>
                      {definition.headword}
                    </T>
                    <Button
                      title={expanded === definition.id ? text.close : text.full}
                      variant="secondary"
                      onPress={() => setExpanded(expanded === definition.id ? null : definition.id)}
                    />
                    {expanded === definition.id && (
                      <T translate={false} selectable>
                        {definition.definition}
                      </T>
                    )}
                    <T
                      translate={false}
                      muted
                      size={12}
                    >{`${definition.source.name} - ${definition.source.license}${definition.locator ? ` - ${definition.locator}` : ''}`}</T>
                    {expanded === definition.id && (
                      <>
                        <T translate={false} selectable muted size={12}>
                          {definition.source.notice}
                        </T>
                        <Button
                          title={text.sourceLink}
                          icon="external-link"
                          variant="quiet"
                          onPress={() => openSource(definition.source.url)}
                        />
                      </>
                    )}
                  </View>
                ))
              ) : (
                <T translate={false} muted>
                  {detail.lexicalDefinitionStatus === 'unmapped'
                    ? text.unmapped
                    : detail.lexicalDefinitionStatus === 'unavailable'
                      ? text.dictionaryError
                      : text.definitionMissing}
                </T>
              )}
            </View>
            {detail.lexicalDefinitionStatus === 'unavailable' && (
              <Button title={text.retry} onPress={onRetry} variant="secondary" />
            )}
            <T
              translate={false}
              muted
              size={12}
              style={{ marginTop: 12 }}
            >{`${text.contextualSource}: ${detail.contextualMeaningSource.name} - ${detail.contextualMeaningSource.license}`}</T>
            <T translate={false} bold size={20} style={{ marginTop: 24 }}>
              {text.occurrences}
              {' \u00b7 '}
              {detail.occurrences.length.toLocaleString(locale)}
            </T>
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.surah}:${item.ayah}, ${text.occurrence}`}
            onPress={() => onOccurrence(item)}
            style={[s.listRow, { borderBottomColor: p.line }]}
          >
            <View style={{ flex: 1 }}>
              <T translate={false} bold>{`${item.surah}:${item.ayah}:${item.word}`}</T>
              {item.gloss && (
                <T translate={false} muted>
                  {item.gloss}
                </T>
              )}
            </View>
            <T arabic size={22}>
              {item.arabic}
            </T>
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <T
              translate={false}
              muted
              size={12}
              style={{ marginTop: 24 }}
            >{`${text.source}: ${detail.source.name} ${detail.source.version} - ${detail.source.license}\n${detail.source.notice}\n${detail.source.url}`}</T>
            <Button
              title={text.sourceLink}
              icon="external-link"
              variant="quiet"
              onPress={() => openSource(detail.source.url)}
            />
            <T translate={false} selectable muted size={12}>
              {detail.contextualMeaningSource.notice}
            </T>
            <Button
              title={text.license}
              variant="quiet"
              onPress={() => setShowLicense(!showLicense)}
            />
            {showLicense && (
              <T
                translate={false}
                selectable
                size={12}
                style={{ writingDirection: 'ltr', textAlign: 'left' }}
              >
                {laneLicense.text}
              </T>
            )}
          </View>
        }
      />
    </Screen>
  );
}
