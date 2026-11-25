import { chapterById, divisions, getAyahs } from './quran';

const hizbStarts = divisions.filter((division) => division.quarter === 1);

/** A Hizb is identified by its opening surah, not an invented canonical name.
 * Keep previews tied to the same verified division rows used by navigation.
 */
export function getHizbOpening(number: number) {
  const start = hizbStarts.find((division) => division.hizb === number);
  if (!start) throw new RangeError('Hizb must be between 1 and 60');
  const ayah = getAyahs(start.surah).find((verse) => verse.number === start.ayah);
  if (!ayah) throw new RangeError('The Hizb opening ayah is missing');
  return { start, chapter: chapterById(start.surah), ayah };
}
