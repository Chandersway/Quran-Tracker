import type { GroupFeedCursor, GroupFeedPost } from '../backend/types';

/** Hydrated feed rows are plain data. Compare every field, including signed media URLs. */
function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right))
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => sameValue(value, right[index]))
    );
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && sameValue(a[key], b[key]))
  );
}

/** Keep unchanged row identities and retain the whole list when its order/data are equal. */
export function reconcileFeedPosts(previous: GroupFeedPost[], incoming: GroupFeedPost[]) {
  if (previous === incoming) return previous;
  const byId = new Map(previous.map((post) => [post.id, post]));
  const next = incoming.map((post) => {
    const old = byId.get(post.id);
    return old && sameValue(old, post) ? old : post;
  });
  return next.length === previous.length && next.every((post, index) => post === previous[index])
    ? previous
    : next;
}

export function sameFeedCursor(left: GroupFeedCursor | null, right: GroupFeedCursor | null) {
  return left === right || (left?.id === right?.id && left?.createdAt === right?.createdAt);
}
