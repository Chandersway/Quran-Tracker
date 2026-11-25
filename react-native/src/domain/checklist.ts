import { verseCounts, type QuranNoteTarget } from './quran';
import { divisions } from '../content/quran';

export const totalVerses = verseCounts.reduce((n, count) => n + count, 0);
export function verseIndex(surah: number, ayah: number): number {
  if (
    !Number.isInteger(surah) ||
    surah < 1 ||
    surah > 114 ||
    !Number.isInteger(ayah) ||
    ayah < 1 ||
    ayah > verseCounts[surah - 1]!
  )
    throw new RangeError('Invalid verse');
  return verseCounts.slice(0, surah - 1).reduce((n, count) => n + count, 0) + ayah - 1;
}
export function versePoint(index: number): { surah: number; ayah: number } {
  if (!Number.isInteger(index) || index < 0 || index >= totalVerses)
    throw new RangeError('Invalid verse index');
  let remaining = index;
  for (let i = 0; i < verseCounts.length; i++) {
    if (remaining < verseCounts[i]!) return { surah: i + 1, ayah: remaining + 1 };
    remaining -= verseCounts[i]!;
  }
  throw new RangeError('Invalid verse index');
}
export function checklistRange(target: QuranNoteTarget): [number, number] {
  const max =
    target.scope === 'surah'
      ? 114
      : target.scope === 'juz'
        ? 30
        : target.scope === 'hizb'
          ? 60
          : target.scope === 'rub'
            ? 240
            : 0;
  if (max === 0 || !Number.isInteger(target.number) || target.number < 1 || target.number > max)
    throw new RangeError('Invalid checklist partition');
  function start(number: number): number {
    if (target.scope === 'surah') return verseIndex(number, 1);
    const d =
      divisions[(number - 1) * (target.scope === 'juz' ? 8 : target.scope === 'hizb' ? 4 : 1)]!;
    return verseIndex(d.surah, d.ayah);
  }
  return [start(target.number), target.number === max ? totalVerses : start(target.number + 1)];
}

/** Locate the saved stop's last verse when changing the checklist grouping. */
export function checklistAnchor(
  position: QuranNoteTarget | null,
  scope: Exclude<QuranNoteTarget['scope'], 'ayah'>,
): number {
  const index = position ? checklistRange(position)[1] - 1 : 0;
  if (scope === 'surah') return versePoint(index).surah;
  const rub = divisions.findLastIndex((row) => verseIndex(row.surah, row.ayah) <= index) + 1;
  return scope === 'juz' ? Math.ceil(rub / 8) : scope === 'hizb' ? Math.ceil(rub / 4) : rub;
}

/** A Juz exposes eight quarters; a Hizb exposes four, sharing the same coverage. */
export function checklistChildren(target: QuranNoteTarget): QuranNoteTarget[] {
  checklistRange(target);
  const size = target.scope === 'juz' ? 8 : target.scope === 'hizb' ? 4 : 0;
  return Array.from({ length: size }, (_, index) => ({
    scope: 'rub',
    number: (target.number - 1) * size + index + 1,
  }));
}
export function toggleCoverage(
  coverage: readonly number[],
  target: QuranNoteTarget,
  checked: boolean,
): number[] {
  const set = new Set(coverage);
  const [start, end] = checklistRange(target);
  for (let i = start; i < end; i++)
    if (checked) set.add(i);
    else set.delete(i);
  return [...set].sort((a, b) => a - b);
}

export type ChecklistState = { coverage: number[]; position: QuranNoteTarget | null };
/** Reject malformed persisted values instead of overwriting data that may be recoverable. */
export function decodeChecklistState(value: unknown): ChecklistState {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid checklist');
  const state = value as Record<string, unknown>;
  if (
    !Array.isArray(state.coverage) ||
    state.coverage.some((n) => !Number.isInteger(n) || n < 0 || n >= totalVerses)
  )
    throw new Error('Invalid checklist coverage');
  if (new Set(state.coverage).size !== state.coverage.length)
    throw new Error('Duplicate checklist coverage');
  if (state.position !== null) {
    if (!state.position || typeof state.position !== 'object' || Array.isArray(state.position))
      throw new Error('Invalid checklist position');
    checklistRange(state.position as QuranNoteTarget);
  }
  return {
    coverage: [...state.coverage] as number[],
    position: state.position as QuranNoteTarget | null,
  };
}
export function clearChecklistCoverage(state: ChecklistState): ChecklistState {
  return { ...state, coverage: [] };
}
export function clearChecklistPosition(state: ChecklistState): ChecklistState {
  return { ...state, position: null };
}
