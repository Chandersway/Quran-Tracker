import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as queue from '../src/services/audio/audio-queue';
import * as playbackDomain from '../src/domain/audioPlayback';
import type { AudioTrack } from '../src/services/backend/types';
import type { AudioControls } from '../src/features/audio/providers/audioContext';

function track(surah: number, startSeconds?: number, endSeconds?: number): AudioTrack {
  return {
    surah,
    reciterId: 1,
    reciterName: 'Fixture',
    riwaya: 'Hafs',
    sourceUrl: `https://example.invalid/${surah}.mp3`,
    url: `https://example.invalid/${surah}.mp3`,
    startSeconds,
    endSeconds,
  };
}

/** Real AudioProvider hook/effect wiring; native status deliberately lags seeks. */
function mount(
  preferences: Record<string, unknown> = {},
  listSurah = async (surah: number) => [track(surah)],
  downloadedUri: string | null = null,
) {
  let index = 0;
  let dirty = false;
  const slots: unknown[] = [];
  const effects: Array<() => void> = [];
  const same = (a: unknown[], b: unknown[]) =>
    a.length === b.length && a.every((value, i) => value === b[i]);
  let controls: AudioControls;
  let status = {
    currentTime: 0,
    duration: 100,
    playing: false,
    didJustFinish: false,
    isBuffering: false,
    error: null as string | null,
  };
  const seeks: number[] = [];
  const sources: Array<string | null> = [];
  let now = 100000;
  const intervals = new Set<() => void>();
  const rates: number[] = [];
  const player = {
    isLoaded: true,
    currentTime: 0,
    duration: 100,
    pause() {},
    play() {},
    replace(uri: string | null) {
      sources.push(uri);
      player.currentTime = 0;
    },
    async seekTo(time: number) {
      seeks.push(time);
      player.currentTime = time;
    },
    setPlaybackRate(rate: number) {
      rates.push(rate);
    },
    setActiveForLockScreen() {},
  };
  const react = {
    createElement(_type: unknown, props: { value: AudioControls }) {
      controls = props.value;
      return null;
    },
    useRef(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: value };
      return slots[slot];
    },
    useState(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof value === 'function' ? value() : value;
      return [
        slots[slot],
        (next: unknown) => {
          const result = typeof next === 'function' ? next(slots[slot]) : next;
          if (!Object.is(result, slots[slot])) {
            slots[slot] = result;
            dirty = true;
          }
        },
      ];
    },
    useMemo(fn: () => unknown, deps: unknown[]) {
      const slot = index++;
      const old = slots[slot] as { deps: unknown[]; value: unknown } | undefined;
      if (!old || !same(old.deps, deps)) slots[slot] = { deps, value: fn() };
      return (slots[slot] as { value: unknown }).value;
    },
    useCallback(fn: unknown, deps: unknown[]) {
      return react.useMemo(() => fn, deps);
    },
    useEffect(fn: () => void, deps: unknown[]) {
      const slot = index++;
      const old = slots[slot] as unknown[] | undefined;
      if (!old || !same(old, deps)) {
        slots[slot] = deps;
        effects.push(fn);
      }
    },
  };
  const state = {
    preferences: {
      audioPlaybackSpeed: 1,
      audioSkipIntervalSeconds: 10,
      audioAutoplayEnabled: false,
      audioRepeatEnabled: false,
      ...preferences,
    },
  };
  const dispatch = (action: { patch: object }) => {
    state.preferences = { ...state.preferences, ...action.patch };
    dirty = true;
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      StyleSheet: { create: (value: unknown) => value },
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    'expo-audio': {
      setAudioModeAsync: async () => {},
      useAudioPlayer: () => player,
      useAudioPlayerStatus: () => status,
    },
    '../../../services/audio/audio': {
      createAudioService: () => ({
        resolve: (item: AudioTrack) => item.sourceUrl,
        getDownloadedUri: () => downloadedUri,
        listSurah,
      }),
    },
    '../../../services/audio/audio-queue': queue,
    '../../../shared/components': {},
    '../../../shared/theme': {},
    '../../../state/store': { useAppStore: () => ({ state, dispatch }) },
    '../../../domain/audioPlayback': playbackDomain,
    '../../../i18n': {},
    '../components/AudioPlayerSheet': {},
    '../components/MiniPlayer': {},
    './audioContext': { AudioContext: { Provider: 'Provider' } },
  };
  const exports: { AudioProvider?: (props: unknown) => void } = {};
  const code = ts.transpileModule(
    readFileSync('src/features/audio/providers/AudioProvider.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    process: { env: {} },
    Date: { now: () => now },
    setInterval(fn: () => void) {
      intervals.add(fn);
      return fn;
    },
    clearInterval(fn: () => void) {
      intervals.delete(fn);
    },
    setTimeout: (fn: () => void) => {
      queueMicrotask(fn);
      return 1;
    },
    require(name: string) {
      assert.ok(name in modules, `Unexpected dependency ${name}`);
      return modules[name];
    },
  });
  function render() {
    dirty = false;
    index = 0;
    exports.AudioProvider!({ children: null });
    effects.splice(0).forEach((fn) => fn());
  }
  render();
  return {
    get controls() {
      return controls!;
    },
    player,
    seeks,
    sources,
    rates,
    advance(milliseconds: number) {
      now += milliseconds;
      intervals.forEach((fn) => fn());
    },
    async settle() {
      // React batches the synchronous state writes and an already-resolved
      // native seek promise before the next render. Status events are separate.
      for (let i = 0; i < 12; i++) {
        await new Promise<void>((resolve) => setImmediate(resolve));
        if (dirty) render();
      }
      assert.equal(dirty, false, 'provider must settle');
    },
    emit(next: Partial<typeof status>) {
      status = { ...status, ...next };
      if (next.currentTime !== undefined) player.currentTime = next.currentTime;
      render();
    },
  };
}

test('two timed clips sharing a URI play twice without stale completion skipping the next round', async () => {
  const app = mount();
  app.controls.playQueue([track(1, 0, 1), track(1, 1, 2)], 2);
  await app.settle();
  assert.deepEqual(app.seeks, [0]);
  app.emit({ currentTime: 1, playing: true });
  await app.settle();
  assert.deepEqual(app.seeks, [0, 1]);
  app.emit({ currentTime: 2, playing: true });
  await app.settle();
  assert.deepEqual(
    app.seeks,
    [0, 1, 0],
    'round two must wait for its own native progress after seek',
  );
  assert.equal(app.controls.round, 2);
  assert.equal(app.controls.status, 'playing');
  app.emit({ currentTime: 0.25, playing: true });
  await app.settle();
  assert.deepEqual(app.seeks, [0, 1, 0]);
  app.emit({ currentTime: 1, playing: true });
  await app.settle();
  assert.deepEqual(app.seeks, [0, 1, 0, 1]);
  app.emit({ currentTime: 2, playing: true });
  await app.settle();
  assert.equal(app.controls.status, 'completed');
  assert.deepEqual(app.sources, ['https://example.invalid/1.mp3']);
});

test('whole-surah completion autoplays exactly the next surah with the same reciter', async () => {
  const requested: number[] = [];
  const app = mount({ audioAutoplayEnabled: true }, async (surah) => {
    requested.push(surah);
    return [{ ...track(surah), reciterId: 2 }, track(surah)];
  });
  app.controls.play(track(95));
  await app.settle();
  app.emit({ currentTime: 36, duration: 36, playing: false, didJustFinish: true });
  await app.settle();
  assert.deepEqual(requested, [96]);
  assert.equal(app.controls.track?.surah, 96);
  assert.equal(app.controls.track?.reciterId, 1);
  assert.equal(app.controls.status, 'playing');
  assert.deepEqual(app.seeks, [0, 0]);
});

test('a stale autoplay lookup cannot replace a newer user selection', async () => {
  let finish: ((tracks: AudioTrack[]) => void) | undefined;
  const app = mount(
    { audioAutoplayEnabled: true },
    () =>
      new Promise<AudioTrack[]>((resolve) => {
        finish = resolve;
      }),
  );
  app.controls.play(track(95));
  await app.settle();
  app.emit({ currentTime: 36, duration: 36, playing: false, didJustFinish: true });
  await app.settle();
  app.controls.play(track(112));
  await app.settle();
  finish!([track(96)]);
  await app.settle();
  assert.equal(app.controls.track?.surah, 112);
  assert.deepEqual(app.sources, [
    'https://example.invalid/95.mp3',
    'https://example.invalid/112.mp3',
  ]);
});

test('a completed full-surah selection stays completed when autoplay is off', async () => {
  const app = mount();
  app.controls.play(track(114));
  await app.settle();
  app.emit({ currentTime: 36, duration: 36, playing: false, didJustFinish: true });
  await app.settle();
  assert.equal(app.controls.status, 'completed');
  assert.deepEqual(app.seeks, [0]);
});

test('a late seek completion from a previous load cannot resume over a newer selection', async () => {
  const app = mount();
  const originalSeek = app.player.seekTo;
  let resolveFirst: (() => void) | undefined;
  let first = true;
  let plays = 0;
  app.player.play = () => {
    plays++;
  };
  app.player.seekTo = async (time) => {
    if (first) {
      first = false;
      await new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });
      return;
    }
    await originalSeek(time);
  };
  app.controls.play(track(95));
  await app.settle();
  assert.equal(app.controls.status, 'loading');
  app.controls.play(track(112));
  await app.settle();
  assert.equal(plays, 1);
  assert.equal(app.controls.track?.surah, 112);
  resolveFirst!();
  await app.settle();
  assert.equal(plays, 1, 'the stale request may not issue play after its seek resolves');
  assert.equal(app.controls.track?.surah, 112);
  assert.equal(app.controls.status, 'playing');
});

test('replacing a paused reciter preserves 45 seconds and never resumes playback', async () => {
  const app = mount();
  let plays = 0;
  app.player.play = () => {
    plays++;
  };
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 45, playing: true });
  app.controls.pause();
  await app.settle();
  app.controls.replaceTrack({
    ...track(1),
    reciterId: 2,
    sourceUrl: 'https://example.invalid/replacement.mp3',
  });
  await app.settle();
  assert.equal(app.player.currentTime, 45);
  assert.equal(app.controls.status, 'paused');
  assert.equal(app.controls.isPlaying, false);
  assert.equal(plays, 1);
  assert.deepEqual(app.seeks, [0, 45]);
});

test('replacing a playing reciter preserves seconds while explicit start restarts', async () => {
  const app = mount();
  let plays = 0;
  app.player.play = () => {
    plays++;
  };
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 45, playing: true });
  const replacement = {
    ...track(1),
    reciterId: 2,
    sourceUrl: 'https://example.invalid/replacement.mp3',
  };
  app.controls.replaceTrack(replacement);
  await app.settle();
  assert.equal(app.player.currentTime, 45);
  assert.equal(app.controls.status, 'playing');
  assert.equal(plays, 2);
  app.controls.play(replacement);
  await app.settle();
  assert.equal(app.player.currentTime, 0);
  assert.deepEqual(app.seeks, [0, 45, 0]);
});

test('replacement clamps to the new recording duration and does not change another surah or selection', async () => {
  const app = mount();
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 45, playing: true });
  app.player.duration = 30;
  app.controls.replaceTrack({
    ...track(1),
    reciterId: 2,
    sourceUrl: 'https://example.invalid/shorter.mp3',
  });
  await app.settle();
  assert.equal(app.player.currentTime, 30);
  app.controls.replaceTrack(track(2));
  await app.settle();
  assert.equal(app.controls.track?.surah, 1);
  app.controls.playQueue([track(1, 0, 1)], 2, { mode: 'page', first: 1, last: 1 });
  await app.settle();
  app.controls.replaceTrack(track(1));
  await app.settle();
  assert.equal(app.controls.selection, true);
  assert.deepEqual(app.controls.selectionRange, { mode: 'page', first: 1, last: 1 });
});

test('a newer reciter replacement cancels the earlier seek and retains its intended paused time', async () => {
  const app = mount();
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 45, playing: true });
  app.controls.pause();
  await app.settle();
  let release: (() => void) | undefined;
  const originalSeek = app.player.seekTo;
  let first = true;
  app.player.seekTo = async (seconds) => {
    if (first) {
      first = false;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    } else await originalSeek(seconds);
  };
  app.controls.replaceTrack({
    ...track(1),
    reciterId: 2,
    sourceUrl: 'https://example.invalid/second.mp3',
  });
  await app.settle();
  app.controls.replaceTrack({
    ...track(1),
    reciterId: 3,
    sourceUrl: 'https://example.invalid/third.mp3',
  });
  await app.settle();
  release!();
  await app.settle();
  assert.equal(app.controls.track?.reciterId, 3);
  assert.equal(app.player.currentTime, 45);
  assert.equal(app.controls.status, 'paused');
});

test('native playback prefers a verified local download and sleep pauses it at the deadline', async () => {
  const app = mount({}, undefined, 'file:///offline/001.mp3');
  let pauses = 0;
  app.player.pause = () => {
    pauses++;
  };
  app.controls.play(track(1));
  await app.settle();
  assert.deepEqual(app.sources, ['file:///offline/001.mp3']);
  app.controls.setSleepTimer(1);
  await app.settle();
  app.advance(59999);
  await app.settle();
  assert.equal(app.controls.status, 'playing');
  app.advance(1);
  await app.settle();
  assert.equal(app.controls.status, 'paused');
  assert.equal(app.controls.sleepEndsAt, null);
  assert.equal(pauses, 2);
});

test('all six speed options and both skip intervals update real provider preferences', async () => {
  const app = mount();
  for (const rate of playbackDomain.playbackSpeeds) {
    app.controls.setRate(rate);
    await app.settle();
    assert.equal(app.controls.rate, rate);
    assert.equal(app.rates.at(-1), rate);
  }
  for (const skip of [5, 10]) {
    app.controls.setSkipInterval(skip);
    await app.settle();
    assert.equal(app.controls.skipInterval, skip);
  }
});

test('track loop precedes autoplay and replaying a completed selection resets its full queue', async () => {
  let lookups = 0;
  const app = mount({ audioRepeatEnabled: true, audioAutoplayEnabled: true }, async (surah) => {
    lookups++;
    return [track(surah)];
  });
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 100, duration: 100, playing: false, didJustFinish: true });
  await app.settle();
  assert.equal(lookups, 0);
  assert.deepEqual(app.seeks, [0, 0]);
  app.controls.playQueue([track(1, 0, 1), track(1, 1, 2)], 1);
  await app.settle();
  app.emit({ currentTime: 1, playing: true, didJustFinish: false });
  await app.settle();
  app.emit({ currentTime: 2, playing: true });
  await app.settle();
  assert.equal(app.controls.status, 'completed');
  app.controls.resume();
  await app.settle();
  assert.equal(app.controls.queueIndex, 0);
  assert.equal(app.controls.round, 1);
  assert.equal(app.player.currentTime, 0);
});

test('a failing cached source falls back to the original recording while preserving pause and seconds', async () => {
  const app = mount({}, undefined, 'file:///offline/001.mp3');
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 45, playing: true });
  app.controls.pause();
  await app.settle();
  app.emit({ error: 'Cached recording failed', playing: false });
  await app.settle();
  assert.deepEqual(app.sources, ['file:///offline/001.mp3', 'https://example.invalid/1.mp3']);
  assert.equal(app.player.currentTime, 45);
  assert.equal(app.controls.status, 'paused');
});

test('retry after a source error reloads the recording instead of waiting on its failed native source', async () => {
  const app = mount();
  app.controls.play(track(1));
  await app.settle();
  app.emit({ error: 'Source failed' });
  await app.settle();
  assert.equal(app.controls.status, 'error');
  app.controls.resume();
  await app.settle();
  assert.deepEqual(app.sources, ['https://example.invalid/1.mp3', 'https://example.invalid/1.mp3']);
  assert.equal(app.controls.status, 'playing');
});

test('retry retains the last confirmed playback position even when the failed native source resets its clock', async () => {
  const app = mount();
  app.controls.play(track(1));
  await app.settle();
  app.emit({ currentTime: 45, playing: true });
  await app.settle();
  app.emit({ error: 'Network failure', currentTime: 0, playing: false });
  await app.settle();
  app.controls.resume();
  await app.settle();
  assert.equal(app.player.currentTime, 45);
  assert.deepEqual(app.seeks, [0, 45]);
});

test('retry of a timed selection retains a completed backward seek before the next status event', async () => {
  const app = mount();
  app.controls.playQueue([track(1, 20, 70)], 2);
  await app.settle();
  app.emit({ currentTime: 55, playing: true });
  await app.settle();
  await app.controls.seek(5);
  app.emit({ error: 'Network failure', currentTime: 0, playing: false });
  await app.settle();
  app.controls.resume();
  await app.settle();
  assert.equal(app.player.currentTime, 25);
  assert.deepEqual(app.seeks, [20, 25, 25]);
  assert.equal(app.controls.queueIndex, 0);
  assert.equal(app.controls.round, 1);
});
