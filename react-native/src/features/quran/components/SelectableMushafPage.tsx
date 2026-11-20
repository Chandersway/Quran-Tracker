import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PixelRatio,
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import qpcHafsFont from '../../../../assets/fonts/UthmanicHafs_V22.ttf';
import qpcWarshFont from '../../../../assets/fonts/UthmanicWarsh-v-3.0.ttf';
import { chapterById } from '../../../content/quran';
import {
  SELECTABLE_MUSHAF,
  type CanonicalMushafWord,
  type SelectableMushafPageData,
  type SelectableMushafToken,
} from '../../../domain/selectableMushaf';
import { loadSelectableMushafPage } from '../../../services/mushaf/selectableMushaf';
import {
  fitSelectablePageText,
  selectablePageLayoutKey,
  selectablePageText,
} from '../../../domain/selectableMushafText';
import { createMushafTextGesture, sameMushafWord } from '../gestures/mushafTextGestures';
import { observeMushafText } from '../gestures/mushafTextGestureBridge';
import { createReleasedMushafTurn } from '../gestures/mushafPageTurn';

/** A separate Unicode book surface. It never overlays invented word rectangles on scans. */
export function SelectableMushafPage({
  page,
  edition = 'hafs',
  maxWidth,
  maxHeight,
  labels,
  onWordPress,
  onUnavailableWord,
  onPageLoaded,
  onPageLayout,
  selectedWord,
  onPageTurn,
  pageTurnEnabled = true,
  selectionEnabled = false,
  verticalEdges = { top: false, bottom: false },
}: {
  page: number;
  edition?: 'hafs' | 'warsh_maknoon';
  maxWidth: number;
  maxHeight: number;
  labels: {
    loading: string;
    preparing?: string;
    error: string;
    retry: string;
    credit: string;
    page: string;
  };
  onWordPress: (word: CanonicalMushafWord, text: string) => void;
  onUnavailableWord: (word: SelectableMushafToken) => void;
  onPageLoaded?: (page: SelectableMushafPageData) => void;
  selectedWord?: CanonicalMushafWord | null;
  onPageTurn?: (direction: 1 | -1) => void;
  pageTurnEnabled?: boolean;
  selectionEnabled?: boolean;
  verticalEdges?: { top: boolean; bottom: boolean };
  onPageLayout?: (layout: {
    page: number;
    status: 'verified' | 'expanded';
    lineCount: number;
    scale: number;
  }) => void;
}) {
  const fontFamily = edition === 'warsh_maknoon' ? 'QpcWarshOriginal' : 'QpcHafsOriginal';
  // Expo's useFonts does not reload when its map changes, so keep each
  // edition's readiness independent when this component is reused in place.
  const [hafsFontLoaded, hafsFontError] = useFonts({ QpcHafsOriginal: qpcHafsFont });
  const [warshFontLoaded, warshFontError] = useFonts({ QpcWarshOriginal: qpcWarshFont });
  const [markerFontLoaded, markerFontError] = useFonts({ Amiri_400Regular });
  const fontsLoaded =
    edition === 'warsh_maknoon' ? warshFontLoaded && markerFontLoaded : hafsFontLoaded;
  const fontError =
    edition === 'warsh_maknoon' ? (warshFontError ?? markerFontError) : hafsFontError;
  const [data, setData] = useState<SelectableMushafPageData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [fit, setFit] = useState<{
    signature: string;
    scale: number;
    status: 'measuring' | 'verified' | 'expanded';
  }>({ signature: '', scale: 1, status: 'measuring' });
  const [textMounted, setTextMounted] = useState<boolean | null>(null);
  const lastLayoutReport = useRef('');
  const gesture = useRef(createMushafTextGesture());
  const nativeText = useRef<React.ComponentRef<typeof Text> | null>(null);
  const nativePage = useRef<React.ComponentRef<typeof View> | null>(null);
  const turnCallback = useRef(onPageTurn);
  const releasedTurn = useRef(
    createReleasedMushafTurn((direction) => turnCallback.current?.(direction)),
  );
  const initialEdges = useRef(verticalEdges);
  const swipeEnabled = pageTurnEnabled && !selectionEnabled;
  turnCallback.current = swipeEnabled ? onPageTurn : undefined;
  useEffect(() => {
    gesture.current.cancel();
  }, [selectionEnabled, pageTurnEnabled]);
  useEffect(() => {
    const coordinator = createReleasedMushafTurn((direction) => turnCallback.current?.(direction));
    releasedTurn.current = coordinator;
    return () => coordinator.dispose();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(false);
    setTextMounted(null);
    gesture.current = createMushafTextGesture();
    void loadSelectableMushafPage(page, controller.signal, edition)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [page, attempt, edition]);
  const matchingData =
    data?.page === page &&
    data.edition === (edition === 'warsh_maknoon' ? 'warsh_unicode' : 'qpc_hafs_unicode')
      ? data
      : null;
  useEffect(() => {
    if (matchingData) onPageLoaded?.(matchingData);
  }, [matchingData, onPageLoaded]);

  const width = Math.max(1, Math.min(maxWidth, maxHeight / 1.47));
  const height = width * 1.47;
  const lineHeight = (height - width * 0.17) / SELECTABLE_MUSHAF.linesPerPage;
  const fontSize = lineHeight * 0.73;
  const pageText = useMemo(
    () =>
      matchingData ? selectablePageText(matchingData, (surah) => chapterById(surah).nameAr) : null,
    [matchingData],
  );
  const textReady = Boolean(pageText) && fontsLoaded;
  const layoutSignature = `${edition}:${selectablePageLayoutKey(page, width, height, attempt, PixelRatio.get())}:font=${PixelRatio.getFontScale?.() ?? 1}`;
  const fontScale = fit.signature === layoutSignature ? fit.scale : 1;
  // Browser Text has no onTextLayout callback. Preserve its whole buffer in an
  // expanded layout; only native measurement can claim the printed-line fit.
  const browserExpanded = (Platform.OS === 'web' || edition === 'warsh_maknoon') && textReady;
  const pageReady =
    browserExpanded ||
    (textReady && fit.signature === layoutSignature && fit.status !== 'measuring');
  const availableTextWidth = Math.max(1, width * 0.88 - 2);
  useEffect(() => {
    if (!pageReady || textMounted !== selectionEnabled || !swipeEnabled) return;
    return observeMushafText(
      nativeText.current,
      (direction) => {
        gesture.current.cancel();
        releasedTurn.current.request(direction);
      },
      (active) => {
        gesture.current.selection(active);
      },
      nativePage.current,
    );
  }, [pageReady, textMounted, page, edition, attempt, swipeEnabled, selectionEnabled]);
  function point(event: GestureResponderEvent) {
    const touch = event.nativeEvent;
    return {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
      timestamp: touch.timestamp,
      touches: touch.touches.length,
    };
  }
  const failed = error || Boolean(fontError);
  return (
    <View
      ref={nativePage}
      collapsable={false}
      testID="selectable-mushaf-page"
      onLayout={() => gesture.current.cancel()}
      onTouchStart={(event) => {
        if (!pageReady || selectionEnabled) return;
        if (Platform.OS === 'web') {
          const selection = globalThis.getSelection?.();
          gesture.current.selection(Boolean(selection && !selection.isCollapsed));
        }
        const setBounds = gesture.current.start(point(event));
        // Measure this page at DOWN. Text spans report locationX in their own
        // coordinates; screen width is also wrong for offset/landscape pages.
        nativePage.current?.measure((_x, _y, measuredWidth, _height, pageX) =>
          setBounds({ left: pageX, width: measuredWidth }),
        );
        releasedTurn.current.begin();
        initialEdges.current = verticalEdges;
      }}
      onTouchMove={(event) => {
        if (pageReady && !selectionEnabled) gesture.current.move(point(event));
      }}
      onTouchEnd={(event) => {
        if (!pageReady || selectionEnabled) return;
        const direction = gesture.current.end(point(event), initialEdges.current);
        // Browse has no native text selection. Its raw page events also cover
        // paper margins and a non-selectable TextView that declines native DOWN.
        // Both Android paths share the release gate and can fulfill a turn once.
        if (swipeEnabled && direction) {
          if (Platform.OS === 'android') releasedTurn.current.request(direction);
          else if (Platform.OS === 'web') onPageTurn?.(direction);
        }
        releasedTurn.current.release();
      }}
      onTouchCancel={() => {
        gesture.current.cancel();
        releasedTurn.current.release();
      }}
      style={{ width, minHeight: height, backgroundColor: '#FFFEF5', padding: width * 0.035 }}
    >
      <View
        style={{
          flexGrow: 1,
          borderColor: '#A48B54',
          borderWidth: 1,
          paddingHorizontal: width * 0.025,
          paddingTop: width * 0.018,
        }}
      >
        {failed ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text style={{ color: '#5C352C', textAlign: 'center' }}>{labels.error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAttempt((value) => value + 1)}
              style={{ padding: 12 }}
            >
              <Text style={{ color: '#24564C' }}>{labels.retry}</Text>
            </Pressable>
          </View>
        ) : !pageText || !fontsLoaded ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator color="#24564C" />
            <Text style={{ color: '#28251F', textAlign: 'center' }}>{labels.loading}</Text>
          </View>
        ) : (
          <View
            pointerEvents={pageReady ? 'auto' : 'none'}
            style={
              pageReady
                ? undefined
                : { height: lineHeight * SELECTABLE_MUSHAF.linesPerPage, overflow: 'hidden' }
            }
          >
            <Text
              key={`${edition}:${page}:${selectionEnabled ? 'select' : 'browse'}`}
              testID="selectable-mushaf-text"
              ref={nativeText}
              onLayout={() => {
                setTextMounted(selectionEnabled);
                if (browserExpanded)
                  onPageLayout?.({ page, status: 'expanded', lineCount: 0, scale: 1 });
              }}
              // Keep this host through fitting. A deliberate mode change replaces
              // it so old native selection handles cannot survive into browsing.
              selectable={selectionEnabled}
              accessible={pageReady}
              accessibilityElementsHidden={!pageReady}
              importantForAccessibility={pageReady ? 'auto' : 'no-hide-descendants'}
              textBreakStrategy="simple"
              android_hyphenationFrequency="none"
              onTextLayout={(event) => {
                if (edition === 'warsh_maknoon') return;
                const measured = event.nativeEvent.lines;
                const next = fitSelectablePageText(
                  pageText,
                  measured,
                  availableTextWidth,
                  fontScale,
                );
                if (next.status === 'resize') {
                  setFit((current) =>
                    current.signature === layoutSignature && current.scale === next.scale
                      ? current
                      : { signature: layoutSignature, scale: next.scale, status: 'measuring' },
                  );
                  return;
                }
                const status: 'verified' | 'expanded' = next.status;
                setFit((current) =>
                  current.signature === layoutSignature &&
                  current.scale === fontScale &&
                  current.status === status
                    ? current
                    : { signature: layoutSignature, scale: fontScale, status },
                );
                const report = `${layoutSignature}:${next.status}:${measured.length}:${fontScale}`;
                if (lastLayoutReport.current !== report) {
                  lastLayoutReport.current = report;
                  onPageLayout?.({
                    page,
                    status: next.status,
                    lineCount: measured.length,
                    scale: fontScale,
                  });
                }
              }}
              style={{
                color: '#181712',
                fontFamily,
                fontSize: fontSize * fontScale,
                lineHeight,
                minHeight: lineHeight * SELECTABLE_MUSHAF.linesPerPage,
                includeFontPadding: false,
                writingDirection: 'rtl',
                textAlign: 'center',
                flexShrink: 0,
                opacity: pageReady ? 1 : 0,
              }}
            >
              {pageText.lines.map((line, lineIndex) => (
                <React.Fragment key={line.number}>
                  {lineIndex > 0 ? '\n' : ''}
                  <Text
                    style={
                      line.kind === 'surah_name'
                        ? { fontSize: fontSize * fontScale * 0.9 }
                        : undefined
                    }
                  >
                    {line.parts.map((part, partIndex) => {
                      const word = part.token;
                      if (!word)
                        return (
                          <React.Fragment key={`text-${partIndex}`}>{part.text}</React.Fragment>
                        );
                      return (
                        <Text
                          key={word.id}
                          accessibilityState={{
                            selected:
                              word.alignment.status === 'verified' &&
                              sameMushafWord(selectedWord, word.alignment.reference),
                          }}
                          style={
                            edition === 'warsh_maknoon' && word.kind === 'end'
                              ? { fontFamily: 'Amiri_400Regular' }
                              : word.alignment.status === 'verified' &&
                                  sameMushafWord(selectedWord, word.alignment.reference)
                                ? { backgroundColor: '#E1E8D5' }
                                : undefined
                          }
                          onPressIn={
                            selectionEnabled || word.kind === 'end'
                              ? undefined
                              : () => {
                                  if (!pageReady) return;
                                  gesture.current.wordStart(word.id, Date.now());
                                }
                          }
                          onLongPress={
                            selectionEnabled || word.kind === 'end'
                              ? undefined
                              : () => {
                                  if (!pageReady) return;
                                  gesture.current.longPress();
                                }
                          }
                          onPress={
                            selectionEnabled || word.kind === 'end'
                              ? undefined
                              : () => {
                                  if (!pageReady) return;
                                  // Native selection must survive release, including when the
                                  // platform took over before JS received its long-press signal.
                                  const allowed = gesture.current.wordTap(word.id, Date.now());
                                  if (!allowed) return;
                                  if (word.alignment.status === 'verified')
                                    onWordPress(word.alignment.reference, word.text);
                                  else onUnavailableWord(word);
                                }
                          }
                        >
                          {part.text}
                        </Text>
                      );
                    })}
                  </Text>
                </React.Fragment>
              ))}
            </Text>
            {!pageReady && (
              <View
                testID="selectable-mushaf-fitting"
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <ActivityIndicator color="#24564C" />
                <Text style={{ color: '#28251F', textAlign: 'center' }}>
                  {labels.preparing ?? labels.loading}
                </Text>
              </View>
            )}
          </View>
        )}
        <Text
          accessibilityLabel={labels.page}
          style={{ color: '#514837', textAlign: 'center', fontSize: width * 0.027 }}
        >
          {page}
        </Text>
      </View>
      <Text style={{ color: '#514837', textAlign: 'center', fontSize: width * 0.021 }}>
        {labels.credit}
      </Text>
    </View>
  );
}
