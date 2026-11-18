import { chapterById } from '../../content/quran';
import {
  findMushafAyah,
  hafsReferences,
  pageSegments,
  type Edition,
} from '../../content/mushafGeometry';
import rawMap from '../../content/generated/warsh_ayah_map.json';
import { repeatAyahUrl, type RepeatReciter, type AudioSelection } from '../../domain/repeat';
import type { AudioService, AudioTrack } from '../backend/types';

const warshMap: Record<string, number[][]> = rawMap.chapters;
export type RepeatMode = 'page' | 'pages' | 'surah' | 'ayahs';
export type RepeatPoint = { surah: number; ayah: number };
export type RepeatSelectionInput = {
  mode: RepeatMode;
  surah: number;
  warsh: boolean;
  edition: Edition | null;
  currentPage?: number;
  from: number;
  to: number;
  fromPage: number;
  toPage: number;
};
export function printedVerseCount(surah: number, warsh: boolean): number {
  return warsh ? (warshMap[String(surah)]?.length ?? 0) : chapterById(surah).verseCount;
}
export function printedVerseForCanonical(surah: number, ayah: number, warsh: boolean): number {
  if (!warsh) return ayah;
  const index = warshMap[String(surah)]?.findIndex((refs) => refs.includes(ayah)) ?? -1;
  if (index < 0) throw new RangeError('REPEAT_AYAHS_INVALID');
  return index + 1;
}
export function repeatInitialPage(
  edition: Edition | null,
  surah: number,
  ayah: number,
): number | undefined {
  return edition ? findMushafAyah(edition, surah, ayah)?.page : undefined;
}
export function repeatSelection(
  input: RepeatSelectionInput,
  reciter: RepeatReciter,
): { points: RepeatPoint[]; selection: AudioSelection } {
  const { mode, surah, warsh, edition } = input;
  let points: RepeatPoint[] = [];
  let selection: AudioSelection;
  if (mode === 'page' || mode === 'pages') {
    const first = mode === 'page' ? input.currentPage : input.fromPage;
    const last = mode === 'page' ? input.currentPage : input.toPage;
    if (
      !edition ||
      !Number.isInteger(first) ||
      !Number.isInteger(last) ||
      !first ||
      !last ||
      first < 1 ||
      last < first ||
      last > (edition === 'muhammadi' ? 638 : 604)
    )
      throw new RangeError('REPEAT_PAGES_INVALID');
    if (warsh !== (edition === 'warsh_maknoon' || edition === 'muhammadi'))
      throw new RangeError('REPEAT_PAGES_INVALID');
    for (let page = first; page <= last; page++) {
      for (const segment of pageSegments(edition, page)) {
        const refs = reciter.timingReadId
          ? [segment.ayah]
          : hafsReferences(edition, segment.surah, segment.ayah);
        points.push(...refs.map((ayah) => ({ surah: segment.surah, ayah })));
      }
    }
    selection = { mode, first, last };
  } else {
    const maximum = printedVerseCount(surah, warsh);
    const first = mode === 'surah' ? 1 : input.from;
    const last = mode === 'surah' ? maximum : input.to;
    if (
      !Number.isInteger(first) ||
      !Number.isInteger(last) ||
      first < 1 ||
      last < first ||
      last > maximum
    )
      throw new RangeError('REPEAT_AYAHS_INVALID');
    for (let ayah = first; ayah <= last; ayah++) {
      const refs =
        warsh && !reciter.timingReadId ? hafsReferences('warsh_maknoon', surah, ayah) : [ayah];
      points.push(...refs.map((verse) => ({ surah, ayah: verse })));
    }
    selection = { mode, surah, first, last };
  }
  points = [
    ...new Map(points.map((point) => [`${point.surah}:${point.ayah}`, point])).values(),
  ].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
  if (!points.length) throw new RangeError('REPEAT_EMPTY');
  return { points, selection };
}

export async function createRepeatQueue(
  input: RepeatSelectionInput,
  reciter: RepeatReciter,
  service: AudioService,
): Promise<{ tracks: AudioTrack[]; selection: AudioSelection }> {
  const { points, selection } = repeatSelection(input, reciter);
  const timings = new Map<number, Awaited<ReturnType<AudioService['getAyahTimings']>>>();
  if (reciter.timingReadId)
    await Promise.all(
      [...new Set(points.map((point) => point.surah))].map(async (surah) => {
        timings.set(
          surah,
          await service.getAyahTimings(
            surah,
            reciter.timingReadId!,
            printedVerseCount(surah, true),
          ),
        );
      }),
    );
  const tracks = points.map((point) => {
    const timing = timings.get(point.surah)?.find((row) => row.ayah === point.ayah);
    if (reciter.timingReadId && !timing) throw new RangeError('Incomplete ayah timing data');
    const sourceUrl = reciter.timingReadId
      ? `${reciter.directory}${String(point.surah).padStart(3, '0')}.mp3`
      : repeatAyahUrl(reciter, point.surah, point.ayah);
    return {
      surah: point.surah,
      ayah: point.ayah,
      reciterId: 10000,
      reciterKey: reciter.id,
      reciterName: reciter.name,
      riwaya: reciter.warsh ? 'Warsh' : 'Hafs',
      sourceUrl,
      url: sourceUrl,
      objectPath:
        reciter.id === 'alafasy'
          ? `audio/ayah/alafasy/${String(point.surah).padStart(3, '0')}${String(point.ayah).padStart(3, '0')}.mp3`
          : undefined,
      startSeconds: timing?.start,
      endSeconds: timing?.end,
    };
  });
  return { tracks, selection };
}
