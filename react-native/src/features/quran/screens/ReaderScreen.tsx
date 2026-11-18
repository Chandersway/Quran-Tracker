import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppChrome } from '../../../app/providers/AppChromeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';
import { chapterById, getAyahs, normalizeSearch } from '../../../content/quran';
import type { Ayah } from '../../../content/types';
import { availableTranslations, getAyahTranslation } from '../../../content/translations';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import { usePalette } from '../../../shared/theme';
import {
  Button,
  Field,
  IconButton,
  Notice,
  Screen,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import type { RootStack } from '../../../app/navigation/types';
import { createAudioService } from '../../../services/audio/audio';
import type { AudioTrack } from '../../../services/backend/types';
import { useAudio } from '../../audio/providers/audioContext';
import { RepeatSheet } from '../../audio/components/RepeatSheet';
import { MediaSettings } from '../../audio/components/MediaSettings';
import { StatusBar } from 'expo-status-bar';
import { AyahActionsSheet, type SelectedAyah } from '../components/AyahActionsSheet';
import { useI18n } from '../../../i18n';
import { ReadingModeSwitch, TranslationControl } from '../components/ReadingModeSwitch';
import { readerCopy } from '../model/readerCopy';
import { surahIllustrations } from '../model/surahIllustrations';
import { textToBook } from '../providers/readingModeContext';
import { isShortLandscape } from '../layout/readingLayout';
import { ReaderScrollAnchor } from '../layout/readerScrollAnchor';
import { ReaderListenButton } from '../components/ReaderListenButton';
import { resolveReaderEntry } from '../../../domain/quranNavigation';
import { preferredMushafEdition } from '../../../domain/bookPresentation';
import { stepArabicFontSize } from '../../../domain/readerTypography';

type ReaderVerse = Ayah & { surah: number; key: string };
const audioService = createAudioService(process.env.EXPO_PUBLIC_AUDIO_BASE_URL);

export function ReaderScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Reader'>) {
  useKeepAwake();
  const p = usePalette();
  const { state, dispatch } = useAppStore();
  const audio = useAudio();
  const entry = useMemo(
    () =>
      resolveReaderEntry(
        route.params,
        route.params.edition ?? preferredMushafEdition(state.preferences.mushaf),
        state.surahPositions,
      ),
    [route.params],
  );
  const { surah, ayah = 1, endSurah, endAyah, readingTarget, planId } = entry;
  const repeatEdition =
    route.params.edition ??
    (state.preferences.mushaf === 'muhammadi'
      ? 'muhammadi'
      : state.preferences.mushaf === 'warsh_maknoon'
        ? 'warsh_maknoon'
        : 'hafs');
  const chapter = chapterById(surah);
  const { t, format, locale } = useI18n();
  const [immersive, setImmersive] = useState(route.params.fullscreen ?? false);
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const setImmersiveReader = useAppChrome();
  const [showSurahCard, setShowSurahCard] = useState(false);
  const [illustrationRatio, setIllustrationRatio] = useState(1);
  useEffect(() => {
    setShowSurahCard(false);
  }, [surah]);
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah | null>(null);
  const [repeatTarget, setRepeatTarget] = useState<{
    surah: number;
    ayah: number;
    endAyah?: number;
  }>({ surah, ayah });
  const [visibleSurah, setVisibleSurah] = useState(surah);
  const list = useRef<FlatList<ReaderVerse>>(null);
  const lastVisible = useRef({ surah, ayah });
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<
    'settings' | 'audio' | 'jump' | 'search' | 'translation' | null
  >(null);
  const dimensions = useWindowDimensions();
  const shortLandscape = isShortLandscape(dimensions.width, dimensions.height);
  const [jump, setJump] = useState(String(ayah));
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const requestId = useRef(newId());
  const [repeatOpen, setRepeatOpen] = useState(false);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allVerses = useMemo(() => {
    const rows: ReaderVerse[] = [];
    for (let id = surah; id <= (endSurah ?? surah); id++) {
      getAyahs(id).forEach((v) => {
        if (
          endSurah &&
          ((id === surah && v.number < ayah) ||
            (id === endSurah && v.number > (endAyah ?? chapterById(id).verseCount)))
        )
          return;
        rows.push({ ...v, surah: id, key: `${id}:${v.number}` });
      });
    }
    return rows;
  }, [surah, ayah, endSurah, endAyah]);
  const verses = useMemo(() => {
    if (!query.trim()) return allVerses;
    const q = normalizeSearch(query);
    return allVerses.filter(
      (v) => String(v.number) === query || normalizeSearch(`${v.text} ${v.en} ${v.nl}`).includes(q),
    );
  }, [allVerses, query]);
  const targetIndex = allVerses.findIndex((v) => v.surah === surah && v.number === ayah);
  const bottomPadding = immersive ? Math.max(80, insets.bottom + 64) : 32;
  const [scrollGeneration, setScrollGeneration] = useState(0);
  const generation = useRef(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(
    targetIndex > 0 ? targetIndex : null,
  );
  const scrollAnchor = useRef<ReaderScrollAnchor | null>(
    targetIndex > 0 ? new ReaderScrollAnchor(targetIndex, verses.length, 0, bottomPadding) : null,
  );
  const measurementLimitRef = useRef(Math.min(64, Math.max(10, targetIndex + 10)));
  const [measurementLimit, setMeasurementLimit] = useState(measurementLimitRef.current);
  const measuredRows = useRef(scrollAnchor.current);
  const [sourceWindow, setSourceWindow] = useState({ first: 0, last: 127 });
  const nativeOffset = useRef(0);
  const allowViewability = useRef(targetIndex <= 0);
  const userScroll = useRef(false);
  const listViewport = useRef<{ width: number; height: number } | null>(null);
  const nativeVisible = useRef(lastVisible.current);
  const requestedPoint = useRef(lastVisible.current);
  const liveVerses = useRef(verses);
  liveVerses.current = verses;
  const currentGeometry = () => {
    // Android can deliver events for reflowed rows before React commits the
    // useWindowDimensions render. Those events are not a new reading position.
    const window = Dimensions.get('window');
    return (
      Math.abs(window.width - dimensions.width) < 2 &&
      Math.abs(window.height - dimensions.height) < 2 &&
      window.fontScale === dimensions.fontScale
    );
  };
  const finishAnchor = () => {
    const target = scrollAnchor.current?.index ?? 0;
    setSourceWindow({ first: Math.max(0, target - 64), last: target + 64 });
    lastVisible.current = requestedPoint.current;
    setVisibleSurah(requestedPoint.current.surah);
    scrollAnchor.current = null;
    setPendingIndex(null);
    // Keep the requested point even when the last verse requires a bottom clamp.
    // Actual user scrolling, rather than a programmatic viewability event, resumes tracking.
    allowViewability.current = false;
    userScroll.current = false;
  };
  const queueAnchor = () => {
    if (!scrollAnchor.current || retryTimer.current) return;
    retryTimer.current = setTimeout(() => {
      retryTimer.current = null;
      const anchor = scrollAnchor.current;
      if (!anchor || anchor.generation !== generation.current) return;
      const offset = anchor.offset();
      if (
        offset === null &&
        anchor.measuredPrefix() >= measurementLimitRef.current &&
        measurementLimitRef.current < anchor.count
      ) {
        // A near-end target can require the remaining tail to establish the
        // native bottom clamp, even after the target itself has been measured.
        measurementLimitRef.current = Math.min(anchor.count, measurementLimitRef.current + 64);
        setMeasurementLimit(measurementLimitRef.current);
        return;
      }
      if (offset === null) return;
      if (anchor.confirms(nativeOffset.current)) finishAnchor();
      else list.current?.scrollToOffset({ offset, animated: false });
    }, 0);
  };
  const requestAnchor = (index: number) => {
    const item = liveVerses.current[index];
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
    if (item) requestedPoint.current = { surah: item.surah, ayah: item.number };
    allowViewability.current = false;
    userScroll.current = false;
    listViewport.current = null;
    const next = ++generation.current;
    scrollAnchor.current = item
      ? new ReaderScrollAnchor(index, liveVerses.current.length, next, bottomPadding)
      : null;
    measuredRows.current = scrollAnchor.current;
    nativeOffset.current = 0;
    measurementLimitRef.current = Math.min(64, Math.max(10, index + 10));
    setMeasurementLimit(measurementLimitRef.current);
    setPendingIndex(item ? index : null);
    setScrollGeneration(next);
  };
  const layoutSignature = [
    dimensions.width,
    dimensions.height,
    dimensions.fontScale,
    insets.top,
    insets.left,
    insets.right,
    insets.bottom,
    state.preferences.arabicFontSize,
    state.preferences.translation,
    locale,
    immersive,
    showSurahCard,
    illustrationRatio,
    query,
  ].join(':');
  const passageSignature = [surah, ayah, endSurah, endAyah].join(':');
  const measuredSignature = useRef(layoutSignature);
  const measuredPassage = useRef(passageSignature);
  useLayoutEffect(() => {
    const passageChanged = measuredPassage.current !== passageSignature;
    if (!passageChanged && measuredSignature.current === layoutSignature) return;
    measuredSignature.current = layoutSignature;
    measuredPassage.current = passageSignature;
    if (passageChanged) {
      setQuery('');
      setJump(String(ayah));
      liveVerses.current = allVerses;
    }
    const point = passageChanged
      ? { surah, ayah }
      : scrollAnchor.current
        ? requestedPoint.current
        : lastVisible.current;
    const index = liveVerses.current.findIndex(
      (item) => item.surah === point.surah && item.number === point.ayah,
    );
    requestAnchor(Math.max(0, index));
    // The signature includes every layout/data input; requestAnchor reads the live rows.
  }, [layoutSignature, passageSignature]);
  useLayoutEffect(() => {
    navigation.setOptions({ title: chapter.name, headerShown: false });
  }, [navigation, chapter.name]);
  useLayoutEffect(() => {
    setImmersiveReader((immersive || shortLandscape) && focused);
    return () => setImmersiveReader(false);
  }, [immersive, shortLandscape, focused, setImmersiveReader]);
  useEffect(() => {
    if (!immersive || !focused) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (panel !== null || selectedAyah !== null || repeatOpen) return false;
      setImmersive(false);
      return true;
    });
    return () => subscription.remove();
  }, [immersive, focused, panel, selectedAyah, repeatOpen]);
  useEffect(() => {
    let live = true;
    audioService
      .listSurah(surah)
      .then((items) => {
        if (live) setTracks(items);
      })
      .catch(() => {
        if (live) setError('audio.error.unavailable');
      });
    return () => {
      live = false;
    };
  }, [surah]);
  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      scrollAnchor.current = null;
      if (repeatTimer.current) clearTimeout(repeatTimer.current);
      dispatch({ type: 'cursor', ...lastVisible.current });
    },
    [dispatch],
  );
  const viewable = useMemo(
    () =>
      ({ viewableItems }: { viewableItems: { item: ReaderVerse; isViewable: boolean }[] }) => {
        if (scrollGeneration !== generation.current) return;
        if (!currentGeometry()) {
          allowViewability.current = false;
          userScroll.current = false;
          return;
        }
        const first = viewableItems.find((item) => item.isViewable && item.item);
        if (!first || !liveVerses.current.includes(first.item)) return;
        nativeVisible.current = { surah: first.item.surah, ayah: first.item.number };
        if (allowViewability.current && !scrollAnchor.current) {
          lastVisible.current = nativeVisible.current;
          setVisibleSurah(nativeVisible.current.surah);
          const index = liveVerses.current.indexOf(first.item);
          setSourceWindow((current) =>
            index >= current.first + 32 && index <= current.last - 32
              ? current
              : { first: Math.max(0, index - 64), last: index + 64 },
          );
        }
      },
    [scrollGeneration],
  );
  async function playSelectedSurah(id: number) {
    try {
      const options = id === surah ? tracks : await audioService.listSurah(id);
      const track =
        options.find((item) => item.reciterId === state.preferences.reciterId) ?? options[0];
      if (!track) throw new Error('No recitation');
      audio.play(track);
    } catch {
      setError('audio.error.unavailable');
    }
  }
  function openRepeat(id: number, verse: number, endAyah?: number) {
    setRepeatTarget({ surah: id, ayah: verse, endAyah });
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    repeatTimer.current = setTimeout(() => setRepeatOpen(true), 250);
  }

  function finish() {
    if (planId) {
      if (!state.plans.find((plan) => plan.id === planId)?.isDone)
        dispatch({ type: 'plan/toggle', id: planId, now: Date.now(), date: localDate() });
      setCheckedIn(true);
      setMessage(t('app.completed'));
      return;
    }
    const target = readingTarget ?? { kind: 'surah' as const, number: surah, name: chapter.name };
    dispatch({
      type: 'checkIn',
      ...target,
      requestId: requestId.current,
      now: Date.now(),
      date: localDate(),
    });
    setCheckedIn(true);
    setMessage(t('quickCheck.saved'));
  }
  const jumpVerses = allVerses.filter((verse) => verse.surah === surah);
  const jumpBounds = {
    first: jumpVerses[0]?.number ?? 1,
    last: jumpVerses.at(-1)?.number ?? chapter.verseCount,
  };
  function jumpToAyah() {
    const n = Number(jump);
    const index = allVerses.findIndex((v) => v.surah === surah && v.number === n);
    if (index < 0)
      return setError(format('ui.reader.ayahRangeInvalid', jumpBounds.first, jumpBounds.last));
    setQuery('');
    setPanel(null);
    setError('');
    // Clearing a filter changes the list rows; anchor against the complete passage.
    liveVerses.current = allVerses;
    requestAnchor(index);
  }
  return (
    <Screen scroll={false} style={{ padding: 0 }}>
      <StatusBar hidden={focused && (immersive || shortLandscape)} />
      {!immersive && (
        <View
          testID="reader-compact-controls"
          style={{ borderBottomWidth: 1, borderBottomColor: p.line }}
        >
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            contentContainerStyle={[
              s.row,
              {
                flexGrow: 1,
                gap: 0,
                paddingHorizontal: 4,
              },
            ]}
          >
            <IconButton
              name="arrow-left"
              mirrorInRtl
              label={t('common.back')}
              onPress={() => navigation.goBack()}
            />
            <View style={{ flexGrow: 1, flexShrink: 0 }}>
              <ReadingModeSwitch
                compact
                mode="text"
                onText={() => {}}
                onBook={() =>
                  navigation.replace(
                    'Mushaf',
                    textToBook(
                      { ...route.params, fullscreen: immersive },
                      lastVisible.current,
                      state,
                    ),
                  )
                }
              />
            </View>
            <IconButton
              name="maximize"
              label={readerCopy(locale).enterImmersive}
              onPress={() => setImmersive(true)}
            />
            <IconButton
              name="check"
              label={t(checkedIn ? 'quickCheck.saved' : 'quickCheck.saveAsRead')}
              disabled={checkedIn}
              onPress={finish}
            />
            <IconButton
              name="sliders"
              label={t('reader.menu')}
              onPress={() => setPanel('settings')}
            />
          </ScrollView>
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${chapter.name} · ${t('ui.reader.jumpToAyah')}`}
              onPress={() => setPanel('jump')}
              style={{ flex: 1, minHeight: 48, minWidth: 80, justifyContent: 'center' }}
            >
              <T translate={false} bold size={14}>
                {locale === 'ar' ? chapter.nameAr : chapter.name}
              </T>
            </Pressable>
            <ReaderListenButton
              compact
              surah={visibleSurah}
              onListen={() => void playSelectedSurah(visibleSurah)}
            />
            <Button
              title={t(
                availableTranslations.find((item) => item.id === state.preferences.translation)
                  ?.labelKey ?? 'ui.reader.arabicOnly',
              )}
              icon="globe"
              variant="quiet"
              style={{ paddingHorizontal: 10, minHeight: 48 }}
              onPress={() => setPanel('translation')}
            />
            <IconButton
              name="search"
              label={t('app.quranSearchPlaceholder')}
              onPress={() => setPanel('search')}
              selected={Boolean(query)}
            />
          </ScrollView>
        </View>
      )}
      {message && <Notice message={message} />}
      {error && <Notice error message={error} />}
      <View style={{ flex: 1 }}>
        <FlatList
          key={scrollGeneration}
          ref={list}
          data={verses}
          keyExtractor={(v) => v.key}
          initialNumToRender={pendingIndex === null ? 10 : measurementLimit}
          windowSize={7}
          maxToRenderPerBatch={8}
          onViewableItemsChanged={viewable}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 1 }}
          style={{ opacity: pendingIndex === null ? 1 : 0 }}
          accessibilityElementsHidden={pendingIndex !== null}
          importantForAccessibility={pendingIndex === null ? 'auto' : 'no-hide-descendants'}
          onLayout={({ nativeEvent }) => {
            if (scrollGeneration !== generation.current) return;
            const { width, height } = nativeEvent.layout;
            const previous = listViewport.current;
            if (
              previous &&
              (Math.abs(previous.width - width) > 2 || Math.abs(previous.height - height) > 2)
            ) {
              allowViewability.current = false;
              userScroll.current = false;
            }
            listViewport.current = { width, height };
            if (scrollAnchor.current?.generation !== scrollGeneration) return;
            scrollAnchor.current.measureViewport(nativeEvent.layout.height);
            queueAnchor();
          }}
          onContentSizeChange={(_width, height) => {
            if (scrollAnchor.current?.generation !== scrollGeneration) return;
            scrollAnchor.current.measureContent(height);
            queueAnchor();
          }}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => {
            if (scrollGeneration !== generation.current) return;
            if (!currentGeometry()) {
              allowViewability.current = false;
              userScroll.current = false;
              return;
            }
            const previousOffset = nativeOffset.current;
            nativeOffset.current = nativeEvent.contentOffset.y;
            if (scrollAnchor.current?.confirms(nativeOffset.current)) finishAnchor();
            else if (
              Platform.OS === 'web' &&
              !scrollAnchor.current &&
              Math.abs(nativeOffset.current - previousOffset) > 2
            ) {
              // Web wheel/keyboard scrolling does not dispatch BeginDrag.
              // An actual move after acknowledgement resumes live tracking.
              allowViewability.current = true;
            }
          }}
          onScrollBeginDrag={() => {
            if (scrollGeneration !== generation.current) return;
            if (!currentGeometry()) return;
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = null;
            scrollAnchor.current = null;
            setPendingIndex(null);
            allowViewability.current = true;
            userScroll.current = true;
            lastVisible.current = nativeVisible.current;
            const index = liveVerses.current.findIndex(
              (item) =>
                item.surah === nativeVisible.current.surah &&
                item.number === nativeVisible.current.ayah,
            );
            setSourceWindow({ first: Math.max(0, index - 64), last: index + 64 });
          }}
          onScrollEndDrag={() => {
            if (scrollGeneration !== generation.current || Platform.OS === 'web') return;
            allowViewability.current = false;
          }}
          onMomentumScrollBegin={() => {
            if (scrollGeneration !== generation.current || !currentGeometry()) return;
            allowViewability.current = userScroll.current;
          }}
          onMomentumScrollEnd={() => {
            if (scrollGeneration !== generation.current || Platform.OS === 'web') return;
            allowViewability.current = false;
            userScroll.current = false;
          }}
          contentContainerStyle={{
            paddingHorizontal: shortLandscape ? 24 : 20,
            paddingBottom: bottomPadding,
          }}
          ListHeaderComponent={
            <View
              onLayout={({ nativeEvent }) => {
                if (scrollAnchor.current?.generation !== scrollGeneration) return;
                scrollAnchor.current.measureHeader(nativeEvent.layout.height);
                queueAnchor();
              }}
              style={{ paddingTop: 8, alignItems: 'center' }}
            >
              {showSurahCard && surahIllustrations[surah] && (
                <View style={{ width: '100%', marginBottom: 16 }}>
                  <Image
                    source={surahIllustrations[surah]}
                    accessibilityLabel={`${readerCopy(locale).illustration} ${chapter.name}`}
                    resizeMode="contain"
                    style={{ width: '100%', aspectRatio: illustrationRatio }}
                    onLoad={({ nativeEvent }) => {
                      const { width, height } = nativeEvent.source;
                      if (width > 0 && height > 0) setIllustrationRatio(width / height);
                    }}
                  />
                  <T muted size={12} style={{ marginTop: 6 }}>
                    {readerCopy(locale).source}
                  </T>
                </View>
              )}
              {surah !== 1 && surah !== 9 && (!endSurah || ayah === 1) && (
                <T arabic size={25} color={p.primary} style={{ textAlign: 'center', marginTop: 4 }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </T>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={{ padding: 24 }}>
              <T muted>{t('mutashabihat.noResults')}</T>
            </View>
          }
          renderItem={({ item: v, index }) => {
            // RN may request overscan beyond the current initial region. Keep
            // unmeasured source shaping inside this bounded batch as well.
            if (pendingIndex !== null && index >= measurementLimit) return null;
            const measuredHeight = measuredRows.current?.rowHeight(index);
            const firstSourceRow =
              pendingIndex === null ? sourceWindow.first : measurementLimit - 64;
            const lastSourceRow = pendingIndex === null ? sourceWindow.last : Infinity;
            if ((index < firstSourceRow || index > lastSourceRow) && measuredHeight !== undefined)
              return (
                <View testID="reader-measured-prefix-row" style={{ height: measuredHeight }} />
              );
            const saved = state.bookmarks.some((b) => b.surah === v.surah && b.ayah === v.number);
            return (
              <View
                onLayout={({ nativeEvent }) => {
                  if (scrollAnchor.current?.generation !== scrollGeneration) return;
                  scrollAnchor.current.measureRow(index, nativeEvent.layout.height);
                  queueAnchor();
                }}
                style={{
                  paddingTop: 12,
                  paddingBottom: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: p.line,
                }}
              >
                <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
                  <View
                    style={{
                      backgroundColor: p.subtle,
                      borderRadius: 9,
                      minWidth: 36,
                      padding: 7,
                      alignItems: 'center',
                    }}
                  >
                    <T size={12} bold color={p.primary}>
                      {endSurah ? `${v.surah}:${v.number}` : v.number}
                    </T>
                  </View>
                  <IconButton
                    name="more-horizontal"
                    label={`${readerCopy(locale).verseActions} ${v.surah}:${v.number}`}
                    selected={saved}
                    onPress={() => setSelectedAyah(v)}
                  />
                </View>
                {endSurah && v.number === 1 && v.surah !== surah && (
                  <T translate={false} size={22} bold style={{ marginBottom: 14 }}>
                    {chapterById(v.surah).name}
                  </T>
                )}
                <T
                  arabic
                  translate={false}
                  size={state.preferences.arabicFontSize}
                  selectable
                  style={{ marginBottom: state.preferences.translation === 'off' ? 0 : 18 }}
                >
                  {v.text}
                </T>
                {state.preferences.translation !== 'off' && (
                  <T
                    translate={false}
                    size={17}
                    selectable
                    style={{ lineHeight: 29, color: p.muted }}
                  >
                    {getAyahTranslation(v, state.preferences.translation)}
                  </T>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <View
              onLayout={({ nativeEvent }) => {
                if (scrollAnchor.current?.generation !== scrollGeneration) return;
                scrollAnchor.current.measureFooter(nativeEvent.layout.height);
                queueAnchor();
              }}
              style={{ paddingTop: 28, gap: 14 }}
            >
              <Button
                title={t(checkedIn ? 'quickCheck.saved' : 'quickCheck.saveAsRead')}
                icon="check"
                onPress={finish}
                disabled={checkedIn}
              />
              <View style={s.row}>
                {surah > 1 && (
                  <Button
                    title={t('ui.reader.previousSurah')}
                    variant="quiet"
                    onPress={() => navigation.replace('Reader', { surah: surah - 1 })}
                    style={{ flex: 1 }}
                  />
                )}
                {surah < 114 && (
                  <Button
                    title={t('ui.reader.nextSurah')}
                    variant="secondary"
                    onPress={() => navigation.replace('Reader', { surah: surah + 1 })}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </View>
          }
        />
        {pendingIndex !== null && (
          <View
            testID="reader-opening-passage"
            pointerEvents="none"
            accessibilityRole="progressbar"
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <ActivityIndicator color={p.primary} />
            <T translate={false}>{readerCopy(locale).openingPassage}</T>
          </View>
        )}
      </View>
      <Sheet
        visible={panel === 'search'}
        title={t('app.quranSearchPlaceholder')}
        onClose={() => setPanel(null)}
      >
        <Field label={t('app.quranSearchPlaceholder')} value={query} onChangeText={setQuery} />
        <Button title={t('common.open')} onPress={() => setPanel(null)} />
      </Sheet>
      <Sheet
        visible={panel === 'translation'}
        title={t('navigation.translation')}
        onClose={() => setPanel(null)}
      >
        <TranslationControl />
      </Sheet>
      <Sheet visible={panel === 'settings'} title={t('reader.menu')} onClose={() => setPanel(null)}>
        <View style={{ gap: 8, marginBottom: 20 }}>
          <Button
            title={readerCopy(locale).enterImmersive}
            icon="maximize"
            variant="secondary"
            onPress={() => {
              setPanel(null);
              setImmersive(true);
            }}
          />
          <Button
            title={t(showSurahCard ? 'reader.hideCard' : 'reader.showCard')}
            icon="image"
            variant="quiet"
            onPress={() => {
              setShowSurahCard((value) => !value);
              if (!showSurahCard) requestAnchor(0);
              setPanel(null);
            }}
          />
          <Button
            title={t('ui.reader.jumpToAyah')}
            icon="hash"
            variant="quiet"
            onPress={() => setPanel('jump')}
          />
          <Button
            title={t('app.quranSearchPlaceholder')}
            icon="search"
            variant="quiet"
            onPress={() => setPanel('search')}
          />
        </View>
        <T bold>{format('reader.fontSize', state.preferences.arabicFontSize)}</T>
        <View style={[s.row, { justifyContent: 'space-between', marginVertical: 16 }]}>
          <IconButton
            name="minus"
            label={t('reader.smallerFont')}
            onPress={() =>
              dispatch({
                type: 'preferences',
                patch: { arabicFontSize: stepArabicFontSize(state.preferences.arabicFontSize, -2) },
              })
            }
          />
          <T arabic size={state.preferences.arabicFontSize}>
            الْقُرْآنَ
          </T>
          <IconButton
            name="plus"
            label={format(
              'reader.fontSize',
              stepArabicFontSize(state.preferences.arabicFontSize, 2),
            )}
            onPress={() =>
              dispatch({
                type: 'preferences',
                patch: { arabicFontSize: stepArabicFontSize(state.preferences.arabicFontSize, 2) },
              })
            }
          />
        </View>
        <T bold>{t('navigation.translation')}</T>
        <Segments
          value={state.preferences.translation}
          onChange={(translation) => dispatch({ type: 'preferences', patch: { translation } })}
          options={[
            ...availableTranslations.map((item) => ({ value: item.id, label: t(item.labelKey) })),
            { value: 'off', label: t('ui.reader.arabicOnly') },
          ]}
        />
        <T bold style={{ marginTop: 20 }}>
          {t('app.appearance')}
        </T>
        <Segments
          value={state.preferences.theme}
          onChange={(theme) => dispatch({ type: 'preferences', patch: { theme } })}
          options={[
            { value: 'light', label: t('app.lightTheme') },
            { value: 'dark', label: t('app.darkTheme') },
            { value: 'system', label: t('ui.reader.themeSystem') },
          ]}
        />
        <Button
          title={t('app.quranAudioPlay')}
          icon="headphones"
          onPress={() => {
            setPanel('audio');
          }}
          variant="secondary"
          style={{ marginTop: 24 }}
        />
      </Sheet>
      <Sheet
        visible={panel === 'audio'}
        title={t('app.media')}
        onClose={() => setPanel(null)}
        avoidKeyboard
      >
        <Button
          title={t('repeat.title')}
          icon="repeat"
          variant="secondary"
          onPress={() => {
            setPanel(null);
            openRepeat(lastVisible.current.surah, lastVisible.current.ayah);
          }}
          style={{ marginTop: 12 }}
        />
        {panel === 'audio' && <MediaSettings surah={surah} />}
      </Sheet>
      <AyahActionsSheet
        ayah={selectedAyah}
        onClose={() => setSelectedAyah(null)}
        onRepeat={openRepeat}
        onPlay={(id) => {
          void playSelectedSurah(id);
        }}
        onError={setError}
      />
      {immersive && (
        <View
          style={{
            position: 'absolute',
            bottom: Math.max(16, insets.bottom),
            right: Math.max(16, insets.right),
            backgroundColor: p.surface,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: p.line,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ReaderListenButton
            compact
            surah={visibleSurah}
            onListen={() => void playSelectedSurah(visibleSurah)}
          />
          <IconButton
            name="minimize"
            label={readerCopy(locale).exitImmersive}
            onPress={() => setImmersive(false)}
          />
        </View>
      )}
      <RepeatSheet
        key={`${repeatTarget.surah}:${repeatTarget.ayah}`}
        visible={repeatOpen}
        onClose={() => setRepeatOpen(false)}
        surah={repeatTarget.surah}
        initialAyah={repeatTarget.ayah}
        initialEndAyah={repeatTarget.endAyah}
        pageEdition={
          repeatEdition === 'hafs_madina_pdf' || repeatEdition === 'hafs_indopak_15'
            ? null
            : repeatEdition
        }
        warsh={repeatEdition === 'warsh_maknoon' || repeatEdition === 'muhammadi'}
      />
      <Sheet
        visible={panel === 'jump'}
        title={t('ui.reader.jumpToAyah')}
        onClose={() => setPanel(null)}
      >
        <Field
          label={format('ui.reader.ayahNumberRange', jumpBounds.first, jumpBounds.last)}
          value={jump}
          onChangeText={setJump}
          keyboardType="number-pad"
        />
        {error && <Notice error message={error} />}
        <Button
          title={t('ui.reader.jumpToAyah')}
          icon="arrow-right"
          mirrorInRtl
          onPress={jumpToAyah}
        />
      </Sheet>
    </Screen>
  );
}
