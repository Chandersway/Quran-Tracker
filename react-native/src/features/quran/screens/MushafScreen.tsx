import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { chapterById, getAyahs } from '../../../content/quran';
import { getStudyAyah } from '../../../content/study';
import type { Word } from '../../../content/types';
import type { CanonicalMushafWord } from '../../../domain/selectableMushaf';
import { useAppStore } from '../../../state/store';
import { newId } from '../../../state/reducer';
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
import { usePalette } from '../../../shared/theme';
import { useAppChrome } from '../../../app/providers/AppChromeContext';
import { useI18n } from '../../../i18n';
import type { RootStack } from '../../../app/navigation/types';
import {
  findMushafAyah,
  printedHafsPage,
  hafsReferences,
  pageSegments,
  type Edition,
  type Segment,
} from '../../../content/mushafGeometry';
import { importLegacyMushafs } from '../../../services/mushaf/storage';
import { DownloadedPdfMushaf } from '../components/DownloadedPdfMushaf';
import { PrintedMushafPage } from '../components/PrintedMushafPage';
import { ContinuousMushafPages } from '../components/ContinuousMushafPages';
import { SelectableMushafPage } from '../components/SelectableMushafPage';
import { MushafReadingActions } from '../components/MushafReadingActions';
import { MushafFooter } from '../components/MushafFooter';
import {
  MushafVerticalRail,
  type MushafVerticalRailPosition,
} from '../components/MushafVerticalRail';
import { ReadingModeSwitch, TranslationControl } from '../components/ReadingModeSwitch';
import { AyahActionsSheet, type SelectedAyah } from '../components/AyahActionsSheet';
import { bookToText } from '../providers/readingModeContext';
import { isShortLandscape, useBookSpread } from '../layout/readingLayout';
import { mushafPageRange, mushafSpread } from '../../../domain/mushafReading';
import {
  beginBookSelection,
  bookSelectionReturnDistance,
  resolveBookEntry,
  preferredMushafEdition,
  restoreBookSelection,
} from '../../../domain/bookPresentation';
import { availableTranslations, getAyahTranslation } from '../../../content/translations';
import { BookTranslationSheet } from '../components/BookTranslationSheet';
import { createMushafTextGesture } from '../gestures/mushafTextGestures';
import { createBookViewportGesture } from '../gestures/bookViewportGestures';
import { createAudioService } from '../../../services/audio/audio';
import { useAudio } from '../../audio/providers/audioContext';
import { RepeatSheet } from '../../audio/components/RepeatSheet';
import { readPageMetrics } from '../model/readPageMetrics';
import { readerCopy } from '../model/readerCopy';
import { bookOffsetForAnchor, bookScrollAnchor } from '../layout/bookScrollPosition';
import { ReaderListenButton } from '../components/ReaderListenButton';
import { FloatingReaderAudio } from '../components/FloatingReaderAudio';
import { resolveReaderEntry } from '../../../domain/quranNavigation';
import { matchesMushafBookmarkPage } from '../../../domain/mushafBookmarks';

const audioService = createAudioService(process.env.EXPO_PUBLIC_AUDIO_BASE_URL);

function pointOnPage(
  point: { surah: number; ayah: number },
  range: ReturnType<typeof mushafPageRange>,
) {
  if (!range) return point;
  const index = point.surah * 1000 + point.ayah;
  return index >= range.start.surah * 1000 + range.start.ayah &&
    index <= range.end.surah * 1000 + range.end.ayah
    ? point
    : range.start;
}

export function MushafScreen(props: NativeStackScreenProps<RootStack, 'Mushaf'>) {
  const { state } = useAppStore();
  const dimensions = useWindowDimensions();
  const shortLandscape = isShortLandscape(dimensions.width, dimensions.height);
  // Resolve resume once per navigation intent; cursor writes must not move an open book.
  const requestedEntry = useMemo(
    () =>
      resolveReaderEntry(
        props.route.params,
        props.route.params.edition ?? preferredMushafEdition(state.preferences.mushaf),
        state.surahPositions,
      ),
    [props.route.params],
  );
  const entry = resolveBookEntry(state, requestedEntry);
  const edition = entry.edition;
  // New passage intent remounts the reader; visible-page/cursor writes do not.
  const entryKey = JSON.stringify([
    edition,
    entry.bookPresentation,
    requestedEntry.surah,
    requestedEntry.ayah,
    requestedEntry.page,
    requestedEntry.endSurah,
    requestedEntry.endAyah,
    requestedEntry.planId,
  ]);
  const pdf = edition === 'hafs_madina_pdf' || edition === 'hafs_indopak_15';
  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerShown: pdf && !shortLandscape && entry.fullscreen === false,
    });
  }, [props.navigation, shortLandscape, pdf, entry.fullscreen]);
  const [checking, setChecking] = useState(true);
  const [migrationError, setMigrationError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setChecking(true);
    setMigrationError(false);
    void importLegacyMushafs(controller.signal)
      .catch(() => {
        if (!controller.signal.aborted) setMigrationError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [edition]);
  if (checking)
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  if (migrationError)
    return (
      <Screen>
        {(!pdf || shortLandscape || entry.fullscreen !== false) && (
          <IconButton
            name="arrow-left"
            mirrorInRtl
            label="common.back"
            onPress={() => props.navigation.goBack()}
          />
        )}
        <ReadingModeSwitch
          mode="book"
          onBook={() => {}}
          onText={() =>
            props.navigation.replace('Reader', {
              ...entry,
              ...(entry.ayah !== undefined ? {} : state.cursor),
            })
          }
        />
        <Notice error message="rub.open.error" />
        <Button title="app.mushaf" onPress={() => props.navigation.navigate('MushafLibrary')} />
      </Screen>
    );
  if (edition === 'hafs_madina_pdf' || edition === 'hafs_indopak_15') {
    const initial =
      entry.page ??
      (edition === 'hafs_indopak_15' ? 1 : printedHafsPage(entry.surah, entry.ayah ?? 1) + 1);
    return (
      <DownloadedPdfMushaf
        key={entryKey}
        shortLandscape={shortLandscape}
        onBack={() => props.navigation.goBack()}
        onSelectable={(page, zoom) =>
          props.navigation.push(
            'Mushaf',
            beginBookSelection(
              state,
              {
                ...entry,
                page,
                bookView: { zoom, horizontalOffset: 0, verticalAnchor: 0 },
              },
              props.route.key,
            ),
          )
        }
        id={edition}
        surah={entry.surah}
        initialPage={initial}
        context={entry}
        onLibrary={() => props.navigation.navigate('MushafLibrary')}
        onText={(page, zoom) =>
          props.navigation.replace(
            'Reader',
            bookToText(
              { ...entry, bookView: { zoom, horizontalOffset: 0, verticalAnchor: 0 } },
              entry.ayah !== undefined ? { surah: entry.surah, ayah: entry.ayah } : state.cursor,
              edition,
              page,
            ),
          )
        }
      />
    );
  }
  return <ImageMushaf {...props} key={entryKey} route={{ ...props.route, params: entry }} />;
}
function ImageMushaf({ route, navigation }: NativeStackScreenProps<RootStack, 'Mushaf'>) {
  const { state, dispatch } = useAppStore();
  const p = usePalette();
  const { t, format, locale } = useI18n();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const dark =
    state.preferences.theme === 'dark' ||
    (state.preferences.theme === 'system' && colorScheme === 'dark');
  const preferred = route.params.edition ?? state.preferences.mushaf;
  const edition: Edition =
    preferred === 'muhammadi'
      ? 'muhammadi'
      : preferred === 'warsh_maknoon'
        ? 'warsh_maknoon'
        : preferred === 'hafs_maknoon'
          ? 'hafs_maknoon'
          : 'hafs';
  const selectablePage =
    (edition === 'hafs' || edition === 'warsh_maknoon') &&
    route.params.bookPresentation === 'selectable';
  const initialFullscreen = route.params.fullscreen ?? true;
  const initialPresentation = initialFullscreen || !selectablePage ? 'original' : 'selectable';
  const entryPoint = useMemo(() => {
    if (route.params.ayah === undefined && route.params.page !== undefined) {
      const known = mushafPageRange(edition, route.params.page, route.params.bookPresentation);
      if (known) return known.start;
    }
    return { surah: route.params.surah, ayah: route.params.ayah ?? 1 };
  }, [
    edition,
    route.params.surah,
    route.params.ayah,
    route.params.page,
    route.params.bookPresentation,
  ]);
  const initial = useMemo(
    () => findMushafAyah(edition, entryPoint.surah, entryPoint.ayah, initialPresentation),
    [edition, entryPoint, initialPresentation],
  );
  // A QPC page number cannot address an original Medina scan. Both views can
  // address the same canonical verse, including the first verse of a saved page.
  const entryPage =
    edition === 'hafs' && selectablePage && initialFullscreen
      ? (initial?.page ?? 1)
      : (route.params.page ?? initial?.page ?? 1);
  const [page, setPage] = useState(entryPage);
  const readingPoint = useRef(entryPoint);
  const [readingSessionId] = useState(newId);
  const [zoom, setZoom] = useState(route.params.bookView?.zoom ?? 1);
  const [fullscreen, setFullscreenState] = useState(initialFullscreen);
  const presentation = fullscreen || !selectablePage ? 'original' : 'selectable';
  const audio = useAudio();
  const [repeatTarget, setRepeatTarget] = useState<{
    surah: number;
    ayah: number;
    endAyah?: number;
    mode: 'page' | 'ayahs';
  } | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (repeatTimer.current) clearTimeout(repeatTimer.current);
    },
    [],
  );
  const setImmersiveReader = useAppChrome();
  const focused = useIsFocused();
  const shortLandscape = isShortLandscape(window.width, window.height);
  useLayoutEffect(() => {
    setImmersiveReader((fullscreen || shortLandscape) && focused);
    return () => setImmersiveReader(false);
  }, [fullscreen, shortLandscape, focused, setImmersiveReader]);
  const verticalRail = useRef<MushafVerticalRailPosition | null>(null);
  const [contentMeasure, setContentMeasure] = useState<{ key: string; height: number } | null>(
    null,
  );
  const [bookMeasure, setBookMeasure] = useState<{ key: string; height: number } | null>(null);
  const verticalScroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const horizontalScroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const initialHorizontalOffset = useRef({ x: route.params.bookView?.horizontalOffset ?? 0, y: 0 });
  const horizontalOffset = useRef(initialHorizontalOffset.current.x);
  const bookExtent = useRef({ width: 0, height: 0 });
  const bookSize = useRef({ width: 0, height: 0 });
  const panViewport = useRef<React.ComponentRef<typeof View> | null>(null);
  const viewportOrigin = useRef({ left: 0, top: 0 });
  const bookFrame = useRef<React.ComponentRef<typeof View> | null>(null);
  const verticalOffset = useRef(0);
  const [verticalEdges, setVerticalEdges] = useState({ top: true, bottom: false });
  const imageGesture = useRef(createMushafTextGesture());
  const imagePageRefs = useRef<Record<number, React.ComponentRef<typeof View> | null>>({});
  const imageEdges = useRef(verticalEdges);
  const [selectionMode, setSelectionMode] = useState(route.params.selectionMode === true);
  const [selectedWord, setSelectedWord] = useState<CanonicalMushafWord | null>(null);
  const [wordInfo, setWordInfo] = useState<{
    ref: CanonicalMushafWord;
    text: string;
    word?: Word;
    status: 'loading' | 'ready' | 'error';
  } | null>(null);
  const wordRequest = useRef(0);
  useEffect(
    () => () => {
      wordRequest.current++;
    },
    [],
  );
  const [selected, setSelected] = useState<{ segment: Segment; page: number } | null>(null);
  const [selectedCanonical, setSelectedCanonical] = useState<SelectedAyah | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [panel, setPanel] = useState<'menu' | 'jump' | 'translation' | null>(null);
  useEffect(() => {
    if (!fullscreen || !focused) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (panel !== null || wordInfo !== null || repeatOpen) return false;
      setFullscreen(false);
      return true;
    });
    return () => subscription.remove();
  }, [fullscreen, focused, panel, wordInfo, selected, selectedCanonical, repeatOpen, page]);
  const [jump, setJump] = useState('');
  const [viewport, setViewport] = useState({
    width: window.width,
    height: Math.max(240, window.height - 260),
  });
  const maximum = edition === 'muhammadi' ? 638 : 604;
  // Page, edition, zoom and width changes invalidate older measurements.
  const fullWidthSpread = useBookSpread(
    window.width,
    window.height,
    viewport.width,
    viewport.height,
  );
  const narrowSpread = useBookSpread(
    window.width,
    window.height,
    Math.max(1, viewport.width - 48),
    viewport.height,
  );
  const measureKey = `${edition}:${route.params.bookPresentation}:${page}:${zoom}:${viewport.width}:${fullWidthSpread}:${narrowSpread}`;
  // Fullscreen overlays its rail on the book. Measurements never add a gutter
  // or resize source text when the control becomes active.
  const showRail = shortLandscape || zoom > 1 || (selectablePage && edition === 'warsh_maknoon');
  const reserveRail = !fullscreen && showRail;
  const bookWidth = Math.max(1, viewport.width - (reserveRail ? 48 : 0));
  const topGutter = 0;
  const bottomGutter = 0;
  const freePan = zoom > 1 && !selectionMode;
  const panConfig = useRef({
    zoom,
    selection: selectionMode,
    blocked: false,
    pinchEnabled: !selectablePage,
    width: bookWidth,
    height: viewport.height,
    topGutter,
    bottomGutter,
  });
  panConfig.current = {
    zoom,
    selection: selectionMode,
    blocked:
      !focused ||
      panel !== null ||
      wordInfo !== null ||
      selected !== null ||
      selectedCanonical !== null ||
      repeatOpen,
    // Reconstructed Unicode refits and hides Text while measuring. Keep native
    // selection intact and use the visible +/- there instead of refitting per MOVE.
    pinchEnabled: !selectablePage,
    width: bookWidth,
    height: viewport.height,
    topGutter,
    bottomGutter,
  };
  const bookGesture = useRef(
    createBookViewportGesture({
      state: () => ({
        ...panConfig.current,
        x: horizontalOffset.current,
        y: verticalOffset.current,
        maximumX: Math.max(0, bookExtent.current.width - panConfig.current.width),
        maximumY: Math.max(0, bookExtent.current.height - panConfig.current.height),
        geometry: {
          ...viewportOrigin.current,
          insetX: Math.max(0, (panConfig.current.width - bookSize.current.width) / 2),
          insetY:
            panConfig.current.topGutter +
            Math.max(
              0,
              (panConfig.current.height -
                bookSize.current.height -
                panConfig.current.topGutter -
                panConfig.current.bottomGutter) /
                2,
            ),
          ...bookSize.current,
        },
      }),
      scroll: (x, y) => {
        horizontalOffset.current = x;
        verticalOffset.current = y;
        horizontalScroll.current?.scrollTo({ x, animated: false });
        verticalScroll.current?.scrollTo({ y, animated: false });
      },
      zoom: setZoom,
      claimed: () => imageGesture.current.cancel(),
    }),
  );
  const spread = reserveRail ? narrowSpread : fullWidthSpread;
  const frameKey = `${measureKey}:${bookWidth}`;
  const frameKeyRef = useRef(frameKey);
  frameKeyRef.current = frameKey;
  const contentKey = `${frameKey}:${fullscreen}:${topGutter}:${bottomGutter}`;
  const contentKeyRef = useRef(contentKey);
  contentKeyRef.current = contentKey;
  const measuredBookHeight = bookMeasure?.key === frameKey ? bookMeasure.height : 0;
  const contentHeight =
    contentMeasure?.key === contentKey
      ? contentMeasure.height
      : measuredBookHeight > 0
        ? Math.max(viewport.height, measuredBookHeight + topGutter + bottomGutter)
        : 0;
  const realPageOverflow = contentHeight > viewport.height + 1;
  const scrollAnchor = useRef(route.params.bookView?.verticalAnchor ?? 0);
  const pageIdentity = `${edition}:${page}`;
  const layoutIdentity = `${frameKey}:${viewport.height}:${fullscreen}`;
  const previousLayout = useRef({ page: pageIdentity, layout: layoutIdentity });
  const pendingScrollRestore = useRef<{ layout: string; anchor: number } | null>(
    route.params.bookView ? { layout: layoutIdentity, anchor: scrollAnchor.current } : null,
  );
  if (previousLayout.current.page !== pageIdentity) {
    scrollAnchor.current = 0;
    pendingScrollRestore.current = null;
  } else if (previousLayout.current.layout !== layoutIdentity) {
    pendingScrollRestore.current = { layout: layoutIdentity, anchor: scrollAnchor.current };
  }
  previousLayout.current = { page: pageIdentity, layout: layoutIdentity };
  const resetPage = useRef(pageIdentity);
  useEffect(() => {
    const pending = pendingScrollRestore.current;
    if (bookGesture.current.active) {
      pendingScrollRestore.current = null;
      return;
    }
    if (!pending || pending.layout !== layoutIdentity || measuredBookHeight <= 0) return;
    const y = bookOffsetForAnchor(
      pending.anchor,
      measuredBookHeight,
      topGutter,
      bottomGutter,
      viewport.height,
    );
    const frame = requestAnimationFrame(() => {
      if (pendingScrollRestore.current !== pending) return;
      scrollAnchor.current = pending.anchor;
      pendingScrollRestore.current = null;
      verticalScroll.current?.scrollTo({ y, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [layoutIdentity, measuredBookHeight, topGutter, bottomGutter, viewport.height]);
  useEffect(() => {
    bookFrame.current?.measure((_x, _y, _width, height) => {
      if (frameKeyRef.current !== frameKey || !Number.isFinite(height) || height <= 0) return;
      setBookMeasure((current) =>
        current?.key === frameKey && current.height === height
          ? current
          : { key: frameKey, height },
      );
    });
  }, [frameKey, measureKey, reserveRail]);
  const pages = useMemo(() => mushafSpread(page, maximum, spread), [page, maximum, spread]);
  useEffect(() => {
    imageGesture.current.cancel();
  }, [page, zoom, fullscreen, viewport.width, viewport.height, spread, selectionMode]);
  useEffect(() => {
    bookGesture.current.cancel();
  }, [
    page,
    edition,
    fullscreen,
    viewport.width,
    viewport.height,
    selectionMode,
    focused,
    panel,
    wordInfo,
    selected,
    selectedCanonical,
    repeatOpen,
  ]);
  useEffect(() => {
    const gesture = bookGesture.current;
    return () => gesture.cancel();
  }, []);
  const horizontalPage = useRef(pageIdentity);
  useEffect(() => {
    if (horizontalPage.current === pageIdentity) return;
    horizontalPage.current = pageIdentity;
    horizontalOffset.current = 0;
    horizontalScroll.current?.scrollTo({ x: 0, animated: false });
  }, [pageIdentity]);
  const range = useMemo(
    () => mushafPageRange(edition, page, presentation),
    [edition, page, presentation],
  );
  const targetHighlight = useMemo(() => {
    if (!route.params.ayah || page !== initial?.page) return null;
    return (
      pageSegments(edition, page, presentation).find(
        (segment) =>
          segment.surah === route.params.surah &&
          hafsReferences(edition, segment.surah, segment.ayah).includes(route.params.ayah!),
      ) ?? null
    );
  }, [edition, page, presentation, initial?.page, route.params.surah, route.params.ayah]);
  const currentPoint =
    selected?.page === page
      ? {
          surah: selected.segment.surah,
          ayah: hafsReferences(edition, selected.segment.surah, selected.segment.ayah)[0]!,
        }
      : selectedCanonical
        ? { surah: selectedCanonical.surah, ayah: selectedCanonical.number }
        : pointOnPage(readingPoint.current, range);
  const chapter = chapterById(currentPoint.surah);
  const getTickMetrics = useMemo(
    () => readPageMetrics(state.history, edition, maximum, undefined, presentation),
    [state.history, edition, maximum, presentation],
  );
  useEffect(() => {
    setPage(entryPage);
    readingPoint.current = entryPoint;
    setSelected(null);
    setSelectedCanonical(null);
  }, [entryPage, entryPoint]);
  useEffect(() => {
    if (!focused) return;
    dispatch({
      type: 'mushaf/position',
      edition,
      page,
      ...(edition === 'hafs' ? { bookPresentation: presentation } : {}),
    });
    if (range) {
      readingPoint.current = { surah: currentPoint.surah, ayah: currentPoint.ayah };
      dispatch({ type: 'cursor', ...readingPoint.current });
    }
  }, [
    dispatch,
    edition,
    page,
    range,
    initial?.page,
    route.params.surah,
    route.params.ayah,
    focused,
    selected,
    selectedCanonical,
    presentation,
    currentPoint.surah,
    currentPoint.ayah,
  ]);
  useEffect(() => {
    setError('');
    setSelected((current) => (current?.page === page ? current : null));
    setSelectedCanonical(null);
    wordRequest.current++;
    setWordInfo(null);
    setSelectedWord(null);
    if (resetPage.current === pageIdentity) return;
    resetPage.current = pageIdentity;
    verticalOffset.current = 0;
    verticalRail.current?.update(0);
    verticalScroll.current?.scrollTo({ y: 0, animated: false });
  }, [edition, page, pageIdentity]);
  const refs = selected
    ? hafsReferences(edition, selected.segment.surah, selected.segment.ayah)
    : [];
  const selectedAyahs = selected
    ? refs.map((number) => ({
        ...getAyahs(selected.segment.surah)[number - 1]!,
        surah: selected.segment.surah,
      }))
    : selectedCanonical
      ? [selectedCanonical]
      : [];
  function setFullscreen(next: boolean | ((current: boolean) => boolean)) {
    const value = typeof next === 'function' ? next(fullscreen) : next;
    if (value !== fullscreen && selectablePage && edition === 'hafs') {
      const point = readingPoint.current;
      const target = findMushafAyah(
        edition,
        point.surah,
        point.ayah,
        value ? 'original' : 'selectable',
      );
      if (target) setPage(target.page);
    }
    setFullscreenState(value);
  }
  const openText = (surah = readingPoint.current.surah, ayah = readingPoint.current.ayah) =>
    navigation.replace(
      'Reader',
      bookToText(
        {
          ...route.params,
          selectablePage,
          fullscreen,
          bookView: {
            zoom,
            horizontalOffset: horizontalOffset.current,
            verticalAnchor: scrollAnchor.current,
          },
        },
        { surah, ayah },
        edition,
        edition === 'hafs' && selectablePage && fullscreen
          ? (findMushafAyah(edition, surah, ayah, 'selectable')?.page ?? page)
          : (selected?.page ?? page),
      ),
    );
  async function playSelectedSurah(surah: number) {
    try {
      const tracks = await audioService.listSurah(surah);
      const track =
        tracks.find((item) => item.reciterId === state.preferences.reciterId) ?? tracks[0];
      if (!track) throw new Error('No recitation');
      audio.play(track);
    } catch {
      setError('audio.error.unavailable');
    }
  }
  function openRepeat(
    surah: number,
    ayah: number,
    endAyah?: number,
    mode: 'page' | 'ayahs' = 'ayahs',
  ) {
    setRepeatTarget({ surah, ayah, endAyah, mode });
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    repeatTimer.current = setTimeout(() => setRepeatOpen(true), 250);
  }
  function openWord(ref: CanonicalMushafWord, text: string) {
    if (edition === 'warsh_maknoon') {
      setError('ui.selectableMushaf.warshWordUnavailable');
      return;
    }
    const request = ++wordRequest.current;
    setSelectedWord(ref);
    setWordInfo({ ref, text, status: 'loading' });
    void getStudyAyah(ref.surah, ref.ayah)
      .then((result) => {
        if (request !== wordRequest.current) return;
        const word = result?.words.find((item) => item.position === ref.word);
        setWordInfo({ ref, text, word, status: word ? 'ready' : 'error' });
      })
      .catch(() => {
        if (request === wordRequest.current) setWordInfo({ ref, text, status: 'error' });
      });
  }
  const goToPage = (target: number) => {
    setPage(Math.max(1, Math.min(maximum, target)));
    setSelected(null);
    setSelectedCanonical(null);
    wordRequest.current++;
    setWordInfo(null);
    setSelectedWord(null);
  };
  const turn = (direction: number) => goToPage(page + direction * (spread ? 2 : 1));
  const imagePoint = (event: GestureResponderEvent) => ({
    x: event.nativeEvent.pageX,
    y: event.nativeEvent.pageY,
    time: Date.now(),
    timestamp: event.nativeEvent.timestamp,
    touches: event.nativeEvent.touches.length,
  });
  const translationLanguage =
    state.preferences.translation === 'off'
      ? locale === 'nl'
        ? 'nl'
        : 'en'
      : state.preferences.translation;
  const translationLabel = t(
    availableTranslations.find((item) => item.id === translationLanguage)!.labelKey,
  );
  const selectionSupported =
    selectablePage ||
    edition === 'warsh_maknoon' ||
    ((edition === 'hafs' || edition === 'hafs_maknoon') && Boolean(range)) ||
    Boolean(pageSegments(edition, page, presentation).length);
  const selectionHint = selectablePage
    ? edition === 'warsh_maknoon'
      ? 'ui.mushaf.warshSelectionHint'
      : 'ui.mushaf.selectionHint'
    : selectionSupported
      ? readerCopy(locale).selectOriginalHint
      : 'ui.mushaf.selectionUnavailable';
  const choosePresentation = (
    bookPresentation: 'selectable' | 'original',
    enableSelection = false,
  ) => {
    dispatch({ type: 'preferences', patch: { bookPresentation } });
    navigation.replace('Mushaf', {
      ...resolveBookEntry(
        state,
        {
          ...route.params,
          ...currentPoint,
          edition,
          page,
          bookPresentation: edition === 'warsh_maknoon' ? bookPresentation : presentation,
          selectionOrigin: undefined,
          bookView: undefined,
        },
        bookPresentation,
      ),
      selectionMode: enableSelection,
      fullscreen,
    });
  };
  const chooseSelectionMode = (select: boolean) => {
    imageGesture.current.cancel();
    wordRequest.current++;
    setWordInfo(null);
    setSelectedWord(null);
    setSelected(null);
    setSelectedCanonical(null);
    setError('');
    if (!select && route.params.selectionOrigin) {
      const stack = navigation.getState();
      const distance = bookSelectionReturnDistance(route.params, stack.routes, stack.index);
      const restored = restoreBookSelection({
        ...route.params,
        edition,
        page,
        bookPresentation: presentation,
      });
      if (distance) {
        if (restored.page !== route.params.selectionOrigin.page)
          navigation.dispatch({
            type: 'SET_PARAMS',
            source: route.params.selectionOrigin.routeKey,
            payload: { params: restored },
          });
        navigation.pop(distance);
      } else navigation.replace('Mushaf', restored);
    } else if (!select) setSelectionMode(false);
    else if (selectionSupported) setSelectionMode(true);
    else setError(selectionHint);
  };
  const selectionControl = (
    <View
      accessibilityRole="tablist"
      testID="mushaf-interaction-mode"
      style={{
        flexDirection: 'row',
        borderRadius: 12,
        padding: 3,
        backgroundColor: p.surface,
        alignSelf: 'flex-start',
      }}
    >
      {[false, true].map((select) => (
        <Pressable
          key={String(select)}
          accessibilityRole="tab"
          accessibilityLabel={t(select ? 'ui.mushaf.selectionMode' : 'ui.mushaf.browseMode')}
          accessibilityHint={select ? t(selectionHint) : undefined}
          accessibilityState={{ selected: selectionMode === select }}
          onPress={() => chooseSelectionMode(select)}
          style={{
            minHeight: 48,
            paddingHorizontal: 14,
            justifyContent: 'center',
            borderRadius: 9,
            backgroundColor: selectionMode === select ? p.primary : 'transparent',
          }}
        >
          <T
            translate={false}
            bold
            size={13}
            color={selectionMode === select ? p.onPrimary : p.ink}
          >
            {t(select ? 'ui.mushaf.selectionMode' : 'ui.mushaf.browseMode')}
          </T>
        </Pressable>
      ))}
    </View>
  );
  const pageTitle = pages
    .slice()
    .sort((a, b) => a - b)
    .map((value) => format('repeat.page', value))
    .join(' / ');
  const pageControl = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${chapter.name} · ${pageTitle}`}
      onPress={() => {
        setJump(String(page));
        setPanel('jump');
      }}
      style={{
        flex: 1,
        minWidth: shortLandscape ? 100 : undefined,
        minHeight: 48,
        justifyContent: 'center',
        paddingHorizontal: 8,
      }}
    >
      <T translate={false} bold size={16} numberOfLines={1}>
        {locale === 'ar' ? chapter.nameAr : chapter.name}
      </T>
      <T translate={false} muted size={12}>
        {pageTitle}
      </T>
    </Pressable>
  );
  const translationControl = (
    <Button
      title={translationLabel}
      icon="globe"
      variant="quiet"
      style={{ paddingHorizontal: 10, minHeight: 48 }}
      onPress={() => {
        if (state.preferences.translation === 'off')
          dispatch({ type: 'preferences', patch: { translation: translationLanguage } });
        setPanel('translation');
      }}
    />
  );
  const bookmarkControl = (
    <IconButton
      name="bookmark"
      label={t('app.bookmarks')}
      selected={state.mushafBookmarks.some((item) =>
        matchesMushafBookmarkPage(item, edition, page, presentation),
      )}
      onPress={() => {
        const existing = state.mushafBookmarks.find((item) =>
          matchesMushafBookmarkPage(item, edition, page, presentation),
        );
        dispatch({
          type: 'mushaf/bookmark',
          edition,
          surah: existing?.surah ?? chapter.id,
          page,
          ...(edition === 'hafs' ? { bookPresentation: presentation } : {}),
        });
      }}
    />
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: p.background,
        paddingBottom: fullscreen ? 0 : insets.bottom,
      }}
    >
      <StatusBar
        hidden={focused && (fullscreen || shortLandscape)}
        style={dark ? 'light' : 'dark'}
      />
      {!fullscreen && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={shortLandscape}
          scrollEnabled={shortLandscape}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            minWidth: Math.max(1, window.width - insets.left - insets.right),
          }}
        >
          <View style={[s.row, { flex: 1, paddingHorizontal: 8, gap: 0 }]}>
            <IconButton
              name="arrow-left"
              mirrorInRtl
              label={t('common.back')}
              onPress={() => navigation.goBack()}
            />
            <View style={{ flexGrow: shortLandscape ? 0 : 1, flexShrink: 0 }}>
              <ReadingModeSwitch compact mode="book" onBook={() => {}} onText={() => openText()} />
            </View>
            {shortLandscape && selectionControl}
            {shortLandscape && (
              <ReaderListenButton
                surah={chapter.id}
                onListen={() => void playSelectedSurah(chapter.id)}
              />
            )}
            {shortLandscape && pageControl}
            {shortLandscape && translationControl}
            {shortLandscape && bookmarkControl}
            <IconButton
              name="maximize"
              label={t('ui.mushaf.enterFullscreen')}
              onPress={() => setFullscreen(true)}
            />
            <IconButton name="sliders" label={t('reader.menu')} onPress={() => setPanel('menu')} />
          </View>
        </ScrollView>
      )}
      {!fullscreen && !shortLandscape && (
        <View style={[s.row, { paddingHorizontal: 12, paddingBottom: 4, gap: 0 }]}>
          {pageControl}
          {translationControl}
          {bookmarkControl}
        </View>
      )}
      {!fullscreen && !shortLandscape && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 6, gap: 3 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {selectionControl}
            <ReaderListenButton
              surah={chapter.id}
              onListen={() => void playSelectedSurah(chapter.id)}
            />
          </View>
          {(selectionMode || !selectablePage) && (
            <T muted size={12} style={{ paddingHorizontal: 4 }}>
              {t(selectionHint)}
            </T>
          )}
        </View>
      )}
      {error ? (
        <Notice
          error
          message={error}
          onRetry={() => {
            setError('');
            if (error === 'audio.error.unavailable') void playSelectedSurah(chapter.id);
            else setRetry((value) => value + 1);
          }}
        />
      ) : null}
      <View
        style={{ flex: 1, backgroundColor: fullscreen ? '#E8E0CC' : p.subtle }}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setViewport((previous) =>
            previous.width === width && previous.height === height ? previous : { width, height },
          );
        }}
      >
        {fullscreen ? (
          <ContinuousMushafPages
            edition={edition}
            initialPage={page}
            maximum={maximum}
            width={viewport.width}
            retry={retry}
            zoom={zoom}
            onZoom={setZoom}
            initialHighlight={targetHighlight}
            onPageChange={(current) => {
              if (!selected) {
                // The hardware Back event can follow visibility before React renders again.
                readingPoint.current = pointOnPage(
                  readingPoint.current,
                  mushafPageRange(edition, current, 'original'),
                );
                setPage(current);
              }
            }}
            onExit={() => setFullscreen(false)}
            exitLabel={t('ui.mushaf.exitFullscreen')}
            onError={setError}
            selected={selected}
            onSelect={(segment, selectedPage) => {
              setSelected(segment ? { segment, page: selectedPage } : null);
              if (segment) {
                setPage(selectedPage);
                readingPoint.current = {
                  surah: segment.surah,
                  ayah: hafsReferences(edition, segment.surah, segment.ayah)[0]!,
                };
                dispatch({ type: 'cursor', ...readingPoint.current });
              }
            }}
          />
        ) : (
          <View
            ref={panViewport}
            testID="mushaf-pan-viewport"
            style={{ flex: 1, direction: 'ltr' }}
            onLayout={() =>
              panViewport.current?.measureInWindow((left, top) => {
                viewportOrigin.current = { left, top };
              })
            }
            {...bookGesture.current.handlers}
          >
            <ScrollView
              ref={verticalScroll}
              scrollEnabled={!freePan}
              style={reserveRail ? { marginRight: 48, direction: 'ltr' } : undefined}
              onTouchMove={
                selectablePage ? undefined : (event) => imageGesture.current.move(imagePoint(event))
              }
              onTouchEnd={
                selectablePage
                  ? undefined
                  : (event) => {
                      const direction = imageGesture.current.end(
                        imagePoint(event),
                        imageEdges.current,
                      );
                      if (direction && !selectionMode && zoom === 1 && panel === null && !selected)
                        turn(direction);
                    }
              }
              onTouchCancel={selectablePage ? undefined : () => imageGesture.current.cancel()}
              scrollEventThrottle={16}
              onContentSizeChange={(_width, height) => {
                if (contentKeyRef.current !== contentKey) return;
                bookExtent.current.height = height;
                bookGesture.current.layout();
                if (contentKeyRef.current === contentKey)
                  setContentMeasure({ key: contentKey, height });
                setVerticalEdges({
                  top: verticalOffset.current <= 1,
                  bottom: verticalOffset.current + viewport.height >= height - 1,
                });
              }}
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                bookExtent.current.height = contentSize.height;
                verticalOffset.current = contentOffset.y;
                if (!pendingScrollRestore.current && measuredBookHeight > 0)
                  scrollAnchor.current = bookScrollAnchor(
                    contentOffset.y,
                    measuredBookHeight,
                    topGutter,
                  );
                // Update the rail without rerendering all SVG/text content on each frame.
                verticalRail.current?.update(contentOffset.y);
                if (contentKeyRef.current === contentKey)
                  setContentMeasure((current) =>
                    current?.key === contentKey && current.height === contentSize.height
                      ? current
                      : { key: contentKey, height: contentSize.height },
                  );
                const next = {
                  top: contentOffset.y <= 1,
                  bottom: contentOffset.y + layoutMeasurement.height >= contentSize.height - 1,
                };
                setVerticalEdges((current) =>
                  current.top === next.top && current.bottom === next.bottom ? current : next,
                );
              }}
              contentContainerStyle={{
                minHeight: viewport.height,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: topGutter,
                paddingBottom: bottomGutter,
              }}
            >
              <ScrollView
                ref={horizontalScroll}
                horizontal
                scrollEnabled={zoom > 1 && !freePan}
                contentOffset={initialHorizontalOffset.current}
                scrollEventThrottle={16}
                onContentSizeChange={(width) => {
                  if (frameKeyRef.current !== frameKey) return;
                  bookExtent.current.width = width;
                  // Android may retain an out-of-bounds offset while this scroll
                  // view is disabled for two-axis panning. Clamp after the new
                  // content arrives, including when zoom returns to page width.
                  const x = Math.max(0, Math.min(horizontalOffset.current, width - bookWidth));
                  if (x !== horizontalOffset.current) {
                    horizontalOffset.current = x;
                    horizontalScroll.current?.scrollTo({ x, animated: false });
                  }
                  bookGesture.current.layout();
                }}
                onScroll={(event) => {
                  horizontalOffset.current = event.nativeEvent.contentOffset.x;
                }}
                contentContainerStyle={{
                  minWidth: bookWidth,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  ref={bookFrame}
                  collapsable={false}
                  testID="mushaf-book-content"
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    if (frameKeyRef.current !== frameKey || !Number.isFinite(height) || height <= 0)
                      return;
                    bookSize.current = { width, height };
                    bookGesture.current.layout();
                    setBookMeasure((current) =>
                      current?.key === frameKey && current.height === height
                        ? current
                        : { key: frameKey, height },
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#E8E0CC',
                    padding: 5,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: '#C4BCA5',
                    shadowColor: '#10251C',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.12,
                    shadowRadius: 5,
                    elevation: 3,
                  }}
                >
                  {pages.map((value, index) => (
                    <React.Fragment key={String(value)}>
                      {index > 0 && (
                        <View
                          style={{
                            width: 10,
                            alignSelf: 'stretch',
                            backgroundColor: '#DBD2BE',
                            borderLeftWidth: 1,
                            borderRightWidth: 1,
                            borderColor: '#BFB49C',
                          }}
                        />
                      )}
                      <View
                        collapsable={false}
                        ref={(node) => {
                          imagePageRefs.current[value] = node;
                        }}
                        onTouchStart={
                          selectablePage
                            ? undefined
                            : (event) => {
                                const setBounds = imageGesture.current.start(imagePoint(event));
                                imageEdges.current = verticalEdges;
                                imagePageRefs.current[value]?.measure(
                                  (_x, _y, width, _height, pageX) =>
                                    setBounds({ left: pageX, width }),
                                );
                              }
                        }
                      >
                        {selectablePage ? (
                          <SelectableMushafPage
                            page={value}
                            edition={edition === 'warsh_maknoon' ? 'warsh_maknoon' : 'hafs'}
                            maxWidth={((bookWidth - 30) / pages.length) * zoom}
                            maxHeight={100000}
                            labels={{
                              loading: t('ui.selectableMushaf.loading'),
                              preparing: t('ui.selectableMushaf.preparing'),
                              error: t('ui.selectableMushaf.error'),
                              retry: t('notifications.retry'),
                              credit: t(
                                edition === 'warsh_maknoon'
                                  ? 'ui.selectableMushaf.warshCredit'
                                  : 'ui.selectableMushaf.credit',
                              ),
                              page: format('repeat.page', value),
                            }}
                            onWordPress={openWord}
                            selectedWord={selectedWord}
                            onPageTurn={turn}
                            selectionEnabled={selectionMode}
                            pageTurnEnabled={
                              !selectionMode && zoom === 1 && panel === null && wordInfo === null
                            }
                            verticalEdges={verticalEdges}
                            onUnavailableWord={() => {
                              wordRequest.current++;
                              setWordInfo(null);
                              setSelectedWord(null);
                              setError(
                                edition === 'warsh_maknoon'
                                  ? 'ui.selectableMushaf.warshWordUnavailable'
                                  : 'ui.selectableMushaf.unavailable',
                              );
                            }}
                          />
                        ) : (
                          <PrintedMushafPage
                            edition={edition}
                            page={value}
                            maxWidth={(bookWidth - 30) / pages.length}
                            maxHeight={
                              shortLandscape ? 100000 : Math.max(160, viewport.height - 20)
                            }
                            zoom={zoom}
                            retry={retry}
                            selected={
                              selected?.page === value
                                ? selected.segment
                                : value === page
                                  ? targetHighlight
                                  : null
                            }
                            onSelect={(segment, selectedPage) => {
                              const pressedAt = Date.now();
                              // A full-page Pressable releases before the ancestor's
                              // raw touch-end. Let that event classify the swipe
                              // before wordTap consumes the completed touch record.
                              queueMicrotask(() => {
                                if (selectionMode && imageGesture.current.wordTap(0, pressedAt)) {
                                  setSelected(segment ? { segment, page: selectedPage } : null);
                                  if (segment)
                                    dispatch({
                                      type: 'cursor',
                                      surah: segment.surah,
                                      ayah: hafsReferences(
                                        edition,
                                        segment.surah,
                                        segment.ayah,
                                      )[0]!,
                                    });
                                }
                              });
                            }}
                            onError={setError}
                          />
                        )}
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        )}
        {!fullscreen && showRail && (
          <View
            testID="mushaf-vertical-overlay"
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              right: 0,
              width: 48,
              backgroundColor: 'transparent',
              top: fullscreen ? topGutter : 0,
              bottom: fullscreen ? bottomGutter : 0,
            }}
          >
            <MushafVerticalRail
              offset={verticalOffset.current}
              positionRef={verticalRail}
              maximum={realPageOverflow ? Math.max(0, contentHeight - viewport.height) : 0}
              onScroll={(y) => verticalScroll.current?.scrollTo({ y, animated: false })}
            />
          </View>
        )}
      </View>
      {fullscreen && (
        <FloatingReaderAudio
          surah={chapter.id}
          onListen={() => void playSelectedSurah(chapter.id)}
        />
      )}
      {!fullscreen && (
        <MushafFooter
          compact={shortLandscape}
          page={page}
          maximum={maximum}
          onPageChange={goToPage}
          onNext={() => goToPage(page + 1)}
          onPrevious={() => goToPage(page - 1)}
          canNext={page < maximum}
          canPrevious={page > 1}
          zoom={zoom}
          onZoomIn={() => setZoom((value) => Math.min(3, value + 0.25))}
          onZoomOut={() => setZoom((value) => Math.max(1, value - 0.25))}
          edition={edition}
          pages={pages}
          context={{ ...route.params, bookPresentation: presentation }}
          readingSessionId={readingSessionId}
          getTickMetrics={getTickMetrics}
          onJump={() => {
            setJump(String(page));
            setPanel('jump');
          }}
        />
      )}
      <BookTranslationSheet
        visible={panel === 'translation'}
        edition={edition}
        bookPresentation={presentation}
        pages={pages}
        onClose={() => setPanel(null)}
        onReadText={(surah, ayah) => {
          setPanel(null);
          openText(surah, ayah);
        }}
      />
      <Sheet visible={panel === 'menu'} title={t('reader.menu')} onClose={() => setPanel(null)}>
        <T muted size={13} style={{ marginBottom: 12 }}>
          {readerCopy(locale).railHint}
        </T>
        {shortLandscape && (
          <T muted size={13} style={{ marginBottom: 12 }}>
            {t(selectionHint)}
          </T>
        )}
        <Button
          title={t(fullscreen ? 'ui.mushaf.exitFullscreen' : 'ui.mushaf.enterFullscreen')}
          icon={fullscreen ? 'minimize' : 'maximize'}
          variant="secondary"
          onPress={() => {
            setPanel(null);
            setFullscreen((value) => !value);
          }}
        />
        {(edition === 'hafs' || edition === 'warsh_maknoon') && (
          <Segments
            value={selectablePage ? 'selectable' : 'original'}
            options={[
              {
                value: 'selectable',
                label: t(
                  edition === 'warsh_maknoon'
                    ? 'ui.bookPresentation.warshSelectable'
                    : 'ui.bookPresentation.selectable',
                ),
              },
              { value: 'original', label: t('ui.bookPresentation.original') },
            ]}
            onChange={choosePresentation}
          />
        )}
        <TranslationControl />
        <Button
          title={t(audio.isPlaying ? 'app.quranAudioPause' : 'app.quranAudioPlay')}
          icon={audio.isPlaying ? 'pause' : 'play'}
          variant="secondary"
          onPress={() => {
            if (audio.isPlaying) audio.pause();
            else void playSelectedSurah(chapter.id);
            setPanel(null);
          }}
        />
        <Button
          title={t('repeat.title')}
          icon="repeat"
          variant="quiet"
          onPress={() => {
            setPanel(null);
            openRepeat(
              range?.start.surah ?? route.params.surah,
              range?.start.ayah ?? route.params.ayah ?? 1,
              undefined,
              'page',
            );
          }}
        />
        {(route.params.planId || route.params.readingTarget) && (
          <MushafReadingActions
            edition={edition}
            pages={pages}
            context={{ ...route.params, bookPresentation: presentation }}
            sessionId={readingSessionId}
          />
        )}
        <Segments
          value={edition}
          options={[
            { value: 'hafs', label: 'Hafs - Medina' },
            ...(preferred === 'hafs_maknoon'
              ? [{ value: 'hafs_maknoon' as const, label: 'Hafs - Maknoon' }]
              : []),
            { value: 'warsh_maknoon', label: 'Warsh - Maknoon' },
            { value: 'muhammadi', label: 'Warsh - Muhammadi' },
          ]}
          onChange={(value) => {
            dispatch({
              type: 'preferences',
              patch: { mushaf: value === 'hafs' ? 'hafs_ayahinfo_1260' : value },
            });
            navigation.replace('Mushaf', {
              ...resolveBookEntry(
                state,
                {
                  ...route.params,
                  ...(range?.start ?? state.cursor),
                  edition: value,
                  originalEdition: value,
                  page: undefined,
                },
                state.preferences.bookPresentation,
              ),
              fullscreen,
              selectionMode,
            });
          }}
        />
        <Button
          title={t('app.mushaf')}
          icon="download"
          variant="secondary"
          onPress={() => {
            setPanel(null);
            navigation.navigate('MushafLibrary');
          }}
        />
        <Button
          title={t('reader.readText')}
          variant="quiet"
          onPress={() => {
            setPanel(null);
            openText();
          }}
        />
      </Sheet>
      <Sheet
        visible={wordInfo !== null}
        title={t('ui.selectableMushaf.wordInfo')}
        onClose={() => {
          wordRequest.current++;
          setWordInfo(null);
        }}
      >
        {wordInfo && (
          <T
            arabic
            translate={false}
            selectable
            size={30}
            style={{
              fontFamily: 'QpcHafsOriginal',
              lineHeight: 60,
              textAlign: 'right',
              writingDirection: 'rtl',
              backgroundColor: p.blueWash,
              borderRadius: 8,
              paddingHorizontal: 12,
            }}
          >
            {wordInfo.text}
          </T>
        )}
        {wordInfo?.status === 'loading' ? (
          <Notice message="ui.study.loadingWords" />
        ) : wordInfo?.status === 'error' || !wordInfo?.word ? (
          <Notice error message="ui.selectableMushaf.unavailable" />
        ) : (
          <>
            <T
              translate={false}
              muted
            >{`${wordInfo.ref.surah}:${wordInfo.ref.ayah}:${wordInfo.ref.word}`}</T>
            <T bold style={{ marginTop: 20 }}>
              {`${t('ui.bookTranslation.verse')} · ${translationLabel}`}
            </T>
            <T
              translate={false}
              selectable
              style={{ lineHeight: 28, textAlign: 'left', writingDirection: 'ltr' }}
            >
              {getAyahTranslation(
                getAyahs(wordInfo.ref.surah)[wordInfo.ref.ayah - 1]!,
                translationLanguage,
              )}
            </T>
            <Button
              title={t('navigation.translation')}
              icon="globe"
              variant="quiet"
              onPress={() => {
                wordRequest.current++;
                setWordInfo(null);
                setPanel('translation');
              }}
            />
            <Button
              title={`${readerCopy(locale).verseActions} ${wordInfo.ref.surah}:${wordInfo.ref.ayah}`}
              icon="more-horizontal"
              variant="secondary"
              onPress={() => {
                const ref = wordInfo.ref;
                wordRequest.current++;
                setWordInfo(null);
                setSelectedCanonical({ ...getAyahs(ref.surah)[ref.ayah - 1]!, surah: ref.surah });
              }}
            />
            <Button
              title={readerCopy(locale).wordDetails}
              icon="search"
              variant="quiet"
              onPress={() => {
                const { ref, text } = wordInfo;
                wordRequest.current++;
                setWordInfo(null);
                navigation.navigate('Lexicon', {
                  kind: 'word',
                  reference: ref,
                  candidateText: text,
                });
              }}
            />
            <T bold style={{ marginTop: 16 }}>
              {t('ui.selectableMushaf.gloss')}
            </T>
            <T translate={false} selectable>
              {wordInfo.word.translation}
            </T>
            <T translate={false} muted selectable style={{ marginTop: 8 }}>
              {wordInfo.word.transliteration}
            </T>
          </>
        )}
      </Sheet>
      <AyahActionsSheet
        ayah={selectedAyahs[0] ?? null}
        relatedAyahs={selectedAyahs}
        onClose={() => {
          setSelected(null);
          setSelectedCanonical(null);
        }}
        onReadText={(surah, ayah) => openText(surah, ayah)}
        onPlay={(surah) => {
          void playSelectedSurah(surah);
        }}
        onRepeat={openRepeat}
        sourceReference={
          selected && (edition === 'warsh_maknoon' || edition === 'muhammadi')
            ? { surah: selected.segment.surah, ayah: selected.segment.ayah, edition: 'warsh' }
            : undefined
        }
        onError={setError}
      />
      {repeatTarget && (
        <RepeatSheet
          key={`${edition}:${presentation}:${repeatTarget.mode}:${repeatTarget.surah}:${repeatTarget.ayah}`}
          visible={repeatOpen}
          onClose={() => setRepeatOpen(false)}
          surah={repeatTarget.surah}
          initialAyah={repeatTarget.ayah}
          initialEndAyah={repeatTarget.endAyah}
          initialMode={repeatTarget.mode}
          pageEdition={edition}
          pagePresentation={presentation}
          currentPage={page}
          warsh={edition === 'warsh_maknoon' || edition === 'muhammadi'}
        />
      )}
      <Sheet
        visible={panel === 'jump'}
        title={t('common.open')}
        onClose={() => setPanel(null)}
        avoidKeyboard
      >
        <Field
          label={format('repeat.pagesRange', 1, maximum)}
          value={jump}
          onChangeText={setJump}
          keyboardType="number-pad"
        />
        <Button
          title={t('common.open')}
          disabled={!/^\d+$/.test(jump) || Number(jump) < 1 || Number(jump) > maximum}
          onPress={() => {
            goToPage(Number(jump));
            setPanel(null);
          }}
        />
      </Sheet>
    </View>
  );
}
