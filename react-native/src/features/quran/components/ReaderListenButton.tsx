import React from 'react';
import { Button } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { useAudio } from '../../audio/providers/audioContext';
import { readerCopy } from '../model/readerCopy';

/** The visible reader action controls its current soera and retains the provider's queue state. */
export function ReaderListenButton({
  surah,
  onListen,
  compact = false,
}: {
  surah: number;
  onListen: () => void;
  compact?: boolean;
}) {
  const audio = useAudio();
  const { locale } = useI18n();
  const copy = readerCopy(locale);
  const current = audio.track?.surah === surah;
  const playing = current && audio.isPlaying;
  const paused = current && audio.status === 'paused';
  const loading = current && audio.status === 'loading';
  return (
    <Button
      testID="reader-listen"
      title={
        playing
          ? compact
            ? copy.pause
            : `${copy.playing} · ${copy.pause}`
          : paused
            ? compact
              ? copy.resumeShort
              : copy.resume
            : loading
              ? copy.loadingAudio
              : copy.listen
      }
      icon={playing ? 'pause' : 'play'}
      loading={loading}
      style={{ minHeight: 48, paddingHorizontal: 12, flexShrink: 0 }}
      onPress={() => {
        if (playing) audio.pause();
        else if (paused) audio.resume();
        else onListen();
      }}
    />
  );
}
