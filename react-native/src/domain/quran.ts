/** Stable values persisted by the Android application. */
export const QuranProgressType = {
  juz: 'juz',
  hizb: 'hizb',
  rub: 'rub',
  surah: 'surah',
} as const;

export type QuranProgressKind = (typeof QuranProgressType)[keyof typeof QuranProgressType];

export const juzProgressId = (number: number): string => `juz_${number}`;
export const hizbProgressId = (number: number): string => `hizb_${number}`;
export const rubProgressId = (hizbNumber: number, quarter: number): string =>
  `rub_${hizbNumber}_${quarter}`;
export const surahProgressId = (number: number): string => `surah_${number}`;

export const verseCounts = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37,
  35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8,
  8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
] as const;

export type NoteScope = 'juz' | 'hizb' | 'rub' | 'surah' | 'ayah';
export interface QuranNoteTarget {
  scope: NoteScope;
  number: number;
  ayah?: number;
}

const ranges: Record<NoteScope, readonly [number, number]> = {
  juz: [1, 30],
  hizb: [1, 60],
  rub: [1, 240],
  surah: [1, 114],
  ayah: [1, 114],
};

export function validateNoteTarget(target: QuranNoteTarget): void {
  const [min, max] = ranges[target.scope];
  if (!Number.isInteger(target.number) || target.number < min || target.number > max)
    throw new RangeError(`Invalid ${target.scope} number`);
  if (target.scope === 'ayah') {
    if (
      !Number.isInteger(target.ayah) ||
      target.ayah! < 1 ||
      target.ayah! > (verseCounts[target.number - 1] ?? 0)
    )
      throw new RangeError('Invalid ayah number');
  } else if (target.ayah !== undefined) {
    throw new RangeError('An ayah is only valid for an ayah note');
  }
}

export function targetHizbNumber(target: QuranNoteTarget): number | undefined {
  if (target.scope === 'hizb') return target.number;
  if (target.scope === 'rub') return Math.floor((target.number - 1) / 4) + 1;
  return undefined;
}

export function targetQuarter(target: QuranNoteTarget): number | undefined {
  return target.scope === 'rub' ? ((target.number - 1) % 4) + 1 : undefined;
}

export function noteTargetIncludes(parent: QuranNoteTarget, child: QuranNoteTarget): boolean {
  if (parent.scope === child.scope && parent.number === child.number && parent.ayah === child.ayah)
    return true;
  switch (parent.scope) {
    case 'surah':
      return child.scope === 'ayah' && child.number === parent.number;
    case 'hizb':
      return child.scope === 'rub' && targetHizbNumber(child) === parent.number;
    case 'juz':
      if (child.scope === 'hizb') return Math.floor((child.number + 1) / 2) === parent.number;
      if (child.scope === 'rub') return Math.floor((child.number - 1) / 8) + 1 === parent.number;
      return false;
    default:
      return false;
  }
}

/** Exact NoteTargetSelector scope transitions; related partitions stay related. */
export function switchNoteScope(target: QuranNoteTarget | null, scope: NoteScope): QuranNoteTarget {
  const current = target ?? { scope: 'surah', number: 1 };
  const hizb = targetHizbNumber(current);
  if (scope === 'juz') return { scope, number: hizb ? Math.ceil(hizb / 2) : 1 };
  if (scope === 'hizb')
    return { scope, number: hizb ?? (current.scope === 'juz' ? current.number * 2 - 1 : 1) };
  if (scope === 'rub') return { scope, number: ((hizb ?? 1) - 1) * 4 + 1 };
  if (scope === 'surah') return { scope, number: current.scope === 'ayah' ? current.number : 1 };
  return { scope, number: current.scope === 'surah' ? current.number : 1, ayah: 1 };
}
