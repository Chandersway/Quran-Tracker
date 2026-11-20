import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRepeatQueue,
  printedVerseForCanonical,
  repeatSelection,
  type RepeatSelectionInput,
} from '../src/services/audio/repeatSelection';
import { repeatReciters } from '../src/domain/repeat';
import type { AudioService } from '../src/services/backend/types';
import { pageSegments, hafsReferences } from '../src/content/mushafGeometry';

const input: RepeatSelectionInput = {
  mode: 'ayahs',
  surah: 1,
  warsh: false,
  edition: 'hafs',
  from: 1,
  to: 1,
  fromPage: 1,
  toPage: 1,
  currentPage: 1,
};
const hafs = repeatReciters.find((item) => item.id === 'alafasy')!;
const warsh = repeatReciters.find((item) => item.id === 'aldosari_warsh')!;
const timed = repeatReciters.find((item) => item.id === 'husary_warsh')!;

test('printed Warsh input uses the bridge only for canonical per-ayah recordings', () => {
  assert.equal(printedVerseForCanonical(1, 1, true), 1);
  assert.equal(printedVerseForCanonical(1, 2, true), 1);
  const printed = { ...input, warsh: true, edition: 'warsh_maknoon' as const };
  assert.deepEqual(repeatSelection(printed, warsh).points, [
    { surah: 1, ayah: 1 },
    { surah: 1, ayah: 2 },
  ]);
  assert.deepEqual(repeatSelection(printed, timed).points, [{ surah: 1, ayah: 1 }]);
  assert.deepEqual(repeatSelection(printed, warsh).selection, {
    mode: 'ayahs',
    surah: 1,
    first: 1,
    last: 1,
  });
});

test('all 604 original Hafs Maknoon page-repeat selections use exactly their verified source strips', () => {
  for (let page = 1; page <= 604; page++) {
    const queue = repeatSelection(
      { ...input, mode: 'page', edition: 'hafs_maknoon', currentPage: page },
      hafs,
    );
    const expected = [
      ...new Set(
        pageSegments('hafs_maknoon', page).flatMap((segment) =>
          hafsReferences('hafs_maknoon', segment.surah, segment.ayah).map(
            (ayah) => `${segment.surah}:${ayah}`,
          ),
        ),
      ),
    ];
    assert.deepEqual(
      queue.points.map((point) => `${point.surah}:${point.ayah}`),
      expected,
      `page ${page}`,
    );
  }
});

test('current page, page range, whole surah and ayah range remain distinct; PDF pages cannot be inferred', () => {
  assert.deepEqual(repeatSelection({ ...input, mode: 'page' }, hafs).selection, {
    mode: 'page',
    first: 1,
    last: 1,
  });
  assert.equal(
    repeatSelection({ ...input, mode: 'pages', toPage: 2 }, hafs).points.some(
      (point) => point.surah === 2,
    ),
    true,
  );
  assert.equal(repeatSelection({ ...input, mode: 'surah' }, hafs).points.length, 7);
  assert.equal(repeatSelection({ ...input, mode: 'ayahs', from: 2, to: 3 }, hafs).points.length, 2);
  assert.throws(
    () => repeatSelection({ ...input, mode: 'page', edition: null }, hafs),
    /REPEAT_PAGES_INVALID/,
  );
  assert.throws(
    () => repeatSelection({ ...input, mode: 'ayahs', from: 0 }, hafs),
    /REPEAT_AYAHS_INVALID/,
  );
});

test('timed queues request complete printed numbering and reject missing selected timings', async () => {
  const requested: number[][] = [];
  const service = {
    getAyahTimings: async (surah: number, read: number, expected: number) => {
      requested.push([surah, read, expected]);
      return Array.from({ length: expected }, (_, i) => ({ ayah: i + 1, start: i, end: i + 1 }));
    },
  } as AudioService;
  const selection = { ...input, warsh: true, edition: 'warsh_maknoon' as const, from: 1, to: 2 };
  const queue = await createRepeatQueue(selection, timed, service);
  assert.deepEqual(requested, [[1, 120, 7]]);
  assert.equal(queue.tracks.length, 2);
  assert.equal(queue.tracks[0]!.sourceUrl, queue.tracks[1]!.sourceUrl);
  assert.deepEqual(
    queue.tracks.map((track) => [track.ayah, track.startSeconds, track.endSeconds]),
    [
      [1, 0, 1],
      [2, 1, 2],
    ],
  );
  await assert.rejects(
    () =>
      createRepeatQueue(selection, timed, {
        getAyahTimings: async () => [],
      } as unknown as AudioService),
    /Incomplete ayah timing/,
  );
});
