import test from 'node:test';
import assert from 'node:assert/strict';
import {
  downloadMushaf,
  importLegacyPackage,
  installedMushaf,
  mushafOptions,
  validMushafHeader,
  validMushafTail,
  type LegacyMushafPort,
  type MushafDownloadPort,
} from '../src/services/mushaf/library';
import { findMushafAyah, hafsReferences, pageSegments } from '../src/content/mushafGeometry';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';
import { initialState } from '../src/state/models';
import { legacyWarshBookmarks } from '../src/domain/mushafBookmarks';

test('library preserves all five Kotlin options and distinguishes PDFs from page packages', () => {
  assert.deepEqual(
    mushafOptions.map((item) => item.id),
    ['hafs_maknoon', 'hafs', 'warsh_maknoon', 'hafs_madina_pdf', 'hafs_indopak_15'],
  );
  assert.equal(mushafOptions.find((item) => item.id === 'hafs_maknoon')?.pages, 604);
});
test('download signatures reject HTML errors as PDF and PNG', () => {
  const bytes = (text: string) => new TextEncoder().encode(text);
  assert.equal(validMushafHeader(bytes('%PDF-1.7'), 'pdf'), true);
  assert.equal(validMushafHeader(bytes('<html>Access denied</html>'), 'pdf'), false);
  assert.equal(validMushafHeader(bytes('<html>Access denied</html>'), 'png'), false);
  assert.equal(validMushafHeader(bytes('<html>Access denied</html>'), 'svgz'), false);
  assert.equal(
    validMushafHeader(bytes('<?xml version="1.0"?><svg viewBox="0 0 10 10">'), 'svgz'),
    true,
  );
  assert.equal(validMushafHeader(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 'png'), true);
  assert.equal(validMushafTail(bytes('truncated'), 'pdf'), false);
  assert.equal(validMushafTail(bytes('startxref\n42\n%%EOF\n'), 'pdf'), true);
  assert.equal(validMushafTail(bytes('IEND'), 'png'), true);
});
test('interrupted page package resumes missing pages without replacing existing pages', async () => {
  const saved = new Set<number>([1, 2]);
  const requested: number[] = [];
  const abort = new AbortController();
  const port: MushafDownloadPort = {
    async has(_id, page) {
      return saved.has(page!);
    },
    async fetch(_id, url, _type, _signal, page) {
      requested.push(page!);
      assert.match(url, /\/3\.png$/);
      saved.add(page!);
      abort.abort();
    },
  };
  await assert.rejects(
    downloadMushaf('hafs_maknoon', port, abort.signal, () => undefined),
    /cancelled/,
  );
  assert.deepEqual(requested, [3]);
  assert.deepEqual(await installedMushaf('hafs_maknoon', port), {
    ready: false,
    count: 3,
    total: 604,
  });
});
test('PDF download is a single file and is never considered installed before success', async () => {
  let saved = false;
  let calls = 0;
  const port: MushafDownloadPort = {
    async has() {
      return saved;
    },
    async fetch(_id, url, type, _signal, page) {
      calls++;
      assert.equal(type, 'pdf');
      assert.equal(page, undefined);
      assert.match(url, /\.pdf$/);
      saved = true;
    },
  };
  assert.equal((await installedMushaf('hafs_madina_pdf', port)).ready, false);
  await downloadMushaf('hafs_madina_pdf', port, new AbortController().signal, () => undefined);
  assert.equal((await installedMushaf('hafs_madina_pdf', port)).ready, true);
  assert.equal(calls, 1);
});
test('legacy migration copies nothing for incomplete packages and respects removal markers', async () => {
  const copied: string[] = [];
  let ignore = false;
  const port: LegacyMushafPort = {
    async ignored() {
      return ignore;
    },
    async hasCurrent() {
      return false;
    },
    async validatedSource(_id, page) {
      return page === 604 ? null : `legacy/${page}`;
    },
    async copyAtomic(_id, source) {
      copied.push(source);
    },
  };
  await importLegacyPackage('hafs_maknoon', port, new AbortController().signal);
  assert.deepEqual(copied, []);
  ignore = true;
  await importLegacyPackage('hafs_madina_pdf', port, new AbortController().signal);
  assert.deepEqual(copied, []);
});
test('complete legacy PDF is copied without mutating the source and resumes safely', async () => {
  const source = 'legacy/mushaf.pdf';
  const copied: string[] = [];
  let exists = false;
  const port: LegacyMushafPort = {
    async ignored() {
      return false;
    },
    async hasCurrent() {
      return exists;
    },
    async validatedSource() {
      return source;
    },
    async copyAtomic(_id, path) {
      copied.push(path);
      exists = true;
    },
  };
  await importLegacyPackage('hafs_madina_pdf', port, new AbortController().signal);
  await importLegacyPackage('hafs_madina_pdf', port, new AbortController().signal);
  assert.deepEqual(copied, [source]);
});
test('source geometry retains edition-specific first-page references and Warsh mapping', () => {
  assert.deepEqual(hafsReferences('warsh_maknoon', 1, 1), [1, 2]);
  assert.equal(findMushafAyah('hafs', 1, 1)?.page, 1);
  assert.equal(findMushafAyah('warsh_maknoon', 1, 2)?.page, 1);
  assert.equal(findMushafAyah('muhammadi', 1, 1)?.page, 1);
  assert.equal(pageSegments('hafs', 1)[0]?.x, 0.3253968);
  assert.equal(pageSegments('warsh_maknoon', 1)[0]?.x, 0.3869723);
  // Numbered medallion center in the publisher's unmodified 771 × 1040 PNG.
  assert.ok(
    pageSegments('hafs_maknoon', 1).some(
      (row) =>
        row.ayah === 1 &&
        row.x <= 259 / 771 &&
        row.x + row.width >= 259 / 771 &&
        row.y <= 316 / 1040 &&
        row.y + row.height >= 316 / 1040,
    ),
  );
});
test('page bookmarks and positions are edition-specific and legacy Warsh keys recover once', () => {
  const source = { warsh_page_bookmarks_2: ['8', '8', '0', '639'], ayah_bookmarks_2: ['3'] };
  assert.deepEqual(legacyWarshBookmarks(source), [{ edition: 'muhammadi', surah: 2, page: 8 }]);
  let state = appReducer(initialState, {
    type: 'mushaf/bookmark',
    edition: 'hafs',
    surah: 2,
    page: 8,
  });
  state = appReducer(state, { type: 'mushaf/bookmark', edition: 'muhammadi', surah: 2, page: 8 });
  state = appReducer(state, { type: 'mushaf/position', edition: 'hafs', page: 9 });
  assert.equal(state.mushafBookmarks.length, 2);
  assert.equal(decodeState(JSON.stringify(state)).mushafPositions.hafs, 9);
  state = appReducer(state, { type: 'mushaf/bookmark', edition: 'hafs', surah: 2, page: 8 });
  assert.deepEqual(state.mushafBookmarks, [{ edition: 'muhammadi', surah: 2, page: 8 }]);
});
