import assert from 'node:assert/strict';
import test from 'node:test';
import {
  componentHarness,
  elements,
  loadComponentModule,
  sharedComponents,
} from './helpers/componentHarness';
import { light } from '../src/shared/theme/colors';
import { feedCopy } from '../src/features/groups/feedCopy';
import type { GroupFeedPost } from '../src/services/backend/types';
import * as feedController from '../src/services/groups/groupFeedController';

const post: GroupFeedPost = {
  id: 'one',
  createdBy: 'author',
  displayName: 'Sarah',
  type: 'text',
  content: 'Dag 1',
  createdAt: '2026-11-20T08:00:00Z',
  editedAt: null,
  isPinned: false,
  isMine: false,
  likeCount: 0,
  likedByMe: false,
  reactionCounts: {},
  myReaction: null,
  comments: [],
};

test('a real feed onReact paints the selected icon and count before the server promise resolves', async () => {
  const hooks = componentHarness();
  let resolve!: (value: string | null) => void;
  let calls = 0;
  const request = new Promise<string | null>((done) => (resolve = done));
  let response = request;
  let refreshes = 0;
  let authChanged: (session: { user: { id: string } } | null) => void = () => {};
  let rows = [post, { ...post, id: 'two', createdAt: '2026-11-19T08:00:00Z' }];
  const resource = {
    value: rows,
    busy: false,
    error: '',
    connection: 'live',
    run: async (action: () => Promise<unknown>) => {
      await action();
    },
    reload: async () => {},
    retry: async () => {
      refreshes++;
    },
    setValue: (update: (p: GroupFeedPost[]) => GroupFeedPost[]) => {
      rows = update(rows);
      resource.value = rows;
    },
  };
  const backend = {
    groups: {
      toggleReaction: () => {
        calls++;
        return response;
      },
    },
    auth: {
      getSession: async () => ({ user: { id: 'reader' } }),
      onChange: (listener: typeof authChanged) => {
        authChanged = listener;
        return () => {};
      },
    },
  };
  const deps: Record<string, unknown> = {
    react: hooks.react,
    'react-native': { Platform: { OS: 'android' }, Share: {}, View: 'View' },
    '../../../i18n': { useI18n: () => ({ t: (s: string) => s, locale: 'nl' }) },
    '../../../shared/components': sharedComponents,
    './groupUi': {
      ConfirmAction: 'ConfirmAction',
      permitted: () => true,
      ResourceState: 'ResourceState',
      groupError: () => 'failed',
    },
    '../../../shared/theme': { usePalette: () => light },
    './useGroupFeed': { useGroupFeed: () => resource },
    '../communityCopy': { communityText: () => '' },
    './GroupFeedPostCard': { GroupFeedPostCard: 'PostCard' },
    './GroupPostComposer': { GroupPostComposer: 'Composer' },
    './GroupDiscussionSheet': { GroupDiscussionSheet: 'Discussion' },
    '../hooks/useFeedWindow': {
      useFeedWindow: (p: GroupFeedPost[]) => ({ posts: p, unseenCount: 0 }),
    },
    '../feedCopy': { feedCopy },
  };
  deps['../hooks/useFeedWindow'] = loadComponentModule(
    new URL('../src/features/groups/hooks/useFeedWindow.ts', import.meta.url),
    { react: hooks.react, '../../../services/groups/groupFeedController': feedController },
  );
  const controller = await import('../src/services/groups/feedReactions');
  deps['../hooks/useFeedReactions'] = loadComponentModule(
    new URL('../src/features/groups/hooks/useFeedReactions.ts', import.meta.url),
    {
      react: hooks.react,
      '../../../services/groups/feedReactions': controller,
      '../components/groupUi': deps['./groupUi'],
      '../../../i18n': deps['../../../i18n'],
    },
  );
  const { GroupFeedPanel } = loadComponentModule<{ GroupFeedPanel: (p: object) => unknown }>(
    new URL('../src/features/groups/components/GroupFeedPanel.tsx', import.meta.url),
    deps,
  );
  const render = () =>
    hooks.render(() =>
      GroupFeedPanel({ backend, group: { code: 'group' }, clearFocus: () => {}, draftStore: {} }),
    );
  let tree = render();
  (elements(tree, 'PostCard')[0]!.props.onReact as (s: string) => void)('like');
  tree = render();
  const cards = elements(tree, 'PostCard');
  assert.equal((cards[0]!.props.post as GroupFeedPost).myReaction, 'like');
  assert.equal((cards[0]!.props.post as GroupFeedPost).reactionCounts.like, 1);
  assert.equal(cards[0]!.props.busy, true);
  assert.equal(cards[1]!.props.busy, false);
  authChanged({ user: { id: 'reader' } });
  assert.equal(
    (elements(render(), 'PostCard')[0]!.props.post as GroupFeedPost).myReaction,
    'like',
    'the first INITIAL_SESSION event initializes the actor without discarding a quick tap',
  );
  const optimistic = cards[0]!.props.post;
  assert.equal(
    elements(render(), 'PostCard')[0]!.props.post,
    optimistic,
    'pending rerenders retain the projected row identity and the real window settles',
  );
  rows = [{ ...post, content: 'Fresh server text' }, rows[1]!];
  resource.value = rows;
  const refreshed = elements(render(), 'PostCard')[0]!.props.post as GroupFeedPost;
  assert.equal(refreshed.myReaction, 'like');
  assert.equal(refreshed.content, 'Fresh server text');
  (cards[0]!.props.onReact as (s: string) => void)('like');
  assert.equal(calls, 1);
  resolve('like');
  await request;
  await new Promise((done) => setImmediate(done));
  assert.equal((elements(render(), 'PostCard')[0]!.props.post as GroupFeedPost).myReaction, 'like');
  response = Promise.reject(new Error('offline'));
  (elements(render(), 'PostCard')[0]!.props.onReact as (s: string) => void)('like');
  assert.equal((elements(render(), 'PostCard')[0]!.props.post as GroupFeedPost).myReaction, null);
  await new Promise((done) => setImmediate(done));
  assert.equal((elements(render(), 'PostCard')[0]!.props.post as GroupFeedPost).myReaction, 'like');
  const failed = elements(render(), 'ResourceState')[0]!;
  assert.equal(failed.props.error, 'failed');
  (failed.props.onRetry as () => void)();
  assert.equal(elements(render(), 'ResourceState')[0]!.props.error, '');
  assert.equal(refreshes, 1);
  assert.equal(calls, 2, 'retry only reloads; it never repeats a non-idempotent toggle');
});
