import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { GroupJoinTarget } from '../../../services/groups/groupJoin';
import { groupJoinUrl, parseGroupJoinInput } from '../../../services/groups/groupJoin';
import { pendingGroup } from '../../../services/groups/pendingGroup';
import { requiresGroupAccessRequest } from '../../../services/groups/groupErrors';
import { useI18n } from '../../../i18n';
import { useAppNavigation } from '../../../app/navigation/types';
import { Button, Field, Notice, T } from '../../../shared/components';
import { groupError } from './groupUi';

/** Joining remains an explicit action; neither a deep link nor a sign-in event accepts an invitation. */
export function GroupJoinFlow({
  backend,
  target,
  onJoined,
  onCancel,
}: {
  backend: Backend;
  target?: GroupJoinTarget;
  onJoined: (code: string) => void;
  onCancel?: () => void;
}) {
  const { t, format } = useI18n();
  const navigation = useAppNavigation();
  const [input, setInput] = useState(target ? groupJoinUrl(target) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [accessRequest, setAccessRequest] = useState<GroupJoinTarget | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (target) {
      setInput(groupJoinUrl(target));
      void pendingGroup.receive(groupJoinUrl(target)).catch(() => undefined);
    }
  }, [target?.code, target?.token]);
  async function join() {
    const destination = parseGroupJoinInput(input);
    if (!destination) {
      setError(t('app.groupJoinText.invalidCode'));
      return;
    }
    setBusy(true);
    setError('');
    setNeedsLogin(false);
    try {
      if (!(await backend.auth.getSession())?.user.id) {
        await pendingGroup.receive(groupJoinUrl(destination));
        setNeedsLogin(true);
        return;
      }
      const group = destination.token
        ? await backend.groups.acceptInvitation(destination.token)
        : await backend.groups.join(destination.code);
      await pendingGroup.consume(destination);
      onJoined(group.code);
    } catch (reason) {
      if (requiresGroupAccessRequest(reason, destination.token !== null)) {
        setAccessRequest(destination);
        setMessage('');
      } else
        setError(
          groupError(
            reason,
            destination.token ? 'groups.invite.acceptError' : 'app.groupJoinText.error',
            t,
          ),
        );
    } finally {
      setBusy(false);
    }
  }
  async function request() {
    if (!accessRequest) return;
    setBusy(true);
    setError('');
    try {
      await backend.groups.requestAccess(accessRequest.code, message);
      await pendingGroup.consume(accessRequest);
      setSent(true);
      setAccessRequest(null);
    } catch (reason) {
      setError(groupError(reason, 'groups.requests.sendError', t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 14 }}>
      {target ? (
        <>
          <T bold>{format('app.groupCode', target.code)}</T>
          <T muted>{t('groups.invite.confirmBody')}</T>
        </>
      ) : (
        <>
          <T muted>{t('groups.requests.requestHint')}</T>
          <Field
            label={t('app.groupJoinText.groupCode')}
            value={input}
            onChangeText={(value) => {
              setInput(value);
              setAccessRequest(null);
              setSent(false);
              setError('');
            }}
            maxLength={300}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      )}
      {error ? <Notice message={error} error /> : null}
      {sent ? (
        <Notice message={t('groups.requests.sent')} />
      ) : accessRequest ? (
        <>
          <T>{format('groups.requests.dialogBody', accessRequest.code)}</T>
          <Field
            label={t('groups.requests.messageHint')}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <Button
            title={t('groups.requests.send')}
            loading={busy}
            disabled={busy}
            onPress={() => void request()}
          />
        </>
      ) : (
        <Button
          title={t('app.groupJoinText.button')}
          loading={busy}
          disabled={busy || !input.trim()}
          onPress={() => void join()}
        />
      )}
      {needsLogin ? (
        <>
          <Notice message={t('groups.accountRequired.body')} />
          <Button
            title={t('groups.accountRequired.action')}
            onPress={() => navigation.navigate('Account')}
          />
        </>
      ) : null}
      {onCancel ? (
        <Button
          title={t('common.cancel')}
          variant="quiet"
          disabled={busy}
          onPress={() => {
            const current = parseGroupJoinInput(input);
            if (current) void pendingGroup.consume(current).catch(() => undefined);
            onCancel();
          }}
        />
      ) : null}
    </View>
  );
}
