import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate as nextTick } from 'node:timers/promises';
import { loadComponentModule } from './helpers/componentHarness';

type StoredFile = { bytes: Uint8Array; modified: number };
type NativeRequest = { source: string; destination: string; signal: AbortSignal };

function nativeCacheHarness() {
  const files = new Map<string, StoredFile>();
  const requests: NativeRequest[] = [];
  const moves: string[] = [];
  let runNative = async ({ destination }: NativeRequest) => {
    await nextTick();
    files.set(destination, { bytes: new Uint8Array([7, 8, 9]), modified: 1 });
    return true;
  };
  class Directory {
    uri: string;
    constructor(...parts: Array<string | { uri: string }>) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    create() {}
  }
  class File extends Directory {
    get exists() {
      return files.has(this.uri);
    }
    get size() {
      return files.get(this.uri)?.bytes.length ?? 0;
    }
    get modificationTime() {
      return files.get(this.uri)?.modified ?? 0;
    }
    async bytes(): Promise<Uint8Array> {
      throw new Error('Native preparation must not read PDF bytes into JavaScript');
    }
    async write(): Promise<void> {
      throw new Error('Native preparation must not write a JavaScript PDF buffer');
    }
    delete() {
      files.delete(this.uri);
    }
    async move(target: File) {
      await nextTick();
      const data = files.get(this.uri);
      assert.ok(data, 'The native worker must finish its destination before move');
      moves.push(this.uri);
      files.set(target.uri, data);
      files.delete(this.uri);
      this.uri = target.uri;
    }
  }
  const cache = loadComponentModule<{
    prepareCroppedPdf(source: File, signal: AbortSignal): Promise<string>;
    cachedCroppedPdfUri(source: File): string | null;
  }>(new URL('../src/features/quran/model/croppedPdf.ts', import.meta.url), {
    'expo-file-system': { File, Directory, Paths: { cache: 'cache' } },
    '../../../services/mushaf/pdfCrop': {
      prepareNativePdfCrop: async (source: string, destination: string, signal: AbortSignal) => {
        const request = { source, destination, signal };
        requests.push(request);
        return runNative(request);
      },
    },
    '../layout/pdfCrop': {
      cropPdfBytes: async () => {
        throw new Error('Native failures must not silently start JS conversion');
      },
    },
  });
  const source = new File('file:///original.pdf');
  files.set(source.uri, { bytes: new Uint8Array([1, 2, 3, 4]), modified: 1 });
  return {
    ...cache,
    source,
    files,
    requests,
    moves,
    setNative: (run: typeof runNative) => {
      runNative = run;
    },
    noPartial: () =>
      assert.equal(
        [...files.keys()].some((uri) => uri.endsWith('.partial')),
        false,
      ),
  };
}

test('native crop writes directly to a unique partial, commits after completion and concurrent callers reuse it', async () => {
  const harness = nativeCacheHarness();
  let finish!: () => void;
  harness.setNative(async ({ source, destination }) => {
    assert.equal(source, harness.source.uri);
    assert.ok(destination.endsWith('.partial'));
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    harness.files.set(destination, { bytes: new Uint8Array([7, 8, 9]), modified: 1 });
    return true;
  });
  let resolved = false;
  const first = harness
    .prepareCroppedPdf(harness.source, new AbortController().signal)
    .then((uri) => {
      resolved = true;
      return uri;
    });
  const second = harness.prepareCroppedPdf(harness.source, new AbortController().signal);
  await nextTick();
  assert.equal(harness.requests.length, 1);
  assert.equal(resolved, false);
  assert.equal(harness.moves.length, 0);
  assert.equal(harness.cachedCroppedPdfUri(harness.source), null);
  finish();
  const [firstUri, secondUri] = await Promise.all([first, second]);
  assert.equal(firstUri, secondUri);
  assert.equal(harness.requests.length, 1);
  assert.equal(harness.moves.length, 1);
  assert.equal(harness.cachedCroppedPdfUri(harness.source), firstUri);
  assert.deepEqual(harness.files.get(firstUri)?.bytes, new Uint8Array([7, 8, 9]));
  assert.deepEqual(harness.files.get(harness.source.uri)?.bytes, new Uint8Array([1, 2, 3, 4]));
  harness.noPartial();
});

test('native cancellation cleans only its partial after the worker settles and leaves queued requests retryable', async () => {
  const harness = nativeCacheHarness();
  const controller = new AbortController();
  let release!: () => void;
  harness.setNative(async ({ destination, signal }) => {
    harness.files.set(destination, { bytes: new Uint8Array([7]), modified: 1 });
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    assert.equal(signal.aborted, true);
    throw new Error('PDF preparation cancelled');
  });
  const running = harness.prepareCroppedPdf(harness.source, controller.signal);
  const rejected = assert.rejects(running, /cancelled/);
  const queuedController = new AbortController();
  const queued = harness.prepareCroppedPdf(harness.source, queuedController.signal);
  const queuedRejected = assert.rejects(queued, /cancelled/);
  queuedController.abort();
  await nextTick();
  controller.abort();
  const partial = harness.requests[0]!.destination;
  assert.ok(harness.files.has(partial), 'caller must not delete a file still owned by the worker');
  assert.equal(harness.moves.length, 0);
  release();
  await Promise.all([rejected, queuedRejected]);
  assert.equal(
    harness.requests.length,
    1,
    'a cancelled queued request never starts another worker',
  );
  assert.equal(harness.cachedCroppedPdfUri(harness.source), null);
  harness.noPartial();
  harness.setNative(async ({ destination }) => {
    harness.files.set(destination, { bytes: new Uint8Array([8, 9]), modified: 1 });
    return true;
  });
  const uri = await harness.prepareCroppedPdf(harness.source, new AbortController().signal);
  assert.ok(harness.files.has(uri));
  assert.deepEqual(harness.files.get(harness.source.uri)?.bytes, new Uint8Array([1, 2, 3, 4]));
});

test('native errors and empty outputs never become caches or trigger a hidden JS fallback', async () => {
  for (const failure of ['reject', 'empty', 'missing'] as const) {
    const harness = nativeCacheHarness();
    harness.setNative(async ({ destination }) => {
      if (failure !== 'missing') {
        harness.files.set(destination, { bytes: new Uint8Array(), modified: 1 });
      }
      if (failure === 'reject') throw new Error('Native save failed');
      return true;
    });
    await assert.rejects(
      harness.prepareCroppedPdf(harness.source, new AbortController().signal),
      failure === 'reject' ? /Native save failed/ : /complete file/,
    );
    assert.equal(harness.cachedCroppedPdfUri(harness.source), null);
    assert.equal(harness.moves.length, 0);
    harness.noPartial();
  }
});
