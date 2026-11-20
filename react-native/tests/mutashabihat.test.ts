import test from 'node:test';
import assert from 'node:assert/strict';
import raw from '../src/content/generated/mutashabiha_data.json';
import chapters from '../src/content/generated/chapters.json';
import {
  filterMutashabihatGroups,
  parseMutashabihatGroups,
  similarReferenceLabel,
  similarSequenceText,
} from '../src/domain/mutashabihat';

test('source repository loads all bundled groups in Juz order without truncating matches', () => {
  const groups = parseMutashabihatGroups(raw, chapters);
  const expected = Object.values(raw).reduce((sum, entries) => sum + entries.length, 0);
  assert.equal(groups.length, expected);
  assert.equal(new Set(groups.map((group) => group.id)).size, expected);
  assert.ok(groups.every((group, index) => index === 0 || groups[index - 1]!.juz <= group.juz));
  assert.ok(groups.every((group) => group.source.ayahs.length && group.matches.length));
  const original = raw['1'][0]!;
  assert.equal(groups[0]!.matches.length, original.muts.length);
});

test('source global query searches source AND match references/names with independent Juz filter', () => {
  const groups = parseMutashabihatGroups(
    {
      '2': [{ src: { ayah: 8 }, muts: [{ ayah: [294, 295] }], ctx: 3 }],
      '3': [{ src: { ayah: 1 }, muts: [{ ayah: 8 }] }],
    },
    chapters,
  );
  assert.equal(filterMutashabihatGroups(groups, 0, '  AL-BAQARAH  ').length, 2);
  assert.equal(filterMutashabihatGroups(groups, 2, '3:1').length, 1);
  assert.equal(filterMutashabihatGroups(groups, 2, 'juz 3').length, 0);
  assert.equal(filterMutashabihatGroups(groups, 3, 'juz 3').length, 1);
  assert.equal(filterMutashabihatGroups(groups, 0, chapters[2]!.nameAr).length, 1);
  assert.equal(filterMutashabihatGroups(groups, 0, 'no such passage').length, 0);
  assert.equal(filterMutashabihatGroups(groups, 0, '').length, 2);
});

test('sequence parsing refuses partial/invalid absolute references and source/match emptiness', () => {
  const groups = parseMutashabihatGroups(
    {
      '1': [
        { src: { ayah: [1, 6237] }, muts: [{ ayah: 2 }] },
        { src: { ayah: [] }, muts: [{ ayah: 2 }] },
        { src: { ayah: 1 }, muts: [{ ayah: [2, 0] }] },
        { src: { ayah: 1 }, muts: [{ ayah: 6236 }, { ayah: 99999 }], ctx: 2 },
      ],
    },
    chapters,
  );
  assert.equal(groups.length, 1);
  assert.equal(groups[0]!.matches.length, 1);
  assert.deepEqual(groups[0]!.matches[0]!.ayahs[0], { absolute: 6236, surah: 114, ayah: 6 });
  assert.equal(groups[0]!.contextAyahs, 2);
});

test('source reference labels and Arabic passage separators preserve sequence order', () => {
  const group = parseMutashabihatGroups(
    { '1': [{ src: { ayah: [8, 9] }, muts: [{ ayah: [7, 8] }] }] },
    chapters,
  )[0]!;
  assert.equal(similarReferenceLabel(group.source, chapters), 'Al-Baqarah 2:1\u20132');
  assert.equal(similarReferenceLabel(group.matches[0]!, chapters), '1:7 \u00b7 2:1');
  assert.equal(
    similarSequenceText(group.source, (surah, ayah) => `${surah}:${ayah}`),
    '2:1 \ufd3f \ufd3e 2:2',
  );
});
