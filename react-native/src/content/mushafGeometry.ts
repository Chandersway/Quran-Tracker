import rawHafs from './generated/hafs-positions.json';
import rawMaknoon from './generated/warsh_maknoon_positions.json';
import rawMap from './generated/warsh_ayah_map.json';
import medinaScan from './generated/printed-medina-strips.json';
import maknoonScan from './generated/printed-hafs-maknoon-strips.json';
import muhammadiScan from './generated/printed-muhammadi-strips.json';
import hafsPublisher from './generated/hafs-kfqc-page-counts.json';
import { chapters } from './quran';
import type { BookPresentation } from '../state/models';

export type Segment = {
  surah: number;
  ayah: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type Edition = 'hafs' | 'hafs_maknoon' | 'warsh_maknoon' | 'muhammadi';
const hafs: Record<string, number[][]> = rawHafs;
const maknoon: Record<string, { width: number; height: number; segments: number[][] }> = rawMaknoon;
const warshMap: Record<string, number[][]> = rawMap.chapters;
// Source pixel dimensions followed by [surah, printed ayah, left, top, right, bottom].
type Scan = [number, number, number[][]];
const scans = {
  hafs: medinaScan as Scan[],
  hafs_maknoon: maknoonScan as Scan[],
  muhammadi: muhammadiScan as Scan[],
};
const publisherEnds: number[] = [];
for (const count of hafsPublisher.counts) publisherEnds.push((publisherEnds.at(-1) ?? 0) + count);
const chapterOffsets = [0];
for (const chapter of chapters) chapterOffsets.push(chapterOffsets.at(-1)! + chapter.verseCount);

export function printedHafsPage(surah: number, ayah: number) {
  const chapter = chapters[surah - 1];
  if (!chapter || !Number.isInteger(ayah) || ayah < 1 || ayah > chapter.verseCount) return 0;
  const index = chapterOffsets[surah - 1]! + ayah - 1;
  return publisherEnds.findIndex((end) => index < end) + 1;
}

export function printedPageRatio(edition: Edition, page: number): number {
  if (edition === 'warsh_maknoon') return maknoonRatio(page);
  const scan = scans[edition][page - 1];
  return scan ? scan[1] / scan[0] : 917 / 622;
}
const toSegment = (r: number[]): Segment => ({
  surah: r[0]!,
  ayah: r[1]!,
  x: r[2]!,
  y: r[3]!,
  width: r[4]!,
  height: r[5]!,
});

export function hafsReferences(edition: Edition, surah: number, ayah: number): number[] {
  if (edition === 'hafs' || edition === 'hafs_maknoon') return [ayah];
  const refs = warshMap[String(surah)]?.[ayah - 1];
  if (!refs?.length) throw new Error(`Missing Warsh reference ${surah}:${ayah}`);
  return refs;
}
export function pageSegments(
  edition: Edition,
  page: number,
  presentation?: BookPresentation,
): Segment[] {
  if (edition === 'hafs' && presentation !== 'original')
    return (hafs[String(page)] ?? []).map(toSegment);
  if (edition === 'warsh_maknoon') return (maknoon[String(page)]?.segments ?? []).map(toSegment);
  const scan = scans[edition][page - 1];
  if (!scan) return [];
  const [width, height, strips] = scan;
  return strips.map(([surah, ayah, left, top, right, bottom]) => ({
    surah: surah!,
    ayah: ayah!,
    x: left! / width,
    y: top! / height,
    width: (right! - left!) / width,
    height: (bottom! - top!) / height,
  }));
}
export function findMushafAyah(
  edition: Edition,
  surah: number,
  ayah: number,
  presentation?: BookPresentation,
): { page: number; segment: Segment } | null {
  if (edition === 'hafs_maknoon' || (edition === 'hafs' && presentation === 'original')) {
    const page = printedHafsPage(surah, ayah);
    const segment = pageSegments(edition, page, presentation).find(
      (s) => s.surah === surah && s.ayah === ayah,
    );
    return segment ? { page, segment } : null;
  }
  const count = edition === 'muhammadi' ? 638 : 604;
  for (let page = 1; page <= count; page++) {
    const segment = pageSegments(edition, page, presentation).find(
      (s) => s.surah === surah && hafsReferences(edition, surah, s.ayah).includes(ayah),
    );
    if (segment) return { page, segment };
  }
  return null;
}
export function maknoonRatio(page: number): number {
  const item = maknoon[String(page)];
  return item ? item.height / item.width : 1.5;
}
