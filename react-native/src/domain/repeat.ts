export interface RepeatTiming {
  ayah: number;
  start: number;
  end: number;
}
export type AudioSelection =
  | { mode: 'page' | 'pages'; first: number; last: number }
  | { mode: 'surah' | 'ayahs'; surah: number; first: number; last: number };

export function validRepeatPageRange(first: string, last: string): boolean {
  if (!/^[+-]?\d+$/.test(first) || !/^[+-]?\d+$/.test(last)) return false;
  const start = Number(first),
    end = Number(last);
  return start >= 1 && start <= 604 && end >= start && end <= 604;
}

/** rounds=0 means continuous; finite rounds count the first pass. */
export function nextRepeatStep(
  index: number,
  round: number,
  trackCount: number,
  rounds: number,
): readonly [number, number] | null {
  if (
    !(
      trackCount > 0 &&
      Number.isInteger(trackCount) &&
      index >= 0 &&
      index < trackCount &&
      Number.isInteger(index) &&
      round > 0 &&
      Number.isInteger(round) &&
      rounds >= 0 &&
      Number.isInteger(rounds)
    )
  )
    throw new RangeError('Invalid repeat selection state');
  if (index + 1 < trackCount) return [index + 1, round];
  if (rounds === 0 || round < rounds) return [0, round + 1];
  return null;
}

export function validateRepeatTimings(
  rows: readonly RepeatTiming[],
  expected: number,
): RepeatTiming[] {
  if (
    !Number.isInteger(expected) ||
    expected < 1 ||
    rows.length !== expected ||
    rows.some((row, index) => row.ayah !== index + 1 || row.start < 0 || row.end <= row.start) ||
    rows.some((row, index) => index > 0 && row.start < rows[index - 1]!.end)
  )
    throw new RangeError('Incomplete or invalid ayah timing data');
  return [...rows];
}

export interface RepeatReciter {
  id: string;
  name: string;
  directory: string;
  warsh: boolean;
  timingReadId?: number;
}

export const repeatReciters: readonly RepeatReciter[] = [
  { id: 'alafasy', name: 'Mishary Alafasy', directory: 'Alafasy_128kbps', warsh: false },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary (Murattal)',
    directory: 'Husary_128kbps',
    warsh: false,
  },
  {
    id: 'husary_teacher',
    name: 'Mahmoud Al-Husary (Muallim)',
    directory: 'Husary_Muallim_128kbps',
    warsh: false,
  },
  { id: 'maher', name: 'Maher Al-Muaiqly', directory: 'MaherAlMuaiqly128kbps', warsh: false },
  {
    id: 'minshawy',
    name: 'Mohamed Al-Minshawi',
    directory: 'Minshawy_Murattal_128kbps',
    warsh: false,
  },
  {
    id: 'aldosari_warsh',
    name: 'Ibrahim Al-Dosari',
    directory: 'warsh/warsh_ibrahim_aldosary_128kbps',
    warsh: true,
  },
  {
    id: 'abdulbasit_warsh',
    name: 'Abdul Basit Abdul Samad',
    directory: 'warsh/warsh_Abdul_Basit_128kbps',
    warsh: true,
  },
  {
    id: 'yassin_warsh',
    name: 'Yassin al-Jazaery',
    directory: 'warsh/warsh_yassin_al_jazaery_64kbps',
    warsh: true,
  },
  {
    id: 'husary_warsh',
    name: 'Mahmoud Khalil Al-Husary',
    directory: 'https://cdn.mp3quran.net/audio/mahmoud-husary/r3/',
    warsh: true,
    timingReadId: 120,
  },
  {
    id: 'kouchi_warsh',
    name: 'Al-Ayoun Al-Kouchi',
    directory: 'https://cdn.mp3quran.net/audio/laayoun-kouchi/r1/',
    warsh: true,
    timingReadId: 16,
  },
  {
    id: 'qazabri_warsh',
    name: 'Omar Al-Qazabri',
    directory: 'https://cdn.mp3quran.net/audio/omar-kazabri/r1/',
    warsh: true,
    timingReadId: 80,
  },
];

export function repeatReciterOptions(warsh: boolean): RepeatReciter[] {
  return repeatReciters.filter((reciter) => reciter.warsh === warsh);
}

export function normalizedRepeatReciter(id: string | undefined, warsh: boolean): string {
  const options = repeatReciterOptions(warsh);
  return options.find((option) => option.id === id)?.id ?? options[0]!.id;
}

export function normalizedRepeatRounds(rounds: number | undefined): number {
  return rounds !== undefined && [0, 2, 3, 5].includes(rounds) ? rounds : 2;
}

export function repeatAyahUrl(reciter: RepeatReciter, surah: number, ayah: number): string {
  const fileName = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return reciter.directory.startsWith('http')
    ? `${reciter.directory}${fileName}`
    : `https://everyayah.com/data/${reciter.directory}/${fileName}`;
}
