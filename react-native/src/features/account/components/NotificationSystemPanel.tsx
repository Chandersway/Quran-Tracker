import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../i18n';
import { Button, Card, Notice, Row, Section, T } from '../../../shared/components';
import {
  observeNotificationSystem,
  openNotificationSettings,
  type NotificationSystemStatus,
} from '../../../services/notifications/notificationSystem';
import { notificationSystemPort } from '../../../services/notifications/notificationSystemPort';
import { GROUP_PUSH_CHANNEL } from '../../../services/notifications/groupPushPolicy';
import { onNotificationPreferencesChanged } from '../../../services/notifications/notificationPreferenceEvents';
import { notificationSystemText } from '../model/notificationSystemCopy';

export function NotificationSystemPanel({ refreshKey }: { refreshKey?: boolean }) {
  const { locale, t } = useI18n();
  const copy = (key: Parameters<typeof notificationSystemText>[0]) =>
    notificationSystemText(key, locale);
  const [status, setStatus] = useState<NotificationSystemStatus | null>(null);
  const [error, setError] = useState<'error' | 'openError' | null>(null);
  const refresh = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    const observer = observeNotificationSystem(
      notificationSystemPort,
      (next) => {
        setStatus(next);
        setError(null);
      },
      () => setError('error'),
    );
    refresh.current = observer.refresh;
    const stop = onNotificationPreferencesChanged(() => void observer.refresh());
    return () => {
      stop();
      observer.dispose();
      refresh.current = null;
    };
  }, []);
  useEffect(() => {
    void refresh.current?.();
  }, [refreshKey]);
  return (
    <>
      <Section title={copy('title')} />
      <Card style={{ gap: 12 }}>
        {status ? (
          <>
            <Row title={copy('permission')} subtitle={copy(status.permission)} />
            {status.channels.map((channel) => (
              <Row
                key={channel.id}
                title={copy(channel.id === GROUP_PUSH_CHANNEL ? 'groups' : 'reminders')}
                subtitle={copy(channel.state)}
              />
            ))}
          </>
        ) : (
          <T muted>{t('common.loading')}</T>
        )}
        {status?.permission !== 'unavailable' ? (
          <Button
            title={copy('open')}
            icon="settings"
            variant="secondary"
            onPress={() =>
              void openNotificationSettings(notificationSystemPort).catch(() =>
                setError('openError'),
              )
            }
          />
        ) : null}
        {error ? (
          <Notice error message={copy(error)} onRetry={() => void refresh.current?.()} />
        ) : null}
      </Card>
    </>
  );
}
