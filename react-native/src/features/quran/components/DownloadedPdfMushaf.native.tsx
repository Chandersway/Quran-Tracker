import { MushafReadingActions } from './MushafReadingActions';
import { MushafFooter } from './MushafFooter';
import type { RootStack } from '../../../app/navigation/types';
import React, { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppChrome } from '../../../app/providers/AppChromeContext';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { File } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { Button, Field, IconButton, Notice, Screen, Sheet, T, s } from '../../../shared/components';
import { FullscreenExitButton } from './FullscreenExitButton';
import { FloatingReaderAudio } from './FloatingReaderAudio';
import { useAppStore } from '../../../state/store';
import { newId } from '../../../state/reducer';
import { mushafFile } from '../../../services/mushaf/storage';
import type { DownloadEdition } from '../../../services/mushaf/library';
import { useI18n } from '../../../i18n';
import { ReadingModeSwitch } from './ReadingModeSwitch';
import { PDF_MIN_ZOOM, PDF_MAX_ZOOM, observedPdfZoom, stepPdfZoom } from '../layout/pdfZoom';
import { ReaderListenButton } from './ReaderListenButton';
import { useAudio } from '../../audio/providers/audioContext';
import { createAudioService } from '../../../services/audio/audio';
import { readerCopy } from '../model/readerCopy';
import { cachedCroppedPdfUri, prepareCroppedPdf } from '../model/croppedPdf';
import { shouldAutomaticallyCropPdf } from '../layout/pdfCrop';
import { nativePdfCropAvailable } from '../../../services/mushaf/pdfCrop';

const audioService = createAudioService(process.env.EXPO_PUBLIC_AUDIO_BASE_URL);

const Pdf = React.lazy(() => import('react-native-pdf'));
export function DownloadedPdfMushaf({
  id,
  surah,
  initialPage,
  context,
  onLibrary,
  onText,
  shortLandscape,
  onBack,
  onSelectable,
}: {
  id: DownloadEdition;
  surah: number;
  initialPage: number;
  context?: RootStack['Mushaf'];
  onLibrary: () => void;
  onText: (page: number, zoom: number) => void;
  shortLandscape: boolean;
  onBack: () => void;
  onSelectable: (page: number, zoom: number) => void;
}) {
  const file = new File(mushafFile(id).uri);
  const [page, setPage] = useState(initialPage);
  const [count, setCount] = useState(0);
  const [zoom, setZoom] = useState(observedPdfZoom(context?.bookView?.zoom ?? 1, 1));
  const [readingSessionId] = useState(newId);
  const [jump, setJump] = useState('');
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(context?.fullscreen ?? true);
  const [error, setError] = useState('');
  const [preparedPdf, setPreparedPdf] = useState<string | null>(() => cachedCroppedPdfUri(file));
  const [preparationError, setPreparationError] = useState(false);
  const [preparationRetry, setPreparationRetry] = useState(0);
  const nativeCrop = nativePdfCropAvailable();
  const [useOriginalPdf, setUseOriginalPdf] = useState(
    !shouldAutomaticallyCropPdf(file.size, nativeCrop) && !preparedPdf,
  );
  const ready = count > 0;
  const { state, dispatch } = useAppStore();
  const audio = useAudio();
  const { t, format, locale } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const setImmersiveReader = useAppChrome();
  const sourceExists = file.exists;
  const sourceVersion = `${file.uri}:${sourceExists ? file.size : 0}:${sourceExists ? file.modificationTime : 0}`;
  useEffect(() => {
    if (!sourceExists || useOriginalPdf) return;
    if (
      !preparationRetry &&
      !shouldAutomaticallyCropPdf(file.size, nativeCrop) &&
      !cachedCroppedPdfUri(file)
    ) {
      setUseOriginalPdf(true);
      return;
    }
    const controller = new AbortController();
    setPreparedPdf(null);
    setCount(0);
    setPreparationError(false);
    void prepareCroppedPdf(file, controller.signal)
      .then((uri) => {
        if (!controller.signal.aborted) setPreparedPdf(uri);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPreparationError(true);
      });
    return () => controller.abort();
    // The source identity, not the per-render File object, owns preparation.
  }, [sourceVersion, sourceExists, preparationRetry, useOriginalPdf, nativeCrop]);
  useLayoutEffect(() => {
    setImmersiveReader((fullscreen || shortLandscape) && focused);
    return () => setImmersiveReader(false);
  }, [fullscreen, shortLandscape, focused, setImmersiveReader]);
  // This component owns PDF fullscreen. The parent still supplies the normal
  // stack header; update after its layout effect when orientation changes.
  useEffect(() => {
    if (focused) navigation.setOptions({ headerShown: !fullscreen && !shortLandscape });
  }, [navigation, fullscreen, shortLandscape, focused]);
  const changeFullscreen = (value: boolean) => {
    setFullscreen(value);
    navigation.setParams({ fullscreen: value });
  };
  useEffect(() => {
    if (!focused || !fullscreen || open || toolsOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setFullscreen(false);
      navigation.setParams({ fullscreen: false });
      return true;
    });
    return () => subscription.remove();
  }, [focused, fullscreen, open, toolsOpen, navigation]);
  useEffect(() => {
    if (!focused) return;
    dispatch({ type: 'mushaf/position', edition: id, page });
  }, [dispatch, id, page, focused]);
  async function listen() {
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
  if (!file.exists)
    return (
      <Screen>
        {(fullscreen || shortLandscape) && (
          <IconButton name="arrow-left" mirrorInRtl label={t('common.back')} onPress={onBack} />
        )}
        <ReadingModeSwitch mode="book" onBook={() => {}} onText={() => onText(page, zoom)} />
        <T muted size={12}>
          {t('ui.mushaf.pdfTextPosition')}
        </T>
        <Button
          title={t('ui.selectableMushaf.fromPdf')}
          variant="secondary"
          onPress={() => onSelectable(page, zoom)}
        />
        <Notice error message="rub.open.download" />
        <Button title="app.mushaf" onPress={onLibrary} />
      </Screen>
    );
  return (
    <Screen scroll={false} style={{ padding: 0, paddingBottom: fullscreen ? 0 : insets.bottom }}>
      <StatusBar hidden={(fullscreen || shortLandscape) && focused} />
      {!fullscreen && (
        <View
          testID="pdf-toolbar"
          style={[s.row, { paddingHorizontal: 4, justifyContent: 'space-between' }]}
        >
          {!fullscreen && shortLandscape && (
            <IconButton name="arrow-left" mirrorInRtl label={t('common.back')} onPress={onBack} />
          )}
          {fullscreen ? (
            <ReaderListenButton compact surah={surah} onListen={() => void listen()} />
          ) : (
            <View style={{ flex: 1 }}>
              <ReadingModeSwitch
                compact
                mode="book"
                onBook={() => {}}
                onText={() => onText(page, zoom)}
              />
            </View>
          )}
          <IconButton
            name={fullscreen ? 'minimize' : 'maximize'}
            label={t(fullscreen ? 'ui.mushaf.exitFullscreen' : 'ui.mushaf.enterFullscreen')}
            onPress={() => changeFullscreen(!fullscreen)}
          />
          <IconButton
            name="more-horizontal"
            label={t('reader.menu')}
            onPress={() => setToolsOpen(true)}
          />
        </View>
      )}
      {!fullscreen && (
        <View testID="pdf-reading-actions" style={{ paddingHorizontal: 8, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Button
              testID="pdf-selectable"
              title={readerCopy(locale).selectHafs}
              icon="type"
              variant="secondary"
              style={{ flex: 1, paddingHorizontal: 8 }}
              onPress={() => onSelectable(page, zoom)}
            />
            <ReaderListenButton compact surah={surah} onListen={() => void listen()} />
          </View>
          {!shortLandscape && (
            <T muted size={11}>
              {readerCopy(locale).pdfPositionHint}
            </T>
          )}
        </View>
      )}
      {error ? <Notice error message={error} /> : null}
      {useOriginalPdf && !fullscreen && (
        <T muted size={12} style={{ paddingHorizontal: 12 }}>
          {readerCopy(locale).originalPdfHint}
        </T>
      )}
      <Suspense fallback={<ActivityIndicator />}>
        {preparedPdf || useOriginalPdf ? (
          <Pdf
            source={{ uri: useOriginalPdf ? file.uri : preparedPdf! }}
            page={page}
            horizontal={!fullscreen}
            enablePaging={!fullscreen}
            spacing={fullscreen ? 0 : 10}
            onPageSingleTap={() => {
              if (fullscreen) changeFullscreen(false);
            }}
            enableDoubleTapZoom
            scale={zoom}
            minScale={PDF_MIN_ZOOM}
            maxScale={PDF_MAX_ZOOM}
            fitPolicy={fullscreen || shortLandscape ? 0 : 2}
            trustAllCerts={false}
            onLoadComplete={(total) => {
              setCount(total);
              setPage((value) => Math.min(total, Math.max(1, value)));
            }}
            onPageChanged={(current) => setPage(current)}
            onScaleChanged={(value) => setZoom((current) => observedPdfZoom(value, current))}
            onError={() => {
              if (!useOriginalPdf) setUseOriginalPdf(true);
              else setError('rub.open.error');
            }}
            style={{ flex: 1, direction: 'ltr' }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
            {preparationError ? (
              <Notice
                error
                message={readerCopy(locale).cropFailed}
                onRetry={() => setPreparationRetry((value) => value + 1)}
              />
            ) : (
              <>
                <ActivityIndicator />
                <T muted>{readerCopy(locale).preparingPdf}</T>
              </>
            )}
            <Button
              title={readerCopy(locale).originalPdf}
              variant="secondary"
              onPress={() => setUseOriginalPdf(true)}
            />
            <Button title="common.back" variant="quiet" onPress={onBack} />
          </View>
        )}
      </Suspense>
      {fullscreen && (
        <FullscreenExitButton
          label={t('ui.mushaf.exitFullscreen')}
          onExit={() => changeFullscreen(false)}
        />
      )}
      {fullscreen && <FloatingReaderAudio surah={surah} onListen={() => void listen()} />}

      {/* Mount the real footer before PDF decoding so its arrival cannot resize the PDF.
          The hidden one-position rail is layout only; native onLoadComplete owns the count. */}
      {!fullscreen && (
        <View
          testID="pdf-footer-layout"
          pointerEvents={ready ? 'auto' : 'none'}
          accessibilityElementsHidden={!ready}
          importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
          style={{ opacity: ready ? 1 : 0 }}
        >
          <MushafFooter
            compact={shortLandscape}
            page={ready ? page : 1}
            maximum={ready ? count : 1}
            onPageChange={(target) => {
              if (ready) setPage(target);
            }}
            onNext={() => {
              if (ready) setPage((value) => Math.min(count, value + 1));
            }}
            onPrevious={() => {
              if (ready) setPage((value) => Math.max(1, value - 1));
            }}
            canNext={ready && page < count}
            canPrevious={ready && page > 1}
            zoom={zoom}
            onZoomIn={() => {
              if (ready) setZoom((value) => stepPdfZoom(value, 0.25));
            }}
            onZoomOut={() => {
              if (ready) setZoom((value) => stepPdfZoom(value, -0.25));
            }}
            edition={id}
            pages={[page]}
            context={context}
            readingSessionId={readingSessionId}
            onJump={() => {
              if (!ready) return;
              setJump(String(page));
              setOpen(true);
            }}
          />
        </View>
      )}
      <Sheet visible={toolsOpen} title={t('reader.menu')} onClose={() => setToolsOpen(false)}>
        {useOriginalPdf && (
          <>
            <T muted size={12} style={{ marginBottom: 12 }}>
              {readerCopy(locale).originalPdfHint}
            </T>
            <Button
              title={readerCopy(locale).preparePdfCrop}
              variant="secondary"
              onPress={() => {
                setUseOriginalPdf(false);
                setPreparationRetry((value) => value + 1);
                setToolsOpen(false);
              }}
            />
          </>
        )}
        <T muted size={12} style={{ marginBottom: 12 }}>
          {t('ui.mushaf.pdfTextPosition')}
        </T>
        <Button
          title={t('ui.selectableMushaf.fromPdf')}
          icon="type"
          variant="secondary"
          onPress={() => {
            setToolsOpen(false);
            onSelectable(page, zoom);
          }}
        />
        <Button
          title={t('reader.readText')}
          variant="secondary"
          onPress={() => {
            setToolsOpen(false);
            onText(page, zoom);
          }}
        />
        <Button
          title="app.bookmarks"
          icon="bookmark"
          variant="secondary"
          onPress={() => dispatch({ type: 'mushaf/bookmark', edition: id, surah, page })}
        />
        <Button
          title="ui.nav.library"
          icon="book"
          variant="secondary"
          onPress={() => {
            setToolsOpen(false);
            onLibrary();
          }}
        />
        <MushafReadingActions
          edition={id}
          pages={[page]}
          context={context}
          sessionId={readingSessionId}
        />
      </Sheet>
      <Sheet visible={open} title={t('common.open')} onClose={() => setOpen(false)} avoidKeyboard>
        <Field
          label={format('repeat.pagesRange', 1, count || '…')}
          value={jump}
          onChangeText={setJump}
          keyboardType="number-pad"
        />
        <Button
          title={t('common.open')}
          disabled={!/^\d+$/.test(jump) || Number(jump) < 1 || Number(jump) > count}
          onPress={() => {
            setPage(Number(jump));
            setOpen(false);
          }}
        />
        <T translate={false} muted size={13}>
          {id === 'hafs_indopak_15' ? 'Hafs - IndoPak 15-line' : 'Hafs - Madinah PDF'}
        </T>
      </Sheet>
    </Screen>
  );
}
