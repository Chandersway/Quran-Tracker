import assert from 'node:assert/strict';
import test from 'node:test';
import type { GroupFeedPost } from '../src/services/backend/types';
import * as controller from '../src/services/groups/groupFeedController';
import type { FeedWindowResult } from '../src/features/groups/hooks/useFeedWindow';
import { componentHarness, loadComponentModule } from './helpers/componentHarness';

function post(id: string, day: number, patch: Partial<GroupFeedPost> = {}): GroupFeedPost {
  return {
    id,
    createdBy: 'friend',
    displayName: 'Reader',
    type: 'text',
    content: id,
    createdAt: new Date(Date.UTC(2026, 10, day)).toISOString(),
    editedAt: null,
    isPinned: false,
    isMine: false,
    likeCount: 0,
    likedByMe: false,
    reactionCounts: {},
    myReaction: null,
    comments: [],
    ...patch,
  };
}
function mount(initial: GroupFeedPost[] = [], initialFocus?: string, copyEachRender = false) {
  const hooks = componentHarness();
  let posts = initial;
  let focused = initialFocus;
  const { useFeedWindow } = loadComponentModule<{
    useFeedWindow: (posts: GroupFeedPost[], focus?: string) => FeedWindowResult;
  }>(new URL('../src/features/groups/hooks/useFeedWindow.ts', import.meta.url), {
    react: hooks.react,
    '../../../services/groups/groupFeedController': controller,
  });
  const render = () =>
    hooks.render(() => ({
      type: 'Window',
      props: { value: useFeedWindow(copyEachRender ? [...posts] : posts, focused) },
    })).props.value as FeedWindowResult;
  return {
    render,
    update(next: GroupFeedPost[], focus = focused) {
      posts = next;
      focused = focus;
      return render();
    },
    focus(next: string | undefined) {
      focused = next;
      return render();
    },
  };
}
const ids = (window: FeedWindowResult) => Array.from(window.posts, (post) => post.id);

test('the first load is immediate and new external posts wait for explicit reveal', () => {
  const window = mount();
  assert.deepEqual(ids(window.render()), []);
  const old = post('old', 10),
    latest = post('latest', 11),
    next = post('next', 12);
  assert.deepEqual(ids(window.update([old, latest])), ['latest', 'old']);
  const pending = window.update([next, latest, old]);
  assert.deepEqual(ids(pending), ['latest', 'old']);
  assert.equal(pending.unseenCount, 1);
  pending.reveal();
  assert.deepEqual(ids(window.render()), ['next', 'latest', 'old']);
  assert.equal(window.render().unseenCount, 0);
});

test('known order stays steady while reactions, edits, pin badges and deletions use fresh data', () => {
  const pinned = post('pin', 8, { isPinned: true }),
    latest = post('latest', 11),
    old = post('old', 10);
  const window = mount([latest, old, pinned]);
  assert.deepEqual(ids(window.render()), ['pin', 'latest', 'old']);
  const changed = { ...old, isPinned: true, content: 'Edited', myReaction: 'love' };
  const next = window.update([changed, latest, pinned]);
  assert.deepEqual(ids(next), ['pin', 'latest', 'old']);
  assert.equal(next.posts[2], changed);
  assert.equal(next.posts[1], latest);
  assert.deepEqual(ids(window.update([changed, latest])), ['latest', 'old']);
});

test('older pagination appends once, and queued rows do not replace unchanged row identities', () => {
  const a = post('a', 11),
    b = post('b', 10),
    older = post('older', 9),
    newPost = post('new', 12);
  const window = mount([a, b]);
  const before = window.render();
  const hidden = window.update([newPost, a, b]);
  assert.equal(hidden.posts, before.posts);
  const page = window.update([newPost, a, b, older, older]);
  assert.deepEqual(ids(page), ['a', 'b', 'older']);
  assert.equal(page.posts[0], a);
  assert.equal(page.unseenCount, 1);
  assert.deepEqual(ids(window.update([newPost, a, b, older])), ['a', 'b', 'older']);
});

test('a removed queued post clears its count and own submitted posts are visible immediately', () => {
  const a = post('a', 10),
    queued = post('queued', 11),
    own = post('own', 12, { isMine: true });
  const window = mount([a]);
  window.render();
  assert.equal(window.update([queued, a]).unseenCount, 1);
  assert.equal(window.update([a]).unseenCount, 0);
  assert.deepEqual(ids(window.update([own, a])), ['own', 'a']);
});

test('timestamp ties use cursor IDs, including a deleted oldest row boundary', () => {
  const base = post('b', 10),
    older = post('a', 10),
    newer = post('c', 10);
  const window = mount([base]);
  window.render();
  const next = window.update([newer, base, older]);
  assert.deepEqual(ids(next), ['b', 'a']);
  assert.equal(next.unseenCount, 1);
  assert.deepEqual(ids(window.update([newer])), []);
  assert.equal(window.render().unseenCount, 1);
});

test('focused-post mode and leaving it expose the new source immediately', () => {
  const a = post('a', 10),
    b = post('b', 11);
  const window = mount([a]);
  window.render();
  assert.equal(window.update([b, a]).unseenCount, 1);
  assert.deepEqual(ids(window.focus('b')), ['b', 'a']);
  assert.equal(window.render().unseenCount, 0);
  assert.deepEqual(ids(window.update([a], 'a')), ['a']);
  assert.deepEqual(ids(window.focus(undefined)), ['a']);
});

test('equivalent fresh arrays settle without update loops or changing displayed rows', () => {
  const a = post('a', 10),
    b = post('b', 11);
  const window = mount([a], undefined, true);
  const before = window.render();
  const after = window.update([b, a]);
  assert.equal(after.posts, before.posts);
  assert.equal(after.unseenCount, 1);
  assert.equal(window.render().posts, before.posts);
});
