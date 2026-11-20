import type { QuranProgressKind } from './quran';

export type QuickCheckDraft = {
  kind: QuranProgressKind;
  number: number;
  quarter: number;
  multiple: boolean;
  selected: number[];
};
/** Validate the entire selection before any check-in is dispatched. */
export function quickCheckTargets(
  draft: QuickCheckDraft,
): { kind: QuranProgressKind; number: number; subId?: number }[] {
  const max = draft.kind === 'surah' ? 114 : draft.kind === 'juz' ? 30 : 60;
  if (!Number.isInteger(draft.number) || draft.number < 1 || draft.number > max)
    throw new RangeError('Invalid quick check-in');
  if (
    draft.kind === 'rub' &&
    (!Number.isInteger(draft.quarter) || draft.quarter < 1 || draft.quarter > 4)
  )
    throw new RangeError('Invalid quarter');
  if (draft.kind === 'hizb' && draft.multiple) {
    if (
      !draft.selected.length ||
      draft.selected.some((n) => !Number.isInteger(n) || n < 1 || n > 60) ||
      new Set(draft.selected).size !== draft.selected.length
    )
      throw new RangeError('Invalid Hizb selection');
    return [...draft.selected].sort((a, b) => a - b).map((number) => ({ kind: 'hizb', number }));
  }
  return [
    {
      kind: draft.kind,
      number: draft.number,
      ...(draft.kind === 'rub' ? { subId: draft.quarter } : {}),
    },
  ];
}
