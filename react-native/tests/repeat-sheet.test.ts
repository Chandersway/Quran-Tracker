import assert from 'node:assert/strict';
import test from 'node:test';
import * as quran from '../src/content/quran';
import * as repeat from '../src/domain/repeat';
import * as geometry from '../src/content/mushafGeometry';
import bridge from '../src/content/generated/warsh_ayah_map.json';
import type { AudioTrack } from '../src/services/backend/types';
import { initialState, type Preferences } from '../src/state/models';
import * as playback from '../src/domain/audioPlayback';
import * as selection from '../src/services/audio/repeatSelection';
import * as copy from '../src/features/audio/model/audioCopy';
import { mountHookComponent } from './helpers/hook-component-harness';

function mount(props: Record<string, unknown> = {}, persisted: Partial<Preferences> = {}) {
  let queue: AudioTrack[] = [];
  let rounds = -1;
  let range: repeat.AudioSelection | undefined;
  let closed = false;
  const timingCalls: number[][] = [];
  const state = { ...initialState, preferences: { ...initialState.preferences, ...persisted } };
  const modules: Record<string, unknown> = {
    'react-native': { Pressable: 'Pressable', View: 'View' },
    '../../../i18n': {
      useI18n: () => ({ locale: 'en', t: (key: string) => key, format: (key: string) => key }),
    },
    '../../../state/store': {
      useAppStore: () => ({
        state,
        commit: async (action: { patch: Partial<Preferences> }) => {
          Object.assign(state.preferences, action.patch);
          Object.assign(persisted, action.patch);
        },
      }),
    },
    '../../../shared/components': {
      ...Object.fromEntries(
        ['Button', 'Field', 'Icon', 'Notice', 'Segments', 'Sheet', 'T'].map((key) => [key, key]),
      ),
      s: {},
    },
    '../../../shared/theme': { usePalette: () => ({ line: '#000' }) },
    '../../../content/quran': quran,
    '../../../domain/repeat': repeat,
    '../../../domain/audioPlayback': playback,
    '../../../services/audio/repeatSelection': selection,
    '../model/audioCopy': copy,
    '../../../services/audio/audio': {
      createAudioService: () => ({
        getAyahTimings: async (surah: number, readId: number, count: number) => {
          timingCalls.push([surah, readId, count]);
          return Array.from({ length: count }, (_, index) => ({
            ayah: index + 1,
            start: index * 10,
            end: (index + 1) * 10,
          }));
        },
      }),
    },
    '../providers/audioContext': {
      useAudio: () => ({
        rate: state.preferences.audioPlaybackSpeed,
        setRate() {},
        playQueue(tracks: AudioTrack[], repeatCount: number, selection?: repeat.AudioSelection) {
          queue = tracks;
          rounds = repeatCount;
          range = selection;
        },
      }),
    },
    '../../../content/mushafGeometry': geometry,
    '../../../content/generated/warsh_ayah_map.json': bridge,
  };
  const component = mountHookComponent(
    'src/features/audio/components/RepeatSheet.tsx',
    'RepeatSheet',
    modules,
    {
      visible: true,
      onClose() {
        closed = true;
      },
      surah: 7,
      initialAyah: 58,
      warsh: true,
      ...props,
    },
  );
  const render = () => {
    component.render();
    return component.nodes;
  };
  return {
    render,
    field(label: string, value: string) {
      render()
        .find((node) => node.type === 'Field' && node.props.label === label)!
        .props.onChangeText(value);
    },
    pages() {
      render()
        .find(
          (node) =>
            node.type === 'Segments' &&
            node.props.options.some((option: { value: string }) => option.value === 'ayahs'),
        )!
        .props.onChange('pages');
    },
    mode(value: selection.RepeatMode) {
      render()
        .find(
          (node) =>
            node.type === 'Segments' &&
            node.props.options.some((option: { value: string }) => option.value === 'ayahs'),
        )!
        .props.onChange(value);
    },
    count(value: string) {
      render()
        .find(
          (node) =>
            node.type === 'Segments' &&
            node.props.options.some((option: { value: string }) => option.value === '0'),
        )!
        .props.onChange(value);
    },
    reciter(id: string) {
      render()
        .find((node) => node.type === 'Pressable' && node.props.key === id)!
        .props.onPress();
    },
    async start() {
      render()
        .find((node) => node.type === 'Button' && node.props.title === 'repeat.start')!
        .props.onPress();
      await component.settle();
    },
    queue: () => Array.from(queue),
    rounds: () => rounds,
    range: () => range,
    closed: () => closed,
    timingCalls,
  };
}
const fileNames = (tracks: AudioTrack[]) =>
  tracks.map((track) => track.sourceUrl.split('/').at(-1));

test('canonical Warsh aya 7:58 uses Everyayah 007058, while a timed provider uses printed aya 57', async () => {
  const clips = mount();
  await clips.start();
  assert.deepEqual(fileNames(clips.queue()), ['007058.mp3']);
  assert.equal(clips.closed(), true);
  const timed = mount();
  timed.reciter('husary_warsh');
  await timed.start();
  assert.deepEqual(
    timed.queue().map(({ startSeconds, endSeconds }) => [startSeconds, endSeconds]),
    [[560, 570]],
  );
  assert.deepEqual(timed.timingCalls, [[7, 120, bridge.chapters['7'].length]]);
});

test('Maknoon page 158 expands printed Warsh 57–66 only for Everyayah and keeps timing indices', async () => {
  for (const timed of [false, true]) {
    const app = mount({ pageEdition: 'warsh_maknoon', currentPage: 158 });
    app.pages();
    assert.equal(
      app.render().find((node) => node.props.label === 'repeat.fromPage')!.props.value,
      '158',
    );
    if (timed) app.reciter('husary_warsh');
    await app.start();
    if (timed)
      assert.deepEqual(
        app.queue().map((track) => track.startSeconds),
        Array.from({ length: 10 }, (_, i) => 560 + i * 10),
      );
    else
      assert.deepEqual(
        fileNames(app.queue()),
        Array.from({ length: 10 }, (_, i) => `0070${58 + i}.mp3`),
      );
  }
});

test('merged Warsh Fatiha selection preserves both canonical clips and one timed verse', async () => {
  for (const timed of [false, true]) {
    const app = mount({ surah: 1, initialAyah: 1, initialEndAyah: 2 });
    if (timed) app.reciter('husary_warsh');
    await app.start();
    assert.deepEqual(
      timed ? app.queue().map((track) => track.startSeconds) : fileNames(app.queue()),
      timed ? [0] : ['001001.mp3', '001002.mp3'],
    );
  }
});

test('Muhammadi pages use their own geometry and accept the actual 638-page range', async () => {
  const app = mount({ pageEdition: 'muhammadi', currentPage: 638 });
  app.pages();
  await app.start();
  const expected = [
    ...new Set(
      geometry
        .pageSegments('muhammadi', 638)
        .flatMap((point) =>
          geometry
            .hafsReferences('muhammadi', point.surah, point.ayah)
            .map(
              (ayah) =>
                `${String(point.surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`,
            ),
        ),
    ),
  ].sort();
  assert.ok(expected.length > 0);
  assert.deepEqual(fileNames(app.queue()), expected);
  assert.equal(app.closed(), true);
});

test('unmapped PDF/scan cannot offer page queues; verified original Hafs Maknoon can', () => {
  const unmapped = mount({ pageEdition: null });
  const modes = unmapped
    .render()
    .find((node) => node.type === 'Segments' && node.props.value === 'ayahs')!;
  assert.deepEqual(
    Array.from(modes.props.options, (option: { value: string }) => option.value),
    ['surah', 'ayahs'],
  );
  const hafs = mount({
    surah: 1,
    initialAyah: undefined,
    currentPage: 1,
    pageEdition: 'hafs_maknoon',
    warsh: false,
  });
  const mapped = hafs
    .render()
    .find((node) => node.type === 'Segments' && node.props.value === 'page')!;
  assert.deepEqual(
    Array.from(mapped.props.options, (option: { value: string }) => option.value),
    ['page', 'pages', 'surah', 'ayahs'],
  );
});

test('Hafs ranges remain canonical, preserve continuous rounds and reject invalid input', async () => {
  const app = mount({ surah: 112, initialAyah: 2, warsh: false });
  app.field('repeat.to', '3');
  app.count('0');
  await app.start();
  assert.deepEqual(fileNames(app.queue()), ['112002.mp3', '112003.mp3']);
  assert.equal(app.rounds(), 0);
  const invalid = mount();
  invalid.field('repeat.to', '1000');
  await invalid.start();
  assert.equal(invalid.closed(), false);
  assert.deepEqual(invalid.queue(), []);
  assert.equal(
    invalid.render().find((node) => node.type === 'Notice')!.props.message,
    'ui.repeat.ayahRangeInvalid',
  );
});

test('the four real mode handlers preserve current-page, page-range, surah and ayah selection metadata', async () => {
  for (const mode of ['page', 'pages', 'surah', 'ayahs'] as const) {
    const app = mount({
      surah: 1,
      initialAyah: undefined,
      currentPage: 1,
      pageEdition: 'hafs_maknoon',
      warsh: false,
    });
    app.mode(mode);
    if (mode === 'pages') app.field('repeat.toPage', '2');
    if (mode === 'ayahs') {
      app.field('repeat.from', '2');
      app.field('repeat.to', '3');
    }
    await app.start();
    assert.equal(app.closed(), true);
    assert.equal(app.range()?.mode, mode);
    assert.equal(app.rounds(), 2);
    if (mode === 'page' || mode === 'surah') assert.equal(app.queue().length, 7);
    else if (mode === 'pages') assert.ok(app.queue().some((track) => track.surah === 2));
    else assert.deepEqual(fileNames(app.queue()), ['001002.mp3', '001003.mp3']);
  }
});

test('repeat callbacks persist independent riwaya reciters, speed and rounds for subsequent mounts', async () => {
  const persisted: Partial<Preferences> = {
    audioRepeatHafsReciter: 'minshawy',
    audioPlaybackSpeed: 1.75,
  };
  const first = mount({}, persisted);
  first.reciter('husary_warsh');
  first.count('5');
  await first.start();
  assert.equal(persisted.audioRepeatWarshReciter, 'husary_warsh');
  assert.equal(persisted.audioRepeatHafsReciter, 'minshawy');
  assert.equal(persisted.audioPlaybackSpeed, 1.75);
  assert.equal(persisted.audioRepeatRounds, 5);
  const reopened = mount({}, persisted);
  await reopened.start();
  assert.equal(reopened.queue()[0]?.reciterKey, 'husary_warsh');
  assert.equal(reopened.rounds(), 5);
  const hafs = mount({ surah: 112, initialAyah: 2, warsh: false }, persisted);
  await hafs.start();
  assert.equal(hafs.queue()[0]?.reciterKey, 'minshawy');
});
