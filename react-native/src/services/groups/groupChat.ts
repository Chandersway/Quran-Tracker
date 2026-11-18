import type {
  GroupFeedPage,
  GroupFeedPost,
  GroupFeedRequest,
  GroupFeedService,
} from '../backend/types';
import { feedCursorFilter, type GroupFeedReadPort } from './groupFeedReader';

export const GROUP_CHAT_MAX_LENGTH = 500;
export type GroupChatRequest = Omit<GroupFeedRequest, 'postId'>;
/** Chat and the Kotlin feed share text posts; no separate or public message channel exists. */
export type GroupChatService = {
  listChatPage(code: string, request?: GroupChatRequest): Promise<GroupFeedPage>;
  subscribeChat: GroupFeedService['subscribeFeed'];
  sendChatMessage(code: string, content: string, expectedUserId: string): Promise<GroupFeedPost>;
};
type ChatPort = GroupFeedReadPort & {
  subscribe: GroupFeedService['subscribeFeed'];
  send(code: string, content: string, expectedUserId: string): Promise<GroupFeedPost>;
};

export function createGroupChatService(port: ChatPort): GroupChatService {
  return {
    async listChatPage(code, request = {}) {
      if (request.cursor) feedCursorFilter(request.cursor);
      const groupId = await port.groupId(code);
      const requested = request.limit ?? 30;
      const limit = Number.isFinite(requested)
        ? Math.max(1, Math.min(60, Math.floor(requested)))
        : 30;
      const rows = await port.read({
        groupId,
        textOnly: true,
        cursor: request.cursor,
        limit: limit + 1,
      });
      const window = rows.slice(0, limit);
      const posts = await port.hydrate(code, window);
      const last = window.at(-1);
      return {
        // Pins retain their meaning in the feed, but never reorder a conversation.
        posts: posts.map((post) => ({ ...post, isPinned: false })),
        pinnedPosts: [],
        nextCursor:
          rows.length > limit && last
            ? { createdAt: String(last.created_at), id: String(last.id) }
            : null,
      };
    },
    subscribeChat: port.subscribe,
    async sendChatMessage(code, content, expectedUserId) {
      if (!expectedUserId) throw new Error('AUTH_REQUIRED');
      const message = content.trim();
      if (!message || message.length > GROUP_CHAT_MAX_LENGTH)
        throw new RangeError('INVALID_CONTENT');
      const post = await port.send(code, message, expectedUserId);
      return { ...post, isPinned: false };
    },
  };
}

/** Reuses the tested lifecycle/pagination controller, while keeping chat's query explicit. */
export function chatFeedService(service: GroupChatService): GroupFeedService {
  return {
    listFeedPage: (code, request) => service.listChatPage(code, request),
    subscribeFeed: service.subscribeChat,
  };
}

/** The actual scroll decision used by the UI: old-page loads and edits never steal position. */
export class GroupChatScroll {
  private latest: Pick<GroupFeedPost, 'id' | 'createdAt'> | undefined;
  private pending = new Set<string>();
  private atLatest = true;
  private forceLatest = false;
  private pendingScroll = false;
  /** Drag intent cancels a layout command even before the first offset event arrives. */
  beginHistory() {
    this.atLatest = false;
    this.forceLatest = false;
    this.pendingScroll = false;
  }
  setOffset(offset: number) {
    this.atLatest = offset < 56;
    if (this.atLatest) this.pending.clear();
    else {
      this.forceLatest = false;
      this.pendingScroll = false;
    }
    return this.pending.size;
  }
  showLatest() {
    this.forceLatest = true;
    this.atLatest = true;
    this.pending.clear();
    this.pendingScroll = true;
  }
  /** Either layout or the next frame may consume it; never a later unrelated update. */
  takeScroll() {
    const shouldScroll = this.pendingScroll && this.atLatest;
    this.pendingScroll = false;
    return shouldScroll;
  }
  observe(posts: GroupFeedPost[]) {
    const previous = this.latest;
    const latest = posts[0];
    const added = previous
      ? posts.filter(
          (post) =>
            post.createdAt > previous.createdAt ||
            (post.createdAt === previous.createdAt && post.id > previous.id),
        )
      : [];
    const scroll = this.forceLatest || (this.atLatest && added.length > 0);
    this.pendingScroll = scroll;
    if (!this.atLatest) for (const post of added) this.pending.add(post.id);
    this.latest = latest ?? previous;
    this.forceLatest = false;
    return { scroll, unread: this.pending.size };
  }
}
