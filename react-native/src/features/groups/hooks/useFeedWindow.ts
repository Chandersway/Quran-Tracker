import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GroupFeedPost } from '../../../services/backend/types';
import { mergeFeedPosts } from '../../../services/groups/groupFeedController';

type Position = Pick<GroupFeedPost, 'id' | 'createdAt'>;
type WindowSnapshot = {
  source: readonly GroupFeedPost[];
  focusedPostId?: string;
  initialized: boolean;
  posts: GroupFeedPost[];
  oldest?: Position;
  unseenCount: number;
};
export type FeedWindowResult = {
  posts: GroupFeedPost[];
  unseenCount: number;
  reveal: () => void;
};

/** Match the feed cursor's timestamp/ID ordering, independently of its pinned badge. */
function compareAge(left: Position, right: Position): number {
  return (
    Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id.localeCompare(right.id)
  );
}

function oldestPosition(
  posts: readonly GroupFeedPost[],
  previous?: Position,
): Position | undefined {
  return posts.reduce<Position | undefined>(
    (oldest, post) => (!oldest || compareAge(post, oldest) < 0 ? post : oldest),
    previous,
  );
}

function openWindow(source: readonly GroupFeedPost[], focusedPostId?: string): WindowSnapshot {
  const posts = mergeFeedPosts([...source]);
  return {
    source,
    focusedPostId,
    initialized: posts.length > 0,
    posts,
    oldest: oldestPosition(posts),
    unseenCount: 0,
  };
}

function reconcileWindow(
  previous: WindowSnapshot,
  source: readonly GroupFeedPost[],
  focusedPostId?: string,
): WindowSnapshot {
  const sameSource =
    source === previous.source ||
    (source.length === previous.source.length &&
      source.every((post, index) => post === previous.source[index]));
  if (sameSource && focusedPostId === previous.focusedPostId) return previous;
  if (focusedPostId || !previous.initialized || focusedPostId !== previous.focusedPostId)
    return openWindow(source, focusedPostId);

  const incoming = mergeFeedPosts([...source]);
  const byId = new Map(incoming.map((post) => [post.id, post]));
  const known = new Set(previous.posts.map((post) => post.id));
  const existing = previous.posts.flatMap((post) => {
    const fresh = byId.get(post.id);
    return fresh ? [fresh] : [];
  });
  const unknown = incoming.filter((post) => !known.has(post.id));
  // A submitted post is a deliberate user action. Pagination only adds rows
  // beneath the existing window; new external activity waits for an explicit tap.
  const own = unknown.filter((post) => post.isMine);
  const older = unknown.filter(
    (post) => !post.isMine && previous.oldest && compareAge(post, previous.oldest) < 0,
  );
  const next = [...own, ...existing, ...older];
  const sameRows =
    next.length === previous.posts.length && next.every((post, i) => post === previous.posts[i]);
  const posts = sameRows ? previous.posts : next;
  return {
    source,
    focusedPostId,
    initialized: true,
    posts,
    oldest: oldestPosition(posts, previous.oldest),
    unseenCount: incoming.length - posts.length,
  };
}

/**
 * Keep the visible reading order steady during transport updates. Fresh data for
 * known rows and deletions apply immediately; revealing new posts deliberately
 * restores the server's pinned/date order. Account/group keys own lifecycle reset.
 */
export function useFeedWindow(
  source: readonly GroupFeedPost[],
  focusedPostId?: string,
): FeedWindowResult {
  const [snapshot, setSnapshot] = useState(() => openWindow(source, focusedPostId));
  const next = useMemo(
    () => reconcileWindow(snapshot, source, focusedPostId),
    [snapshot, source, focusedPostId],
  );
  // Return the derived window immediately; commit its ordering boundary after
  // render so interrupted/concurrent renders cannot mutate a shared ref.
  useEffect(() => setSnapshot(next), [next]);
  const reveal = useCallback(
    () => setSnapshot(openWindow(source, focusedPostId)),
    [source, focusedPostId],
  );
  return { posts: next.posts, unseenCount: next.unseenCount, reveal };
}
