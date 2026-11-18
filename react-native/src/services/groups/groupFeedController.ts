import type {
  GroupFeedConnection,
  GroupFeedCursor,
  GroupFeedPost,
  GroupFeedService,
} from '../backend/types';
import { reconcileFeedPosts, sameFeedCursor } from './feedSnapshots';

export type FeedState = {
  posts: GroupFeedPost[];
  nextCursor: GroupFeedCursor | null;
  busy: boolean;
  loadingOlder: boolean;
  error: unknown;
  connection: GroupFeedConnection;
};
export type FeedClock = { every(callback: () => void, ms: number): () => void };
const clock: FeedClock = {
  every(callback, ms) {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  },
};

export function mergeFeedPosts(posts: GroupFeedPost[]): GroupFeedPost[] {
  return [...new Map(posts.map((post) => [post.id, post])).values()].sort(
    (a, b) =>
      Number(b.isPinned) - Number(a.isPinned) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

/** Screen-independent feed lifecycle; all transport details stay behind GroupFeedService. */
export class GroupFeedController {
  private state: FeedState = {
    posts: [],
    nextCursor: null,
    busy: false,
    loadingOlder: false,
    error: null,
    connection: 'connecting',
  };
  private listeners = new Set<() => void>();
  private active = false;
  private generation = 0;
  private pages = 1;
  private connection: GroupFeedConnection = 'connecting';
  private close?: () => void;
  private stopPoll?: () => void;
  private work?: Promise<void>;
  private operation?: 'refresh' | 'older';
  private pendingRefresh = false;
  private pendingOlder = false;
  private hasSnapshot = false;
  private postsRevision = 0;
  private failedOperation: 'refresh' | 'older' = 'refresh';
  constructor(
    private service: GroupFeedService,
    private code: string,
    private postId?: string,
    private timer: FeedClock = clock,
    private pollIntervalMs = 30_000,
  ) {}
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private update(patch: Partial<FeedState>) {
    const next = { ...this.state, ...patch };
    next.posts = reconcileFeedPosts(this.state.posts, next.posts);
    if (sameFeedCursor(this.state.nextCursor, next.nextCursor))
      next.nextCursor = this.state.nextCursor;
    if (
      (Object.keys(next) as (keyof FeedState)[]).every((key) =>
        Object.is(next[key], this.state[key]),
      )
    )
      return;
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
  setPosts(update: (posts: GroupFeedPost[]) => GroupFeedPost[]) {
    const previous = this.state.posts;
    this.update({ posts: update(this.state.posts) });
    if (this.state.posts !== previous) {
      this.postsRevision++;
      // A read started before a server acknowledgement may not erase that acknowledgement.
      if (this.work) void this.requestRefresh(false, true);
    }
  }
  start = () => {
    if (this.active) return;
    this.active = true;
    const initial = !this.hasSnapshot;
    if (initial) this.update({ busy: true });
    const generation = this.generation;
    const current = () => this.active && generation === this.generation;
    this.close = this.service.subscribeFeed(
      this.code,
      () => {
        if (current()) void this.requestRefresh(false, true);
      },
      (connection) => {
        if (!current()) return;
        const reconnected = connection === 'live' && this.connection !== 'live';
        this.connection = connection;
        this.update({ connection: this.state.error ? 'offline' : connection });
        // A read already in flight may predate events sent before the socket was ready.
        if (reconnected) void this.requestRefresh(false, true);
      },
    );
    // Poll even with a socket: catches hard deletes/RLS edge cases and works without publication.
    this.stopPoll = this.timer.every(
      () => {
        if (current()) void this.requestRefresh(false);
      },
      Math.max(5_000, this.pollIntervalMs),
    );
    void this.requestRefresh(initial);
  };
  stop = () => {
    this.active = false;
    this.generation++;
    this.close?.();
    this.close = undefined;
    this.stopPoll?.();
    this.stopPoll = undefined;
    this.work = undefined;
    this.operation = undefined;
    this.pendingRefresh = false;
    this.pendingOlder = false;
    this.update({ busy: false, loadingOlder: false });
  };
  /** Explicit refresh keeps its visible feedback; transport reconciliation stays silent. */
  refresh = (): Promise<void> => this.requestRefresh(true);
  private requestRefresh(visible: boolean, invalidated = false): Promise<void> {
    if (!this.active) return Promise.resolve();
    if (visible) this.update({ busy: true });
    // A timer/mount/manual join needs no second identical read. Real invalidations
    // get one catch-up; a pending older read does not reconcile the latest page.
    if (!this.work || this.operation === 'older' || this.pendingOlder || invalidated)
      this.pendingRefresh = true;
    return this.drain();
  }
  private drain(): Promise<void> {
    if (this.work) return this.work;
    const generation = this.generation;
    // Defer execution until the work identity exists, including synchronous service errors.
    this.work = Promise.resolve().then(async () => {
      try {
        while (
          this.active &&
          generation === this.generation &&
          (this.pendingOlder || this.pendingRefresh)
        ) {
          const operation = this.pendingOlder ? 'older' : 'refresh';
          if (operation === 'older') this.pendingOlder = false;
          else this.pendingRefresh = false;
          this.operation = operation;
          await this.read(operation, generation);
        }
      } finally {
        if (this.active && generation === this.generation) {
          this.operation = undefined;
          this.work = undefined;
          this.update({ busy: false, loadingOlder: false });
        }
      }
    });
    return this.work;
  }
  private async read(operation: 'refresh' | 'older', generation: number) {
    const current = () => this.active && generation === this.generation;
    const revision = this.postsRevision;
    const changedLocally = () => {
      if (revision === this.postsRevision) return false;
      this.pendingRefresh = true;
      if (operation === 'older') this.pendingOlder = true;
      return true;
    };
    try {
      if (operation === 'older') {
        const cursor = this.state.nextCursor;
        if (!cursor) return;
        const result = await this.service.listFeedPage(this.code, { cursor, postId: this.postId });
        if (!current() || changedLocally()) return;
        this.pages++;
        this.update({
          posts: mergeFeedPosts([...this.state.posts, ...result.posts, ...result.pinnedPosts]),
          nextCursor: result.nextCursor,
          error: null,
          connection: this.connection,
        });
      } else {
        let cursor: GroupFeedCursor | undefined;
        let posts: GroupFeedPost[] = [];
        let nextCursor: GroupFeedCursor | null = null;
        let fetched = 0;
        for (let page = 0; page < this.pages; page++) {
          const result = await this.service.listFeedPage(this.code, {
            cursor,
            postId: this.postId,
          });
          if (!current() || changedLocally()) return;
          posts = [...posts, ...result.posts, ...result.pinnedPosts];
          nextCursor = result.nextCursor;
          fetched++;
          if (!nextCursor) break;
          cursor = nextCursor;
        }
        this.pages = fetched;
        this.hasSnapshot = true;
        // Refreshing the newest pages does not silently dismiss a failed older-page action.
        const error = this.failedOperation === 'older' && nextCursor ? this.state.error : null;
        if (!error) this.failedOperation = 'refresh';
        this.update({
          posts: mergeFeedPosts(posts),
          nextCursor,
          error,
          connection: error ? 'offline' : this.connection,
        });
      }
    } catch (error) {
      if (current()) {
        this.failedOperation = operation;
        this.update({ error, connection: 'offline' });
      }
    } finally {
      if (current() && operation === 'older' && !this.pendingOlder)
        this.update({ loadingOlder: false });
    }
  }
  retry = () => (this.failedOperation === 'older' ? this.loadOlder() : this.refresh());
  loadOlder = (): Promise<void> => {
    if (!this.active || this.state.loadingOlder || this.state.busy || !this.state.nextCursor)
      return Promise.resolve();
    this.pendingOlder = true;
    this.update({ loadingOlder: true });
    return this.drain();
  };
}
