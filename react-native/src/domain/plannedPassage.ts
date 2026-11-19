import { chapterById, divisions, divisionEnd } from '../content/quran';
import type { Language, Plan } from '../state/models';

/** A khatma range stores absolute rub indices; display and navigation use its real verses. */
export function rubPassage(startRub: number, endRub: number) {
  if (
    !Number.isInteger(startRub) ||
    !Number.isInteger(endRub) ||
    startRub < 1 ||
    endRub > 240 ||
    endRub < startRub
  )
    return null;
  const start = divisions[startRub - 1];
  if (!start) return null;
  const end = divisionEnd(endRub);
  return {
    surah: start.surah,
    ayah: start.ayah,
    endSurah: end.surah,
    endAyah: end.ayah,
  };
}

export function rubPassageLabel(startRub: number, endRub: number, locale: Language): string {
  const range = rubPassage(startRub, endRub);
  if (!range) return '';
  const name = (surah: number) =>
    locale === 'ar' ? chapterById(surah).nameAr : chapterById(surah).name;
  return range.surah === range.endSurah
    ? `${name(range.surah)} ${range.surah}:${range.ayah}–${range.endAyah}`
    : `${name(range.surah)} ${range.surah}:${range.ayah} – ${name(range.endSurah)} ${range.endSurah}:${range.endAyah}`;
}

export function plannedPassageTitle(
  plan: Pick<Plan, 'type' | 'referenceId' | 'subId' | 'displayName'>,
  locale: Language,
): string {
  return plan.type === 'khatma'
    ? rubPassageLabel(plan.referenceId, plan.subId, locale) || plan.displayName
    : plan.displayName;
}
