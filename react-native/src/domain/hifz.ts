import type { Progress } from '../state/models';

export type AssessmentKind = 'surah' | 'hizb' | 'juz';
export type Assessment = {
  kind: AssessmentKind;
  number: number;
  score: number;
  assessedAt: number;
};
const limits = { surah: 114, hizb: 60, juz: 30 };
/** Home combines every explicit category; Stats deliberately uses Hizb only. */
export function averageAssessmentScore(assessments: readonly Assessment[]): number {
  return assessments.length
    ? Math.round(assessments.reduce((sum, item) => sum + item.score, 0) / assessments.length)
    : 0;
}
export function explicitAssessments(progress: Record<string, Progress>): Assessment[] {
  return Object.values(progress)
    .filter(
      (item) =>
        item.type in limits &&
        item.hasHifzScore &&
        item.progress > 0 &&
        item.referenceId >= 1 &&
        item.referenceId <= limits[item.type as AssessmentKind],
    )
    .map((item) => ({
      kind: item.type as AssessmentKind,
      number: item.referenceId,
      score: Math.min(100, Math.max(0, item.progress)),
      assessedAt: item.lastUpdated,
    }));
}
export function reviewIntervalDays(score: number): number {
  return score <= 30 ? 1 : score <= 50 ? 2 : score <= 70 ? 4 : score <= 85 ? 7 : 14;
}
export function reviewDue(assessment: Assessment, now: number): number {
  return (
    reviewIntervalDays(assessment.score) -
    Math.max(0, Math.floor((now - assessment.assessedAt) / 86_400_000))
  );
}
/** Scores remain independent. This is advice, never a cross-unit write. */
export function inconsistentJuz(assessments: readonly Assessment[]): number[] {
  const hizb = new Map(
    assessments.filter((item) => item.kind === 'hizb').map((item) => [item.number, item.score]),
  );
  return assessments
    .filter((item) => {
      if (item.kind !== 'juz') return false;
      const first = hizb.get(item.number * 2 - 1),
        second = hizb.get(item.number * 2);
      return (
        first !== undefined &&
        second !== undefined &&
        (Math.abs(item.score - first) >= 20 || Math.abs(item.score - second) >= 20)
      );
    })
    .map((item) => item.number);
}
