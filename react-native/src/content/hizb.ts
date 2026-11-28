import { chapterById, divisions, getAyahs } from './quran';
import { resolveRubStart } from '../domain/quranNavigation';
import type { MushafEdition } from '../state/models';

const hizbStarts = divisions.filter((division) => division.quarter === 1);

/** A Hizb is identified by its opening surah, not an invented canonical name.
 * Keep previews tied to the same verified division rows used by navigation:
 * the Warsh mushaf opens Hizb 2, 7, 10 and 12 at a different ayah than Hafs.
 */
export function getHizbOpening(number: number, edition: MushafEdition = 'hafs') {
  const division = hizbStarts.find((row) => row.hizb === number);
  if (!division) throw new RangeError('Hizb must be between 1 and 60');
  const start =
    edition === 'warsh_maknoon'
      ? (() => {
          const warsh = resolveRubStart(edition, number, 1);
          return { ...division, surah: warsh.surah, ayah: warsh.ayah };
        })()
      : division;
  const ayah = getAyahs(start.surah).find((verse) => verse.number === start.ayah);
  if (!ayah) throw new RangeError('The Hizb opening ayah is missing');
  return { start, chapter: chapterById(start.surah), ayah };
}
