import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { ProgressBar } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { useAudio } from '../providers/audioContext';
import { audioCopy } from '../model/audioCopy';

export function AudioSeekBar() {
  const audio = useAudio();
  const { locale } = useI18n();
  const [width, setWidth] = useState(1);
  const elapsed = Math.max(0, Math.min(audio.duration, audio.position));
  const label = audioCopy(locale, 'position');
  return (
    <Pressable
      testID="audio-seek"
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: Math.round(audio.duration), now: Math.round(elapsed) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        void audio.seek(
          elapsed +
            (event.nativeEvent.actionName === 'increment'
              ? audio.skipInterval
              : -audio.skipInterval),
        );
      }}
      onLayout={(event) => setWidth(Math.max(1, event.nativeEvent.layout.width))}
      onPress={(event) => {
        void audio.seek((event.nativeEvent.locationX / width) * audio.duration);
      }}
      style={{ minHeight: 44, justifyContent: 'center', direction: 'ltr' }}
    >
      <ProgressBar value={audio.duration ? elapsed / audio.duration : 0} label={label} />
    </Pressable>
  );
}
