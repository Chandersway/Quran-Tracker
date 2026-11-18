import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useAudio } from '../providers/audioContext';
import { RepeatSheet } from './RepeatSheet';
import { playbackSpeeds } from '../../../domain/audioPlayback';
import {
  Button,
  IconButton,
  Notice,
  Row,
  Section,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { chapterById } from '../../../content/quran';
import { AudioSeekBar } from './AudioSeekBar';
import { MediaSettingsSheet } from './MediaSettings';
import { audioTime, selectionTitle } from '../model/audioLabels';

export function AudioPlayerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const audio = useAudio();
  const { t, format } = useI18n();
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!visible || !audio.sleepEndsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [visible, audio.sleepEndsAt]);
  if (!audio.track) return null;
  const chapter = chapterById(audio.track.surah);
  const elapsed = Math.min(audio.duration, audio.position);
  return (
    <>
      <Sheet
        visible={visible && !repeatOpen && !mediaOpen}
        title={t('app.quranAudioNowPlaying')}
        onClose={onClose}
      >
        <T arabic size={38} style={{ textAlign: 'center' }}>
          {chapter.nameAr}
        </T>
        <T translate={false} bold style={{ textAlign: 'center', marginBottom: 20 }}>
          {audio.track.reciterName}
        </T>
        <T translate={false} muted style={{ textAlign: 'center' }}>
          {audio.track.riwaya}
        </T>
        {audio.selectionRange && (
          <T translate={false} bold style={{ textAlign: 'center', marginVertical: 12 }}>
            {selectionTitle(audio.selectionRange, format)}
          </T>
        )}
        {audio.status === 'loading' || audio.status === 'paused' || audio.status === 'completed' ? (
          <T muted size={13} style={{ textAlign: 'center', marginBottom: 12 }}>
            {t(
              audio.status === 'loading'
                ? 'audio.state.loading'
                : audio.status === 'paused'
                  ? 'audio.state.paused'
                  : 'audio.state.completed',
            )}
          </T>
        ) : null}
        <AudioSeekBar />
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T translate={false} size={13} muted>
            {audioTime(elapsed)}
          </T>
          <T translate={false} size={13} muted>
            {audioTime(audio.duration)}
          </T>
        </View>
        <View style={[s.row, { justifyContent: 'center', gap: 24, marginVertical: 20 }]}>
          <IconButton
            name="rewind"
            label={format('audio.skipBack', audio.skipInterval)}
            onPress={() => {
              void audio.seek(audio.position - audio.skipInterval);
            }}
          />
          <Button
            title={t(audio.isPlaying ? 'app.quranAudioPause' : 'app.quranAudioPlay')}
            icon={audio.isPlaying ? 'pause' : 'play'}
            loading={audio.status === 'loading'}
            onPress={audio.isPlaying ? audio.pause : audio.resume}
          />
          <IconButton
            name="fast-forward"
            label={format('audio.skipForward', audio.skipInterval)}
            onPress={() => {
              void audio.seek(audio.position + audio.skipInterval);
            }}
          />
        </View>
        {audio.error && <Notice error message={t(audio.error)} onRetry={audio.resume} />}
        {audio.selection && (
          <T muted>
            {audio.rounds ? format('repeat.round', audio.round, audio.rounds) : t('repeat.forever')}
            {' · '}
            {audio.queueIndex + 1}/{audio.queueLength}
          </T>
        )}
        <Section title={t('app.quranAudioPlaybackSpeed')} />
        <Segments
          value={String(audio.rate)}
          onChange={(value) => audio.setRate(Number(value))}
          options={playbackSpeeds.map((value) => ({
            value: String(value),
            label: format('app.quranAudioPlaybackSpeedValue', value),
          }))}
        />
        <Section title={t('audio.skipInterval')} />
        <Segments
          value={String(audio.skipInterval)}
          onChange={(value) => audio.setSkipInterval(Number(value))}
          options={[5, 10].map((value) => ({
            value: String(value),
            label: format('audio.seconds', value),
          }))}
        />
        {!audio.selection && (
          <Row
            title={t('audio.repeat')}
            subtitle={t('audio.repeatDescription')}
            trailing={
              <Switch
                accessibilityLabel={t('audio.repeat')}
                value={audio.repeatEnabled}
                onValueChange={audio.setRepeat}
              />
            }
          />
        )}
        <Row
          title={t('audio.autoplay')}
          subtitle={t('audio.autoplayDescription')}
          trailing={
            <Switch
              accessibilityLabel={t('audio.autoplay')}
              value={audio.autoplayEnabled}
              onValueChange={audio.setAutoplay}
            />
          }
        />
        <Section
          title={
            audio.sleepEndsAt
              ? format(
                  'audio.sleepTimerActive',
                  Math.max(0, Math.ceil((audio.sleepEndsAt - now) / 60_000)),
                )
              : t('audio.sleepTimer')
          }
        />
        <Segments
          value={audio.sleepEndsAt ? String(Math.ceil((audio.sleepEndsAt - now) / 60_000)) : 'off'}
          onChange={(value) => {
            setNow(Date.now());
            audio.setSleepTimer(value === 'off' ? null : Number(value));
          }}
          options={[
            { value: 'off', label: t('audio.off') },
            ...[15, 30, 60].map((value) => ({
              value: String(value),
              label: format('audio.minutes', value),
            })),
          ]}
        />
        <Button
          title={t('app.media')}
          icon="headphones"
          variant="secondary"
          onPress={() => setMediaOpen(true)}
          style={{ marginTop: 24 }}
        />
        <Button
          title={t('repeat.title')}
          icon="repeat"
          variant="secondary"
          onPress={() => setRepeatOpen(true)}
          style={{ marginTop: 24 }}
        />
        <Button
          title={t('app.quranAudioStop')}
          icon="square"
          variant="quiet"
          onPress={() => {
            audio.stop();
            onClose();
          }}
          style={{ marginTop: 12 }}
        />
      </Sheet>
      <MediaSettingsSheet
        visible={visible && mediaOpen}
        onClose={() => setMediaOpen(false)}
        surah={audio.track.surah}
      />
      <RepeatSheet
        key={audio.track.surah}
        visible={visible && repeatOpen}
        onClose={() => setRepeatOpen(false)}
        surah={audio.track.surah}
        warsh={/warsh|ورش/i.test(audio.track.riwaya)}
      />
    </>
  );
}
