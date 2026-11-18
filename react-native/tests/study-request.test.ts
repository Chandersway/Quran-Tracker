import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStudyRequestController,
  fixedStudyReferences,
  hasStudySource,
  studyRequestKey,
  type StudyLoadState,
} from '../src/services/study/studyRequest';
import {
  loadIrab,
  parseAsbabIndex,
  parseIrabResponse,
  plainHtmlText,
} from '../src/services/study/studyProviders';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('a later verse/provider wins even when the earlier transport ignores abort', async () => {
  const controller = createStudyRequestController<string>();
  const events: StudyLoadState<string>[] = [];
  const old = deferred<string>();
  const next = deferred<string>();
  let oldSignal: AbortSignal | undefined;
  const first = controller.run(
    'irab:2:1:316',
    (signal) => {
      oldSignal = signal;
      return old.promise;
    },
    (state) => events.push(state),
  );
  const second = controller.run(
    'irab:2:2:309',
    () => next.promise,
    (state) => events.push(state),
  );
  assert.equal(oldSignal?.aborted, true);
  next.resolve('current');
  await second;
  old.resolve('stale');
  await first;
  assert.deepEqual(events, [
    { status: 'loading', key: 'irab:2:1:316' },
    { status: 'loading', key: 'irab:2:2:309' },
    { status: 'ready', key: 'irab:2:2:309', value: 'current' },
  ]);
});

test('editing/unmounting cancels pending results and errors without replacing the cleared view', async () => {
  const controller = createStudyRequestController<string>();
  const old = deferred<string>();
  const events: StudyLoadState<string>[] = [];
  const pending = controller.run(
    'old',
    () => old.promise,
    (state) => events.push(state),
  );
  controller.cancel();
  old.reject(new Error('late network failure'));
  await pending;
  assert.deepEqual(events, [{ status: 'loading', key: 'old' }]);
});

test('all source/reference changes have distinct identity; fixed multi-reference sets never substitute an indexed verse', () => {
  const initial = { kind: 'irab' as const, surah: 2, ayah: 1, source: '316' };
  const keys = [
    initial,
    { ...initial, ayah: 2 },
    { ...initial, source: '309' },
    { ...initial, kind: 'asbab' as const },
    { ...initial, surah: 3 },
  ].map(studyRequestKey);
  assert.equal(new Set(keys).size, keys.length);
  const refs = fixedStudyReferences([
    { surah: 2, ayah: 1 },
    { surah: 2, ayah: 2 },
    { surah: 2, ayah: 1 },
    { surah: 115, ayah: 1 },
  ]);
  const index = parseAsbabIndex({
    data: [
      { surah: 2, ayah: 3, asbab: [{ id: 2919 }] },
      { surah: 2, ayah: 2, asbab: [{ id: 460 }] },
    ],
  });
  assert.deepEqual(refs, [
    { surah: 2, ayah: 1 },
    { surah: 2, ayah: 2 },
  ]);
  assert.equal(hasStudySource(index, 2919, refs[0]!), false);
  assert.equal(hasStudySource(index, 460, refs[1]!), true);
  assert.deepEqual(refs, [
    { surah: 2, ayah: 1 },
    { surah: 2, ayah: 2 },
  ]);
  assert.deepEqual(fixedStudyReferences([]), []);
});

test('Quranpedia keeps full book/author, numeric volume/page and Arabic numeric entities', () => {
  const parsed = parseIrabResponse(
    {
      book: { id: 316, name: 'Full book name', short_name: 'Short', author: { ar_name: 'Author' } },
      content: [{ text: '<p>&#x0627;&#1576;</p>', volume: 2, page: 301 }],
    },
    316,
  );
  assert.equal(parsed.name, 'Full book name');
  assert.equal(parsed.author, 'Author');
  assert.deepEqual(parsed.fragments[0], { html: '<p>&#x0627;&#1576;</p>', part: '2', page: '301' });
  assert.equal(plainHtmlText(parsed.fragments[0]!.html), '\u0627\u0628');
  assert.equal(plainHtmlText('<script>bad</script><p>Source</p>'), 'Source');
});

test('context cancellation reaches the provider HTTP request', async () => {
  const controller = new AbortController();
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
    })) as typeof fetch;
  const request = loadIrab(2, 1, 316, fetcher, controller.signal);
  controller.abort();
  await assert.rejects(request, /cancelled/);
});

test('context cancellation remains attached while an HTTP response body is still streaming', async () => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | undefined;
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestSignal = init?.signal ?? undefined;
    return new Response(
      new ReadableStream<Uint8Array>({
        start(value) {
          stream = value;
          init?.signal?.addEventListener('abort', () => value.error(new Error('body cancelled')), {
            once: true,
          });
        },
      }),
    );
  }) as typeof fetch;
  const request = loadIrab(2, 1, 316, fetcher, controller.signal);
  const outcome = request.then(
    () => 'loaded',
    () => 'cancelled',
  );
  await new Promise<void>((resolve) => setImmediate(resolve));
  controller.abort();
  const bodyAborted = requestSignal?.aborted;
  // Release an un-aborted regression body too, so the failing test leaves no work behind.
  if (!bodyAborted) {
    stream.enqueue(
      new TextEncoder().encode(JSON.stringify({ book: { id: 316, name: 'Source' }, content: [] })),
    );
    stream.close();
  }
  assert.equal(await outcome, 'cancelled');
  assert.equal(bodyAborted, true);
});

test('source request deadline also cancels a stalled body after successful response headers', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) =>
    new Response(
      new ReadableStream<Uint8Array>({
        start(stream) {
          init?.signal?.addEventListener('abort', () => stream.error(new Error('body deadline')), {
            once: true,
          });
        },
      }),
    )) as typeof fetch;
  const request = loadIrab(2, 1, 316, fetcher);
  const rejection = assert.rejects(request, /body deadline/);
  await new Promise<void>((resolve) => setImmediate(resolve));
  t.mock.timers.tick(15_000);
  await rejection;
});
