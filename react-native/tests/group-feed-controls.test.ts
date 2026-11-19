import assert from 'node:assert/strict';
import test from 'node:test';
import type { Group, GroupFeedPost } from '../src/services/backend/types';
import { GroupDraftStore } from '../src/services/groups/groupDrafts';
import { light } from '../src/shared/theme/colors';
import { feedCopy } from '../src/features/groups/feedCopy';
import * as feedReactions from '../src/services/groups/feedReactions';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
} from './helpers/componentHarness';

const post: GroupFeedPost = {
  id: 'post',
  createdBy: 'actor',
  displayName: 'Exact name',
  type: 'text',
  content: 'Original post',
  createdAt: '2026-11-19T18:00:00Z',
  editedAt: null,
  isPinned: false,
  isMine: true,
  likeCount: 0,
  likedByMe: false,
  myReaction: null,
  reactionCounts: {},
  comments: [
    {
      id: 'comment',
      postId: 'post',
      createdBy: 'actor',
      displayName: 'Me',
      content: 'Comment',
      createdAt: '',
      isMine: true,
    },
  ],
};
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function mount(platform = 'android') {
  const hooks = componentHarness();
  const calls: unknown[][] = [];
  const shares: Record<string, string>[] = [];
  const store = new GroupDraftStore('actor');
  const group: Group = {
    id: 'group',
    code: 'GROUP',
    name: 'Original group name',
    description: '',
    goal_type: '',
    progress_unit: '',
    goal_period: '',
    goal_target: null,
    privacy: 'private',
    language_code: 'nl',
    owner_id: 'actor',
    created_at: '',
    permissions: ['post.create', 'post.pin', 'post.moderate', 'reaction.create', 'comment.create'],
  };
  let rows = [structuredClone(post)];
  const resource = {
    get value() {
      return rows;
    },
    busy: false,
    error: '',
    connection: 'polling',
    nextCursor: null,
    loadingOlder: false,
    reload: async () => {
      calls.push(['reload']);
    },
    retry: async () => {},
    loadOlder: async () => {},
    setValue: (update: (value: GroupFeedPost[]) => GroupFeedPost[]) => {
      rows = update(rows);
    },
    run: async (action: () => Promise<unknown>, _error: string, refresh = true) => {
      await action();
      if (refresh) await resource.reload();
    },
  };
  const operation =
    (name: string) =>
    async (...args: unknown[]) => {
      calls.push([name, ...args]);
      return null;
    };
  const backend = {
    auth: { getSession: async () => ({ user: { id: 'actor' } }), onChange: () => () => {} },
    groups: Object.fromEntries(
      ['toggleReaction', 'updatePost', 'pinPost', 'reportPost', 'deletePost', 'deleteComment'].map(
        (name) => [name, operation(name)],
      ),
    ),
  };
  const reactionHook = loadComponentModule(
    new URL('../src/features/groups/hooks/useFeedReactions.ts', import.meta.url),
    {
      react: hooks.react,
      '../../../services/groups/feedReactions': feedReactions,
      '../components/groupUi': { groupError: () => 'failed' },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key }) },
    },
  );
  const { GroupFeedPanel } = loadComponentModule<{ GroupFeedPanel: (props: object) => unknown }>(
    new URL('../src/features/groups/components/GroupFeedPanel.tsx', import.meta.url),
    {
      react: hooks.react,
      '../hooks/useFeedReactions': reactionHook,
      '../hooks/useFeedWindow': {
        useFeedWindow: (value: GroupFeedPost[]) => ({ posts: value, unseenCount: 0, reveal() {} }),
      },
      '../feedCopy': { feedCopy },
      'react-native': {
        View: 'View',
        Platform: { OS: platform },
        Share: {
          share: async (value: Record<string, string>) => {
            shares.push(value);
          },
        },
      },
      '../../../i18n': { useI18n: () => ({ locale: 'nl', t: (key: string) => key }) },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => light },
      './groupUi': {
        permitted: (g: Group, key: string) => g.permissions?.includes(key),
        ResourceState: 'ResourceState',
        ConfirmAction: 'ConfirmAction',
      },
      './useGroupFeed': { useGroupFeed: () => resource },
      '../communityCopy': { communityText: (key: string) => key },
      './GroupFeedPostCard': { GroupFeedPostCard: 'GroupFeedPostCard' },
      './GroupPostComposer': { GroupPostComposer: 'GroupPostComposer' },
      './GroupDiscussionSheet': { GroupDiscussionSheet: 'GroupDiscussionSheet' },
    },
  );
  const render = () =>
    hooks.render(() =>
      GroupFeedPanel({
        backend,
        group,
        draftStore: store,
        clearFocus() {},
      }),
    );
  const card = () => elements(render(), 'GroupFeedPostCard')[0]!;
  return { render, card, calls, shares, group, resource };
}

test('new compact feed controls preserve reaction, comment, edit, pin and share operations', async () => {
  const app = mount();
  assert.equal(elements(app.render(), 'GroupPostComposer').length, 1);
  assert.ok(
    !elements(app.render(), 'T').some((node) =>
      JSON.stringify(node.props.children).includes('polling'),
    ),
    'normal polling has no connection banner',
  );
  (app.card().props.onReact as (reaction: string) => void)('dua');
  await flush();
  assert.deepEqual(app.calls[0], ['toggleReaction', 'GROUP', 'post', 'dua']);
  (app.card().props.onReply as () => void)();
  assert.equal(
    (elements(app.render(), 'GroupDiscussionSheet')[0]!.props.discussion as GroupFeedPost).id,
    'post',
  );
  (elements(app.render(), 'GroupDiscussionSheet')[0]!.props.onClose as () => void)();
  (app.card().props.onMore as () => void)();
  let tree = app.render();
  await press(findElement(tree, 'Button', 'title', 'groups.feed.share'));
  assert.equal(app.shares[0]!.title, 'Original group name');
  assert.equal(app.shares[0]!.message, 'Original post\nqurantracker://group/GROUP?postId=post');
  await press(findElement(tree, 'Button', 'title', 'groups.feed.pin.action'));
  await flush();
  assert.ok(
    app.calls.some(
      (call) => JSON.stringify(call) === JSON.stringify(['pinPost', 'GROUP', 'post', true]),
    ),
  );
  (app.card().props.onMore as () => void)();
  await press(findElement(app.render(), 'Button', 'title', 'groups.feed.edit.action'));
  tree = app.render();
  (
    findElement(tree, 'Field', 'label', 'groups.feed.edit.body').props.onChangeText as (
      value: string,
    ) => void
  )('  edited exact  ');
  await press(findElement(app.render(), 'Button', 'title', 'groups.feed.edit.confirm'));
  await flush();
  assert.ok(
    app.calls.some(
      (call) =>
        JSON.stringify(call) ===
        JSON.stringify(['updatePost', 'GROUP', 'post', '  edited exact  ']),
    ),
  );
});

test('post permissions hide creation/edit/moderation while preserving discussion and reporting', async () => {
  const app = mount();
  app.group.permissions = [];
  app.resource.value[0]!.isMine = false;
  assert.equal(elements(app.render(), 'GroupPostComposer').length, 0);
  assert.equal(app.card().props.canReact, false);
  (app.card().props.onMore as () => void)();
  let tree = app.render();
  assert.ok(
    !elements(tree, 'Button').some((node) => node.props.title === 'groups.feed.edit.action'),
  );
  assert.ok(
    !elements(tree, 'Button').some((node) => node.props.title === 'groups.feed.pin.action'),
  );
  assert.equal(elements(tree, 'ConfirmAction').length, 0);
  await press(findElement(tree, 'Button', 'title', 'groups.feed.report.action'));
  tree = app.render();
  (elements(tree, 'Segments')[0]!.props.onChange as (value: string) => void)('harassment');
  (
    findElement(tree, 'Field', 'label', 'groups.feed.report.details').props.onChangeText as (
      value: string,
    ) => void
  )('Details');
  await press(findElement(app.render(), 'Button', 'title', 'groups.feed.report.confirm'));
  await flush();
  assert.deepEqual(app.calls[0], ['reportPost', 'GROUP', 'post', 'harassment', 'Details']);
});

test('iOS comment deletion and cancellation reopen discussion only after the confirmation dismisses', async () => {
  for (const deleting of [false, true]) {
    const app = mount('ios');
    (app.card().props.onReply as () => void)();
    (
      elements(app.render(), 'GroupDiscussionSheet')[0]!.props.onDeleteComment as (
        postId: string,
        id: string,
      ) => void
    )('post', 'comment');
    const confirm = () =>
      findElement(app.render(), 'Sheet', 'title', 'groups.feed.comment.delete.title');
    assert.equal(confirm().props.visible, true);
    await press(
      findElement(
        app.render(),
        'Button',
        'title',
        deleting ? 'groups.feed.delete.confirm' : 'common.cancel',
      ),
    );
    await flush();
    assert.equal(confirm().props.visible, false);
    assert.equal(elements(app.render(), 'GroupDiscussionSheet')[0]!.props.discussion, undefined);
    (confirm().props.onDismiss as () => void)();
    const reopened = elements(app.render(), 'GroupDiscussionSheet')[0]!.props
      .discussion as GroupFeedPost;
    assert.equal(reopened.id, 'post');
    assert.equal(reopened.comments.length, deleting ? 0 : 1);
    assert.equal(app.calls.filter((call) => call[0] === 'deleteComment').length, deleting ? 1 : 0);
  }
});
