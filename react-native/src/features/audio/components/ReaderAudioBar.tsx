import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chapterById } from '../../../content/quran';
import { playbackSpeeds } from '../../../domain/audioPlayback';
import { useI18n } from '../../../i18n';
import { Icon, IconButton, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { audioTime } from '../model/audioLabels';
import { readerAudioCopy } from '../model/readerAudioCopy';
import { useAudio } from '../providers/audioContext';
import { MediaSettingsSheet } from './MediaSettings';

/** A deliberate, dismissible reader overlay backed by the app's single audio player. */
export function ReaderAudioBar({
  surah,
  onListen,
  onDismiss,
}: {
  surah: number;
  onListen: () => void;
  onDismiss: () => void;
}) {
  const audio = useAudio();
  const p = usePalette();
  const { t, locale } = useI18n();
  const copy = readerAudioCopy[locale];
  const insets = useSafeAreaInsets();
  const [recitersOpen, setRecitersOpen] = useState(false);
  const offset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const gesture = useMemo(() => {
    let claimed = { x: 0, y: 0 };
    const claim = (_event: unknown, state: { dx: number; dy: number }) => {
      if (Math.abs(state.dx) <= 12 && state.dy <= 12) return false;
      claimed = { x: state.dx, y: state.dy };
      return true;
    };
    return PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        claimed = { x: 0, y: 0 };
        return false;
      },
      onMoveShouldSetPanResponderCapture: claim,
      onMoveShouldSetPanResponder: claim,
      onPanResponderMove: (_event, state) =>
        offset.setValue({ x: claimed.x + state.dx, y: Math.max(0, claimed.y + state.dy) }),
      onPanResponderRelease: (_event, state) => {
        const x = claimed.x + state.dx,
          y = claimed.y + state.dy;
        if (
          Math.abs(x) > 36 ||
          y > 32 ||
          (Math.abs(x) > 12 && Math.abs(state.vx) > 0.8) ||
          (y > 12 && state.vy > 0.8)
        )
          dismiss.current();
        offset.setValue({ x: 0, y: 0 });
        claimed = { x: 0, y: 0 };
      },
      onPanResponderTerminate: () => {
        offset.setValue({ x: 0, y: 0 });
        claimed = { x: 0, y: 0 };
      },
    });
  }, [offset]);
  const current = audio.track?.surah === surah;
  const loading = current && audio.status === 'loading';
  const playing = current && audio.isPlaying;
  const duration = current ? audio.duration : 0;
  const position = current ? audio.position : 0;
  const progress = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
  return (
    <>
      <Animated.View
        testID="reader-audio-bar"
        {...gesture.panHandlers}
        accessibilityLabel={t('ui.audio.player')}
        accessibilityHint={copy.swipeHint}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 8,
          left: 12,
          right: 12,
          zIndex: 20,
          backgroundColor: p.surface,
          borderColor: p.line,
          borderWidth: 1,
          borderRadius: 14,
          overflow: 'hidden',
          transform: offset.getTranslateTransform(),
          direction: locale === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        <View style={{ height: 2, backgroundColor: p.line }}>
          <View style={{ height: 2, width: `${progress * 100}%`, backgroundColor: p.primary }} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingStart: 12,
            paddingEnd: 3,
            paddingTop: 3,
            gap: 4,
          }}
        >
          <Pressable
            testID="reader-audio-reciter"
            accessibilityRole="button"
            accessibilityLabel={`${copy.chooseReciter}${current && audio.track?.reciterName ? ` · ${audio.track.reciterName}` : ''}`}
            onPress={() => setRecitersOpen(true)}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 48,
              justifyContent: 'center',
              paddingVertical: 4,
            }}
          >
            <T translate={false} bold size={13} numberOfLines={1}>
              {locale === 'ar' ? chapterById(surah).nameAr : chapterById(surah).name}
            </T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <T
                translate={false}
                size={12}
                color={p.primary}
                numberOfLines={2}
                style={{ flexShrink: 1 }}
              >
                {current && audio.track?.reciterName ? audio.track.reciterName : copy.chooseReciter}
              </T>
              <Icon name="chevron-down" size={16} color={p.primary} />
            </View>
          </Pressable>
          <Pressable
            testID="reader-audio-speed"
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
            style={{ minHeight: 48, minWidth: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <T translate={false} size={12} bold>
              {audio.rate}×
            </T>
          </Pressable>
          {loading ? (
            <View
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel={t('audio.state.loading')}
              accessible
            >
              <ActivityIndicator size="small" color={p.primary} />
            </View>
          ) : (
            <IconButton
              name={playing ? 'pause' : 'play'}
              label={t(playing ? 'app.quranAudioPause' : 'app.quranAudioPlay')}
              selected
              onPress={() => {
                if (playing) audio.pause();
                else if (current && audio.status === 'paused') audio.resume();
                else onListen();
              }}
            />
          )}
          <IconButton name="x" label={copy.hide} onPress={onDismiss} />
        </View>
        <T translate={false} muted size={10} style={{ paddingHorizontal: 12, paddingBottom: 5 }}>
          {loading ? `${t('audio.state.loading')} · ` : ''}
          {audioTime(position)} / {audioTime(duration)}
        </T>
        {current && audio.error ? (
          <T
            translate={false}
            accessibilityRole="alert"
            color={p.danger}
            size={12}
            style={{ paddingHorizontal: 12, paddingBottom: 8 }}
          >
            {t(audio.error)}
          </T>
        ) : null}
      </Animated.View>
      <MediaSettingsSheet
        recitersOnly
        visible={recitersOpen}
        onClose={() => setRecitersOpen(false)}
        surah={surah}
      />
    </>
  );
}
