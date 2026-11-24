import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { localDate } from '../../../domain/localDate';
import { useI18n } from '../../../i18n';
import { publishHomeWidget } from '../../../services/widget/homeWidget';
import { useAppStore } from '../../../state/store';
import { homeWidgetSnapshot } from '../model/homeWidgetSnapshot';

/** Keeps the Android home-screen widget in step with the daily goal and today's reading. */
export function HomeWidgetSync() {
  const { state, ready } = useAppStore();
  const { t, locale } = useI18n();
  const [today, setToday] = useState(localDate);
  const [resumed, setResumed] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 1, 0);
      timer = setTimeout(() => {
        setToday(localDate());
        schedule();
      }, next.getTime() - now.getTime());
    };
    schedule();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      setToday(localDate());
      setResumed((count) => count + 1);
      schedule();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
  const {
    goals,
    goal,
    goalDays,
    history,
    plans,
    cursor,
    preferences,
    mushafPositions,
    mushafPositionPresentations,
  } = state;
  const json = useMemo(
    () =>
      JSON.stringify(
        homeWidgetSnapshot(
          {
            goals,
            goal,
            goalDays,
            history,
            plans,
            cursor,
            preferences,
            mushafPositions,
            mushafPositionPresentations,
          },
          today,
          locale,
          t,
        ),
      ),
    // `t` is recreated every render but only depends on `locale`.
    [
      goals,
      goal,
      goalDays,
      history,
      plans,
      cursor,
      preferences,
      mushafPositions,
      mushafPositionPresentations,
      today,
      locale,
    ],
  );
  useEffect(() => {
    if (!ready) return;
    // The widget is best effort; a failed redraw must never disturb reading.
    publishHomeWidget(json).catch(() => undefined);
  }, [ready, json, resumed]);
  return null;
}
