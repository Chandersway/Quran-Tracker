import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mirroredAudioUrl,
  parseAudioCatalog,
  validateAyahTimings,
  riwayaCategory,
  filterReciters,
} from '../src/services/audio/audio-catalog';

const option = {
  id: 1,
  reciter: { en: 'Sample Reciter' },
  rewaya: { en: 'Hafs' },
  link: 'https://audio.example/001.mp3',
};

test('parses audio catalog entries into typed surah tracks', () => {
  assert.deepEqual(parseAudioCatalog(1, [option]), [
    {
      surah: 1,
      reciterId: 1,
      reciterName: 'Sample Reciter',
      riwaya: 'Hafs',
      sourceUrl: 'https://audio.example/001.mp3',
      url: 'https://audio.example/001.mp3',
      objectPath: 'audio/1/001.mp3',
    },
  ]);
});

test('media filters preserve the source catalog and normalize legacy riwaya spellings', () => {
  assert.equal(riwayaCategory('They said about Nafi’'), 'Qalun');
  assert.equal(riwayaCategory('Qunbil on the authority of Ibn Kathir'), 'Qunbil');
  assert.equal(riwayaCategory('Al-Douri from Al-Kisa’i'), 'Al-Duri');
  const items = parseAudioCatalog(1, [
    option,
    { ...option, id: 2, reciter: { en: 'Yassín reader' }, rewaya: { en: 'Warsh' } },
  ]);
  assert.equal(filterReciters(items, 'yassin', 'Warsh')[0]?.reciterId, 2);
  assert.equal(filterReciters(items, '', 'Hafs').length, 1);
  assert.equal(items[1]!.reciterName, 'Yassín reader');
});

test('rejects invalid surahs and incomplete source entries', () => {
  assert.throws(() => parseAudioCatalog(115, [option]), RangeError);
  assert.throws(
    () => parseAudioCatalog(1, [{ ...option, link: 'http://insecure.example/a.mp3' }]),
    TypeError,
  );
});

test('resolves mirrored object keys or preserves the original source', () => {
  const track = { reciterId: 7, surah: 2, sourceUrl: option.link, objectPath: 'audio/7/002.mp3' };
  assert.equal(mirroredAudioUrl(undefined, track), option.link);
  assert.equal(
    mirroredAudioUrl('https://cdn.example/', track),
    'https://cdn.example/audio/7/002.mp3',
  );
  assert.equal(
    mirroredAudioUrl('https://cdn.example/', { ...track, objectPath: undefined }),
    option.link,
  );
  assert.throws(
    () => mirroredAudioUrl('https://cdn.example/', { ...track, objectPath: 'audio/../secret.mp3' }),
    RangeError,
  );
});

test('accepts complete ordered ayah timings and rejects gaps or overlap', () => {
  const rows = [
    { ayah: 1, start: 0, end: 800 },
    { ayah: 2, start: 810, end: 1500 },
  ];
  assert.deepEqual(validateAyahTimings(rows, 2), rows);
  assert.throws(() => validateAyahTimings(rows.slice(1), 2), RangeError);
  assert.throws(
    () =>
      validateAyahTimings(
        [
          { ayah: 1, start: 0, end: 800 },
          { ayah: 2, start: 700, end: 1500 },
        ],
        2,
      ),
    RangeError,
  );
});
