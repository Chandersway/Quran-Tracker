import React, { useMemo, useState } from 'react';
import { ActivityIndicator, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useI18n } from '../../../i18n';
import { playbackSpeeds } from '../../../domain/audioPlayback';
import { chapterById } from '../../../content/quran';
import { useAudio } from '../providers/audioContext';
import { AudioPlayerSheet } from './AudioPlayerSheet';
import { AudioSeekBar } from './AudioSeekBar';
import { audioTime, selectionTitle } from '../model/audioLabels';

export function MiniPlayer() {
  const audio = useAudio();
  const p = usePalette();
  const { t, format } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const gesture = useMemo(() => {
    // RN resets dy when the parent takes over from a child Pressable. Retain the
    // movement that won the responder so a quick swipe can end immediately.
    let claimedDy = 0;
    const claim = (_: unknown, state: { dx: number; dy: number }) => {
      if (state.dy >= -10 || Math.abs(state.dy) <= Math.abs(state.dx)) return false;
      claimedDy = state.dy;
      return true;
    };
    return PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        claimedDy = 0;
        return false;
      },
      onMoveShouldSetPanResponderCapture: claim,
      onMoveShouldSetPanResponder: claim,
      onPanResponderRelease: (_, state) => {
        if (claimedDy + state.dy < -24) setExpanded(true);
        claimedDy = 0;
      },
      onPanResponderTerminate: () => {
        claimedDy = 0;
      },
    });
  }, []);
  if (!audio.track) return null;
  const title = selectionTitle(audio.selectionRange, format) ?? chapterById(audio.track.surah).name;
  return (
    <View
      testID="audio-mini-player"
      accessibilityLabel={t('ui.audio.player')}
      style={[styles.player, { backgroundColor: p.surface, borderColor: p.line }]}
      {...gesture.panHandlers}
    >
      <Pressable
        testID="audio-mini-expand"
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${t('audio.more')}`}
        onPress={() => setExpanded(true)}
        style={{ minHeight: 48, justifyContent: 'center' }}
      >
        <T translate={false} bold size={14} numberOfLines={1}>
          {title}
        </T>
        <T translate={false} muted size={12} numberOfLines={1}>
          {audio.track.reciterName}
        </T>
      </Pressable>
      {audio.selection && (
        <T translate={false} muted size={12}>
          {audio.rounds
            ? format('repeat.round', audio.round, audio.rounds)
            : `${format('repeat.round', audio.round, '∞')}`}{' '}
          · {audio.queueIndex + 1}/{audio.queueLength}
        </T>
      )}
      <View style={styles.controls}>
        <Pressable
          testID="audio-mini-speed"
          accessibilityRole="button"
          accessibilityLabel={`${t('app.quranAudioPlaybackSpeed')}: ${audio.rate}×`}
          onPress={() =>
            audio.setRate(
              playbackSpeeds[
                (playbackSpeeds.indexOf(audio.rate as (typeof playbackSpeeds)[number]) + 1) %
                  playbackSpeeds.length
              ]!,
            )
          }
          style={{ minWidth: 48, minHeight: 48, justifyContent: 'center' }}
        >
          <T translate={false} bold size={14}>
            {audio.rate}×
          </T>
        </Pressable>
        <IconButton
          name="rewind"
          label={format('audio.skipBack', audio.skipInterval)}
          onPress={() => {
            void audio.seek(audio.position - audio.skipInterval);
          }}
        />
        <IconButton
          name={audio.isPlaying ? 'pause' : 'play'}
          label={t(audio.isPlaying ? 'app.quranAudioPause' : 'app.quranAudioPlay')}
          onPress={audio.isPlaying ? audio.pause : audio.resume}
          selected
        />
        <IconButton
          name="fast-forward"
          label={format('audio.skipForward', audio.skipInterval)}
          onPress={() => {
            void audio.seek(audio.position + audio.skipInterval);
          }}
        />
        <IconButton name="square" label={t('app.quranAudioStop')} onPress={audio.stop} />
      </View>
      <View style={styles.status}>
        {audio.status === 'loading' ? <ActivityIndicator size="small" color={p.primary} /> : null}
        <T translate={false} muted size={12}>
          {audio.status === 'loading'
            ? `${t('audio.state.loading')} · `
            : audio.status === 'paused'
              ? `${t('audio.state.paused')} · `
              : audio.status === 'completed'
                ? `${t('audio.state.completed')} · `
                : ''}
          {audioTime(audio.position)} / {audioTime(audio.duration)}
        </T>
      </View>
      <AudioSeekBar />
      {audio.error && (
        <T accessibilityRole="alert" size={12} color={p.danger}>
          {audio.error}
        </T>
      )}
      <AudioPlayerSheet visible={expanded} onClose={() => setExpanded(false)} />
    </View>
  );
}
const styles = StyleSheet.create({
  player: {
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingTop: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
