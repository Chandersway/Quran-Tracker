import { createContext, useContext } from 'react';
import type { AudioTrack } from '../../../services/backend/types';
import type { AudioSelection } from '../../../domain/repeat';
export type { AudioSelection } from '../../../domain/repeat';

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
export type AudioControls = {
  track: AudioTrack | null;
  status: AudioPlaybackState;
  position: number;
  duration: number;
  isPlaying: boolean;
  error: string | null;
  rate: number;
  skipInterval: 5 | 10;
  repeatEnabled: boolean;
  autoplayEnabled: boolean;
  sleepEndsAt: number | null;
  selection: boolean;
  selectionRange: AudioSelection | null;
  queueIndex: number;
  queueLength: number;
  round: number;
  rounds: number;
  play(track: AudioTrack): void;
  /** Replace the current surah recording without restarting or resuming a paused player. */
  replaceTrack(track: AudioTrack): void;
  playQueue(tracks: AudioTrack[], rounds?: number, selection?: AudioSelection): void;
  download(track: AudioTrack): Promise<AudioTrack>;
  pause(): void;
  resume(): void;
  stop(): void;
  seek(seconds: number): Promise<void>;
  setRate(rate: number): void;
  setSkipInterval(seconds: number): void;
  setRepeat(enabled: boolean): void;
  setAutoplay(enabled: boolean): void;
  setSleepTimer(minutes: number | null): void;
};
export const AudioContext = createContext<AudioControls | null>(null);
export function useAudio(): AudioControls {
  const context = useContext(AudioContext);
  if (!context) throw new Error('AudioProvider is missing');
  return context;
}
