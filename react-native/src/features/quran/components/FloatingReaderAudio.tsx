import React, { useState } from 'react';
import { useI18n } from '../../../i18n';
import { useAudio } from '../../audio/providers/audioContext';
import { readerCopy } from '../model/readerCopy';
import { FloatingReaderButton } from './FloatingReaderButton';
import { ReaderAudioBar } from '../../audio/components/ReaderAudioBar';

/** Uses the existing central player; moving this control never starts playback. */
export function FloatingReaderAudio({ surah, onListen }: { surah: number; onListen: () => void }) {
  const audio = useAudio();
  const [expanded, setExpanded] = useState(false);
  const { locale } = useI18n();
  const copy = readerCopy(locale);
  const current = audio.track?.surah === surah;
  const playing = current && audio.isPlaying;
  const paused = current && audio.status === 'paused';
  const loading = current && audio.status === 'loading';
  return (
    <>
      <FloatingReaderButton
        emphasized
        visible={!expanded}
        testID="fullscreen-audio-button"
        initialCorner="bottomRight"
        label={
          loading ? copy.loadingAudio : playing ? copy.pause : paused ? copy.resume : copy.listen
        }
        icon={playing ? 'pause' : 'play'}
        onPress={() => {
          setExpanded(true);
          if (loading) return;
          if (playing) audio.pause();
          else if (paused) audio.resume();
          else onListen();
        }}
      />
      {expanded ? (
        <ReaderAudioBar surah={surah} onListen={onListen} onDismiss={() => setExpanded(false)} />
      ) : null}
    </>
  );
}
