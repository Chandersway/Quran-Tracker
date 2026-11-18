import rawHafs from './generated/hafs-positions.json';
import rawMaknoon from './generated/warsh_maknoon_positions.json';
import rawMuhammadi from './generated/muhammadi-positions.json';
import rawMap from './generated/warsh_ayah_map.json';

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
const muhammadi = rawMuhammadi as number[][][];
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
export function pageSegments(edition: Edition, page: number): Segment[] {
  if (edition === 'hafs' || edition === 'hafs_maknoon')
    return (hafs[String(page)] ?? []).map(toSegment);
  if (edition === 'warsh_maknoon') return (maknoon[String(page)]?.segments ?? []).map(toSegment);
  const rows = muhammadi[page] ?? [];
  const segments: Segment[] = [];
  let previousLine = 0,
    previousLeft = 456;
  rows.forEach((r, index) => {
    const left = Math.min(456, Math.max(0, r[2]! - 15));
    const line = Math.min(14, Math.max(0, Math.floor(r[3]! / 66)));
    function add(x: number, y: number, width: number) {
      if (width > 0)
        segments.push({
          surah: r[0]!,
          ayah: r[1]!,
          x: x / 456,
          y: y / 15,
          width: width / 456,
          height: 1 / 15,
        });
    }
    if (index === 0) add(left, line, 456 - left);
    else if (line <= previousLine) add(left, line, previousLeft - left);
    else {
      add(left, line, 456 - left);
      add(0, previousLine, previousLeft);
      for (let extra = previousLine + 1; extra < line; extra++) add(0, extra, 456);
    }
    previousLine = line;
    previousLeft = left;
  });
  return segments;
}
export function findMushafAyah(
  edition: Edition,
  surah: number,
  ayah: number,
): { page: number; segment: Segment } | null {
  if (edition === 'hafs_maknoon') return findMushafAyah('hafs', surah, ayah);
  const count = edition === 'muhammadi' ? 638 : 604;
  for (let page = 1; page <= count; page++) {
    const segment = pageSegments(edition, page).find(
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
