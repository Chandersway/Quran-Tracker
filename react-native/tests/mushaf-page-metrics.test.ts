import assert from 'node:assert/strict';
import test from 'node:test';
import { mushafPageAyahCount, mushafPageDensity } from '../src/content/mushafPageMetrics';
import { tickPageRanges } from '../src/features/quran/layout/mushafScrubber';

test('ayah counts deduplicate printed segments and use the selected edition', () => {
  assert.equal(mushafPageAyahCount('hafs', 1), 7); // Ten geometry segments, seven ayahs.
  assert.equal(mushafPageAyahCount('hafs', 2), 5);
  assert.equal(mushafPageAyahCount('warsh_maknoon', 2), 4);
  assert.equal(mushafPageAyahCount('hafs', 50), 9);
  assert.equal(mushafPageAyahCount('muhammadi', 1), 7); // Illuminated frame is not an ayah.
  assert.equal(mushafPageAyahCount('muhammadi', 2), 4);
  assert.equal(mushafPageAyahCount('muhammadi', 3), 11); // Includes the next ayah's visible opening.
  assert.equal(mushafPageAyahCount('muhammadi', 50), 8); // Seven medallions plus printed Warsh 3:21.
  assert.equal(mushafPageAyahCount('muhammadi', 638), 15);
  assert.equal(mushafPageAyahCount('hafs', 120), 6);
  assert.equal(mushafPageAyahCount('hafs_maknoon', 120), 7);
  assert.equal(mushafPageAyahCount('hafs_maknoon', 531), 24);
  assert.equal(mushafPageAyahCount('hafs_maknoon', 598), 17);
});

test('density covers every verified edition page and increases with actual ayah count', () => {
  for (const [edition, count] of [
    ['hafs', 604],
    ['warsh_maknoon', 604],
    ['muhammadi', 638],
    ['hafs_maknoon', 604],
  ] as const) {
    const rows = Array.from({ length: count }, (_, index) => {
      const page = index + 1;
      const ayahs = mushafPageAyahCount(edition, page)!;
      const density = mushafPageDensity(edition, count, page, page)!;
      assert.ok(Number.isInteger(ayahs) && ayahs > 0, `${edition} page ${page}`);
      assert.ok(density >= 0 && density <= 1);
      return { ayahs, density };
    }).sort((a, b) => a.ayahs - b.ayahs);
    assert.equal(rows[0]!.density, 0);
    assert.equal(rows.at(-1)!.density, 1);
    for (let index = 1; index < rows.length; index++) {
      assert.ok(rows[index]!.density >= rows[index - 1]!.density);
      if (rows[index]!.ayahs > rows[index - 1]!.ayahs)
        assert.ok(rows[index]!.density > rows[index - 1]!.density);
    }
  }
});

test('the complete Quran.ws PDF has one cover before its 604 printed pages', () => {
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 1), 0);
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 2), 7);
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 121), 7);
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 532), 24);
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 599), 17);
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 605), 15);
  assert.equal(mushafPageAyahCount('hafs_madina_pdf', 606), undefined);
  const total = Array.from(
    { length: 605 },
    (_, page) => mushafPageAyahCount('hafs_madina_pdf', page + 1)!,
  ).reduce((sum, count) => sum + count, 0);
  assert.equal(total, 6236);
  assert.equal(mushafPageDensity('hafs_madina_pdf', 605, 1, 1), 0);
  assert.equal(mushafPageDensity('hafs_madina_pdf', 604, 1, 1), undefined);
});

test('overview tick ranges aggregate their actual pages without overweighting larger buckets', () => {
  for (const range of tickPageRanges(604, 42)) {
    const densities = Array.from(
      { length: range.lastPage - range.firstPage + 1 },
      (_, index) =>
        mushafPageDensity('hafs', 604, range.firstPage + index, range.firstPage + index)!,
    );
    const expected = densities.reduce((sum, value) => sum + value, 0) / densities.length;
    assert.ok(
      Math.abs(mushafPageDensity('hafs', 604, range.firstPage, range.lastPage)! - expected) < 1e-12,
    );
  }
});

test('unverified publisher data, different PDF lengths and invalid page ranges remain neutral', () => {
  for (const edition of ['hafs_indopak_15'] as const) {
    assert.equal(mushafPageAyahCount(edition, 1), undefined);
    assert.equal(mushafPageDensity(edition, 604, 1, 20), undefined);
  }
  for (const range of [
    [0, 1],
    [1, 605],
    [3, 2],
    [1.5, 2],
    [1, NaN],
  ]) {
    assert.equal(mushafPageDensity('hafs', 604, range[0]!, range[1]!), undefined);
  }
  assert.equal(mushafPageDensity('hafs', 612, 1, 20), undefined);
  assert.equal(mushafPageAyahCount('muhammadi', 0), undefined);
  assert.equal(mushafPageAyahCount('hafs', 605), undefined);
});
