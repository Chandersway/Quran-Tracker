import { useI18n } from '../../../i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import enSahih from '../../../../assets/translations/en_sahih.json';
import nlSiregar from '../../../../assets/translations/nl_siregar.json';
import { chapters, getAyahs } from '../../../content/quran';
import {
  Button,
  Card,
  Field,
  IconButton,
  Notice,
  Screen,
  Segments,
  T,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import type { RootStack } from '../../../app/navigation/types';
import {
  asbabBooks,
  irabBooks,
  loadAsbabAvailability,
  loadIrab,
  loadTafsir,
  plainHtmlText,
  tafsirProviders,
  translationProviders,
  type IrabResult,
} from '../../../services/study/studyProviders';
import {
  createStudyRequestController,
  fixedStudyReferences,
  hasStudySource,
  studyRequestKey,
  type StudyLoadState,
} from '../../../services/study/studyRequest';
import {
  availableAsbabAyahs,
  availableAsbabBooks,
  availableAsbabSurahs,
  hasAsbab,
} from '../../../domain/asbabDiscovery';
import { AvailableSourcePicker } from '../components/AvailableSourcePicker';

type Kind = 'tafsir' | 'irab' | 'asbab';
type Translation = { surah: number; ayah: number; text: string };
const translations: Record<string, Translation[]> = {
  'en.sahih': enSahih as Translation[],
  'nl.siregar': nlSiregar as Translation[],
};
const copy = {
  en: {
    fixed: 'Selected canonical references',
    missing:
      'This book has no indexed excerpt for the selected reference. Choose another book or a selected reference.',
    linkError: 'The source could not be opened. Try again.',
    noMapping: 'No verified canonical reference is available for this selection.',
  },
  nl: {
    fixed: 'Geselecteerde canonieke verwijzingen',
    missing:
      'Dit boek heeft geen geïndexeerd fragment voor deze verwijzing. Kies een ander boek of een geselecteerde verwijzing.',
    linkError: 'De bron kon niet worden geopend. Probeer opnieuw.',
    noMapping: 'Voor deze selectie is geen geverifieerde canonieke verwijzing beschikbaar.',
  },
  ar: {
    fixed: 'المراجع القياسية المحددة',
    missing: 'لا يوجد مقتطف مفهرس لهذا المرجع في الكتاب. اختر كتاباً آخر أو مرجعاً محدداً.',
    linkError: 'تعذر فتح المصدر. حاول مرة أخرى.',
    noMapping: 'لا يتوفر مرجع قياسي موثق لهذا التحديد.',
  },
};

export function StudySourceContent({ params }: { params: RootStack['StudySources'] }) {
  const p = usePalette();
  const { t, format, locale } = useI18n();
  const text = copy[locale];
  const fixed = params?.fixedReferences !== undefined || !!params?.warshReference;
  const references = useMemo(
    () =>
      fixedStudyReferences(
        params?.fixedReferences ??
          (params?.warshReference ? [] : [{ surah: params?.surah ?? 1, ayah: params?.ayah ?? 1 }]),
      ),
    [params],
  );
  const [kind, setKind] = useState<Kind>(params?.kind ?? 'tafsir');
  const [surahInput, setSurahInput] = useState(String(references[0]?.surah ?? params?.surah ?? 1));
  const [ayahInput, setAyahInput] = useState(String(references[0]?.ayah ?? params?.ayah ?? 1));
  const [provider, setProvider] = useState<string>(tafsirProviders[0].slug);
  const [translation, setTranslation] = useState<string>(translationProviders[0].id);
  const [book, setBook] = useState(params?.kind === 'asbab' ? 2919 : 316);
  const [availability, setAvailability] = useState<Awaited<
    ReturnType<typeof loadAsbabAvailability>
  > | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [indexRetry, setIndexRetry] = useState(0);
  const [requested, setRequested] = useState('');
  const [retry, setRetry] = useState(0);
  const [linkError, setLinkError] = useState(false);
  const [result, setResult] = useState<StudyLoadState<string | IrabResult>>({
    status: 'idle',
    key: '',
  });
  const controller = useMemo(() => createStudyRequestController<string | IrabResult>(), []);
  const surah = Number(surahInput);
  const ayah = Number(ayahInput);
  const chapter = chapters[surah - 1];
  const ayahRecord = useMemo(
    () =>
      chapter && Number.isInteger(ayah)
        ? getAyahs(surah).find((record) => record.number === ayah)
        : undefined,
    [surah, ayah, chapter],
  );
  const isAsbab = kind === 'asbab';
  const availableBooks = availability
    ? availableAsbabBooks(availability, fixed ? references : undefined)
    : [];
  const availableSurahs = availability ? availableAsbabSurahs(availability, book) : [];
  const availableAyahs = availability ? availableAsbabAyahs(availability, book, surah) : [];
  const shownReferences = isAsbab
    ? references.filter((ref) => availability && hasAsbab(availability, [ref], book))
    : references;
  const inSelection = !fixed || references.some((ref) => ref.surah === surah && ref.ayah === ayah);
  const sourceMissing =
    isAsbab && !!availability && !hasStudySource(availability, book, { surah, ayah });
  const valid = !!ayahRecord && inSelection && (!isAsbab || (!!availability && !sourceMissing));
  const key = studyRequestKey({
    kind,
    surah,
    ayah,
    source: kind === 'tafsir' ? provider : String(book),
  });
  const current = result.key === key ? result : undefined;
  const loading = current?.status === 'loading';
  const value = current?.status === 'ready' ? current.value : undefined;
  const tafsir = typeof value === 'string' ? value : '';
  const irab = typeof value === 'object' ? value : undefined;
  const selectedTranslation =
    translations[translation]?.find((item) => item.surah === surah && item.ayah === ayah)?.text ??
    '';
  const clear = () => {
    controller.cancel();
    setRequested('');
    setResult({ status: 'idle', key: '' });
    setLinkError(false);
  };

  useEffect(() => {
    if (!isAsbab) return;
    let active = true;
    setAvailabilityError(false);
    void loadAsbabAvailability()
      .then((index) => {
        if (active) setAvailability(index);
      })
      .catch(() => {
        if (active) setAvailabilityError(true);
      });
    return () => {
      active = false;
    };
  }, [isAsbab, indexRetry]);
  useEffect(() => {
    if (!isAsbab || !availability) return;
    const books = availableAsbabBooks(availability, fixed ? references : undefined);
    if (!books.includes(book)) {
      const first = books.find((id) => hasAsbab(availability, [{ surah, ayah }], id)) ?? books[0];
      if (first !== undefined) setBook(first);
      return;
    }
    // A contextual selection must never drift to a passage outside its fixed references.
    if (fixed) return;
    const selectedSurah = availableAsbabSurahs(availability, book).includes(surah)
      ? surah
      : availableAsbabSurahs(availability, book)[0];
    if (selectedSurah === undefined) return;
    const ayahs = availableAsbabAyahs(availability, book, selectedSurah);
    if (selectedSurah !== surah) setSurahInput(String(selectedSurah));
    if (selectedSurah !== surah || !ayahs.includes(ayah)) setAyahInput(String(ayahs[0]));
  }, [isAsbab, availability, fixed, references, book, surah, ayah]);
  useEffect(() => {
    if (!valid || (!params?.autoLoad && requested !== key)) {
      controller.cancel();
      return;
    }
    const request = { surah, ayah, kind, provider, book };
    void controller.run(
      key,
      (signal) =>
        request.kind === 'tafsir'
          ? loadTafsir(request.surah, request.ayah, request.provider, fetch, signal)
          : loadIrab(request.surah, request.ayah, request.book, fetch, signal),
      setResult,
    );
    return () => controller.cancel();
  }, [
    key,
    valid,
    requested,
    retry,
    params?.autoLoad,
    controller,
    surah,
    ayah,
    kind,
    provider,
    book,
  ]);
  const load = () => {
    setRequested(key);
    setRetry((value) => value + 1);
  };
  const stepTafsir = (offset: number) => {
    const next = ayah + offset;
    if (fixed || kind !== 'tafsir' || !valid || next < 1 || next > chapter!.verseCount) return;
    clear();
    setAyahInput(String(next));
    setRequested(studyRequestKey({ kind, surah, ayah: next, source: provider }));
  };
  const openSource = () => {
    setLinkError(false);
    void Linking.openURL('https://quranpedia.net').catch(() => setLinkError(true));
  };
  const failure = current?.status === 'error' ? current.error : undefined;

  return (
    <Screen style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <T size={28} bold>
          {t(kind === 'tafsir' ? 'navigation.tafsir' : isAsbab ? 'asbab.title' : 'irab.title')}
        </T>
        <T muted>
          {t(
            kind === 'tafsir'
              ? 'menu.tafsir.subtitle'
              : isAsbab
                ? 'asbab.menuSubtitle'
                : 'irab.menuSubtitle',
          )}
        </T>
      </View>
      <Segments
        value={kind}
        options={(['tafsir', 'irab', 'asbab'] as const).map((value) => ({
          value,
          label: t(
            value === 'tafsir'
              ? 'navigation.tafsir'
              : value === 'irab'
                ? 'irab.title'
                : 'asbab.title',
          ),
        }))}
        onChange={(next) => {
          clear();
          setKind(next);
          setBook(next === 'asbab' ? 2919 : 316);
        }}
      />
      {kind !== 'tafsir' && <Notice message={t(isAsbab ? 'asbab.notice' : 'irab.notice')} />}
      {params?.warshReference && (
        <Notice
          message={format(
            isAsbab ? 'asbab.warshMapping' : 'irab.warshMapping',
            `${params.warshReference.surah}:${params.warshReference.ayah}`,
            references.map((ref) => `${ref.surah}:${ref.ayah}`).join(', '),
          )}
        />
      )}
      <Card style={{ gap: 10 }}>
        {fixed ? (
          <>
            <T bold>{text.fixed}</T>
            {!references.length ? (
              <Notice error message={text.noMapping} />
            ) : (
              <Segments
                value={`${surah}:${ayah}`}
                options={shownReferences.map((ref) => ({
                  value: `${ref.surah}:${ref.ayah}`,
                  label: `Hafs ${ref.surah}:${ref.ayah}`,
                }))}
                translateLabels={false}
                onChange={(ref) => {
                  clear();
                  const [s, a] = ref.split(':');
                  setSurahInput(s ?? '');
                  setAyahInput(a ?? '');
                }}
              />
            )}
          </>
        ) : isAsbab ? (
          <>
            <AvailableSourcePicker
              title={t('app.surah')}
              value={surah}
              options={availableSurahs.map((number) => ({
                value: number,
                label: `${number} · ${chapters[number - 1]!.name} · ${chapters[number - 1]!.nameAr}`,
              }))}
              onChange={(number) => {
                clear();
                setSurahInput(String(number));
                setAyahInput(
                  String(
                    availability ? (availableAsbabAyahs(availability, book, number)[0] ?? '') : '',
                  ),
                );
              }}
            />
            <AvailableSourcePicker
              title={t('app.groupAyah')}
              value={ayah}
              options={availableAyahs.map((number) => ({
                value: number,
                label: `${surah}:${number}`,
              }))}
              onChange={(number) => {
                clear();
                setAyahInput(String(number));
              }}
            />
          </>
        ) : (
          <>
            <AvailableSourcePicker
              title={t('app.surah')}
              value={surah}
              options={chapters.map((item) => ({
                value: item.id,
                label: `${item.id} · ${item.name} · ${item.nameAr}`,
              }))}
              onChange={(value) => {
                clear();
                setSurahInput(String(value));
                setAyahInput('1');
              }}
            />
            {kind === 'tafsir' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <IconButton
                  name="chevron-left"
                  mirrorInRtl
                  label="ui.study.previous"
                  disabled={!valid || ayah <= 1}
                  onPress={() => stepTafsir(-1)}
                />
                <IconButton
                  name="chevron-right"
                  mirrorInRtl
                  label="ui.study.next"
                  disabled={!valid || ayah >= (chapter?.verseCount ?? 0)}
                  onPress={() => stepTafsir(1)}
                />
              </View>
            )}
            <Field
              label={format('irab.ayah', chapter?.verseCount ?? 286)}
              value={ayahInput}
              onChangeText={(value) => {
                clear();
                setAyahInput(value.replace(/\D/g, '').slice(0, 3));
              }}
              keyboardType="number-pad"
              error={ayahInput && !ayahRecord ? t('irab.mappingMissing') : undefined}
            />
          </>
        )}
        <T size={13} muted>
          {chapter ? `${chapter.name} · ${surah}:${ayah}` : t('irab.mappingMissing')}
        </T>
        <Segments
          value={kind === 'tafsir' ? provider : String(book)}
          translateLabels={false}
          options={
            kind === 'tafsir'
              ? tafsirProviders.map((item) => ({ value: item.slug, label: item.name }))
              : (isAsbab
                  ? asbabBooks.filter((item) => availableBooks.includes(item.id))
                  : irabBooks
                ).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))
          }
          onChange={(value) => {
            clear();
            if (kind === 'tafsir') setProvider(value);
            else setBook(Number(value));
          }}
        />
        {isAsbab &&
          !availability &&
          (availabilityError ? (
            <Notice
              error
              message={t('irab.error')}
              onRetry={() => setIndexRetry((value) => value + 1)}
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={p.primary} />
              <T muted>{t('common.loading')}</T>
            </View>
          ))}
        {sourceMissing && <Notice message={text.missing} />}
        {isAsbab && availability && !availableBooks.length && <Notice message={t('asbab.empty')} />}
        {kind === 'tafsir' && (
          <Segments
            value={translation}
            translateLabels={false}
            options={translationProviders.map((item) => ({ value: item.id, label: item.name }))}
            onChange={setTranslation}
          />
        )}
        <Button title="irab.load" onPress={load} disabled={!valid || loading} loading={loading} />
      </Card>
      {ayahRecord && inSelection && (
        <View style={{ gap: 9, paddingVertical: 12 }}>
          <T arabic selectable size={25}>
            {ayahRecord.text}
          </T>
          {kind === 'tafsir' && !!selectedTranslation && (
            <>
              <T size={13} bold color={p.primary}>
                {translationProviders.find((item) => item.id === translation)?.name}
              </T>
              <T selectable>{selectedTranslation}</T>
            </>
          )}
        </View>
      )}
      {failure !== undefined && (
        <Notice
          error
          message={t(
            failure instanceof Error && failure.message === 'RATE_LIMIT'
              ? 'irab.rateLimit'
              : 'irab.error',
          )}
          onRetry={load}
        />
      )}
      {!!tafsir && (
        <View style={{ gap: 8 }}>
          <T size={15} bold color={p.primary}>
            {tafsirProviders.find((item) => item.slug === provider)?.name}
          </T>
          <T arabic selectable size={20}>
            {tafsir}
          </T>
        </View>
      )}
      {irab && (
        <>
          {!irab.fragments.length ? (
            <Notice message={t(isAsbab ? 'asbab.empty' : 'irab.empty')} />
          ) : (
            <>
              <T muted>{t('irab.excerpt')}</T>
              <T bold selectable>
                {irab.name}
                {irab.author ? `\n${irab.author}` : ''}
              </T>
              {irab.fragments.map((fragment, index) => (
                <View
                  key={`${key}-${index}`}
                  style={{ gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: p.line }}
                >
                  <T size={13} bold>
                    {format('irab.reference', fragment.part || '—', fragment.page || '—')}
                  </T>
                  <T arabic selectable size={22} style={{ lineHeight: 40 }}>
                    {plainHtmlText(fragment.html)}
                  </T>
                </View>
              ))}
            </>
          )}
        </>
      )}
      {kind !== 'tafsir' && (
        <Button title="irab.credit" icon="external-link" variant="quiet" onPress={openSource} />
      )}
      {linkError && <Notice error message={text.linkError} onRetry={openSource} />}
    </Screen>
  );
}
