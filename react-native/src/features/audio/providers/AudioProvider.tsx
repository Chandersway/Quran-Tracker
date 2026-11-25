import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createAudioService } from '../../../services/audio/audio';
import { nextAudioQueueCursor } from '../../../services/audio/audio-queue';
import type { AudioTrack } from '../../../services/backend/types';
import { useAppStore } from '../../../state/store';
import {
  clipSeekPosition,
  clipWindow,
  normalizePlaybackSpeed,
  normalizeSkipInterval,
} from '../../../domain/audioPlayback';

import {
  AudioContext,
  type AudioControls,
  type AudioPlaybackState,
  type AudioSelection,
} from './audioContext';
export { useAudio } from './audioContext';
export { MiniPlayer } from '../components/MiniPlayer';
export type { AudioControls, AudioPlaybackState } from './audioContext';

const audioService = createAudioService(process.env.EXPO_PUBLIC_AUDIO_BASE_URL);
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
type PlaybackRequest = {
  token: number;
  tracks: AudioTrack[];
  index: number;
  round: number;
  rounds: number;
  uri: string | null;
  loading: boolean;
  paused: boolean;
  sourceFallback: boolean;
  selection: boolean;
  selectionRange: AudioSelection | null;
  startAt: number;
};
function validateTrack(track: AudioTrack) {
  if (
    (track.startSeconds === undefined) !== (track.endSeconds === undefined) ||
    (track.startSeconds !== undefined &&
      (!Number.isFinite(track.startSeconds) ||
        !Number.isFinite(track.endSeconds) ||
        track.startSeconds < 0 ||
        track.endSeconds! <= track.startSeconds))
  ) {
    throw new RangeError('Audio segment start and end must be valid seconds.');
  }
}

/** One player owns playback. Tokens cancel stale loads when a new track is selected. */
export function AudioProvider({ children }: React.PropsWithChildren) {
  const { state, dispatch } = useAppStore();
  const preferences = useRef(state.preferences);
  preferences.current = state.preferences;
  const player = useAudioPlayer(null, { updateInterval: 250, keepAudioSessionActive: true });
  const playback = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [status, setStatus] = useState<AudioPlaybackState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const request = useRef<PlaybackRequest>({
    token: 0,
    tracks: [],
    index: 0,
    round: 1,
    rounds: 1,
    uri: null,
    loading: false,
    paused: false,
    sourceFallback: false,
    selection: false,
    selectionRange: null,
    startAt: 0,
  });
  const handledFinish = useRef(-1);
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: true,
    }).catch(() => {
      setError('The device audio session could not be prepared. Try playing again.');
    });
    return () => {
      request.current.token++;
    };
  }, []);
  useEffect(() => {
    player.setPlaybackRate(normalizePlaybackSpeed(state.preferences.audioPlaybackSpeed));
  }, [player, state.preferences.audioPlaybackSpeed]);
  useEffect(() => {
    if (sleepEndsAt === null) return;
    const sample = () => {
      if (Date.now() >= sleepEndsAt) {
        request.current.paused = true;
        player.pause();
        setStatus('paused');
        setSleepEndsAt(null);
      }
    };
    const interval = setInterval(sample, 500);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') sample();
    });
    sample();
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [sleepEndsAt, player]);
  const begin = useCallback(
    async (next: AudioTrack, sourceFallback = false, startAt = next.startSeconds ?? 0) => {
      const current = request.current;
      const token = ++current.token;
      current.loading = true;
      current.sourceFallback = sourceFallback;
      current.startAt = startAt;
      setTrack(next);
      setError(null);
      setStatus('loading');
      try {
        const uri = sourceFallback
          ? next.sourceUrl
          : (next.localUri ?? audioService.getDownloadedUri(next) ?? audioService.resolve(next));
        player.pause();
        if (uri !== current.uri) {
          player.replace(uri);
          current.uri = uri;
          await delay(50);
        }
        const deadline = Date.now() + 30000;
        while (!player.isLoaded) {
          if (token !== request.current.token) return;
          if (Date.now() > deadline)
            throw new Error(
              'This recitation is taking too long to load. Check your connection and try again.',
            );
          await delay(100);
        }
        if (token !== request.current.token) return;
        const start = next.startSeconds ?? 0;
        const end = next.endSeconds ?? player.duration;
        const target = Math.max(start, end > 0 ? Math.min(startAt, end) : startAt);
        await player.seekTo(target);
        if (token !== request.current.token) return;
        current.startAt = target;
        current.loading = false;
        player.setPlaybackRate(normalizePlaybackSpeed(preferences.current.audioPlaybackSpeed));
        player.setActiveForLockScreen(true, {
          title: `Quran · Surah ${next.surah}`,
          artist: next.reciterName,
        });
        if (current.paused) setStatus('paused');
        else {
          player.play();
          setStatus('playing');
        }
      } catch (cause) {
        if (token !== request.current.token) return;
        current.loading = false;
        setError(cause instanceof Error ? cause.message : 'This recitation could not be opened.');
        setStatus('error');
      }
    },
    [player],
  );
  useEffect(() => {
    const current = request.current;
    if (!track) return;
    // Native error events can reset currentTime to zero. Keep the last healthy
    // sample so retry resumes the recording (and a timed selection) in place.
    if (!current.loading && !playback.error && Number.isFinite(player.currentTime)) {
      current.startAt = clipSeekPosition(
        player.currentTime - (track.startSeconds ?? 0),
        track.startSeconds,
        track.endSeconds,
        player.duration,
      );
    }
    if (playback.error) {
      if (!current.sourceFallback && current.uri !== track.sourceUrl) {
        void begin(track, true, Math.max(current.startAt, player.currentTime));
        return;
      }
      current.loading = false;
      setError(playback.error);
      setStatus('error');
      return;
    }
    if (current.loading || current.paused || handledFinish.current === current.token) return;
    const segmentFinished =
      track.endSeconds !== undefined &&
      playback.playing &&
      // A same-URI seek can complete before the next status event. The old
      // segment's end snapshot must not finish the newly started round.
      player.currentTime >= track.endSeconds;
    const trackFinished =
      playback.didJustFinish &&
      playback.duration > 0 &&
      player.currentTime >= playback.duration - 0.3;
    if (segmentFinished || trackFinished) {
      handledFinish.current = current.token;
      player.pause();
      if (!current.selection) {
        if (preferences.current.audioRepeatEnabled) {
          void begin(track);
          return;
        }
        if (preferences.current.audioAutoplayEnabled && track.surah < 114) {
          const token = current.token;
          current.loading = true;
          setStatus('loading');
          void audioService
            .listSurah(track.surah + 1)
            .then((options) => {
              if (request.current.token !== token) return;
              const next = options.find((item) => item.reciterId === track.reciterId);
              if (!next) {
                current.loading = false;
                setStatus('completed');
                return;
              }
              current.tracks = [next];
              current.index = 0;
              current.round = 1;
              void begin(next);
            })
            .catch(() => {
              if (request.current.token === token) {
                current.loading = false;
                setError('audio.error.unavailable');
                setStatus('error');
              }
            });
          return;
        }
        setStatus('completed');
        return;
      }
      const next = nextAudioQueueCursor(
        { index: current.index, round: current.round, rounds: current.rounds },
        current.tracks.length,
      );
      if (!next) {
        setStatus('completed');
        return;
      }
      current.index = next.index;
      current.round = next.round;
      void begin(current.tracks[next.index]!);
    } else if (playback.isBuffering) setStatus('loading');
    else if (playback.playing) setStatus('playing');
  }, [
    playback.error,
    playback.didJustFinish,
    playback.duration,
    playback.currentTime,
    playback.playing,
    playback.isBuffering,
    track,
    player,
    begin,
  ]);
  const controls = useMemo<AudioControls>(() => {
    function playQueue(tracks: AudioTrack[], rounds = 1, selectionRange?: AudioSelection) {
      if (!tracks.length || !Number.isInteger(rounds) || rounds < 0)
        throw new RangeError('Choose at least one track and a non-negative repeat count.');
      tracks.forEach(validateTrack);
      Object.assign(request.current, {
        tracks,
        index: 0,
        round: 1,
        rounds,
        paused: false,
        selection: true,
        selectionRange: selectionRange ?? null,
      });
      setSleepEndsAt(null);
      void begin(tracks[0]!);
    }
    const window = clipWindow(track?.startSeconds, track?.endSeconds, playback.duration);
    return {
      track,
      status,
      error,
      position: Math.max(0, Math.min(window.duration, playback.currentTime - window.start)),
      duration: window.duration,
      isPlaying:
        !request.current.paused && status !== 'completed' && status !== 'error' && playback.playing,
      rate: normalizePlaybackSpeed(state.preferences.audioPlaybackSpeed),
      skipInterval: normalizeSkipInterval(state.preferences.audioSkipIntervalSeconds),
      repeatEnabled: state.preferences.audioRepeatEnabled,
      autoplayEnabled: state.preferences.audioAutoplayEnabled,
      sleepEndsAt,
      selection: request.current.selection,
      selectionRange: request.current.selectionRange,
      queueIndex: request.current.index,
      queueLength: request.current.tracks.length,
      round: request.current.round,
      rounds: request.current.rounds,
      play(next) {
        validateTrack(next);
        Object.assign(request.current, {
          tracks: [next],
          index: 0,
          round: 1,
          rounds: 1,
          paused: false,
          selection: false,
          selectionRange: null,
        });
        void begin(next);
      },
      replaceTrack(next) {
        validateTrack(next);
        if (!track || next.surah !== track.surah || request.current.selection) return;
        const current = request.current;
        const startAt = current.loading ? current.startAt : player.currentTime;
        current.paused =
          current.paused ||
          status === 'paused' ||
          status === 'completed' ||
          (!current.loading && !playback.playing);
        Object.assign(current, {
          tracks: [next],
          index: 0,
          round: 1,
          rounds: 1,
          selectionRange: null,
        });
        void begin(next, false, startAt);
      },
      playQueue,
      async download(next) {
        return { ...next, localUri: await audioService.download(next) };
      },
      pause() {
        request.current.paused = true;
        player.pause();
        setStatus('paused');
      },
      resume() {
        if (!track) return;
        request.current.paused = false;
        if (request.current.loading) return;
        if (status === 'error' || status === 'completed') {
          if (status === 'error') request.current.uri = null;
          if (status === 'completed' && request.current.selection) {
            request.current.index = 0;
            request.current.round = 1;
            void begin(request.current.tracks[0]!);
          } else
            void begin(
              track,
              request.current.sourceFallback,
              status === 'error' ? request.current.startAt : (track.startSeconds ?? 0),
            );
          return;
        }
        player.play();
        setStatus('playing');
      },
      stop() {
        request.current.token++;
        request.current.tracks = [];
        request.current.uri = null;
        request.current.loading = false;
        request.current.selection = false;
        request.current.selectionRange = null;
        player.pause();
        player.replace(null);
        player.setActiveForLockScreen(false);
        setSleepEndsAt(null);
        setTrack(null);
        setStatus('idle');
        setError(null);
      },
      async seek(seconds) {
        if (!Number.isFinite(seconds) || !track) return;
        const token = request.current.token;
        const target = clipSeekPosition(
          seconds,
          track.startSeconds,
          track.endSeconds,
          playback.duration,
        );
        try {
          await player.seekTo(target);
          if (token === request.current.token) request.current.startAt = target;
        } catch {
          setError('The player could not seek to that point.');
        }
      },
      setRate(rate) {
        dispatch({
          type: 'preferences',
          patch: { audioPlaybackSpeed: normalizePlaybackSpeed(rate) },
        });
      },
      setSkipInterval(seconds) {
        dispatch({
          type: 'preferences',
          patch: { audioSkipIntervalSeconds: normalizeSkipInterval(seconds) },
        });
      },
      setRepeat(enabled) {
        dispatch({ type: 'preferences', patch: { audioRepeatEnabled: enabled } });
      },
      setAutoplay(enabled) {
        dispatch({ type: 'preferences', patch: { audioAutoplayEnabled: enabled } });
      },
      setSleepTimer(minutes) {
        setSleepEndsAt(
          minutes !== null && Number.isFinite(minutes) && minutes > 0
            ? Date.now() + minutes * 60_000
            : null,
        );
      },
    };
  }, [
    track,
    status,
    error,
    playback.currentTime,
    playback.duration,
    playback.playing,
    player,
    begin,
    state.preferences,
    dispatch,
    sleepEndsAt,
  ]);
  return <AudioContext.Provider value={controls}>{children}</AudioContext.Provider>;
}
