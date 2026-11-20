import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as worker from '../src/services/mushaf/pdfCropTypes';

test('unavailable workers return false, while an already aborted request never starts', async () => {
  assert.equal(
    await worker.runNativePdfCrop(
      null,
      'file:///source',
      'file:///temp.partial',
      new AbortController().signal,
      'one',
    ),
    false,
  );
  const controller = new AbortController();
  controller.abort();
  let started = false;
  await assert.rejects(
    worker.runNativePdfCrop(
      {
        prepare: async () => {
          started = true;
          return true;
        },
        cancel: () => {},
      },
      'source',
      'destination',
      controller.signal,
      'two',
    ),
    { name: 'AbortError' },
  );
  assert.equal(started, false);
});

test('abort requests cancellation but does not release caller cleanup until native completion', async () => {
  const controller = new AbortController();
  let finish!: () => void;
  const cancelled: string[] = [];
  let settled = false;
  const running = worker
    .runNativePdfCrop(
      {
        prepare: () =>
          new Promise((resolve) => {
            finish = () => resolve(true);
          }),
        cancel: (job) => {
          cancelled.push(job);
        },
      },
      'source',
      'destination',
      controller.signal,
      'delayed',
    )
    .finally(() => {
      settled = true;
    });
  controller.abort();
  await Promise.resolve();
  assert.deepEqual(cancelled, ['delayed']);
  assert.equal(settled, false);
  finish();
  await assert.rejects(running, { name: 'AbortError' });
  assert.equal(settled, true);
});

test('real errors and incomplete results reject without a hidden JS fallback; listeners are removed', async () => {
  const controller = new AbortController();
  let cancelled = 0;
  const failure = new Error('Disk full');
  await assert.rejects(
    worker.runNativePdfCrop(
      {
        prepare: async () => {
          throw failure;
        },
        cancel: () => {
          cancelled++;
        },
      },
      'source',
      'destination',
      controller.signal,
      'failure',
    ),
    (error) => error === failure,
  );
  controller.abort();
  assert.equal(cancelled, 0);
  await assert.rejects(
    worker.runNativePdfCrop(
      { prepare: async () => false, cancel: () => {} },
      'source',
      'destination',
      new AbortController().signal,
      'incomplete',
    ),
    /did not complete/,
  );
});

function adapterHarness() {
  const nativeModules: { MushafPdfCrop?: worker.NativePdfCropModule } = {};
  const platform = { OS: 'android' };
  const exports: Record<string, (...args: unknown[]) => unknown> = {};
  const output = ts.transpileModule(readFileSync('src/services/mushaf/pdfCrop.native.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(output, {
    exports,
    require: (name: string) => {
      if (name === 'react-native') return { NativeModules: nativeModules, Platform: platform };
      assert.equal(name, './pdfCropTypes');
      return worker;
    },
  });
  return { nativeModules, platform, exports };
}

test('actual platform adapter enables only a compatible Android module and uses distinct native job IDs', async () => {
  const harness = adapterHarness();
  const available = () => harness.exports.nativePdfCropAvailable!();
  assert.equal(available(), false);
  const calls: string[][] = [];
  harness.nativeModules.MushafPdfCrop = {
    protocolVersion: 1,
    prepare: async (...args) => {
      calls.push(args);
      return true;
    },
    cancel: () => {},
  };
  assert.equal(available(), true);
  harness.platform.OS = 'ios';
  assert.equal(available(), false);
  harness.platform.OS = 'android';
  harness.nativeModules.MushafPdfCrop.protocolVersion = 2;
  assert.equal(available(), false);
  harness.nativeModules.MushafPdfCrop.protocolVersion = 1;
  await harness.exports.prepareNativePdfCrop!(
    'file:///original.pdf',
    'file:///cache/one.partial',
    new AbortController().signal,
  );
  await harness.exports.prepareNativePdfCrop!(
    'file:///original.pdf',
    'file:///cache/two.partial',
    new AbortController().signal,
  );
  assert.equal(calls.length, 2);
  assert.deepEqual(
    calls.map((call) => call.slice(0, 2)),
    [
      ['file:///original.pdf', 'file:///cache/one.partial'],
      ['file:///original.pdf', 'file:///cache/two.partial'],
    ],
  );
  assert.notEqual(calls[0]![2], calls[1]![2]);
});

test('config plugin registration is idempotent and installs the actual worker sources without replacing existing app logic', () => {
  const require = createRequire(import.meta.url);
  const plugin = require('../plugins/withMushafPdfCrop.js') as {
    patchApplication: (source: string) => string;
    patchSettings: (source: string) => string;
    patchBuild: (source: string) => string;
    installSources: (root: string) => void;
  };
  for (const patch of [plugin.patchApplication, plugin.patchSettings, plugin.patchBuild]) {
    const original = '// Existing app behavior\n// add(MyReactNativePackage())\n';
    const once = patch(original);
    assert.equal(patch(once), once);
    assert.ok(once.includes('// Existing app behavior'));
  }
  assert.throws(() => plugin.patchApplication('unexpected application'), /register/);
  const root = mkdtempSync(join(tmpdir(), 'pdf-crop-plugin-'));
  try {
    const directory = join(root, 'app/src/main/java/com/Ameender/qurantracker');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, 'MainApplication.kt'),
      '// add(MyReactNativePackage())\n// Existing app behavior',
    );
    plugin.installSources(root);
    plugin.installSources(root);
    assert.ok(existsSync(join(root, 'mushaf-pdf-crop/src/main/cpp/PdfCropBridge.cpp')));
    assert.ok(
      existsSync(
        join(
          root,
          'mushaf-pdf-crop/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt',
        ),
      ),
    );
    assert.equal(
      readFileSync(join(directory, 'MainApplication.kt'), 'utf8').match(
        /add\(com\.Ameender\.qurantracker\.pdfcrop\.MushafPdfCropPackage\(\)\)/g,
      )?.length,
      1,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
