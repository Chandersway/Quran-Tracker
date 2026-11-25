import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createGroupFeedReader,
  feedCursorFilter,
  type FeedQuery,
} from '../src/services/groups/groupFeedReader';
import { GroupFeedController, type FeedClock } from '../src/services/groups/groupFeedController';
import { createGroupFeedSubscription } from '../src/services/groups/groupFeedSubscription';
import { GroupDraftStore, groupDrafts } from '../src/services/groups/groupDrafts';
import { captureDraftActor } from '../src/services/groups/draftActor';
import { isCorsGroupStorageImage } from '../src/features/groups/components/groupImageSource';
import {
  communityCopy,
  groupRoleLabel,
  groupStatusLabel,
} from '../src/features/groups/communityCopy';
import type {
  GroupFeedConnection,
  GroupFeedPost,
  GroupFeedPage,
  GroupFeedService,
  GroupFeedRequest,
} from '../src/services/backend/types';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const timestamp = '2026-11-14T12:00:00.000000+00:00';
function post(n: number, pinned = false): GroupFeedPost {
  return {
    id: id(n),
    createdAt: timestamp,
    createdBy: 'alice',
    displayName: 'Alice',
    type: 'text',
    content: `Post ${n}`,
    editedAt: null,
    isPinned: pinned,
    isMine: false,
    likeCount: 0,
    likedByMe: false,
    reactionCounts: {},
    myReaction: null,
    comments: [],
  };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function controlledFeed() {
  const requests: (ReturnType<typeof deferred<GroupFeedPage>> & { request: GroupFeedRequest })[] =
    [];
  const subscriptions: { change: () => void; status: (value: GroupFeedConnection) => void }[] = [];
  let poll = () => {};
  const service: GroupFeedService = {
    listFeedPage: (_code, request = {}) => {
      const call = { ...deferred<GroupFeedPage>(), request };
      requests.push(call);
      return call.promise;
    },
    subscribeFeed: (_code, change, status) => {
      subscriptions.push({ change, status });
      status('polling');
      return () => {};
    },
  };
  const controller = new GroupFeedController(service, 'ABC-1234', undefined, {
    every: (callback) => {
      poll = callback;
      return () => {
        poll = () => {};
      };
    },
  });
  return {
    controller,
    requests,
    subscriptions,
    poll: () => poll(),
    change: () => subscriptions.at(-1)!.change(),
    status: (value: GroupFeedConnection) => subscriptions.at(-1)!.status(value),
    async finish(index: number, posts: GroupFeedPost[], more = false) {
      const last = posts.at(-1);
      requests[index]!.resolve({
        posts,
        pinnedPosts: [],
        nextCursor: more && last ? { id: last.id, createdAt: last.createdAt } : null,
      });
      await flush();
    },
  };
}

function fixture(count = 75) {
  const calls: FeedQuery[] = [];
  const requests: GroupFeedRequest[] = [];
  let rows = Array.from({ length: count }, (_, index) => post(index + 1, index === 0));
  let fail = false;
  let invalidate = () => {};
  let status: (value: GroupFeedConnection) => void = () => {};
  let subscriptions = 0,
    cleanups = 0,
    polls = 0,
    cleared = 0;
  let poll = () => {};
  const timer: FeedClock = {
    every(callback, ms) {
      assert.equal(ms, 30_000);
      polls++;
      poll = callback;
      return () => {
        cleared++;
        poll = () => {};
      };
    },
  };
  const read = createGroupFeedReader({
    groupId: async (code) => {
      assert.equal(code, 'ABC-1234');
      return 'group-a';
    },
    read: async (query) => {
      calls.push(query);
      assert.equal(query.groupId, 'group-a');
      if (fail) throw new Error('offline');
      let matches = [...rows].sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      );
      if (query.postId) matches = matches.filter((post) => post.id === query.postId);
      if (query.cursor)
        matches = matches.filter(
          (post) =>
            post.createdAt < query.cursor!.createdAt ||
            (post.createdAt === query.cursor!.createdAt && post.id < query.cursor!.id),
        );
      if (query.pinnedOnly) matches = matches.filter((post) => post.isPinned);
      else matches = matches.slice(0, query.limit);
      return matches.map((post) => ({ id: post.id, created_at: post.createdAt }));
    },
    hydrate: async (_code, data) => data.map((row) => rows.find((post) => post.id === row.id)!),
  });
  const service: GroupFeedService = {
    listFeedPage: (code, request = {}) => {
      requests.push(request);
      return read(code, request);
    },
    subscribeFeed(code, change, connection) {
      assert.equal(code, 'ABC-1234');
      subscriptions++;
      invalidate = change;
      status = connection;
      connection('polling');
      return () => {
        cleanups++;
      };
    },
  };
  return {
    service,
    calls,
    requests,
    timer,
    change: () => invalidate(),
    status: (value: GroupFeedConnection) => status(value),
    poll: () => poll(),
    fail: (value: boolean) => {
      fail = value;
    },
    rows: () => rows,
    setRows: (value: GroupFeedPost[]) => {
      rows = value;
    },
    lifecycle: () => ({ subscriptions, cleanups, polls, cleared }),
  };
}

test('keyset pages cover timestamp ties exactly once; old pins survive outside the latest 60', async () => {
  const f = fixture(91);
  const seen: string[] = [];
  let cursor;
  do {
    const page = await f.service.listFeedPage('ABC-1234', { cursor, limit: 30 });
    seen.push(...page.posts.map((post) => post.id));
    assert.equal(page.pinnedPosts[0]?.id, id(1));
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  assert.equal(seen.length, 91);
  assert.equal(new Set(seen).size, 91);
  assert.deepEqual(
    seen,
    f
      .rows()
      .map((post) => post.id)
      .reverse(),
  );
  assert.equal(f.calls[0]?.limit, 31, 'lookahead decides whether another page exists');
  assert.ok(
    f.calls.some((call) => call.pinnedOnly && !call.cursor),
    'pins have their own unbounded window',
  );
});

test('cursor filters use strict timestamp + UUID ordering and reject filter injection', () => {
  assert.equal(
    feedCursorFilter({ createdAt: timestamp, id: id(1) }),
    `created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${id(1)})`,
  );
  assert.throws(
    () => feedCursorFilter({ createdAt: timestamp, id: 'bad),group_id.eq.other' }),
    RangeError,
  );
  assert.throws(() => feedCursorFilter({ createdAt: 'bad,or(secret)', id: id(1) }), RangeError);
});

test('focused deep-link reads stay scoped and do not include unrelated pins or an older cursor', async () => {
  const f = fixture();
  const page = await f.service.listFeedPage('ABC-1234', { postId: id(20) });
  assert.deepEqual(
    page.posts.map((post) => post.id),
    [id(20)],
  );
  assert.deepEqual(page.pinnedPosts, []);
  assert.equal(page.nextCursor, null);
  assert.equal(f.calls.length, 1);
});

test('controller loads older pages, deduplicates pins, and keeps all loaded pages fresh on invalidation', async () => {
  const f = fixture();
  const controller = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  controller.start();
  await flush();
  assert.equal(controller.snapshot().posts.length, 31);
  assert.equal(controller.snapshot().posts[0]?.id, id(1));
  await controller.loadOlder();
  assert.equal(controller.snapshot().posts.length, 61);
  f.setRows([
    post(76),
    ...f
      .rows()
      .filter((post) => post.id !== id(60))
      .map((post) =>
        post.id === id(40)
          ? { ...post, content: 'Edited remotely', reactionCounts: { love: 1 } }
          : post,
      ),
  ]);
  f.change();
  await flush();
  const snapshot = controller.snapshot();
  assert.ok(snapshot.posts.some((post) => post.id === id(76)));
  assert.ok(!snapshot.posts.some((post) => post.id === id(60)));
  assert.equal(snapshot.posts.find((post) => post.id === id(40))?.content, 'Edited remotely');
  assert.equal(snapshot.posts.find((post) => post.id === id(40))?.reactionCounts.love, 1);
  assert.equal(new Set(snapshot.posts.map((post) => post.id)).size, snapshot.posts.length);
  controller.stop();
});

test('an already loaded empty feed does not flash its loading state on a background poll', async () => {
  const f = fixture(0);
  const controller = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  controller.start();
  await flush();
  try {
    assert.equal(controller.snapshot().busy, false);
    f.poll();
    assert.equal(
      controller.snapshot().busy,
      false,
      'the same busy flag drives the empty feed/chat loading placeholder',
    );
    await flush();
  } finally {
    controller.stop();
  }
});

test('identical background feed responses do not publish or replace the displayed list', async () => {
  const f = fixture(1);
  const controller = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  controller.start();
  await flush();
  const before = controller.snapshot();
  let published = 0;
  const unsubscribe = controller.subscribe(() => published++);
  try {
    // HTTP hydration returns fresh objects even when every visible field is unchanged.
    f.setRows(structuredClone(f.rows()));
    f.poll();
    await flush();
    assert.equal(published, 0, 'an unchanged background response must not rerender subscribers');
    assert.equal(controller.snapshot(), before);
    assert.equal(controller.snapshot().posts, before.posts);
  } finally {
    unsubscribe();
    controller.stop();
  }
});

test('initial mount and live status coalesce, while manual refresh promotes a silent request without a duplicate fetch', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  const mounting = c.refresh();
  f.status('live');
  await flush();
  try {
    assert.equal(c.snapshot().busy, true);
    assert.equal(f.requests.length, 1);
    await f.finish(0, [post(5)]);
    await mounting;
    assert.equal(
      f.requests.length,
      1,
      'mount effect and first socket readiness do not enqueue identical initial reads',
    );
    f.poll();
    await flush();
    assert.equal(c.snapshot().busy, false);
    const manual = c.refresh();
    assert.equal(c.snapshot().busy, true, 'explicit refresh retains visible feedback');
    f.poll();
    await f.finish(1, [post(5)]);
    await manual;
    assert.equal(f.requests.length, 2, 'ticks and manual promotion share the active read');
    assert.equal(c.snapshot().busy, false);
  } finally {
    c.stop();
  }
});

test('live readiness catches up when the initial read began before subscription confirmation', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  try {
    // The initial HTTP snapshot predates a message written before the socket was ready.
    // That message emits no event to this client, so readiness must schedule a fresh read.
    f.status('live');
    await f.finish(0, [post(1)]);
    assert.equal(f.requests.length, 2, 'subscription readiness must close the initial read gap');
    await f.finish(1, [post(2), post(1)]);
    assert.deepEqual(
      c.snapshot().posts.map((row) => row.id),
      [id(2), id(1)],
    );
  } finally {
    c.stop();
  }
});

test('background retries retain permission denial until a successful authorized response', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  await f.finish(0, [post(5)]);
  try {
    f.poll();
    await flush();
    const denial = new Error('PERMISSION_DENIED');
    f.requests[1]!.reject(denial);
    await flush();
    const before = c.snapshot();
    f.poll();
    await flush();
    assert.equal(
      c.snapshot().error,
      denial,
      'accessDenied must not disappear while the next read is pending',
    );
    assert.equal(c.snapshot().busy, false);
    assert.equal(c.snapshot().posts, before.posts);
    await f.finish(2, [post(5)]);
    assert.equal(c.snapshot().error, null);
    assert.equal(c.snapshot().connection, 'polling');
  } finally {
    c.stop();
  }
});

test('older-page intent waits for a silent refresh and invalidation waits for older data without losing its cursor', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  await f.finish(0, [post(5), post(4)], true);
  try {
    f.poll();
    await flush();
    const older = c.loadOlder();
    assert.equal(
      c.snapshot().loadingOlder,
      true,
      'a user tap while silently refreshing is retained',
    );
    assert.equal(f.requests.length, 2);
    await f.finish(1, [post(6), post(5)], true);
    assert.equal(
      f.requests[2]?.request.cursor?.id,
      id(5),
      'pagination uses the freshly reconciled cursor',
    );
    f.change();
    f.change();
    assert.equal(c.snapshot().loadingOlder, true);
    assert.equal(f.requests.length, 3, 'socket invalidation cannot interrupt the older-page fetch');
    await f.finish(2, [post(4), post(3)], true);
    assert.equal(c.snapshot().posts.length, 4);
    await f.finish(3, [post(6), post(5)], true);
    await f.finish(4, [post(4), post(3)], true);
    await older;
    assert.equal(c.snapshot().posts.length, 4);
    assert.equal(c.snapshot().nextCursor?.id, id(3));
    assert.equal(c.snapshot().loadingOlder, false);
    assert.equal(f.requests.length, 5, 'the two loaded pages are reconciled once for a burst');
  } finally {
    c.stop();
  }
});

test('socket changes during a refresh coalesce to one catch-up and old lifecycle callbacks cannot affect a restarted controller', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  await f.finish(0, [post(5)]);
  try {
    f.poll();
    await flush();
    f.change();
    f.change();
    f.poll();
    await f.finish(1, [post(5)]);
    assert.equal(f.requests.length, 3);
    await f.finish(2, [post(6), post(5)]);
    assert.equal(f.requests.length, 3);
    assert.equal(c.snapshot().posts[0]?.id, id(6));
    f.poll();
    await flush();
    const previous = f.subscriptions[0]!;
    c.stop();
    c.start();
    await flush();
    const waiting = c.snapshot();
    previous.change();
    previous.status('offline');
    await f.finish(3, [post(99)]);
    assert.equal(
      c.snapshot(),
      waiting,
      'old reads/statuses do not write into the new subscription lifetime',
    );
    await f.finish(4, [post(7), post(6)]);
    assert.equal(c.snapshot().posts[0]?.id, id(7));
    assert.equal(f.requests.length, 5);
  } finally {
    c.stop();
  }
});

test('a local server acknowledgement survives a stale background response until catch-up confirms it', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  await f.finish(0, [post(5)]);
  try {
    f.poll();
    await flush();
    c.setPosts((posts) => [post(6), ...posts]);
    const acknowledged = c.snapshot().posts;
    const reload = c.refresh();
    await f.finish(1, [post(5)]);
    assert.equal(
      c.snapshot().posts,
      acknowledged,
      'a response started before the acknowledged send cannot remove it',
    );
    await f.finish(2, [post(6), post(5)]);
    await reload;
    assert.equal(c.snapshot().posts, acknowledged);
  } finally {
    c.stop();
  }
});

test('changed hydrated fields publish once and retain unchanged rows; equal reaction-key order is silent', async () => {
  const f = fixture(2);
  const c = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  f.setRows([post(2), { ...post(1), reactionCounts: { love: 1, like: 2 } }]);
  c.start();
  await flush();
  let published = 0;
  const unsubscribe = c.subscribe(() => published++);
  try {
    const before = c.snapshot();
    f.setRows([
      structuredClone(post(2)),
      { ...structuredClone(post(1)), reactionCounts: { like: 2, love: 1 } },
    ]);
    f.poll();
    await flush();
    assert.equal(c.snapshot(), before);
    f.setRows([
      {
        ...post(2),
        avatarUrl: 'https://example.invalid/avatar?token=renewed',
        comments: [
          {
            id: 'comment',
            postId: id(2),
            createdBy: 'bob',
            displayName: 'More',
            content: 'Reply',
            createdAt: timestamp,
            isMine: false,
          },
        ],
      },
      f.rows()[1]!,
    ]);
    f.change();
    await flush();
    assert.equal(published, 1);
    assert.notEqual(c.snapshot().posts, before.posts);
    assert.equal(c.snapshot().posts[1], before.posts[1]);
    assert.equal(c.snapshot().posts[0]?.avatarUrl, 'https://example.invalid/avatar?token=renewed');
    assert.equal(c.snapshot().posts[0]?.comments[0]?.content, 'Reply');
  } finally {
    unsubscribe();
    c.stop();
  }
});

test('an older-page failure stays retryable until a full read proves there are no older rows left', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  await f.finish(0, [post(5), post(4)], true);
  try {
    const older = c.loadOlder();
    await flush();
    const failure = new Error('older page unavailable');
    f.requests[1]!.reject(failure);
    await older;
    f.poll();
    await flush();
    assert.equal(c.snapshot().error, failure);
    await f.finish(2, [post(5), post(4)], true);
    assert.equal(
      c.snapshot().error,
      failure,
      'a still-retryable older failure survives unrelated refresh',
    );
    f.poll();
    await flush();
    await f.finish(3, [post(5)]);
    assert.equal(c.snapshot().nextCursor, null);
    assert.equal(
      c.snapshot().error,
      null,
      'a successful complete read resolves the obsolete older failure',
    );
    assert.equal(c.snapshot().connection, 'polling');
    const refresh = c.refresh();
    await flush();
    await f.finish(4, [post(5)]);
    await refresh;
    assert.equal(c.snapshot().error, null);
  } finally {
    c.stop();
  }
});

test('returning before the first response still loads, but a confirmed empty snapshot resumes silently', async () => {
  const f = controlledFeed();
  const c = f.controller;
  c.start();
  await flush();
  assert.equal(c.snapshot().busy, true);
  c.stop();
  c.start();
  await flush();
  try {
    assert.equal(c.snapshot().busy, true, 'no response has established that this feed is empty');
    await f.finish(0, [post(99)]);
    assert.equal(c.snapshot().busy, true, 'the old lifecycle response cannot finish the new load');
    assert.deepEqual(c.snapshot().posts, []);
    await f.finish(1, []);
    assert.equal(c.snapshot().busy, false);
    c.stop();
    c.start();
    await flush();
    assert.equal(c.snapshot().busy, false, 'a confirmed empty list does not flash on resume');
    await f.finish(2, []);
  } finally {
    c.stop();
  }
});

test('failed older load retains rows/cursor and retries the same page', async () => {
  const f = fixture();
  const controller = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  controller.start();
  await flush();
  const previous = controller.snapshot();
  f.fail(true);
  await controller.loadOlder();
  assert.equal(controller.snapshot().connection, 'offline');
  assert.deepEqual(controller.snapshot().posts, previous.posts);
  assert.deepEqual(controller.snapshot().nextCursor, previous.nextCursor);
  f.fail(false);
  await controller.retry();
  assert.equal(controller.snapshot().posts.length, 61);
  assert.equal(controller.snapshot().error, null);
  assert.equal(controller.snapshot().connection, 'polling');
  controller.stop();
});

test('polling fallback recovers offline data without a realtime publication and reconnect refreshes', async () => {
  const f = fixture();
  f.fail(true);
  const controller = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  controller.start();
  await flush();
  assert.equal(controller.snapshot().connection, 'offline');
  f.fail(false);
  f.poll();
  await flush();
  assert.equal(controller.snapshot().posts.length, 31);
  assert.equal(controller.snapshot().connection, 'polling');
  f.setRows([post(100), ...f.rows()]);
  f.status('live');
  await flush();
  assert.ok(controller.snapshot().posts.some((post) => post.id === id(100)));
  assert.equal(controller.snapshot().connection, 'live');
  controller.stop();
  assert.deepEqual(f.lifecycle(), { subscriptions: 1, cleanups: 1, polls: 1, cleared: 1 });
});

test('stopping rejects late fetches/events and returning starts one subscription and poll', async () => {
  const wait = deferred<Awaited<ReturnType<GroupFeedService['listFeedPage']>>>();
  const f = fixture();
  f.service.listFeedPage = () => wait.promise;
  const controller = new GroupFeedController(f.service, 'ABC-1234', undefined, f.timer);
  controller.start();
  controller.stop();
  const stopped = controller.snapshot();
  wait.resolve({ posts: [post(1)], pinnedPosts: [], nextCursor: null });
  f.change();
  f.status('live');
  await flush();
  assert.deepEqual(controller.snapshot(), stopped);
  controller.start();
  controller.start();
  await flush();
  assert.equal(controller.snapshot().posts[0]?.id, id(1));
  controller.stop();
  controller.stop();
  assert.deepEqual(f.lifecycle(), { subscriptions: 2, cleanups: 2, polls: 2, cleared: 2 });
});

test('subscription cancelled during group lookup never opens a channel', async () => {
  const lookup = deferred<string>();
  let opened = 0;
  const subscribe = createGroupFeedSubscription({
    groupId: () => lookup.promise,
    open: () => {
      opened++;
      return () => {};
    },
  });
  const close = subscribe(
    'ABC-1234',
    () => assert.fail('late event'),
    () => {},
  );
  close();
  lookup.resolve('group-a');
  await flush();
  assert.equal(opened, 0);
});

test('subscriptions isolate group identifiers and ignore callbacks after cleanup', async () => {
  const events = new Map<string, () => void>();
  const closed: string[] = [];
  const received: string[] = [];
  const subscribe = createGroupFeedSubscription({
    groupId: async (code) => code,
    open: (groupId, change) => {
      events.set(groupId, change);
      return () => {
        closed.push(groupId);
      };
    },
  });
  const stopA = subscribe(
    'group-a',
    () => received.push('a'),
    () => {},
  );
  const stopB = subscribe(
    'group-b',
    () => received.push('b'),
    () => {},
  );
  await flush();
  events.get('group-a')?.();
  stopA();
  events.get('group-a')?.();
  events.get('group-b')?.();
  stopB();
  assert.deepEqual(received, ['a', 'b']);
  assert.deepEqual(closed, ['group-a', 'group-b']);
});

test('post/reply drafts survive panel remount, refresh and return without crossing account/group boundaries', () => {
  const original = groupDrafts('fixture-alice', 'ABC-1234');
  original.set('  Continue\nالمسودة  ');
  original.set('Unsent reply', id(5));
  const remount = groupDrafts('fixture-alice', ' abc-1234 ');
  assert.equal(remount, original);
  assert.equal(remount.snapshot().post.text, '  Continue\nالمسودة  ');
  assert.equal(remount.snapshot().comments[id(5)]?.text, 'Unsent reply');
  assert.equal(groupDrafts('fixture-bob', 'ABC-1234').snapshot().post.text, '');
  assert.equal(groupDrafts('fixture-alice', 'DEF-5678').snapshot().post.text, '');
  assert.equal(remount.snapshot().comments[id(6)], undefined);
});

test('send failures retain exact draft and retry clears only the acknowledged snapshot', async () => {
  const store = new GroupDraftStore();
  store.set('  More\nرسالة  ');
  assert.equal(
    await store.send(async () => {
      throw new Error('offline');
    }),
    false,
  );
  assert.deepEqual(store.snapshot().post, { text: '  More\nرسالة  ', status: 'failed' });
  const sent: string[] = [];
  assert.equal(
    await store.send(async (text) => {
      sent.push(text);
    }),
    true,
  );
  assert.deepEqual(sent, ['  More\nرسالة  ']);
  assert.deepEqual(store.snapshot().post, { text: '', status: 'sent' });
});

test('pending sends prevent duplicates and preserve edits/new replies typed while waiting', async () => {
  const store = new GroupDraftStore(),
    request = deferred<void>();
  store.set('First', id(2));
  const sending = store.send(() => request.promise, id(2));
  assert.equal(store.snapshot().comments[id(2)]?.status, 'sending');
  assert.equal(await store.send(async () => assert.fail('duplicate'), id(2)), false);
  store.set('Next reply', id(2));
  store.set('Different reply', id(3));
  request.resolve();
  await sending;
  assert.deepEqual(store.snapshot().comments[id(2)], { text: 'Next reply', status: 'idle' });
  assert.equal(store.snapshot().comments[id(3)]?.text, 'Different reply');
});

test('account-bound drafts reject a changed account before mutation and preserve its original private text', async () => {
  const store = new GroupDraftStore('alice');
  store.set('Private Alice draft');
  let writes = 0;
  const sent = await store.send(async (_text, expectedUserId) => {
    await captureDraftActor(
      async () => ({ access_token: 'fake-bob-token', user: { id: 'bob' } }),
      expectedUserId,
    );
    writes++;
  });
  assert.equal(sent, false);
  assert.equal(writes, 0);
  assert.deepEqual(store.snapshot().post, { text: 'Private Alice draft', status: 'failed' });
});

test('captured draft identity remains immutable while later group lookups await a different session', async () => {
  let current = {
    access_token: 'fake-alice-token',
    user: { id: 'alice', user_metadata: { display_name: 'Alice' } },
  };
  const actor = await captureDraftActor(async () => current, 'alice');
  current = {
    access_token: 'fake-bob-token',
    user: { id: 'bob', user_metadata: { display_name: 'Bob' } },
  };
  assert.deepEqual(actor, {
    accessToken: 'fake-alice-token',
    userId: 'alice',
    displayName: 'Alice',
  });
  await assert.rejects(
    captureDraftActor(async () => current, 'alice'),
    /AUTH_REQUIRED/,
  );
  await assert.rejects(
    captureDraftActor(async () => null, 'alice'),
    /AUTH_REQUIRED/,
  );
});

test('all new copy has complete NL/EN/AR labels and roles use curated Kotlin keys', () => {
  for (const entry of Object.values(communityCopy))
    for (const locale of ['nl', 'en', 'ar'] as const) assert.ok(entry[locale].trim());
  const t = (key: string) => key;
  assert.equal(groupRoleLabel(' OWNER ', t, 'nl'), 'app.groupManagement.ownerBadge');
  assert.equal(groupRoleLabel('admin', t, 'ar'), 'groups.detail.role.admin');
  assert.equal(groupRoleLabel('moderator', t, 'en'), 'groups.detail.role.moderator');
  assert.equal(groupRoleLabel('member', t, 'nl'), 'groups.member');
  assert.equal(groupStatusLabel('cancelled', 'nl'), 'Geannuleerd');
  assert.equal(groupStatusLabel('expired', 'en'), 'Expired');
  assert.equal(groupStatusLabel('unexpected_internal_value', 'nl'), 'Onbekende status');
});

test('CORS image handling is limited to actual storage paths and preserves external avatar behavior', () => {
  assert.equal(
    isCorsGroupStorageImage(
      'http://127.0.0.1:55431/storage/v1/object/sign/group-media/fake.png?token=fake',
    ),
    true,
  );
  assert.equal(
    isCorsGroupStorageImage(
      'https://example.invalid/storage/v1/object/public/group-avatars/fake.png',
    ),
    true,
  );
  assert.equal(isCorsGroupStorageImage('https://avatars.example.invalid/image.png'), false);
  assert.equal(isCorsGroupStorageImage('data:image/png;base64,fake'), false);
});
