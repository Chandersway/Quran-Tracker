import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '../../../state/store';
import {
  getReminderFailure,
  onReminderFailureChanged,
  reconcileLocalReminders,
  setReminderFailure,
} from '../../../services/notifications/localReminders';
import {
  onNotificationPreferencesChanged,
  notifyNotificationPreferencesChanged,
} from '../../../services/notifications/notificationPreferenceEvents';
import { Notice } from '../../../shared/components';
import { useI18n } from '../../../i18n';

/** Restores local alarms on launch, onboarding completion and return from system settings. */
export function PlanningReminderCoordinator() {
  const { state, ready } = useAppStore();
  const current = useRef(state);
  current.current = state;
  const goal = state.goals.find((item) => item.id === 1);
  const minute = goal ? goal.reminderHour * 60 + goal.reminderMinute : 480;
  useEffect(() => {
    if (!ready) return;
    const reconcile = () => {
      void reconcileLocalReminders(current.current).catch(() => setReminderFailure('restore'));
    };
    let midnightTimer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      clearTimeout(midnightTimer);
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 1, 0);
      midnightTimer = setTimeout(() => {
        reconcile();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    reconcile();
    scheduleMidnight();
    const unlisten = onNotificationPreferencesChanged(reconcile);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        reconcile();
        scheduleMidnight();
      }
    });
    return () => {
      unlisten();
      subscription.remove();
      clearTimeout(midnightTimer);
    };
  }, [
    ready,
    state.plans,
    state.history,
    state.goals,
    state.goalDays,
    state.preferences.language,
    state.preferences.onboardingComplete,
    minute,
  ]);
  return null;
}
export function LocalReminderFailureNotice() {
  const failure = useSyncExternalStore(onReminderFailureChanged, getReminderFailure, () => null);
  const { t } = useI18n();
  return failure ? (
    <Notice
      error
      message={t(failure === 'cleanup' ? 'ui.reminderCleanupError' : 'ui.reminderRestoreError')}
      onRetry={notifyNotificationPreferencesChanged}
    />
  ) : null;
}
