import type { GroupFeedPost } from '../backend/types';

/** Rebase only this viewer's contribution; preserve other readers and post contents. */
export function withFeedReaction(post: GroupFeedPost, reaction: string | null): GroupFeedPost {
  if (post.myReaction === reaction) return post;
  const counts = { ...post.reactionCounts };
  if (post.myReaction) counts[post.myReaction] = Math.max(0, (counts[post.myReaction] ?? 0) - 1);
  if (reaction) counts[reaction] = (counts[reaction] ?? 0) + 1;
  return {
    ...post,
    myReaction: reaction,
    reactionCounts: counts,
    likeCount: counts.like ?? 0,
    likedByMe: reaction === 'like',
  };
}

/** One non-idempotent toggle per row at a time. Never retry an uncertain write. */
export class FeedReactions {
  private pending = new Map<string, string | null>();
  private listeners = new Set<() => void>();
  private generation = 0;
  private actor: string | null | undefined;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  reset = () => {
    this.generation++;
    this.pending.clear();
    this.emit();
  };
  setActor(id: string | null, initialSnapshot = false) {
    if (this.actor !== id && !(initialSnapshot && this.actor === undefined)) this.reset();
    this.actor = id;
  }
  busy = (id: string) => this.pending.has(id);
  project = (posts: GroupFeedPost[]) =>
    posts.map((post) =>
      this.pending.has(post.id) ? withFeedReaction(post, this.pending.get(post.id) ?? null) : post,
    );
  async toggle(
    post: GroupFeedPost,
    reaction: string,
    send: () => Promise<string | null>,
    commit: (id: string, reaction: string | null) => void,
    fail: (error: unknown) => void,
  ): Promise<void> {
    if (this.pending.has(post.id)) return;
    const generation = this.generation;
    this.pending.set(post.id, post.myReaction === reaction ? null : reaction);
    this.emit();
    try {
      const canonical = await send();
      if (generation !== this.generation) return;
      // Commit before removing the overlay, so no intermediate unselected frame occurs.
      commit(post.id, canonical);
    } catch (error) {
      if (generation === this.generation) fail(error);
    } finally {
      if (generation === this.generation) {
        this.pending.delete(post.id);
        this.emit();
      }
    }
  }
}
