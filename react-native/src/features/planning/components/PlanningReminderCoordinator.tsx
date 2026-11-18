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

/** Restores both daily reminders and pending Agenda alarms; never requests permission. */
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
    reconcile();
    const unlisten = onNotificationPreferencesChanged(reconcile);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') reconcile();
    });
    return () => {
      unlisten();
      subscription.remove();
    };
  }, [ready, state.plans, state.preferences.language, minute]);
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
