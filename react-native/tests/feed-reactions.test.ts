import assert from 'node:assert/strict';
import test from 'node:test';
import { FeedReactions, withFeedReaction } from '../src/services/groups/feedReactions';
import type { GroupFeedPost } from '../src/services/backend/types';
const base: GroupFeedPost = {
  id: 'one',
  createdBy: 'author',
  displayName: 'Sarah',
  type: 'text',
  content: 'Dag 1',
  createdAt: '2026-11-20',
  editedAt: null,
  isPinned: false,
  isMine: false,
  likeCount: 2,
  likedByMe: false,
  reactionCounts: { like: 2 },
  myReaction: null,
  comments: [],
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('optimistic switch, removal, rollback and parallel rows preserve content and other people counts', async () => {
  const model = new FeedReactions();
  const wait = deferred<string | null>();
  let source = [base, { ...base, id: 'two' }];
  let calls = 0;
  const errors: unknown[] = [];
  const commit = (id: string, reaction: string | null) => {
    source = source.map((p) => (p.id === id ? withFeedReaction(p, reaction) : p));
  };
  const action = model.toggle(
    base,
    'beautiful',
    () => {
      calls++;
      return wait.promise;
    },
    commit,
    (e) => errors.push(e),
  );
  assert.equal(model.project(source)[0]!.myReaction, 'beautiful');
  assert.equal(model.project(source)[0]!.reactionCounts.beautiful, 1);
  assert.equal(model.project(source)[0]!.reactionCounts.like, 2);
  assert.equal(model.project(source)[1]!, source[1]!);
  await model.toggle(
    base,
    'like',
    () => {
      calls++;
      return Promise.resolve('like');
    },
    commit,
    (e) => errors.push(e),
  );
  assert.equal(calls, 1);
  // Fresh server data while the write is pending must not erase the visible choice.
  source = [{ ...base, content: 'edited elsewhere', reactionCounts: { like: 4 } }, source[1]!];
  assert.equal(model.project(source)[0]!.myReaction, 'beautiful');
  assert.equal(model.project(source)[0]!.reactionCounts.like, 4);
  assert.equal(model.busy('two'), false);
  wait.resolve('beautiful');
  await action;
  assert.equal(source[0]!.myReaction, 'beautiful');
  assert.equal(source[0]!.content, 'edited elsewhere');
  assert.equal(source[0]!.reactionCounts.like, 4);
  assert.equal(model.busy('one'), false);
  const fail = deferred<string | null>();
  const removal = model.toggle(
    source[0]!,
    'beautiful',
    () => fail.promise,
    commit,
    (e) => errors.push(e),
  );
  assert.equal(model.project(source)[0]!.myReaction, null);
  assert.equal(model.project(source)[0]!.reactionCounts.beautiful, 0);
  fail.reject(new Error('offline'));
  await removal;
  assert.equal(model.project(source)[0]!.myReaction, 'beautiful');
  assert.equal(errors.length, 1);
  // The next explicit toggle is allowed; no automatic retry of the failed toggle occurred.
  await model.toggle(
    source[0]!,
    'beautiful',
    async () => null,
    commit,
    (e) => errors.push(e),
  );
  assert.equal(source[0]!.myReaction, null);
  assert.equal(source[0]!.reactionCounts.beautiful, 0);
});

test('a canonical reply rebases without doubling counts when realtime already contains the accepted reaction', async () => {
  const model = new FeedReactions();
  const wait = deferred<string | null>();
  let source = [base];
  const work = model.toggle(
    base,
    'like',
    () => wait.promise,
    (id, reaction) => {
      source = source.map((p) => (p.id === id ? withFeedReaction(p, reaction) : p));
    },
    () => {},
  );
  source = [
    { ...base, myReaction: 'like', likedByMe: true, likeCount: 5, reactionCounts: { like: 5 } },
  ];
  assert.equal(model.project(source)[0]!.likeCount, 5);
  wait.resolve('like');
  await work;
  assert.equal(source[0]!.likeCount, 5);
});

test('actor changes and disposed group controllers ignore old acknowledgements and errors', async () => {
  for (const outcome of ['success', 'error'] as const) {
    const model = new FeedReactions();
    model.setActor('first');
    const wait = deferred<string | null>();
    let commits = 0;
    let failures = 0;
    const work = model.toggle(
      base,
      'like',
      () => wait.promise,
      () => {
        commits++;
      },
      () => {
        failures++;
      },
    );
    model.setActor('second');
    assert.equal(model.busy('one'), false);
    assert.equal(model.project([base])[0]!.myReaction, null);
    if (outcome === 'success') wait.resolve('like');
    else wait.reject(new Error('old account'));
    await work;
    assert.equal(commits, 0);
    assert.equal(failures, 0);
  }
  const model = new FeedReactions();
  const wait = deferred<string | null>();
  let commits = 0;
  const work = model.toggle(
    base,
    'like',
    () => wait.promise,
    () => {
      commits++;
    },
    () => {},
  );
  model.reset();
  wait.resolve('like');
  await work;
  assert.equal(commits, 0);
});
