import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  Button,
  Field,
  Icon,
  Notice,
  Section,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { playbackSpeeds } from '../../../domain/audioPlayback';
import { createAudioService } from '../../../services/audio/audio';
import { filterReciters, riwayaCategory } from '../../../services/audio/audio-catalog';
import type { AudioTrack } from '../../../services/backend/types';
import { chapterById } from '../../../content/quran';
import { useAudio } from '../providers/audioContext';
import { audioCopy } from '../model/audioCopy';

const service = createAudioService(process.env.EXPO_PUBLIC_AUDIO_BASE_URL);

export function MediaSettings({
  surah,
  recitersOnly = false,
  onSelected,
}: {
  surah?: number;
  recitersOnly?: boolean;
  onSelected?: () => void;
}) {
  const audio = useAudio();
  const { state, commit } = useAppStore();
  const { t, format, locale } = useI18n();
  const p = usePalette();
  const currentSurah = surah ?? audio.track?.surah ?? state.cursor.surah ?? 1;
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    setTracks([]);
    setSaved('');
    service
      .listSurah(currentSurah)
      .then((items) => {
        if (live) setTracks(items);
      })
      .catch(() => {
        if (live) setError('audio.error.unavailable');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [currentSurah, retry]);
  const selected =
    tracks.find((track) => track.reciterId === state.preferences.reciterId) ?? tracks[0];
  const filtered = filterReciters(tracks, query, category);
  const categories = [...new Set(tracks.map((track) => riwayaCategory(track.riwaya)))].sort();
  async function choose(track: AudioTrack, start = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await commit({ type: 'preferences', patch: { reciterId: track.reciterId } });
      if (start) audio.play(track);
      else if (
        audio.track?.surah === track.surah &&
        audio.track.reciterId !== track.reciterId &&
        !audio.selection
      )
        audio.replaceTrack(track);
      onSelected?.();
    } catch {
      setError(audioCopy(locale, 'saveError'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function download() {
    if (!selected || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setSaved('');
    try {
      await service.download(selected);
      setSaved(`${selected.reciterName} · ${audioCopy(locale, 'saved')}`);
    } catch {
      setError(audioCopy(locale, 'cancelDownload'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <View>
      <T translate={false} bold size={20}>
        {chapterById(currentSurah).name}
      </T>
      {selected && !recitersOnly && (
        <>
          <T muted size={13} style={{ marginTop: 12 }}>
            {audioCopy(locale, 'chosen')}
          </T>
          <T translate={false} bold>
            {selected.reciterName}
          </T>
          <T translate={false} muted size={13}>
            {selected.riwaya}
          </T>
          <Button
            title={audioCopy(locale, 'start')}
            icon="play"
            disabled={busy}
            onPress={() => {
              void choose(selected, true);
            }}
            style={{ marginTop: 16 }}
          />
          <Button
            title={t('ui.reader.saveAudio')}
            icon="download"
            variant="quiet"
            loading={busy}
            onPress={() => {
              void download();
            }}
          />
        </>
      )}
      {saved && (
        <T translate={false} accessibilityLiveRegion="polite">
          {saved}
        </T>
      )}
      {error && (
        <Notice
          error
          message={error}
          onRetry={tracks.length ? undefined : () => setRetry((value) => value + 1)}
        />
      )}
      <T muted size={13} style={{ marginVertical: 12 }}>
        {audioCopy(locale, recitersOnly && audio.selection ? 'queueReciterHint' : 'chooseHint')}
      </T>
      {!recitersOnly && (
        <>
          <Section title={t('app.quranAudioPlaybackSpeed')} />
          <Segments
            value={String(audio.rate)}
            onChange={(value) => audio.setRate(Number(value))}
            options={playbackSpeeds.map((value) => ({
              value: String(value),
              label: format('app.quranAudioPlaybackSpeedValue', value),
            }))}
          />
        </>
      )}
      {!recitersOnly && <Section title={t('repeat.reciter')} />}
      <Field
        label={audioCopy(locale, 'search')}
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setLimit(30);
        }}
        autoCorrect={false}
      />
      <T muted size={13}>
        {audioCopy(locale, 'riwaya')}
      </T>
      <Segments
        value={category}
        onChange={(value) => {
          setCategory(value);
          setLimit(30);
        }}
        options={[
          { value: 'all', label: t('app.mediaAllFilter') },
          ...categories.map((value) => ({ value, label: value })),
        ]}
      />
      {loading && (
        <ActivityIndicator accessibilityLabel={t('audio.state.loading')} color={p.primary} />
      )}
      {!loading && !filtered.length && <T muted>{audioCopy(locale, 'noMatches')}</T>}
      {filtered.slice(0, limit).map((track) => (
        <Pressable
          key={`${track.reciterId}:${track.sourceUrl}`}
          testID={`audio-reciter-${track.reciterId}`}
          accessibilityRole="radio"
          accessibilityLabel={`${audioCopy(locale, 'choose')}: ${track.reciterName}, ${track.riwaya}`}
          accessibilityState={{ selected: selected?.reciterId === track.reciterId, disabled: busy }}
          disabled={busy}
          onPress={() => {
            void choose(track);
          }}
          style={[s.listRow, { borderBottomColor: p.line, minHeight: 64 }]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <T translate={false} bold={selected?.reciterId === track.reciterId}>
              {track.reciterName}
            </T>
            <T translate={false} muted size={13}>
              {track.riwaya}
            </T>
          </View>
          {selected?.reciterId === track.reciterId && <Icon name="check" color={p.primary} />}
        </Pressable>
      ))}
      {filtered.length > limit && (
        <Button
          title={audioCopy(locale, 'more')}
          variant="quiet"
          onPress={() => setLimit((value) => value + 30)}
        />
      )}
    </View>
  );
}

export function MediaSettingsSheet({
  visible,
  onClose,
  surah,
  recitersOnly = false,
}: {
  visible: boolean;
  onClose: () => void;
  surah?: number;
  recitersOnly?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t(recitersOnly ? 'repeat.reciter' : 'app.media')}
      avoidKeyboard
    >
      {visible && (
        <MediaSettings
          surah={surah}
          recitersOnly={recitersOnly}
          onSelected={recitersOnly ? onClose : undefined}
        />
      )}
    </Sheet>
  );
}
