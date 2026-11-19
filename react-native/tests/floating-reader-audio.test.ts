import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { readerCopy } from '../src/features/quran/model/readerCopy';

test('floating play controls the active recitation and never restarts a paused queue', () => {
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
  const modules: Record<string, unknown> = {
    react: { createElement: (type: unknown, props: unknown) => ({ type, props }) },
    '../../../i18n': { useI18n: () => ({ locale: 'nl' }) },
    '../../audio/providers/audioContext': { useAudio: () => audio },
    '../model/readerCopy': { readerCopy },
    './FloatingReaderButton': { FloatingReaderButton: 'FloatingReaderButton' },
  };
  const exports: {
    FloatingReaderAudio?: (props: { surah: number; onListen: () => void }) => {
      props: {
        onPress: () => void;
        icon: string;
        initialCorner: string;
        disabled: boolean;
        label: string;
      };
    };
  } = {};
  const output = ts.transpileModule(
    readFileSync('src/features/quran/components/FloatingReaderAudio.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const render = () => exports.FloatingReaderAudio!({ surah: 2, onListen: () => starts++ }).props;
  assert.equal(render().initialCorner, 'bottomRight');
  assert.equal(render().icon, 'play');
  render().onPress();
  assert.equal(starts, 1);
  audio.track = { surah: 2 };
  audio.isPlaying = true;
  audio.status = 'playing';
  assert.equal(render().icon, 'pause');
  render().onPress();
  assert.equal(pauses, 1);
  audio.isPlaying = false;
  audio.status = 'paused';
  render().onPress();
  assert.equal(resumes, 1);
  assert.equal(starts, 1);
  audio.status = 'loading';
  assert.equal(render().disabled, true);
  audio.track = { surah: 3 };
  render().onPress();
  assert.equal(starts, 2);
});
