import type { AudioTrack, AyahTiming } from '../backend/types';

export type RawAudioOption = {
  id: number;
  reciter: { en: string };
  rewaya: { en: string };
  link: string;
};

/** Catalog spelling differs between sources; retain the original riwaya as display metadata. */
export function riwayaCategory(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const known: Array<[RegExp, string]> = [
    [/warsh|ورش/, 'Warsh'],
    [/hafs|حفص/, 'Hafs'],
    [/qal[ou]n|they said|قالون/, 'Qalun'],
    [/shu.?bah|sh[ou]ba|شعبة/, "Shu'bah"],
    [/d(?:o?u|o)ri|دوري/, 'Al-Duri'],
    [/baz[zi]+|بزي/, 'Al-Bazi'],
    [/q[ou]nb[oui]l|قنبل/, 'Qunbil'],
    [/sous[si]+|susi|سوسي/, 'Al-Susi'],
    [/khalaf|خلف/, 'Khalaf'],
    [/khallad|خلاد/, 'Khallad'],
  ];
  return known.find(([pattern]) => pattern.test(normalized))?.[1] ?? value.trim();
}

export function filterReciters(
  tracks: readonly AudioTrack[],
  query: string,
  category: string,
): AudioTrack[] {
  const normalized = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '')
      .toLowerCase();
  const words = normalized(query.trim()).split(/\s+/).filter(Boolean);
  return tracks.filter(
    (track) =>
      (category === 'all' || riwayaCategory(track.riwaya) === category) &&
      words.every((word) => normalized(track.reciterName).includes(word)),
  );
}

export function parseAudioCatalog(surah: number, rows: readonly RawAudioOption[]): AudioTrack[] {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114)
    throw new RangeError('Surah must be between 1 and 114');
  return rows.map((row) => {
    if (
      !Number.isInteger(row.id) ||
      row.id < 1 ||
      !row.link.startsWith('https://') ||
      !row.reciter?.en ||
      !row.rewaya?.en
    )
      throw new TypeError('Invalid reciter option in audio catalog');
    return {
      surah,
      reciterId: row.id,
      reciterName: row.reciter.en,
      riwaya: row.rewaya.en,
      sourceUrl: row.link,
      url: row.link,
      objectPath: `audio/${row.id}/${String(surah).padStart(3, '0')}.mp3`,
    };
  });
}

export function mirroredAudioUrl(
  baseUrl: string | undefined,
  track: Pick<AudioTrack, 'reciterId' | 'surah' | 'sourceUrl' | 'objectPath'>,
): string {
  if (!baseUrl) return track.sourceUrl;
  if (!track.objectPath) return track.sourceUrl;
  const segments = track.objectPath.split('/');
  if (
    segments.some(
      (segment) =>
        !/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(segment) || segment === '.' || segment === '..',
    )
  )
    throw new RangeError('Invalid audio object path');
  return `${baseUrl.replace(/\/$/, '')}/${track.objectPath.replace(/^\//, '')}`;
}

export function validateAyahTimings(
  rows: readonly AyahTiming[],
  expectedAyahs: number,
): AyahTiming[] {
  if (
    !Number.isInteger(expectedAyahs) ||
    expectedAyahs < 1 ||
    rows.length !== expectedAyahs ||
    rows.some(
      (row, index) =>
        row.ayah !== index + 1 ||
        !Number.isFinite(row.start) ||
        !Number.isFinite(row.end) ||
        row.start < 0 ||
        row.end <= row.start,
    ) ||
    rows.some(
      (row, index) => index > 0 && row.start < (rows[index - 1]?.end ?? Number.POSITIVE_INFINITY),
    )
  )
    throw new RangeError('Incomplete or invalid ayah timing data');
  return [...rows];
}
