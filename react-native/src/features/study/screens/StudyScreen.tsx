import { restoreSourceCopy, screenSourceKeys, useI18n } from '../../../i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import similarData from '../../../content/generated/mutashabiha_data.json';
import { chapters, getAyahs } from '../../../content/quran';
import type { Ayah } from '../../../content/types';
import { getAyahTranslation } from '../../../content/translations';
import { getStudyAyah } from '../../../content/study';
import type { StudyAyah } from '../../../content/types';
import { Button, Icon, IconButton, Notice, Screen, Segments, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation } from '../../../app/navigation/types';
import { useAppStore } from '../../../state/store';
import type { RootStack } from '../../../app/navigation/types';
import { absoluteAyahId, absoluteAyahLocation, type AyahReference } from '../../../domain/study';
import { fixedStudyReferences } from '../../../services/study/studyRequest';

type Props = NativeStackScreenProps<RootStack, 'Study'>;
type Mode = NonNullable<RootStack['Study']>['mode'] & string;
type AbsoluteSequence = { ayah: number | number[] };
type RawSimilarGroup = { src?: AbsoluteSequence; muts?: AbsoluteSequence[]; ctx?: number };
type Passage = { refs: AyahReference[]; text: string };
type SimilarGroup = { juz: number; source: Passage; matches: Passage[]; contextAyahs: number };

const strings = {
  en: {
    title: 'Study this ayah',
    words: 'Word by word',
    irab: 'Grammar',
    similar: 'Similar ayahs',
    translation: 'Translation',
    transliteration: 'Transliteration',
    meaning: 'Meaning',
    starting: 'Starting passage',
    compare: 'Compare passages',
    context: 'additional context ayahs',
    empty: 'No similar passages are listed for this ayah.',
    open: 'Open in Mushaf',
    prev: 'Previous ayah',
    next: 'Next ayah',
    source: 'Data: Quran Mutashabihat Data by Waqar144',
  },
  nl: {
    title: 'Bestudeer deze aya',
    words: 'Woord voor woord',
    irab: 'Iʿrāb',
    similar: 'Vergelijkbare ayaat',
    translation: 'Vertaling',
    transliteration: 'Transcriptie',
    meaning: 'Betekenis',
    starting: 'Startpassage',
    compare: 'Vergelijk passages',
    context: 'extra contextverzen',
    empty: 'Voor deze aya zijn geen vergelijkbare passages opgenomen.',
    open: 'Open in mushaf',
    prev: 'Vorige aya',
    next: 'Volgende aya',
    source: 'Data: Quran Mutashabihat Data van Waqar144',
  },
  ar: {
    title: 'دراسة الآية',
    words: 'كلمة كلمة',
    irab: 'الإعراب',
    similar: 'آيات متشابهة',
    translation: 'الترجمة',
    transliteration: 'النقل الصوتي',
    meaning: 'المعنى',
    starting: 'المقطع الأصلي',
    compare: 'قارن المقاطع',
    context: 'آيات إضافية للسياق',
    empty: 'لا توجد مقاطع مشابهة لهذه الآية.',
    open: 'افتح في المصحف',
    prev: 'الآية السابقة',
    next: 'الآية التالية',
    source: 'البيانات: Quran Mutashabihat Data من Waqar144',
  },
} as const;

const rawGroups = similarData as Record<string, RawSimilarGroup[]>;

function readSequence(sequence: AbsoluteSequence | undefined): AyahReference[] {
  if (!sequence) return [];
  const raw = Array.isArray(sequence.ayah) ? sequence.ayah : [sequence.ayah];
  const refs = raw
    .map((id) => absoluteAyahLocation(id, chapters))
    .filter((ref): ref is AyahReference => ref !== null);
  return refs.length === raw.length ? refs : [];
}

function makePassage(sequence: AbsoluteSequence | undefined): Passage | null {
  const refs = readSequence(sequence);
  if (!refs.length) return null;
  const text = refs
    .map(({ surah, ayah }) => getAyahs(surah).find((item) => item.number === ayah)?.text ?? '')
    .filter(Boolean)
    .join(' ۞ ');
  return { refs, text };
}

export function similarGroupsForAyah(surah: number, ayah: number): SimilarGroup[] {
  const absolute = absoluteAyahId(surah, ayah, chapters);
  if (absolute === null) return [];
  return Object.entries(rawGroups).flatMap(([juzText, entries]) => {
    const juz = Number(juzText);
    return entries.flatMap((entry) => {
      const source = makePassage(entry.src);
      const matches = (entry.muts ?? [])
        .map(makePassage)
        .filter((item): item is Passage => item !== null);
      if (!source || !matches.length) return [];
      if (
        ![source, ...matches].some((passage) =>
          passage.refs.some((ref) => ref.absolute === absolute),
        )
      )
        return [];
      return [{ juz, source, matches, contextAyahs: Number.isInteger(entry.ctx) ? entry.ctx! : 0 }];
    });
  });
}

function referenceLabel(passage: Passage): string {
  const first = passage.refs[0]!;
  const chapter = chapters[first.surah - 1];
  const name = chapter?.name ?? `Surah ${first.surah}`;
  const sameSurah = passage.refs.every((ref) => ref.surah === first.surah);
  if (passage.refs.length > 1 && sameSurah)
    return `${name} ${first.surah}:${first.ayah}–${passage.refs.at(-1)!.ayah}`;
  if (passage.refs.length > 1)
    return passage.refs.map((ref) => `${ref.surah}:${ref.ayah}`).join(' · ');
  return `${name} ${first.surah}:${first.ayah}`;
}

function PassageRow({
  passage,
  label,
  onOpen,
}: {
  passage: Passage;
  label: string;
  onOpen: (ref: AyahReference) => void;
}) {
  const p = usePalette();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${referenceLabel(passage)}. ${t('mutashabihat.openAyah')}`}
      onPress={() => onOpen(passage.refs[0]!)}
      style={({ pressed }) => ({
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: p.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <T size={14} bold color={p.primary}>
          {label}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T size={12} muted>
            {referenceLabel(passage)}
          </T>
          <Icon name="book-open" size={15} color={p.primary} />
        </View>
      </View>
      {passage.text ? (
        <T arabic size={22} style={{ textAlign: 'right' }}>
          {passage.text}
        </T>
      ) : (
        <T muted size={13}>
          {t('irab.empty')}
        </T>
      )}
    </Pressable>
  );
}

export function StudyScreen(props: Props) {
  return <StudyScreenContent key={JSON.stringify(props.route.params)} {...props} />;
}

function StudyScreenContent({ route }: Props) {
  const p = usePalette();
  const { t } = useI18n();
  const { state } = useAppStore();
  const navigation = useAppNavigation();
  const language = state.preferences.language;
  const copy = restoreSourceCopy(
    language,
    strings[language] ?? strings.en,
    strings.en,
    screenSourceKeys.study,
  );
  const [ayahNumber, setAyahNumber] = useState(route.params.ayah ?? 1);
  const [mode, setMode] = useState<Mode>(route.params.mode ?? 'words');
  const [studyAyahs, setStudyAyahs] = useState<Array<StudyAyah & { surah: number }>>([]);
  const [studyReference, setStudyReference] = useState('');
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyError, setStudyError] = useState(false);
  const chapter = chapters[route.params.surah - 1];
  const ayahs = useMemo(() => {
    try {
      return getAyahs(route.params.surah);
    } catch {
      return [];
    }
  }, [route.params.surah]);
  const ayah: Ayah | undefined = ayahs.find((item) => item.number === ayahNumber);
  const selectionReferences = useMemo(
    () =>
      fixedStudyReferences(
        route.params.fixedReferences ?? [{ surah: route.params.surah, ayah: ayahNumber }],
      ),
    [route.params.fixedReferences, route.params.surah, ayahNumber],
  );
  const referenceKey = selectionReferences.map((ref) => `${ref.surah}:${ref.ayah}`).join(',');
  const currentStudies = studyReference === referenceKey ? studyAyahs : [];
  const studyWords = currentStudies.flatMap((item) =>
    item.words.map((word) => ({ ...word, surah: item.surah, ayah: item.number })),
  );
  const selectedVerses = selectionReferences.map((ref) => ({
    ...ref,
    verse: getAyahs(ref.surah)[ref.ayah - 1]!,
  }));
  const currentStudyLoading = studyLoading || studyReference !== referenceKey;
  const lexiconCopy = {
    en: {
      hint: 'Select a word for verified morphology, dictionary articles and all occurrences.',
      grammar: 'Bundled grammar',
      word: 'Word information',
    },
    nl: {
      hint: 'Kies een woord voor geverifieerde morfologie, woordenboekartikelen en alle vindplaatsen.',
      grammar: 'Gebundelde grammatica',
      word: 'Woordgegevens',
    },
    ar: {
      hint: 'اختر كلمة لعرض التحليل الصرفي الموثق ومقالات المعجم وجميع المواضع.',
      grammar: 'القواعد المضمّنة',
      word: 'تفاصيل الكلمة',
    },
  }[language];
  useEffect(() => {
    let active = true;
    setStudyLoading(true);
    setStudyError(false);
    setStudyAyahs([]);
    Promise.all(
      selectionReferences.map(async (ref) => {
        const item = await getStudyAyah(ref.surah, ref.ayah);
        if (!item) throw new Error('Missing study ayah');
        return { ...item, surah: ref.surah };
      }),
    )
      .then((items) => {
        if (active) setStudyAyahs(items);
      })
      .catch(() => {
        if (active) setStudyError(true);
      })
      .finally(() => {
        if (active) {
          setStudyReference(referenceKey);
          setStudyLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectionReferences, referenceKey]);
  const comparisons = useMemo(
    () => similarGroupsForAyah(route.params.surah, ayahNumber),
    [route.params.surah, ayahNumber],
  );
  const openAyah = (ref: AyahReference) =>
    navigation.navigate('Reader', { surah: ref.surah, ayah: ref.ayah });
  const openSources = () =>
    navigation.navigate('StudySources', {
      surah: route.params.surah,
      ayah: ayahNumber,
      fixedReferences: selectionReferences,
    });

  if (!chapter || !ayah)
    return (
      <Screen>
        <Notice error message="irab.error" onRetry={() => navigation.goBack()} />
      </Screen>
    );

  return (
    <Screen style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ flex: 1 }}>
          <T size={27} bold>
            {copy.title}
          </T>
          <T muted>
            {chapter.name} · {route.params.surah}:{ayahNumber}
          </T>
        </View>
        <IconButton
          name="chevron-left"
          mirrorInRtl
          label={copy.prev}
          disabled={!!route.params.fixedReferences || ayahNumber <= 1}
          onPress={() => setAyahNumber((n) => Math.max(1, n - 1))}
        />
        <IconButton
          name="chevron-right"
          mirrorInRtl
          label={copy.next}
          disabled={!!route.params.fixedReferences || ayahNumber >= chapter.verseCount}
          onPress={() => setAyahNumber((n) => Math.min(chapter.verseCount, n + 1))}
        />
      </View>

      <View style={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2, gap: 10 }}>
        {selectedVerses.map(({ surah: verseSurah, ayah: verseNumber, verse }) => (
          <View key={`${verseSurah}:${verseNumber}`} style={{ gap: 8 }}>
            {selectedVerses.length > 1 && (
              <T muted size={13}>
                {verseSurah}:{verseNumber}
              </T>
            )}
            <T arabic size={32} style={{ textAlign: 'right' }}>
              {verse.text.trim()}
            </T>
            {state.preferences.translation !== 'off' && (
              <T size={16} muted style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                {getAyahTranslation(verse, state.preferences.translation)}
              </T>
            )}
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => openAyah({ absolute: 0, surah: route.params.surah, ayah: ayahNumber })}
          style={{
            alignSelf: 'flex-start',
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Icon name="book-open" size={16} color={p.primary} />
          <T size={13} bold color={p.primary}>
            {copy.open}
          </T>
        </Pressable>
      </View>

      <Segments
        value={mode}
        options={[
          { value: 'words', label: copy.words },
          { value: 'irab', label: lexiconCopy.grammar },
          { value: 'similar', label: copy.similar },
        ]}
        onChange={setMode}
      />
      <Button
        title="menu.tafsir.subtitle"
        onPress={openSources}
        variant="secondary"
        icon="external-link"
      />

      {mode === 'words' && (
        <View style={{ gap: 12 }}>
          <T muted size={13}>
            {lexiconCopy.hint}
          </T>
          {currentStudyLoading ? (
            <Notice message="ui.study.loadingWords" />
          ) : studyError ? (
            <Notice error message="irab.error" />
          ) : !studyWords.length ? (
            <Notice message="ui.study.wordsUnavailable" />
          ) : (
            studyWords.map((word, index) => (
              <Pressable
                key={`${word.surah}:${word.ayah}:${word.position}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${lexiconCopy.word}, ${word.arabic}, ${word.surah}:${word.ayah}:${word.position}`}
                onPress={() =>
                  navigation.navigate('Lexicon', {
                    kind: 'word',
                    reference: { surah: word.surah, ayah: word.ayah, word: word.position },
                    candidateText: word.arabic,
                  })
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: p.line,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: p.subtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T size={12} bold color={p.primary}>
                    {selectedVerses.length > 1 ? `${word.ayah}:${word.position}` : word.position}
                  </T>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end', gap: 3 }}>
                  <T arabic size={24} style={{ textAlign: 'right' }}>
                    {word.arabic}
                  </T>
                  {!!word.transliteration && (
                    <T size={13} muted>
                      {word.transliteration}
                    </T>
                  )}
                  {!!word.translation && (
                    <T size={15} style={{ textAlign: 'right' }}>
                      {word.translation}
                    </T>
                  )}
                </View>
                <Icon name="chevron-right" mirrorInRtl size={18} color={p.primary} />
              </Pressable>
            ))
          )}
        </View>
      )}

      {mode === 'irab' && (
        <View style={{ gap: 12 }}>
          <T size={14} bold color={p.primary}>
            {t('irab.title')}
          </T>
          <Button
            title="irab.load"
            icon="external-link"
            variant="secondary"
            onPress={() =>
              navigation.navigate('StudySources', {
                surah: route.params.surah,
                ayah: ayahNumber,
                kind: 'irab',
                autoLoad: true,
                fixedReferences: selectionReferences,
              })
            }
          />
          {currentStudyLoading ? (
            <Notice message="ui.study.loadingGrammar" />
          ) : studyError ? (
            <Notice error message="irab.error" />
          ) : currentStudies.length ? (
            currentStudies.map((item) => (
              <View key={`${item.surah}:${item.number}`} style={{ gap: 8 }}>
                {currentStudies.length > 1 && (
                  <T muted size={13}>
                    {item.surah}:{item.number}
                  </T>
                )}
                {item.irab.trim() ? (
                  <T
                    selectable
                    size={17}
                    style={{ lineHeight: 29, textAlign: language === 'ar' ? 'right' : 'left' }}
                  >
                    {item.irab.trim()}
                  </T>
                ) : (
                  <Notice message="ui.study.grammarUnavailable" />
                )}
              </View>
            ))
          ) : (
            <Notice message="ui.study.grammarUnavailable" />
          )}
        </View>
      )}

      {mode === 'similar' && (
        <View style={{ gap: 10 }}>
          <T size={14} muted>
            {copy.compare}
          </T>
          {comparisons.length === 0 ? (
            <Notice message={copy.empty} />
          ) : (
            comparisons.map((group, index) => (
              <View
                key={`${group.juz}-${group.source.refs[0]!.absolute}-${index}`}
                style={{ marginBottom: 18 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                  }}
                >
                  <T size={14} bold color={p.primary}>
                    Juz {group.juz} · {referenceLabel(group.source)}
                  </T>
                  <T size={12} muted>
                    {group.matches.length} {copy.similar}
                  </T>
                </View>
                <PassageRow passage={group.source} label={copy.starting} onOpen={openAyah} />
                {group.contextAyahs > 0 && (
                  <T size={12} muted style={{ paddingVertical: 8 }}>
                    +{group.contextAyahs} {copy.context}
                  </T>
                )}
                {group.matches.map((passage, matchIndex) => (
                  <PassageRow
                    key={`${group.juz}-${matchIndex}`}
                    passage={passage}
                    label={`${matchIndex + 1}`}
                    onOpen={openAyah}
                  />
                ))}
              </View>
            ))
          )}
          <T size={12} muted style={{ textAlign: 'center', paddingTop: 8 }}>
            {copy.source}
          </T>
        </View>
      )}
    </Screen>
  );
}
