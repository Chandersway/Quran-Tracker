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

/** The verses an agenda item points at; surah plans open at the surah itself. */
export function plannedPassage(plan: Pick<Plan, 'type' | 'referenceId' | 'subId'>) {
  if (plan.type === 'surah') return { surah: plan.referenceId };
  const startId =
    plan.type === 'khatma'
      ? plan.referenceId
      : plan.type === 'juz'
        ? (plan.referenceId - 1) * 8 + 1
        : plan.type === 'hizb'
          ? (plan.referenceId - 1) * 4 + 1
          : (plan.referenceId - 1) * 4 + plan.subId;
  const endId =
    plan.type === 'khatma'
      ? plan.subId
      : startId + (plan.type === 'juz' ? 7 : plan.type === 'hizb' ? 3 : 0);
  return rubPassage(startId, endId);
}
