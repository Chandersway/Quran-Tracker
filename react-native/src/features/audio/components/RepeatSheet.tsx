import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useI18n } from '../../../i18n';
import { Button, Field, Icon, Notice, Segments, Sheet, T, s } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import {
  normalizedRepeatReciter,
  normalizedRepeatRounds,
  repeatReciterOptions,
} from '../../../domain/repeat';
import { playbackSpeeds } from '../../../domain/audioPlayback';
import { createAudioService } from '../../../services/audio/audio';
import {
  createRepeatQueue,
  printedVerseCount,
  printedVerseForCanonical,
  repeatInitialPage,
  type RepeatMode,
} from '../../../services/audio/repeatSelection';
import { useAudio } from '../providers/audioContext';
import type { Edition } from '../../../content/mushafGeometry';
import { chapterById } from '../../../content/quran';
import { audioCopy } from '../model/audioCopy';
import type { BookPresentation } from '../../../state/models';

const service = createAudioService(process.env.EXPO_PUBLIC_AUDIO_BASE_URL);

export function RepeatSheet({
  visible,
  onClose,
  surah,
  initialAyah,
  initialEndAyah = initialAyah,
  initialMode,
  warsh = false,
  pageEdition = warsh ? 'warsh_maknoon' : 'hafs',
  currentPage,
  pagePresentation,
}: {
  visible: boolean;
  onClose: () => void;
  surah: number;
  initialAyah?: number;
  initialEndAyah?: number;
  initialMode?: RepeatMode;
  warsh?: boolean;
  pageEdition?: Edition | null;
  currentPage?: number;
  pagePresentation?: BookPresentation;
}) {
  const { t, format, locale } = useI18n();
  const p = usePalette();
  const audio = useAudio();
  const { state, commit } = useAppStore();
  const options = repeatReciterOptions(warsh);
  const page =
    currentPage ?? repeatInitialPage(pageEdition, surah, initialAyah ?? 1, pagePresentation);
  const maximumPage = pageEdition === 'muhammadi' ? 638 : 604;
  const maximumVerse = printedVerseCount(surah, warsh);
  const defaultMode =
    initialMode ??
    (initialAyah !== undefined
      ? 'ayahs'
      : currentPage !== undefined && pageEdition
        ? 'page'
        : 'surah');
  const [mode, setMode] = useState<RepeatMode>(defaultMode);
  const [from, setFrom] = useState(
    String(printedVerseForCanonical(surah, initialAyah ?? 1, warsh)),
  );
  const [to, setTo] = useState(
    String(printedVerseForCanonical(surah, initialEndAyah ?? initialAyah ?? 1, warsh)),
  );
  const [fromPage, setFromPage] = useState(String(page ?? 1));
  const [toPage, setToPage] = useState(String(page ?? 1));
  const [rounds, setRounds] = useState(
    String(normalizedRepeatRounds(state.preferences.audioRepeatRounds)),
  );
  const [reciterId, setReciterId] = useState(
    normalizedRepeatReciter(
      warsh ? state.preferences.audioRepeatWarshReciter : state.preferences.audioRepeatHafsReciter,
      warsh,
    ),
  );
  const [speed, setSpeed] = useState(String(audio.rate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const lock = useRef(false);
  const open = useRef(visible);
  open.current = visible;
  const generation = useRef(0);
  useEffect(() => {
    if (!visible) generation.current++;
    return () => {
      generation.current++;
    };
  }, [visible]);
  useEffect(() => {
    setSaved(false);
  }, [mode, from, to, fromPage, toPage, reciterId, page, surah]);
  async function downloadSelection() {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError('');
    setSaved(false);
    setDownloadProgress({ done: 0, total: 0 });
    const token = generation.current;
    try {
      const reciter = options.find((option) => option.id === reciterId) ?? options[0]!;
      const queue = await createRepeatQueue(
        {
          mode,
          surah,
          warsh,
          edition: pageEdition,
          ...(pagePresentation ? { pagePresentation } : {}),
          currentPage: page,
          from: Number(from),
          to: Number(to),
          fromPage: Number(fromPage),
          toPage: Number(toPage),
        },
        reciter,
        service,
      );
      const recordings = [
        ...new Map(queue.tracks.map((track) => [track.sourceUrl, track])).values(),
      ];
      for (const [index, track] of recordings.entries()) {
        if (!open.current || generation.current !== token) return;
        setDownloadProgress({ done: index, total: recordings.length });
        await service.download(track);
      }
      if (open.current && generation.current === token) setSaved(true);
    } catch (cause) {
      if (open.current)
        setError(
          cause instanceof Error && cause.message === 'REPEAT_AYAHS_INVALID'
            ? format('ui.repeat.ayahRangeInvalid', maximumVerse)
            : cause instanceof Error && cause.message === 'REPEAT_PAGES_INVALID'
              ? format('ui.repeat.pagesInvalid', maximumPage)
              : audioCopy(locale, 'cancelDownload'),
        );
    } finally {
      lock.current = false;
      setLoading(false);
      setDownloadProgress(null);
    }
  }
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setError('');
    setLoading(true);
    const token = generation.current;
    try {
      const repetitions = Number(rounds);
      if (![0, 2, 3, 5].includes(repetitions)) throw new RangeError('REPEAT_COUNT_INVALID');
      const reciter = options.find((option) => option.id === reciterId) ?? options[0]!;
      const queue = await createRepeatQueue(
        {
          mode,
          surah,
          warsh,
          edition: pageEdition,
          ...(pagePresentation ? { pagePresentation } : {}),
          currentPage: page,
          from: Number(from),
          to: Number(to),
          fromPage: Number(fromPage),
          toPage: Number(toPage),
        },
        reciter,
        service,
      );
      if (!open.current || token !== generation.current) return;
      await commit({
        type: 'preferences',
        patch: {
          audioRepeatRounds: repetitions,
          ...(warsh
            ? { audioRepeatWarshReciter: reciter.id }
            : { audioRepeatHafsReciter: reciter.id }),
          audioPlaybackSpeed: Number(speed),
        },
      });
      if (!open.current || token !== generation.current) return;
      audio.playQueue(queue.tracks, repetitions, queue.selection);
      onClose();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      if (open.current)
        setError(
          code === 'REPEAT_AYAHS_INVALID'
            ? format('ui.repeat.ayahRangeInvalid', maximumVerse)
            : code === 'REPEAT_PAGES_INVALID'
              ? format('ui.repeat.pagesInvalid', maximumPage)
              : t('repeat.error'),
        );
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }
  return (
    <Sheet visible={visible} title={t('repeat.title')} onClose={onClose} avoidKeyboard>
      <T translate={false} bold>
        {chapterById(surah).name} · {warsh ? 'Warsh' : 'Hafs'}
      </T>
      <T muted style={{ marginTop: 16 }}>
        {t('repeat.selection')}
      </T>
      <Segments
        value={mode}
        onChange={(value) => {
          if (!loading) {
            setMode(value);
            setError('');
          }
        }}
        layout="wrap"
        options={[
          ...(pageEdition && page
            ? [
                { value: 'page' as const, label: format('repeat.page', page) },
                { value: 'pages' as const, label: t('repeat.pages') },
              ]
            : []),
          { value: 'surah', label: audioCopy(locale, 'wholeSurah') },
          { value: 'ayahs', label: t('repeat.ayahs') },
        ]}
      />
      {mode === 'ayahs' && (
        <>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field
                label={t('repeat.from')}
                value={from}
                onChangeText={setFrom}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t('repeat.to')}
                value={to}
                onChangeText={setTo}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          </View>
          <T translate={false} muted size={13}>
            1–{maximumVerse}
          </T>
          {warsh && (
            <T muted size={13}>
              {audioCopy(locale, 'printed')}
            </T>
          )}
        </>
      )}
      {mode === 'pages' && (
        <>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field
                label={t('repeat.fromPage')}
                value={fromPage}
                onChangeText={setFromPage}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t('repeat.toPage')}
                value={toPage}
                onChangeText={setToPage}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          </View>
          <T muted size={13}>
            {t('repeat.pagesHint')}
          </T>
        </>
      )}
      <T bold style={{ marginTop: 20 }}>
        {t('repeat.count')}
      </T>
      <Segments
        value={rounds}
        onChange={(value) => {
          if (!loading) setRounds(value);
        }}
        options={[2, 3, 5, 0].map((value) => ({
          value: String(value),
          label: value ? `${value}×` : t('repeat.forever'),
        }))}
      />
      <T muted size={13}>
        {audioCopy(locale, 'count')}
      </T>
      <T bold style={{ marginTop: 20 }}>
        {t('app.quranAudioPlaybackSpeed')}
      </T>
      <Segments
        value={speed}
        onChange={(value) => {
          if (!loading) setSpeed(value);
        }}
        options={playbackSpeeds.map((value) => ({
          value: String(value),
          label: format('app.quranAudioPlaybackSpeedValue', value),
        }))}
      />
      <T bold style={{ marginTop: 20 }}>
        {t('repeat.reciter')}
      </T>
      {options.map((reciter) => (
        <Pressable
          key={reciter.id}
          testID={`repeat-reciter-${reciter.id}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: reciter.id === reciterId, disabled: loading }}
          disabled={loading}
          onPress={() => setReciterId(reciter.id)}
          style={[s.listRow, { borderBottomColor: p.line, minHeight: 56 }]}
        >
          <T translate={false} style={{ flex: 1 }} bold={reciter.id === reciterId}>
            {reciter.name}
          </T>
          {reciter.id === reciterId && <Icon name="check" color={p.primary} />}
        </Pressable>
      ))}
      {error && <Notice error message={error} />}
      {downloadProgress && (
        <T translate={false} accessibilityLiveRegion="polite" muted>
          {audioCopy(locale, 'downloading')}: {downloadProgress.done}/{downloadProgress.total}
        </T>
      )}
      {saved && <T accessibilityLiveRegion="polite">{audioCopy(locale, 'selectionSaved')}</T>}
      <Button
        title={t('repeat.start')}
        icon="repeat"
        loading={loading && !downloadProgress}
        disabled={loading}
        onPress={() => {
          void start();
        }}
        style={{ marginTop: 20 }}
      />
      <Button
        title={audioCopy(locale, 'saveSelection')}
        icon="download"
        variant="quiet"
        loading={loading && !!downloadProgress}
        disabled={loading}
        onPress={() => {
          void downloadSelection();
        }}
      />
    </Sheet>
  );
}
