import assert from 'node:assert/strict';
import test from 'node:test';
import { resumeReference } from '../src/features/home/model/resumeReference';
import { mushafPageRange } from '../src/domain/mushafReading';

test('resume caption never assigns an unrelated last-known aya to an unmapped edition page', () => {
  for (const edition of ['hafs_madina_pdf', 'hafs_indopak_15'] as const)
    assert.equal(resumeReference({ edition, page: 10, surah: 2, ayah: 100 }), undefined);
  assert.equal(resumeReference({ edition: 'hafs', page: 999, surah: 2, ayah: 100 }), undefined);
});

test('resume caption preserves a precise verified aya on the saved page and uses page start for a stale cursor', () => {
  for (const edition of ['hafs', 'hafs_maknoon', 'warsh_maknoon', 'muhammadi'] as const) {
    const range = mushafPageRange(edition, 50)!;
    assert.deepEqual(resumeReference({ edition, page: 50, ...range.end }), range.end);
    assert.deepEqual(resumeReference({ edition, page: 50, surah: 114, ayah: 6 }), range.start);
  }
  assert.deepEqual(resumeReference({ edition: 'hafs', surah: 2, ayah: 100 }), {
    surah: 2,
    ayah: 100,
  });
});
