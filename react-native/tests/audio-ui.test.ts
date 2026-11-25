import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState } from '../src/state/models';
import * as quran from '../src/content/quran';
import * as playback from '../src/domain/audioPlayback';
import * as repeat from '../src/domain/repeat';
import * as selection from '../src/services/audio/repeatSelection';
import * as catalog from '../src/services/audio/audio-catalog';
import * as copy from '../src/features/audio/model/audioCopy';
import * as labels from '../src/features/audio/model/audioLabels';
import type { AudioTrack } from '../src/services/backend/types';
import { mountHookComponent } from './helpers/hook-component-harness';
import { nativePanResponder } from './helpers/native-pan-responder';

const track = (id = 1, name = 'Hafs reader', riwaya = 'Hafs'): AudioTrack => ({
  surah: 1,
  reciterId: id,
  reciterName: name,
  riwaya,
  url: `https://source.invalid/${id}.mp3`,
  sourceUrl: `https://source.invalid/${id}.mp3`,
});
function fixture(preferences: Partial<typeof initialState.preferences> = {}) {
  const state = { ...initialState, preferences: { ...initialState.preferences, ...preferences } };
  const calls: Array<{ kind: string; values: unknown[] }> = [];
  const record =
    (kind: string) =>
    (...values: unknown[]) => {
      calls.push({ kind, values });
    };
  const audio = {
    track: null as AudioTrack | null,
    selection: false,
    selectionRange: null,
    queueIndex: 0,
    queueLength: 0,
    round: 1,
    rounds: 2,
    status: 'paused',
    rate: 1,
    skipInterval: 10,
    position: 45,
    duration: 100,
    isPlaying: false,
    error: null,
    play: record('play'),
    replaceTrack: record('replace'),
    setRate: record('rate'),
    playQueue: record('queue'),
    seek: record('seek'),
    pause: record('pause'),
    resume: record('resume'),
    stop: record('stop'),
  };
  const store = {
    state,
    commit: async (action: { patch: object }) => {
      calls.push({ kind: 'commit', values: [action] });
      Object.assign(state.preferences, action.patch);
    },
  };
  const service = {
    listSurah: async () => [
      track(),
      track(2, 'Warsh reader', 'Warsh A Nafi'),
      track(3, 'Second Hafs reader', 'Hafs A Asim'),
    ],
    download: async () => 'file.mp3',
    getAyahTimings: async (_surah: number, _read: number, count: number) =>
      Array.from({ length: count }, (_, i) => ({ ayah: i + 1, start: i, end: i + 1 })),
  };
  const native = {
    ...Object.fromEntries(['ActivityIndicator', 'Pressable', 'View'].map((name) => [name, name])),
    StyleSheet: { create: (styles: unknown) => styles },
    PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
  };
  const modules = {
    'react-native': native,
    '../../../shared/components': {
      ...Object.fromEntries(
        [
          'Button',
          'Field',
          'Icon',
          'IconButton',
          'Notice',
          'ProgressBar',
          'Section',
          'Segments',
          'Sheet',
          'T',
        ].map((name) => [name, name]),
      ),
      s: { row: {}, listRow: {} },
    },
    '../../../shared/theme': {
      usePalette: () => ({ primary: '#183B30', line: '#ddd', muted: '#567', surface: '#fff' }),
    },
    '../../../i18n': {
      useI18n: () => ({
        locale: 'en',
        t: (value: string) => value,
        format: (value: string, ...args: unknown[]) => `${value}:${args.join(',')}`,
      }),
    },
    '../../../state/store': { useAppStore: () => store },
    '../../../domain/audioPlayback': playback,
    '../../../domain/repeat': repeat,
    '../../../services/audio/audio': { createAudioService: () => service },
    '../../../services/audio/audio-catalog': catalog,
    '../../../services/audio/repeatSelection': selection,
    '../../../content/quran': quran,
    '../providers/audioContext': { useAudio: () => audio },
    '../model/audioCopy': copy,
    '../model/audioLabels': labels,
    './RepeatSheet': { RepeatSheet: 'RepeatSheet' },
    './AudioSeekBar': { AudioSeekBar: 'AudioSeekBar' },
  };
  return { modules, calls, audio, store, service };
}
const mountMedia = (f: ReturnType<typeof fixture>, props: Record<string, unknown> = {}) =>
  mountHookComponent(
    'src/features/audio/components/MediaSettings.tsx',
    'MediaSettings',
    f.modules,
    { surah: 1, ...props },
  );

test('actual media selection saves without starting, filters names and riwaya, and has a separate start action', async () => {
  const f = fixture();
  const app = mountMedia(f);
  await app.settle();
  app.find('Field').props.onChangeText('warsh');
  await app.settle();
  assert.equal(app.nodes.filter((node) => node.props.accessibilityRole === 'radio').length, 1);
  app.find('Pressable', (node) => node.props.testID === 'audio-reciter-2').props.onPress();
  await app.settle();
  assert.equal(f.store.state.preferences.reciterId, 2);
  assert.deepEqual(
    f.calls.map((call) => call.kind),
    ['commit'],
  );
  app.find('Button', (node) => node.props.title === 'Start now').props.onPress();
  await app.settle();
  assert.deepEqual(
    f.calls.map((call) => call.kind),
    ['commit', 'commit', 'play'],
  );
  app.find('Field').props.onChangeText('');
  app.find('Segments', (node) => node.props.value === 'all').props.onChange('Hafs');
  await app.settle();
  assert.equal(app.nodes.filter((node) => node.props.accessibilityRole === 'radio').length, 2);
  const reopened = mountMedia(f);
  await reopened.settle();
  assert.equal(
    reopened.find('Pressable', (node) => node.props.testID === 'audio-reciter-2').props
      .accessibilityState.selected,
    true,
  );
});

test('actual media choice replaces an existing paused surah through the preservation API; failed storage cannot change playback', async () => {
  const f = fixture();
  f.audio.track = track();
  const app = mountMedia(f);
  await app.settle();
  app.find('Pressable', (node) => node.props.testID === 'audio-reciter-2').props.onPress();
  await app.settle();
  assert.deepEqual(
    f.calls.map((call) => call.kind),
    ['commit', 'replace'],
  );
  f.store.commit = async () => {
    throw new Error('Disk full');
  };
  app.render();
  app.find('Pressable', (node) => node.props.testID === 'audio-reciter-3').props.onPress();
  await app.settle();
  assert.equal(f.calls.filter((call) => call.kind === 'play' || call.kind === 'replace').length, 1);
  assert.ok(app.find('Notice').props.error);
});

test('reader reciter-only mode opens the actual searchable choices without general playback controls', async () => {
  const f = fixture();
  f.audio.track = track();
  let selected = 0;
  const app = mountMedia(f, { recitersOnly: true, onSelected: () => selected++ });
  await app.settle();
  assert.equal(
    app.nodes.some((node) => node.type === 'Button' && node.props.title === 'Start now'),
    false,
  );
  assert.equal(
    app.nodes.some(
      (node) => node.type === 'Section' && node.props.title === 'app.quranAudioPlaybackSpeed',
    ),
    false,
  );
  assert.equal(app.find('Field').props.label, 'Search reciters');
  assert.equal(app.nodes.filter((node) => node.props.accessibilityRole === 'radio').length, 3);
  app.find('Pressable', (node) => node.props.testID === 'audio-reciter-2').props.onPress();
  await app.settle();
  assert.equal(selected, 1);
  assert.deepEqual(
    f.calls.map((call) => call.kind),
    ['commit', 'replace'],
  );
  f.store.commit = async () => {
    throw new Error('Disk full');
  };
  app.render();
  app.find('Pressable', (node) => node.props.testID === 'audio-reciter-3').props.onPress();
  await app.settle();
  assert.equal(selected, 1, 'a failed choice must stay open with its error');
  assert.ok(app.find('Notice').props.error);
});

test('actual repeat callback defaults to current page, waits for saving, locks double taps and counts the first pass', async () => {
  const f = fixture();
  let release: (() => void) | undefined;
  f.store.commit = async () =>
    new Promise<void>((resolve) => {
      release = resolve;
    });
  let closed = 0;
  const app = mountHookComponent(
    'src/features/audio/components/RepeatSheet.tsx',
    'RepeatSheet',
    f.modules,
    {
      visible: true,
      onClose: () => {
        closed++;
      },
      surah: 1,
      currentPage: 1,
      pageEdition: 'hafs_maknoon',
    },
  );
  assert.equal(app.find('Segments').props.value, 'page');
  const start = app.find('Button', (node) => node.props.title === 'repeat.start');
  start.props.onPress();
  start.props.onPress();
  await app.settle();
  assert.equal(f.calls.length, 0);
  assert.equal(closed, 0);
  release!();
  await app.settle();
  assert.equal(closed, 1);
  const queued = f.calls.find((call) => call.kind === 'queue')!;
  assert.equal((queued.values[0] as AudioTrack[]).length, 7);
  assert.equal(queued.values[1], 2);
  assert.equal(
    JSON.stringify(queued.values[2]),
    JSON.stringify({ mode: 'page', first: 1, last: 1 }),
  );
});

test('actual Warsh sheet exposes printed numbers and persists its independent reciter and rounds', async () => {
  const f = fixture({ audioRepeatWarshReciter: 'husary_warsh', audioRepeatRounds: 5 });
  const app = mountHookComponent(
    'src/features/audio/components/RepeatSheet.tsx',
    'RepeatSheet',
    f.modules,
    { visible: true, onClose() {}, surah: 1, warsh: true, initialAyah: 2 },
  );
  assert.equal(app.find('Segments').props.value, 'ayahs');
  assert.equal(app.find('Field', (node) => node.props.label === 'repeat.from').props.value, '1');
  assert.equal(
    app.find('Pressable', (node) => node.props.testID === 'repeat-reciter-husary_warsh').props
      .accessibilityState.selected,
    true,
  );
  app.find('Button', (node) => node.props.title === 'repeat.start').props.onPress();
  await app.settle();
  const queued = f.calls.find((call) => call.kind === 'queue')!;
  assert.equal((queued.values[0] as AudioTrack[]).length, 1);
  assert.equal((queued.values[0] as AudioTrack[])[0]!.ayah, 1);
  assert.equal(queued.values[1], 5);
  assert.equal(f.store.state.preferences.audioRepeatHafsReciter, 'alafasy');
});

test('dismissing a repeat sheet while timings load cannot start audio later', async () => {
  const f = fixture({ audioRepeatWarshReciter: 'husary_warsh' });
  let release: (() => void) | undefined;
  const original = f.service.getAyahTimings;
  f.service.getAyahTimings = async (...args) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return original(...args);
  };
  const app = mountHookComponent(
    'src/features/audio/components/RepeatSheet.tsx',
    'RepeatSheet',
    f.modules,
    { visible: true, onClose() {}, surah: 1, warsh: true },
  );
  app.find('Button', (node) => node.props.title === 'repeat.start').props.onPress();
  await app.settle();
  app.update({ visible: false });
  release!();
  await app.settle();
  assert.equal(f.calls.length, 0);
});

test('saving a timed Warsh selection downloads its shared recording once and never starts playback', async () => {
  const f = fixture({ audioRepeatWarshReciter: 'husary_warsh' });
  let downloads = 0;
  f.service.download = async () => {
    downloads++;
    return 'file.mp3';
  };
  const app = mountHookComponent(
    'src/features/audio/components/RepeatSheet.tsx',
    'RepeatSheet',
    f.modules,
    { visible: true, onClose() {}, surah: 1, warsh: true },
  );
  app.find('Button', (node) => node.props.title === 'Save selection offline').props.onPress();
  await app.settle();
  assert.equal(downloads, 1);
  assert.equal(
    f.calls.some((call) => call.kind === 'play' || call.kind === 'queue'),
    false,
  );
  assert.ok(
    app.nodes.find(
      (node) => node.type === 'T' && node.children.includes('This selection is available offline.'),
    ),
  );
});

test('saving a Hafs range downloads each verse and surfaces a failure without starting a partial selection', async () => {
  const f = fixture();
  let downloads = 0;
  f.service.download = async () => {
    if (++downloads === 2) throw new Error('Offline');
    return 'file.mp3';
  };
  const app = mountHookComponent(
    'src/features/audio/components/RepeatSheet.tsx',
    'RepeatSheet',
    f.modules,
    { visible: true, onClose() {}, surah: 1, initialAyah: 1, initialEndAyah: 3 },
  );
  app.find('Button', (node) => node.props.title === 'Save selection offline').props.onPress();
  await app.settle();
  assert.equal(downloads, 2);
  assert.ok(app.find('Notice').props.error);
  assert.equal(
    f.calls.some((call) => call.kind === 'play' || call.kind === 'queue'),
    false,
  );
});

test('compact mini player opens the player page on tap and upward swipe; repeat, pause/resume and stop are one tap away', async () => {
  const f = fixture();
  f.audio.track = track();
  let opens = 0;
  const app = mountHookComponent(
    'src/features/audio/components/MiniPlayer.tsx',
    'MiniPlayer',
    f.modules,
    { onOpen: () => opens++ },
  );
  app.find('Pressable', (node) => node.props.testID === 'audio-mini-expand').props.onPress();
  assert.equal(opens, 1);
  const player = app.find('View', (node) => node.props.testID === 'audio-mini-player');
  assert.equal(player.props.onMoveShouldSetPanResponder(null, { dx: 2, dy: -20 }), true);
  assert.equal(player.props.onMoveShouldSetPanResponder(null, { dx: 40, dy: -20 }), false);
  player.props.onPanResponderRelease(null, { dx: 0, dy: -25 });
  assert.equal(opens, 2);
  assert.equal(app.find('RepeatSheet').props.visible, false);
  app.find('IconButton', (node) => node.props.name === 'repeat').props.onPress();
  await app.settle();
  assert.equal(app.find('RepeatSheet').props.visible, true);
  assert.equal(app.find('RepeatSheet').props.surah, 1);
  app.find('RepeatSheet').props.onClose();
  await app.settle();
  app.find('IconButton', (node) => node.props.name === 'play').props.onPress();
  app.find('IconButton', (node) => node.props.name === 'x').props.onPress();
  assert.deepEqual(f.calls, [
    { kind: 'resume', values: [] },
    { kind: 'stop', values: [] },
  ]);
});

test('actual seek bar maps pointer and accessibility actions to the same audio seconds', async () => {
  const f = fixture();
  const app = mountHookComponent(
    'src/features/audio/components/AudioSeekBar.tsx',
    'AudioSeekBar',
    f.modules,
  );
  app.find('Pressable').props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  await app.settle();
  app.find('Pressable').props.onPress({ nativeEvent: { locationX: 50 } });
  app.find('Pressable').props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  assert.deepEqual(f.calls, [
    { kind: 'seek', values: [25] },
    { kind: 'seek', values: [55] },
  ]);
});

test('native mini upward move survives should-set, grant reset and immediate release', async () => {
  const f = fixture();
  f.audio.track = track();
  f.modules['react-native'].PanResponder = nativePanResponder();
  let opens = 0;
  const app = mountHookComponent(
    'src/features/audio/components/MiniPlayer.tsx',
    'MiniPlayer',
    f.modules,
    { onOpen: () => opens++ },
  );
  const player = app.find('View', (node) => node.props.testID === 'audio-mini-player');
  const touch = {
    touchActive: true,
    startPageX: 157,
    startPageY: 755,
    currentPageX: 157,
    currentPageY: 755,
    previousPageX: 157,
    previousPageY: 755,
    currentTimeStamp: 1,
    previousTimeStamp: 0,
    startTimeStamp: 1,
  };
  const history = {
    touchBank: [touch],
    numberActiveTouches: 1,
    indexOfSingleActiveTouch: 0,
    mostRecentTimeStamp: 1,
  };
  const event = () => ({
    nativeEvent: {
      touches: touch.touchActive ? [touch] : [],
      pageX: touch.currentPageX,
      pageY: touch.currentPageY,
    },
    touchHistory: history,
  });
  assert.equal(player.props.onStartShouldSetResponderCapture(event()), false);
  assert.equal(player.props.onStartShouldSetResponder(event()), false);
  touch.currentPageY = 530;
  touch.currentTimeStamp = history.mostRecentTimeStamp = 20;
  const captured = player.props.onMoveShouldSetResponderCapture(event());
  assert.equal(captured || player.props.onMoveShouldSetResponder(event()), true);
  player.props.onResponderGrant(event());
  // RN suppresses the move already processed during should-set; grant reset dy to zero.
  player.props.onResponderMove(event());
  touch.touchActive = false;
  history.numberActiveTouches = 0;
  player.props.onResponderRelease(event());
  await app.settle();
  assert.equal(opens, 1);
});
