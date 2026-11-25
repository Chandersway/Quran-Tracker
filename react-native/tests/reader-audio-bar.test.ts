import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterById } from '../src/content/quran';
import { playbackSpeeds } from '../src/domain/audioPlayback';
import { audioTime } from '../src/features/audio/model/audioLabels';
import { readerAudioCopy } from '../src/features/audio/model/readerAudioCopy';
import { light } from '../src/shared/theme/colors';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
} from './helpers/componentHarness';

function mount() {
  const hooks = componentHarness();
  let hides = 0,
    starts = 0,
    pauses = 0,
    resumes = 0,
    stops = 0;
  const offset = { x: 0, y: 0 };
  const audio = {
    track: { surah: 2, reciterName: 'Mishary Alafasy' },
    isPlaying: true,
    status: 'playing',
    duration: 180,
    position: 45,
    rate: 1,
    error: null as string | null,
    pause() {
      pauses++;
      audio.isPlaying = false;
      audio.status = 'paused';
    },
    resume() {
      resumes++;
      audio.isPlaying = true;
      audio.status = 'playing';
    },
    stop() {
      stops++;
    },
    setRate(value: number) {
      audio.rate = value;
    },
  };
  const { ReaderAudioBar } = loadComponentModule<{ ReaderAudioBar: (props: object) => unknown }>(
    new URL('../src/features/audio/components/ReaderAudioBar.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': {
        ActivityIndicator: 'ActivityIndicator',
        Pressable: 'Pressable',
        View: 'View',
        Animated: {
          View: 'AnimatedView',
          ValueXY: class {
            setValue(value: typeof offset) {
              Object.assign(offset, value);
            }
            getTranslateTransform() {
              return [];
            }
          },
        },
        PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
      },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 20 }) },
      '../../../content/quran': { chapterById },
      '../../../domain/audioPlayback': { playbackSpeeds },
      '../../../i18n': { useI18n: () => ({ locale: 'nl', t: (key: string) => key }) },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => light },
      '../model/audioLabels': { audioTime },
      '../model/readerAudioCopy': { readerAudioCopy },
      '../providers/audioContext': { useAudio: () => audio },
      './MediaSettings': { MediaSettingsSheet: 'MediaSettingsSheet' },
      './RepeatSheet': { RepeatSheet: 'RepeatSheet' },
      '../model/audioCopy': { audioCopy: (_locale: string, key: string) => key },
    },
  );
  return {
    audio,
    offset,
    get hides() {
      return hides;
    },
    get starts() {
      return starts;
    },
    get pauses() {
      return pauses;
    },
    get resumes() {
      return resumes;
    },
    get stops() {
      return stops;
    },
    render: () =>
      hooks.render(() =>
        ReaderAudioBar({ surah: 2, onListen: () => starts++, onDismiss: () => hides++ }),
      ),
  };
}

test('the reader bar exposes the selected reciter directly and uses the existing reciter sheet', () => {
  const app = mount();
  let tree = app.render();
  const bar = findElement(tree, 'AnimatedView', 'testID', 'reader-audio-bar');
  assert.equal((bar.props.style as Record<string, unknown>).bottom, 28);
  const reciter = findElement(tree, 'Pressable', 'testID', 'reader-audio-reciter');
  assert.match(reciter.props.accessibilityLabel as string, /Reciteur kiezen.*Mishary Alafasy/);
  assert.equal(elements(tree, 'MediaSettingsSheet')[0]!.props.visible, false);
  press(reciter);
  tree = app.render();
  const chooser = elements(tree, 'MediaSettingsSheet')[0]!;
  assert.equal(chooser.props.visible, true);
  assert.equal(chooser.props.surah, 2);
  assert.equal(
    chooser.props.recitersOnly,
    true,
    'the bar opens the chooser rather than general playback settings',
  );
  (chooser.props.onClose as () => void)();
  assert.equal(elements(app.render(), 'MediaSettingsSheet')[0]!.props.visible, false);
  assert.equal(app.hides, 0);
  assert.equal(app.stops, 0);
});

test('compact playback and speed controls operate on the same active central queue', () => {
  const app = mount();
  let tree = app.render();
  press(findElement(tree, 'IconButton', 'name', 'pause'));
  assert.equal(app.pauses, 1);
  tree = app.render();
  press(findElement(tree, 'IconButton', 'name', 'play'));
  assert.equal(app.resumes, 1);
  assert.equal(app.starts, 0);
  press(findElement(tree, 'Pressable', 'testID', 'reader-audio-speed'));
  assert.equal(app.audio.rate, playbackSpeeds[playbackSpeeds.indexOf(1) + 1]);
  app.audio.status = 'loading';
  app.audio.isPlaying = false;
  tree = app.render();
  assert.equal(elements(tree, 'ActivityIndicator').length, 1);
  assert.ok(findElement(tree, 'Pressable', 'testID', 'reader-audio-reciter'));
});

test('swiping down or sideways and closing hide the bar without stopping the audio', () => {
  const app = mount();
  const bar = findElement(app.render(), 'AnimatedView', 'testID', 'reader-audio-bar');
  const start = bar.props.onStartShouldSetPanResponderCapture as () => boolean;
  const claim = bar.props.onMoveShouldSetPanResponderCapture as (
    _event: unknown,
    state: object,
  ) => boolean;
  const move = bar.props.onPanResponderMove as (_event: unknown, state: object) => void;
  const release = bar.props.onPanResponderRelease as (_event: unknown, state: object) => void;
  assert.equal(start(), false, 'buttons retain normal tap ownership');
  assert.equal(claim(null, { dx: 2, dy: -20 }), false);
  assert.equal(claim(null, { dx: 1, dy: 18 }), true);
  move(null, { dx: 1, dy: 25 });
  assert.equal(app.offset.y, 43);
  release(null, { dx: 1, dy: 25, vx: 0, vy: 0 });
  assert.equal(app.hides, 1);
  start();
  assert.equal(claim(null, { dx: -22, dy: 1 }), true);
  release(null, { dx: -20, dy: 1, vx: -1, vy: 0 });
  assert.equal(app.hides, 2);
  press(findElement(app.render(), 'IconButton', 'name', 'x'));
  assert.equal(app.hides, 3);
  assert.equal(app.stops, 0);
  assert.equal(app.pauses, 0);
  assert.equal(app.audio.isPlaying, true);
});

test('the reader bar opens the repeat choices for the open surah without touching playback', () => {
  const app = mount();
  let tree = app.render();
  assert.equal(elements(tree, 'RepeatSheet')[0]!.props.visible, false);
  press(findElement(tree, 'IconButton', 'name', 'repeat'));
  tree = app.render();
  const sheet = elements(tree, 'RepeatSheet')[0]!;
  assert.equal(sheet.props.visible, true);
  assert.equal(sheet.props.surah, 2);
  assert.equal(app.pauses + app.resumes + app.starts + app.stops, 0);
});
