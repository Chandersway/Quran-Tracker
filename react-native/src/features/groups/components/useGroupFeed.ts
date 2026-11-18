import { useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { GroupFeedService } from '../../../services/backend/types';
import { GroupFeedController } from '../../../services/groups/groupFeedController';
import { useI18n } from '../../../i18n';
import { groupError, GroupRefreshContext } from './groupUi';

export function useGroupFeed(
  service: GroupFeedService,
  code: string,
  postId?: string,
  pollIntervalMs = 30_000,
) {
  const { t } = useI18n();
  const refreshRevision = useContext(GroupRefreshContext);
  const controller = useMemo(
    () => new GroupFeedController(service, code, postId, undefined, pollIntervalMs),
    [service, code, postId, pollIntervalMs],
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  useFocusEffect(
    useCallback(() => {
      if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive')
        controller.start();
      const listener = AppState.addEventListener('change', (value) => {
        if (value === 'active') controller.start();
        else controller.stop();
      });
      return () => {
        listener.remove();
        controller.stop();
      };
    }, [controller]),
  );
  useEffect(() => {
    void controller.refresh();
  }, [controller, refreshRevision]);
  const run = async (
    action: () => Promise<unknown>,
    fallback = 'groups.error.network',
    refresh = true,
  ) => {
    setActionBusy(true);
    setActionError('');
    try {
      await action();
      if (refresh) await controller.refresh();
    } catch (error) {
      setActionError(groupError(error, fallback, t));
    } finally {
      setActionBusy(false);
    }
  };
  return {
    value: state.posts,
    busy: actionBusy || state.busy,
    loadingOlder: state.loadingOlder,
    error: actionError || (state.error ? groupError(state.error, 'groups.error.network', t) : ''),
    errorReason: state.error,
    connection: state.connection,
    nextCursor: state.nextCursor,
    reload: controller.refresh,
    retry: controller.retry,
    loadOlder: controller.loadOlder,
    run,
    setValue: (update: (posts: typeof state.posts) => typeof state.posts) =>
      controller.setPosts(update),
  };
}
