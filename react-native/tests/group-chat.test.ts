import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createGroupChatService,
  GroupChatScroll,
  chatFeedService,
} from '../src/services/groups/groupChat';
import { groupChatDrafts, groupDrafts } from '../src/services/groups/groupDrafts';
import { GroupFeedController } from '../src/services/groups/groupFeedController';
import type { GroupFeedPost } from '../src/services/backend/types';
import { chatCopy } from '../src/features/groups/chatCopy';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const stamp = '2026-11-15T12:00:00.000000+00:00';
const post = (n: number, type = 'text'): GroupFeedPost => ({
  id: id(n),
  type,
  createdAt: stamp,
  createdBy: 'member',
  displayName: 'Continue',
  content: `Bericht ${n}`,
  editedAt: null,
  isPinned: n === 1,
  isMine: false,
  comments: [],
  reactionCounts: {},
  myReaction: null,
  likeCount: 0,
  likedByMe: false,
});

function fixture() {
  const source = Array.from({ length: 95 }, (_, index) =>
    post(index + 1, index % 3 === 2 ? 'system' : 'text'),
  ).reverse();
  let write: { code: string; text: string; actor: string } | undefined;
  const service = createGroupChatService({
    groupId: async (code) => {
      assert.equal(code, 'QA');
      return 'group';
    },
    read: async (query) => {
      assert.equal(query.textOnly, true);
      assert.equal(query.groupId, 'group');
      assert.equal(query.pinnedOnly, undefined);
      return source
        .filter((row) => row.type === 'text' && (!query.cursor || row.id < query.cursor.id))
        .slice(0, query.limit)
        .map((row) => ({ id: row.id, created_at: row.createdAt }));
    },
    hydrate: async (_code, rows) => rows.map((row) => source.find((entry) => row.id === entry.id)!),
    send: async (code, text, actor) => {
      write = { code, text, actor };
      return post(100);
    },
    subscribe: (_code, _change, status) => {
      status('live');
      return () => {};
    },
  });
  return { service, source, write: () => write };
}

test('chat queries text before cursor pagination, covers timestamp ties, and never reorders old pins', async () => {
  const f = fixture();
  const seen: GroupFeedPost[] = [];
  let cursor;
  do {
    const page = await f.service.listChatPage('QA', { cursor, limit: 17 });
    assert.deepEqual(page.pinnedPosts, []);
    seen.push(...page.posts);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  assert.deepEqual(
    seen.map((row) => row.id),
    f.source.filter((row) => row.type === 'text').map((row) => row.id),
  );
  assert.equal(new Set(seen.map((row) => row.id)).size, seen.length);
  assert.ok(seen.every((row) => !row.isPinned));
  assert.equal(seen.at(-1)?.id, id(1));
  assert.equal(seen[0]!.displayName, 'Continue');
  await assert.rejects(
    f.service.listChatPage('QA', { cursor: { id: 'id),status.eq.hidden', createdAt: stamp } }),
    /Invalid feed cursor/,
  );
});

test('chat send preserves explicit actor and rejects empty, anonymous and oversized input without silent truncation', async () => {
  const f = fixture();
  await assert.rejects(f.service.sendChatMessage('QA', 'test', ''), /AUTH_REQUIRED/);
  await assert.rejects(f.service.sendChatMessage('QA', ' ', 'member'), /INVALID_CONTENT/);
  await assert.rejects(
    f.service.sendChatMessage('QA', 'x'.repeat(501), 'member'),
    /INVALID_CONTENT/,
  );
  assert.equal(f.write(), undefined);
  await f.service.sendChatMessage('QA', '  Continue\nMore  ', 'member');
  assert.deepEqual(f.write(), { code: 'QA', text: 'Continue\nMore', actor: 'member' });
});

test('chat drafts are exact, independent from feed, scoped to account/group, and survive failure and an in-flight edit', async () => {
  const store = groupChatDrafts('chat-a', ' qa ');
  assert.equal(store, groupChatDrafts('chat-a', 'QA'));
  const text = '  Continue\nMore  ';
  store.set(text);
  assert.equal(groupDrafts('chat-a', 'QA').snapshot().post.text, '');
  assert.equal(groupChatDrafts('chat-b', 'QA').snapshot().post.text, '');
  assert.equal(groupChatDrafts('chat-a', 'OTHER').snapshot().post.text, '');
  assert.equal(
    await store.send(async (_text, actor) => {
      assert.equal(actor, 'chat-a');
      throw new Error('offline');
    }),
    false,
  );
  assert.deepEqual(store.snapshot().post, { text, status: 'failed' });
  let finish!: () => void;
  const sent = store.send(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  assert.equal(
    await store.send(async () => {
      throw new Error('duplicate');
    }),
    false,
  );
  store.set('Nieuwe exacte tekst  ');
  finish();
  assert.equal(await sent, true);
  assert.deepEqual(store.snapshot().post, { text: 'Nieuwe exacte tekst  ', status: 'idle' });
});

test('reading history does not jump on incoming messages, older loads, edits or poll refresh; explicit latest and own send scroll', () => {
  const scroll = new GroupChatScroll();
  assert.deepEqual(scroll.observe([post(9), post(8)]), { scroll: false, unread: 0 });
  scroll.setOffset(500);
  assert.deepEqual(scroll.observe([post(9), post(8), post(7)]), { scroll: false, unread: 0 });
  assert.deepEqual(scroll.observe([{ ...post(9), content: 'edited' }, post(8), post(7)]), {
    scroll: false,
    unread: 0,
  });
  assert.deepEqual(scroll.observe([post(11), post(10), post(9), post(8)]), {
    scroll: false,
    unread: 2,
  });
  assert.deepEqual(scroll.observe([post(11), post(10), post(9), post(8)]), {
    scroll: false,
    unread: 2,
  });
  scroll.showLatest();
  assert.deepEqual(scroll.observe([post(11), post(10), post(9)]), { scroll: true, unread: 0 });
  assert.deepEqual(scroll.observe([post(12), post(11)]), { scroll: true, unread: 0 });
  scroll.setOffset(800);
  scroll.showLatest();
  assert.deepEqual(scroll.observe([post(13), post(12)]), { scroll: true, unread: 0 });
});

test('chat uses the actual feed lifecycle without pinned ordering and cleans up on blur', async () => {
  const f = fixture();
  let closed = 0;
  let polls = 0;
  let invalidate = () => {};
  f.service.subscribeChat = (_code, change, status) => {
    invalidate = change;
    status('live');
    return () => {
      closed++;
    };
  };
  const controller = new GroupFeedController(
    chatFeedService(f.service),
    'QA',
    undefined,
    {
      every: (_fn, ms) => {
        assert.equal(ms, 5000);
        polls++;
        return () => {
          polls--;
        };
      },
    },
    5000,
  );
  controller.start();
  await controller.refresh();
  await new Promise((resolve) => setImmediate(resolve));
  await controller.loadOlder();
  assert.equal(controller.snapshot().posts.length, 60);
  assert.equal(controller.snapshot().posts[0]!.id, id(95));
  assert.ok(controller.snapshot().posts.every((row) => !row.isPinned));
  invalidate();
  await controller.refresh();
  controller.stop();
  assert.equal(closed, 1);
  assert.equal(polls, 0);
});

test('chat labels have complete Dutch, English and Arabic copy', () => {
  for (const translations of Object.values(chatCopy))
    for (const locale of ['nl', 'en', 'ar'] as const) assert.ok(translations[locale].trim());
});

test('a late content-size callback cannot apply a stale latest-scroll after history drag', () => {
  const scroll = new GroupChatScroll();
  scroll.observe([post(9), post(8)]);
  // Native content-size can precede React's effect which observes the new snapshot.
  assert.equal(scroll.takeScroll(), false);
  assert.equal(scroll.observe([post(10), post(9), post(8)]).scroll, true);
  // The user starts reading history before the deferred frame/content-size notification.
  scroll.beginHistory();
  assert.equal(scroll.takeScroll(), false);
  assert.deepEqual(scroll.observe([post(11), post(10), post(9), post(8)]), {
    scroll: false,
    unread: 1,
  });
  assert.equal(scroll.takeScroll(), false);
  scroll.showLatest();
  assert.equal(scroll.takeScroll(), true);
  assert.equal(scroll.takeScroll(), false);
  scroll.setOffset(500);
  scroll.observe([post(11), post(10), post(9), post(8), post(7)]);
  assert.equal(scroll.takeScroll(), false);
});
