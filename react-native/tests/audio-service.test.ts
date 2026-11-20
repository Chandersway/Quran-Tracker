import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioServiceHarness } from './helpers/audio-service-harness';
import type { AudioTrack } from '../src/services/backend/types';

const recording = new Uint8Array(512);
recording.set([0xff, 0xfb, 0x90, 0]);
const track: AudioTrack = {
  surah: 1,
  reciterId: 10000,
  reciterKey: 'fixture',
  reciterName: 'Fixture',
  riwaya: 'Hafs',
  sourceUrl: 'https://source.invalid/001001.mp3',
  url: 'https://source.invalid/001001.mp3',
  ayah: 1,
};

test('the real audio service preserves a completed moved download and reuses it without backend or network', async () => {
  const requested: string[] = [];
  const app = audioServiceHarness({
    baseUrl: 'https://mirror.invalid',
    download: async (url) => {
      requested.push(url);
      if (url.startsWith('https://mirror')) throw new Error('Mirror unavailable');
      return recording;
    },
  });
  try {
    const source = { ...track, objectPath: 'audio/ayah/fixture/001001.mp3' };
    const uri = await app.service.download(source);
    assert.equal(
      existsSync(uri),
      true,
      'cleanup must not delete a File after its URI mutates during move',
    );
    assert.deepEqual(new Uint8Array(readFileSync(uri)), recording);
    assert.equal(app.service.getDownloadedUri(source), uri);
    assert.equal(await app.service.download(source), uri);
    assert.equal(requested.length, 2);
    assert.equal(existsSync(`${uri}.download`), false);
  } finally {
    app.cleanup();
  }
});

test('different verse clips have different cache paths; timed clips share one recording', async () => {
  let downloads = 0;
  const app = audioServiceHarness({
    download: async () => {
      downloads++;
      return recording;
    },
  });
  try {
    const first = await app.service.download(track);
    const second = await app.service.download({ ...track, ayah: 2 });
    assert.notEqual(first, second);
    const timed = { ...track, startSeconds: 0, endSeconds: 1 };
    const timedFirst = await app.service.download(timed);
    const timedSecond = await app.service.download({
      ...timed,
      ayah: 2,
      startSeconds: 1,
      endSeconds: 2,
    });
    assert.equal(timedFirst, timedSecond);
    assert.equal(downloads, 3);
  } finally {
    app.cleanup();
  }
});

test('corrupt cached audio with the same byte length is rejected and redownloaded; concurrent requests deduplicate', async () => {
  let downloads = 0;
  const app = audioServiceHarness({
    download: async () => {
      downloads++;
      await new Promise((resolve) => setImmediate(resolve));
      return recording;
    },
  });
  try {
    const [one, two] = await Promise.all([
      app.service.download(track),
      app.service.download(track),
    ]);
    assert.equal(one, two);
    assert.equal(downloads, 1);
    writeFileSync(one, new Uint8Array(recording.length).fill(32));
    assert.equal(app.service.getDownloadedUri(track), null);
    assert.equal(await app.service.download(track), one);
    assert.equal(downloads, 2);
  } finally {
    app.cleanup();
  }
});

test('validated Warsh timings persist and work offline; corrupt metadata never becomes a selection', async () => {
  let requests = 0;
  const app = audioServiceHarness({
    download: async () => recording,
    fetcher: (async () => {
      requests++;
      if (requests > 1) throw new Error('Offline');
      return new Response(
        JSON.stringify([
          { ayah: 1, start_time: 0, end_time: 1000 },
          { ayah: 2, start_time: 1000, end_time: 2000 },
        ]),
      );
    }) as typeof fetch,
  });
  try {
    const online = await app.service.getAyahTimings(1, 120, 2);
    const offline = await app.service.getAyahTimings(1, 120, 2);
    assert.equal(JSON.stringify(online), JSON.stringify(offline));
    assert.equal(requests, 1);
    writeFileSync(
      join(app.root, 'audio', 'timings', '120-1.json'),
      '[{"ayah":1,"start":0,"end":1}]',
    );
    await assert.rejects(() => app.service.getAyahTimings(1, 120, 2), /Offline/);
  } finally {
    app.cleanup();
  }
});
