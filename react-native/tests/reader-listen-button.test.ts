import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { readerCopy } from '../src/features/quran/model/readerCopy';
import type { Language } from '../src/state/models';

test('visible Listen, playing and pause actions are localized and preserve current audio queues on resume', () => {
  const calls: string[] = [];
  let locale: Language = 'nl';
  const audio = {
    track: null as null | { surah: number },
    status: 'idle',
    isPlaying: false,
    pause: () => calls.push('pause'),
    resume: () => calls.push('resume'),
  };
  const modules: Record<string, unknown> = {
    react: { createElement: (type: string, props: unknown) => ({ type, props }) },
    '../../../shared/components': { Button: 'Button' },
    '../../../i18n': { useI18n: () => ({ locale }) },
    '../../audio/providers/audioContext': { useAudio: () => audio },
    '../model/readerCopy': { readerCopy },
  };
  const source = ts.transpileModule(
    readFileSync('src/features/quran/components/ReaderListenButton.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports: {
    ReaderListenButton?: (props: { surah: number; onListen: () => void; compact?: boolean }) => {
      type: string;
      props: { title: string; onPress: () => void; loading: boolean; icon: string };
    };
  } = {};
  vm.runInNewContext(source, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const render = (compact = false) =>
    exports.ReaderListenButton!({ surah: 7, onListen: () => calls.push('listen7'), compact });
  for (const [language, label] of [
    ['nl', 'Luisteren'],
    ['en', 'Listen'],
    ['ar', 'استماع'],
  ] as const) {
    locale = language;
    audio.track = null;
    audio.status = 'idle';
    audio.isPlaying = false;
    assert.equal(render().props.title, label);
    render().props.onPress();
    assert.equal(calls.at(-1), 'listen7');
    audio.track = { surah: 7 };
    audio.status = 'playing';
    audio.isPlaying = true;
    assert.ok(render().props.title.includes(readerCopy(locale).playing));
    assert.equal(render().props.icon, 'pause');
    render().props.onPress();
    assert.equal(calls.at(-1), 'pause');
    audio.status = 'paused';
    audio.isPlaying = false;
    assert.equal(render().props.title, readerCopy(locale).resume);
    assert.equal(render(true).props.title, readerCopy(locale).resumeShort);
    render().props.onPress();
    assert.equal(calls.at(-1), 'resume');
    audio.status = 'loading';
    assert.equal(render().props.loading, true);
    assert.equal(render().props.title, readerCopy(locale).loadingAudio);
    audio.track = { surah: 95 };
    audio.status = 'paused';
    render().props.onPress();
    assert.equal(calls.at(-1), 'listen7', 'another soera is not silently resumed');
  }
});
