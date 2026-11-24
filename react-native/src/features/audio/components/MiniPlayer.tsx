import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useI18n } from '../../../i18n';
import { chapterById } from '../../../content/quran';
import { useAudio } from '../providers/audioContext';
import { RepeatSheet } from './RepeatSheet';
import { audioTime, selectionTitle } from '../model/audioLabels';
import { audioCopy } from '../model/audioCopy';

/**
 * One compact row above the tabs: title, repeat, play/pause and stop. Tapping
 * the title or swiping up opens the full player page.
 */
export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const audio = useAudio();
  const p = usePalette();
  const { t, format, locale } = useI18n();
  const [repeatOpen, setRepeatOpen] = useState(false);
  const open = useRef(onOpen);
  open.current = onOpen;
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
        if (claimedDy + state.dy < -24) open.current();
        claimedDy = 0;
      },
      onPanResponderTerminate: () => {
        claimedDy = 0;
      },
    });
  }, []);
  if (!audio.track) return null;
  const title = selectionTitle(audio.selectionRange, format) ?? chapterById(audio.track.surah).name;
  const progress =
    audio.duration > 0 ? Math.max(0, Math.min(1, audio.position / audio.duration)) : 0;
  const repeating = audio.selection || audio.repeatEnabled;
  const detail = audio.selection
    ? `${audio.rounds ? format('repeat.round', audio.round, audio.rounds) : format('repeat.round', audio.round, '∞')} · ${audio.queueIndex + 1}/${audio.queueLength}`
    : `${audio.track.reciterName} · ${audioTime(audio.position)} / ${audioTime(audio.duration)}`;
  return (
    <View
      testID="audio-mini-player"
      accessibilityLabel={t('ui.audio.player')}
      style={[styles.player, { backgroundColor: p.surface, borderColor: p.line }]}
      {...gesture.panHandlers}
    >
      <View style={{ height: 2, backgroundColor: p.line }}>
        <View style={{ height: 2, width: `${progress * 100}%`, backgroundColor: p.primary }} />
      </View>
      <View style={styles.row}>
        <Pressable
          testID="audio-mini-expand"
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${audioCopy(locale, 'openPlayer')}`}
          onPress={onOpen}
          style={{ flex: 1, minWidth: 0, minHeight: 48, justifyContent: 'center' }}
        >
          <T translate={false} bold size={14} numberOfLines={1}>
            {title}
          </T>
          <T translate={false} muted size={12} numberOfLines={1}>
            {audio.status === 'loading' ? `${t('audio.state.loading')} · ` : ''}
            {detail}
          </T>
        </Pressable>
        {audio.status === 'loading' ? <ActivityIndicator size="small" color={p.primary} /> : null}
        <IconButton
          name="repeat"
          label={audioCopy(locale, 'repeatHeading')}
          selected={repeating}
          onPress={() => setRepeatOpen(true)}
        />
        <IconButton
          name={audio.isPlaying ? 'pause' : 'play'}
          label={t(audio.isPlaying ? 'app.quranAudioPause' : 'app.quranAudioPlay')}
          onPress={audio.isPlaying ? audio.pause : audio.resume}
          selected
        />
        <IconButton name="x" label={t('app.quranAudioStop')} onPress={audio.stop} />
      </View>
      {audio.error && (
        <T
          accessibilityRole="alert"
          size={12}
          color={p.danger}
          style={{ paddingHorizontal: 12, paddingBottom: 6 }}
        >
          {audio.error}
        </T>
      )}
      <RepeatSheet
        key={audio.track.surah}
        visible={repeatOpen}
        onClose={() => setRepeatOpen(false)}
        surah={audio.track.surah}
        warsh={/warsh|ورش/i.test(audio.track.riwaya)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  player: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingStart: 12, paddingEnd: 2 },
});
