import { useEffect, useMemo, useRef, useState } from 'react';
import type { Backend } from '../../../services/backend/backend';
import type { GroupFeedPost } from '../../../services/backend/types';
import { FeedReactions, withFeedReaction } from '../../../services/groups/feedReactions';
import { groupError } from '../components/groupUi';
import { useI18n } from '../../../i18n';

export function useFeedReactions(
  backend: Backend,
  code: string,
  source: GroupFeedPost[],
  setPosts: (update: (posts: GroupFeedPost[]) => GroupFeedPost[]) => void,
) {
  const { t } = useI18n();
  const controller = useMemo(() => new FeedReactions(), [backend, code]);
  const [revision, redraw] = useState(0);
  const [failure, setFailure] = useState<{ controller: FeedReactions; message: string } | null>(
    null,
  );
  const latest = useRef({ setPosts, t });
  latest.current = { setPosts, t };
  useEffect(() => {
    const unsubscribe = controller.subscribe(() => redraw((value) => value + 1));
    let active = true;
    let authRevision = 0;
    const stopAuth = backend.auth.onChange((session) => {
      authRevision++;
      controller.setActor(session?.user.id ?? null, true);
      setFailure(null);
    });
    const revision = authRevision;
    void backend.auth
      .getSession()
      .then((session) => {
        if (active && revision === authRevision)
          controller.setActor(session?.user.id ?? null, true);
      })
      .catch(() => {
        /* Authentication errors are handled by the account flow. */
      });
    return () => {
      active = false;
      unsubscribe();
      stopAuth();
      controller.reset();
    };
  }, [backend, controller]);
  const posts = useMemo(() => controller.project(source), [controller, source, revision]);
  return {
    posts,
    busy: controller.busy,
    error: failure?.controller === controller ? failure.message : '',
    clearError: () => setFailure(null),
    toggle(post: GroupFeedPost, reaction: string) {
      if (controller.busy(post.id)) return;
      setFailure(null);
      void controller.toggle(
        post,
        reaction,
        () => backend.groups.toggleReaction(code, post.id, reaction),
        (id, canonical) =>
          latest.current.setPosts((posts) =>
            posts.map((row) => (row.id === id ? withFeedReaction(row, canonical) : row)),
          ),
        (error) =>
          setFailure({
            controller,
            message: groupError(error, 'groups.error.network', latest.current.t),
          }),
      );
    },
  };
}
