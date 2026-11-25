import type {
  GroupFeedPage,
  GroupFeedPost,
  GroupFeedRequest,
  GroupFeedCursor,
} from '../backend/types';

export type FeedRow = Record<string, unknown>;
export type FeedQuery = {
  groupId: string;
  limit: number;
  cursor?: GroupFeedCursor;
  postId?: string;
  pinnedOnly?: boolean;
  /** Applied by the adapter before pagination, never by filtering a returned page. */
  textOnly?: boolean;
};
export type GroupFeedReadPort = {
  groupId(code: string): Promise<string>;
  /** Published posts ordered created_at DESC, id DESC, cursor strictly exclusive. */
  read(query: FeedQuery): Promise<FeedRow[]>;
  hydrate(code: string, rows: FeedRow[]): Promise<GroupFeedPost[]>;
};

/** Validate before interpolating PostgREST's filter grammar. IDs are database UUIDs. */
export function feedCursorFilter(cursor: GroupFeedCursor): string {
  if (
    !/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)$/.test(cursor.createdAt) ||
    !Number.isFinite(Date.parse(cursor.createdAt)) ||
    !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(cursor.id)
  )
    throw new RangeError('Invalid feed cursor');
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}

export function createGroupFeedReader(port: GroupFeedReadPort) {
  return async (code: string, request: GroupFeedRequest = {}): Promise<GroupFeedPage> => {
    const groupId = await port.groupId(code);
    const limit = Math.max(1, Math.min(60, Math.floor(request.limit ?? 30)));
    const [rows, pins] = await Promise.all([
      port.read({ groupId, limit: limit + 1, cursor: request.cursor, postId: request.postId }),
      request.postId ? Promise.resolve([]) : port.read({ groupId, limit: 0, pinnedOnly: true }),
    ]);
    const window = rows.slice(0, limit);
    const unique = [...new Map([...window, ...pins].map((row) => [String(row.id), row])).values()];
    const hydrated = await port.hydrate(code, unique);
    const byId = new Map(hydrated.map((post) => [post.id, post]));
    const last = window.at(-1);
    return {
      posts: window.map((row) => byId.get(String(row.id))!).filter(Boolean),
      pinnedPosts: pins.map((row) => byId.get(String(row.id))!).filter(Boolean),
      nextCursor:
        !request.postId && rows.length > limit && last
          ? { createdAt: String(last.created_at), id: String(last.id) }
          : null,
    };
  };
}
