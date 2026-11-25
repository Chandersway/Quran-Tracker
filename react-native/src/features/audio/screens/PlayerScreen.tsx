import React from 'react';
import { Empty, Screen } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { useAppNavigation } from '../../../app/navigation/types';
import { useAudio } from '../providers/audioContext';
import { AudioPlayerPanel } from '../components/AudioPlayerPanel';
import { audioCopy } from '../model/audioCopy';

/** A full page for the current recording, opened from the mini player or reader bar. */
export function PlayerScreen() {
  const audio = useAudio();
  const nav = useAppNavigation();
  const { locale } = useI18n();
  const close = () => {
    if (nav.canGoBack()) nav.goBack();
  };
  return (
    <Screen>
      {audio.track ? (
        <AudioPlayerPanel onStopped={close} />
      ) : (
        <Empty
          icon="headphones"
          title={audioCopy(locale, 'playerTitle')}
          message={audioCopy(locale, 'noTrack')}
        />
      )}
    </Screen>
  );
}
