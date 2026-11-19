import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Switch, View } from 'react-native';
import { Button, Card, Field, Notice, Row, Section, Sheet, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';

import { useI18n } from '../../../i18n';
import {
  localNotificationDefaults,
  type LocalNotificationPreferences,
} from '../../../domain/notificationPreferences';
import {
  loadLocalNotifications,
  saveLocalNotifications,
} from '../../../services/notifications/localReminders';
import { requestPlanReminderPermission } from '../../../services/notifications/planningReminderPort';
import {
  notifyNotificationPreferencesChanged,
  onNotificationPreferencesChanged,
} from '../../../services/notifications/notificationPreferenceEvents';
import { syncRegisteredPushDevice } from '../../../services/notifications/pushDevice';
import { getBackend } from '../../../config/runtime';
import { localReminderCopy } from '../localReminderCopy';

type TimeKey = 'dailyMinute' | 'extraMinute' | 'quietStart' | 'quietEnd';
const clock = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

export function LocalRemindersPanel() {
  const { state, commit } = useAppStore();
  const { t } = useI18n();
  const p = usePalette();
  const copy = localReminderCopy[state.preferences.language];
  const [preferences, setPreferences] = useState(localNotificationDefaults);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<TimeKey | null>(null);
  const [hour, setHour] = useState(''),
    [minute, setMinute] = useState('');
  const goal = state.goals.find((item) => item.id === 1);
  const goalTime = goal ? goal.reminderHour * 60 + goal.reminderMinute : 480;
  const load = useCallback(() => {
    setReady(false);
    void loadLocalNotifications(state)
      .then((value) => {
        setPreferences(value);
        setReady(true);
        setError('');
      })
      .catch(() => setError(t('ui.reminderRestoreError')));
  }, [state, t]);
  // State reads include the legacy snapshot, while reloads track the shared goal time.
  const latestLoad = React.useRef(load);
  latestLoad.current = load;
  useEffect(() => {
    latestLoad.current();
    return onNotificationPreferencesChanged(() => latestLoad.current());
  }, [goalTime]);
  async function save(patch: Partial<LocalNotificationPreferences>) {
    const next = { ...preferences, ...patch };
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const schedules =
        (patch.enabled === true ||
          patch.daily === true ||
          patch.extra === true ||
          patch.planning === true ||
          (patch.dailyMinute !== undefined && next.daily) ||
          (patch.extraMinute !== undefined && next.extra)) &&
        next.enabled;
      if (schedules && Platform.OS !== 'web' && !(await requestPlanReminderPermission())) {
        setError(t('notifications.blocked'));
        return;
      }
      await saveLocalNotifications(state, next);
      if (next.dailyMinute !== goalTime)
        await commit({
          type: 'goals/save',
          goal: {
            ...(goal ?? { id: 1, unit: state.goal.unit, target: state.goal.target }),
            reminderHour: Math.floor(next.dailyMinute / 60),
            reminderMinute: next.dailyMinute % 60,
          },
          date: localDate(),
        });
      await commit({
        type: 'preferences',
        patch: {
          reminderEnabled: next.enabled && next.daily,
          reminderHour: Math.floor(next.dailyMinute / 60),
          reminderMinute: next.dailyMinute % 60,
        },
      });
      setPreferences(next);
      setEditing(null);
      notifyNotificationPreferencesChanged();
      const backend = getBackend();
      if (backend) {
        try {
          await syncRegisteredPushDevice(backend, state.preferences.language);
        } catch {
          setError(t('groups.error.network'));
        }
      }
      setSaved(true);
    } catch {
      setError(t('notifications.error'));
    } finally {
      setBusy(false);
    }
  }
  const toggle = (key: 'enabled' | 'daily' | 'extra' | 'planning' | 'quiet', title: string) => (
    <Row
      title={t(title)}
      trailing={
        <Switch
          value={preferences[key]}
          disabled={busy || !ready}
          onValueChange={(value) => {
            void save({ [key]: value });
          }}
          accessibilityLabel={t(title)}
          trackColor={{ false: p.line, true: p.primary }}
        />
      }
    />
  );
  function time(key: TimeKey, title: string) {
    return (
      <Row
        title={t(title)}
        trailing={
          <Button
            title={clock(preferences[key])}
            variant="secondary"
            disabled={busy || !ready}
            onPress={() => {
              setError('');
              setEditing(key);
              setHour(String(Math.floor(preferences[key] / 60)));
              setMinute(String(preferences[key] % 60));
            }}
          />
        }
      />
    );
  }
  const timeLabel =
    editing === 'dailyMinute'
      ? 'notifications.time'
      : editing === 'extraMinute'
        ? 'notifications.extraTime'
        : editing === 'quietStart'
          ? 'notifications.from'
          : 'notifications.until';
  return (
    <>
      <Section title={t('notifications.general')} />
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        {toggle('enabled', 'notifications.localOn')}
        {toggle('daily', 'notifications.daily')}
        {preferences.daily && time('dailyMinute', 'notifications.time')}
        <T size={13} muted style={{ paddingVertical: 12 }}>
          {copy.dailyHelp}
        </T>
        {toggle('extra', 'notifications.extra')}
        {preferences.extra && time('extraMinute', 'notifications.extraTime')}
        {toggle('planning', 'notifications.planningOn')}
        <T size={13} muted style={{ paddingVertical: 12 }}>
          {t('notifications.planningHelp')}
        </T>
        {toggle('quiet', 'notifications.quiet')}
        {preferences.quiet && (
          <>
            {time('quietStart', 'notifications.from')}
            {time('quietEnd', 'notifications.until')}
          </>
        )}
        <T muted size={12} style={{ paddingVertical: 16 }}>
          {t('notifications.timing')}
        </T>
        <T translate={false} muted size={12} style={{ paddingBottom: 12 }}>
          {copy.forecast}
        </T>
      </Card>
      {!editing && !!error && (
        <Notice error message={error} onRetry={!ready ? () => latestLoad.current() : undefined} />
      )}
      {saved && <Notice message={t('notifications.saved')} />}
      <Sheet
        visible={editing !== null}
        title={t(timeLabel)}
        onClose={() => {
          if (!busy) setEditing(null);
        }}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('notifications.hours')}
              value={hour}
              onChangeText={(value) => setHour(value.replace(/\D/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label={t('notifications.minutesLabel')}
              value={minute}
              onChangeText={(value) => setMinute(value.replace(/\D/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>
        {!!error && <Notice error message={error} />}
        <Button
          title={t('notifications.save')}
          loading={busy}
          disabled={!hour || !minute || Number(hour) > 23 || Number(minute) > 59}
          onPress={() => {
            if (editing) void save({ [editing]: Number(hour) * 60 + Number(minute) });
          }}
        />
      </Sheet>
    </>
  );
}
