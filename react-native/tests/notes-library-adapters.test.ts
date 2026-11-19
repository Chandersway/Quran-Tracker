import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function load<T>(
  file: string,
  modules: Record<string, unknown>,
  globals: Record<string, unknown> = {},
): T {
  const exports = {};
  const output = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(output, {
    exports,
    ...globals,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  return exports as T;
}

test('native import copies to cache, reads exact selected bytes and handles cancellation and size before reading', async () => {
  let canceled = false;
  let size = 123;
  let reads = 0;
  let copied = false;
  const original = '{"content":"الله\nreflection"}';
  const adapter = load<{ pickNotesFile: () => Promise<string | null> }>(
    '../src/services/storage/pickNotesFile.native.ts',
    {
      'expo-document-picker': {
        getDocumentAsync: async (options: { copyToCacheDirectory: boolean }) => {
          copied = options.copyToCacheDirectory;
          return canceled
            ? { canceled: true }
            : { canceled: false, assets: [{ uri: 'file:///cache/notes.json', size }] };
        },
      },
      'expo-file-system': {
        File: class {
          size = size;
          constructor(readonly uri: string) {
            assert.equal(uri, 'file:///cache/notes.json');
          }
          async text() {
            reads++;
            return original;
          }
        },
      },
    },
  );
  assert.equal(await adapter.pickNotesFile(), original);
  assert.equal(copied, true);
  canceled = true;
  assert.equal(await adapter.pickNotesFile(), null);
  assert.equal(reads, 1);
  canceled = false;
  size = 11 * 1024 * 1024;
  await assert.rejects(adapter.pickNotesFile(), /too-large/);
  assert.equal(reads, 1);
});

test('web import uses the browser File without loading native filesystem code', async () => {
  let size = 3;
  let reads = 0;
  const revoked: string[] = [];
  const adapter = load<{ pickNotesFile: () => Promise<string | null> }>(
    '../src/services/storage/pickNotesFile.web.ts',
    {
      'expo-document-picker': {
        getDocumentAsync: async (options: { base64: boolean }) => {
          assert.equal(options.base64, false);
          return {
            canceled: false,
            assets: [
              {
                uri: 'blob:test',
                file: {
                  size,
                  text: async () => {
                    reads++;
                    return 'abc';
                  },
                },
              },
            ],
          };
        },
      },
    },
    { URL: { revokeObjectURL: (url: string) => revoked.push(url) } },
  );
  assert.equal(await adapter.pickNotesFile(), 'abc');
  size = 11 * 1024 * 1024;
  await assert.rejects(adapter.pickNotesFile(), /too-large/);
  assert.equal(reads, 1);
  assert.deepEqual(revoked, ['blob:test', 'blob:test']);
});

test('actual note drag handle emits one drop with real coordinates; tapping opens chooser and cancellation never moves', () => {
  let starts = 0;
  let cancels = 0;
  let choices = 0;
  const drops: number[][] = [];
  const moves: number[][] = [];
  type Gesture = { dx: number; dy: number; moveX: number; moveY: number };
  type Handlers = {
    onPanResponderGrant: () => void;
    onPanResponderMove: (event: unknown, gesture: Gesture) => void;
    onPanResponderRelease: (event: unknown, gesture: Gesture) => void;
    onPanResponderTerminate: () => void;
    onAccessibilityTap: () => void;
    onClick: (event: { nativeEvent: { detail: number } }) => void;
  };
  const component = load<{
    NoteDragHandle: (props: Record<string, unknown>) => { props: Handlers };
  }>('../src/features/notes/components/NoteDragHandle.tsx', {
    react: {
      useRef: (value: unknown) => ({ current: value }),
      useMemo: (factory: () => unknown) => factory(),
      createElement: (type: unknown, props: unknown) => ({ type, props }),
    },
    'react-native': {
      Platform: { OS: 'web' },
      PanResponder: { create: (handlers: unknown) => ({ panHandlers: handlers }) },
      Animated: {
        View: 'AnimatedView',
        ValueXY: class {
          setValue() {}
          getTranslateTransform() {
            return [];
          }
        },
      },
    },
    '../../../shared/components': { Icon: 'Icon' },
  });
  const control = component.NoteDragHandle({
    label: 'Move note',
    onStart: () => starts++,
    onMove: (x: number, y: number) => moves.push([x, y]),
    onDrop: (x: number, y: number) => drops.push([x, y]),
    onCancel: () => cancels++,
    onChoose: () => choices++,
  }).props;
  const drag = { dx: -30, dy: 200, moveX: 80, moveY: 620 };
  control.onPanResponderGrant();
  control.onPanResponderMove(null, drag);
  control.onPanResponderRelease(null, drag);
  assert.equal(starts, 1);
  assert.deepEqual(moves, [[80, 620]]);
  assert.deepEqual(drops, [[80, 620]]);
  assert.equal(choices, 0);
  control.onPanResponderGrant();
  control.onPanResponderRelease(null, { dx: 0, dy: 0, moveX: 80, moveY: 400 });
  assert.equal(choices, 1);
  control.onPanResponderGrant();
  control.onPanResponderMove(null, drag);
  control.onPanResponderTerminate();
  assert.equal(drops.length, 1);
  assert.equal(cancels, 2);
  control.onAccessibilityTap();
  assert.equal(choices, 2);
  control.onClick({ nativeEvent: { detail: 1 } });
  assert.equal(choices, 2);
  control.onClick({ nativeEvent: { detail: 0 } });
  assert.equal(choices, 3);
});
