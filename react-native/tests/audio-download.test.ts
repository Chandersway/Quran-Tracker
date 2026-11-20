import test from 'node:test';
import assert from 'node:assert/strict';
import {
  downloadAudio,
  validMp3Header,
  type AudioDownloadPort,
} from '../src/services/audio/audioDownload';

test('a failed mirror falls back to source and publishes only verified complete audio', async () => {
  const calls: string[] = [];
  let valid = false;
  const port: AudioDownloadPort = {
    complete: () => null,
    download: async (url) => {
      calls.push(url);
      valid = url === 'source';
    },
    validate: async () => valid,
    commit: async () => {
      calls.push('commit');
      return 'local';
    },
    cleanup: async () => {
      calls.push('cleanup');
    },
  };
  assert.equal(await downloadAudio(['mirror', 'source'], port), 'local');
  assert.deepEqual(calls, ['mirror', 'cleanup', 'source', 'commit', 'cleanup']);
});
test('partial or HTML downloads never become a cached track', async () => {
  let committed = false,
    cleaned = false;
  await assert.rejects(
    () =>
      downloadAudio(['source'], {
        complete: () => null,
        download: async () => {},
        validate: async () => false,
        commit: async () => {
          committed = true;
          return 'bad';
        },
        cleanup: async () => {
          cleaned = true;
        },
      }),
    /Invalid audio/,
  );
  assert.equal(committed, false);
  assert.equal(cleaned, true);
  assert.equal(validMp3Header(new TextEncoder().encode('<html>server failure</html>')), false);
  assert.equal(validMp3Header(new Uint8Array([0x49, 0x44, 0x33])), true);
  assert.equal(validMp3Header(new Uint8Array([0xff, 0xfb, 0x90])), true);
});
