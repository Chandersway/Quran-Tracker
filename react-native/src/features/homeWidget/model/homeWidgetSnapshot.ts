import { chapterById, divisions } from '../../../content/quran';
import { progressForGoal } from '../../../domain/goals';
import { addDays } from '../../../domain/journey';
import { mushafResume } from '../../../domain/mushafResume';
import { plannedPassage, plannedPassageTitle } from '../../../domain/plannedPassage';
import { goalAction } from '../../../domain/planning';
import { readingUnitLabelKey } from '../../../domain/readingUnit';
import type { AppState, Language } from '../../../state/models';
import { resumeReference } from '../../home/model/resumeReference';
import { homeWidgetCopy } from './homeWidgetCopy';

/** One day of the widget as the native side shows it, already in the reader's language. */
export type HomeWidgetDay = {
  date: string;
  progressText: string;
  status: string;
  fraction: number;
  complete: boolean;
};

/**
 * Everything the Android widget renders. The native side never computes reading
 * progress: it picks `today`, or `tomorrow` once the date has rolled over while
 * the app was closed (a fresh day always starts at zero).
 */
export type HomeWidgetSnapshot = {
  version: 1;
  title: string;
  next: string;
  url: string;
  today: HomeWidgetDay;
  tomorrow: HomeWidgetDay;
  empty: string;
};

type WidgetState = Pick<
  AppState,
  | 'goals'
  | 'goal'
  | 'goalDays'
  | 'history'
  | 'plans'
  | 'cursor'
  | 'preferences'
  | 'mushafPositions'
  | 'mushafPositionPresentations'
>;

const SCHEME = 'qurantracker://';

/** The rub quarter (and thereby hizb) that contains a verse in the Hafs division table. */
export function hizbAt(surah: number, ayah: number): number | undefined {
  const key = surah * 1000 + ayah;
  let found: number | undefined;
  for (const division of divisions) {
    if (division.surah * 1000 + division.ayah > key) break;
    found = division.hizb;
  }
  return found;
}

export function mushafLink(passage: {
  surah: number;
  ayah?: number;
  endSurah?: number;
  endAyah?: number;
  planId?: string;
}): string {
  const query = (['ayah', 'endSurah', 'endAyah', 'planId'] as const)
    .filter((key) => passage[key] !== undefined)
    .map((key) => `${key}=${encodeURIComponent(String(passage[key]))}`)
    .join('&');
  return `${SCHEME}mushaf/${passage.surah}${query ? `?${query}` : ''}`;
}

export function homeWidgetSnapshot(
  state: WidgetState,
  today: string,
  locale: Language,
  t: (key: string) => string,
): HomeWidgetSnapshot {
  const copy = homeWidgetCopy[locale === 'ar' || locale === 'en' ? locale : 'nl'];
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 });
  const definition = state.goals.find((goal) => goal.id === 1);
  const unit = definition?.unit ?? state.goal.unit;
  const baseTarget = definition?.target ?? state.goal.target;
  const describe = (date: string, done: number, target: number, dayUnit: string): HomeWidgetDay => {
    const unitLabel = t(readingUnitLabelKey(dayUnit));
    if (target <= 0)
      return {
        date,
        progressText: copy.noGoal,
        status: copy.setGoal,
        fraction: 0,
        complete: false,
      };
    const complete = done >= target;
    return {
      date,
      progressText: `${number(done)} / ${number(target)} ${unitLabel}`,
      status: complete ? copy.reached : copy.remaining(number(target - done), unitLabel),
      fraction: Math.max(0, Math.min(1, done / target)),
      complete,
    };
  };
  const day = state.goalDays.find((item) => item.goalId === 1 && item.date === today) ?? {
    goalId: 1,
    date: today,
    unit,
    target: baseTarget,
    extra: 0,
    resolution: '',
  };
  const progress = progressForGoal(day, state.history);
  const tomorrowDate = addDays(today, 1);
  const tomorrowDay = state.goalDays.find(
    (item) => item.goalId === 1 && item.date === tomorrowDate,
  );
  const todayView = describe(today, progress.done, progress.target, day.unit);
  const tomorrowView = describe(
    tomorrowDate,
    0,
    tomorrowDay ? tomorrowDay.target + tomorrowDay.extra : baseTarget,
    tomorrowDay?.unit ?? unit,
  );
  if (baseTarget <= 0 && progress.target <= 0)
    return {
      version: 1,
      title: copy.title,
      next: copy.setGoal,
      url: `${SCHEME}goals`,
      today: todayView,
      tomorrow: tomorrowView,
      empty: copy.empty,
    };

  // A reading item planned for today wins; otherwise continue where the reader stopped.
  const plan = state.plans
    .filter((row) => row.date === today && !row.isDone && goalAction(row.goalId) === 'read')
    .sort(
      (a, b) =>
        (a.reminderHour ?? 24) * 60 +
          (a.reminderMinute ?? 0) -
          ((b.reminderHour ?? 24) * 60 + (b.reminderMinute ?? 0)) || a.createdAt - b.createdAt,
    )
    .map((row) => ({ row, passage: plannedPassage(row) }))
    .find((item) => item.passage);
  let next: string;
  let url: string;
  if (plan?.passage) {
    next = copy.planned(plannedPassageTitle(plan.row, locale));
    url = mushafLink({ ...plan.passage, planId: plan.row.id });
  } else {
    const point = resumeReference(mushafResume(state)) ?? { surah: 1, ayah: 1 };
    const chapter = chapterById(point.surah);
    const hizb = hizbAt(point.surah, point.ayah);
    const place = `${locale === 'ar' ? chapter.nameAr : chapter.name} ${point.surah}:${point.ayah}`;
    next = copy.continue(hizb ? `${t('unit.hizb')} ${number(hizb)} · ${place}` : place);
    url = mushafLink(point);
  }
  return {
    version: 1,
    title: copy.title,
    next,
    url,
    today: todayView,
    tomorrow: tomorrowView,
    empty: copy.empty,
  };
}
