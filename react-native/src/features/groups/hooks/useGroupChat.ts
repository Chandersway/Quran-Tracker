import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Backend } from '../../../services/backend/backend';
import type { AuthSession } from '../../../services/auth/types';
import { chatFeedService } from '../../../services/groups/groupChat';
import { groupChatDrafts } from '../../../services/groups/groupDrafts';
import { mergeFeedPosts } from '../../../services/groups/groupFeedController';
import { useGroupFeed } from '../components/useGroupFeed';
import { groupError } from '../components/groupUi';
import { useI18n } from '../../../i18n';
import { groupErrorKey } from '../../../services/groups/groupErrors';

export function useChatSession(backend: Backend | null) {
  const [session, setSession] = useState<AuthSession | null | undefined>();
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!backend) return;
    let active = true;
    let changed = false;
    setError(false);
    const stop = backend.auth.onChange((value) => {
      changed = true;
      if (active) {
        setSession(value);
        setError(false);
      }
    });
    void backend.auth
      .getSession()
      .then((value) => {
        if (active && !changed) setSession(value);
      })
      .catch(() => {
        if (active && !changed) setError(true);
      });
    return () => {
      active = false;
      stop();
    };
  }, [backend, revision]);
  return { session, error, retry: () => setRevision((value) => value + 1) };
}

export function useGroupChat(backend: Backend, code: string, accountId: string) {
  const { t } = useI18n();
  const service = useMemo(() => chatFeedService(backend.groups), [backend]);
  // A socket can join even when hosted publication coverage has not been provisioned.
  // Keep focused chat responsive in that case; blur/background still clears the timer.
  const feed = useGroupFeed(service, code, undefined, 5_000);
  const store = useMemo(() => groupChatDrafts(accountId, code), [accountId, code]);
  const drafts = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  const [sendError, setSendError] = useState('');
  const [sentRevision, setSentRevision] = useState(0);
  const [sendDenied, setSendDenied] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const send = async () => {
    setSendError('');
    setSendDenied(false);
    await store.send(async (text, expectedUserId) => {
      try {
        const message = await backend.groups.sendChatMessage(code, text, expectedUserId!);
        if (active.current) {
          // An acknowledged send is visible immediately; a refresh cannot turn it into failure.
          feed.setValue((posts) => mergeFeedPosts([...posts, message]));
          setSentRevision((value) => value + 1);
          void feed.reload();
        }
      } catch (error) {
        if (active.current) {
          setSendError(groupError(error, 'groups.error.network', t));
          setSendDenied(groupErrorKey(error) === 'groups.error.permission');
        }
        throw error;
      }
    });
  };
  const accessDenied = [
    'groups.error.permission',
    'groups.error.blocked',
    'groups.error.notFound',
    'groups.error.login',
    'groups.error.session',
  ].includes(groupErrorKey(feed.errorReason) ?? '');
  return {
    ...feed,
    draft: drafts.post,
    setDraft: (text: string) => {
      store.set(text);
      setSendError('');
    },
    send,
    sendError,
    sentRevision,
    accessDenied,
    sendDenied,
  };
}
