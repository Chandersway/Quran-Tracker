import assert from 'node:assert/strict';
import test from 'node:test';
import { readerCopy } from '../src/features/quran/model/readerCopy';
import { componentHarness, elements, loadComponentModule, press } from './helpers/componentHarness';

test('floating play reveals the compact player and preserves central playback and queue controls', () => {
  const hooks = componentHarness();
  let starts = 0,
    pauses = 0,
    resumes = 0;
  const audio = {
    track: null as null | { surah: number },
    isPlaying: false,
    status: 'idle',
    pause: () => pauses++,
    resume: () => resumes++,
  };
  const { FloatingReaderAudio } = loadComponentModule<{
    FloatingReaderAudio: (props: { surah: number; onListen: () => void }) => unknown;
  }>(new URL('../src/features/quran/components/FloatingReaderAudio.tsx', import.meta.url), {
    react: hooks.react,
    '../../../i18n': { useI18n: () => ({ locale: 'nl' }) },
    '../../audio/providers/audioContext': { useAudio: () => audio },
    '../model/readerCopy': { readerCopy },
    './FloatingReaderButton': { FloatingReaderButton: 'FloatingReaderButton' },
    '../../audio/components/ReaderAudioBar': { ReaderAudioBar: 'ReaderAudioBar' },
  });
  const render = () =>
    hooks.render(() => FloatingReaderAudio({ surah: 2, onListen: () => starts++ }));
  const button = () => elements(render(), 'FloatingReaderButton')[0]!;
  const dismiss = () => (elements(render(), 'ReaderAudioBar')[0]!.props.onDismiss as () => void)();
  assert.equal(button().props.initialCorner, 'bottomRight');
  assert.equal(button().props.emphasized, true);
  assert.equal(button().props.visible, true);
  press(button());
  assert.equal(starts, 1);
  assert.equal(elements(render(), 'ReaderAudioBar').length, 1);
  assert.equal(button().props.visible, false, 'the bar owns play controls while open');
  dismiss();
  assert.equal(button().props.visible, true, 'dismissing restores the same floating control');
  assert.equal(starts, 1);
  audio.track = { surah: 2 };
  audio.isPlaying = true;
  audio.status = 'playing';
  assert.equal(button().props.icon, 'pause');
  press(button());
  assert.equal(pauses, 1);
  assert.equal(elements(render(), 'ReaderAudioBar').length, 1);
  dismiss();
  audio.isPlaying = false;
  audio.status = 'paused';
  press(button());
  assert.equal(resumes, 1);
  assert.equal(starts, 1, 'a paused queue must resume instead of being rebuilt');
  dismiss();
  audio.status = 'loading';
  press(button());
  assert.equal(
    elements(render(), 'ReaderAudioBar').length,
    1,
    'reciter settings remain reachable while loading',
  );
  assert.equal(starts, 1, 'opening the loading player does not submit playback twice');
  dismiss();
  audio.track = { surah: 3 };
  press(button());
  assert.equal(starts, 2);
});
