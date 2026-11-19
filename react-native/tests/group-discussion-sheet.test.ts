import assert from 'node:assert/strict';
import test from 'node:test';
import type { Backend } from '../src/services/backend/backend';
import type { Group, GroupFeedPost } from '../src/services/backend/types';
import { GroupDraftStore } from '../src/services/groups/groupDrafts';
import { feedCopy } from '../src/features/groups/feedCopy';
import { light } from '../src/shared/theme/colors';
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
  createdBy: 'author',
  displayName: 'A long original display name',
  type: 'text',
  content: 'Original post\n'.repeat(50),
  createdAt: '2026-11-19T18:00:00Z',
  editedAt: null,
  isPinned: false,
  isMine: false,
  likeCount: 0,
  likedByMe: false,
  reactionCounts: {},
  myReaction: null,
  comments: [
    {
      id: 'mine',
      postId: 'post',
      createdBy: 'actor',
      displayName: 'Settings',
      content: '  Exact text\nnext line  ',
      createdAt: '2026-11-19T18:01:00Z',
      isMine: true,
      avatarUrl: 'https://example.test/member.png',
    },
    {
      id: 'other',
      postId: 'post',
      createdBy: 'other',
      displayName: 'اسم طويل للاختبار',
      content: 'مرحبا',
      createdAt: '2026-11-19T18:02:00Z',
      isMine: false,
    },
  ],
};
function mount(platform = 'android') {
  const hooks = componentHarness();
  const draftStore = new GroupDraftStore('actor');
  let discussion: GroupFeedPost | undefined = post;
  let locale: 'nl' | 'en' | 'ar' = 'nl';
  let busy = false;
  let sent = 0;
  let request: (...args: unknown[]) => Promise<unknown> = async () => undefined;
  const calls: unknown[][] = [];
  const order: unknown[][] = [];
  const group: Group = {
    id: 'group',
    code: 'GROUP',
    name: 'Group',
    description: '',
    goal_type: '',
    progress_unit: '',
    goal_period: '',
    goal_target: null,
    privacy: 'private',
    language_code: 'nl',
    owner_id: 'owner',
    created_at: '',
    permissions: ['comment.create'],
  };
  const backend = {
    groups: {
      addComment: (...args: unknown[]) => {
        calls.push(args);
        return request(...args);
      },
    },
  } as unknown as Backend;
  const { GroupDiscussionSheet } = loadComponentModule<{
    GroupDiscussionSheet: (props: object) => unknown;
  }>(new URL('../src/features/groups/components/GroupDiscussionSheet.tsx', import.meta.url), {
    react: {
      ...hooks.react,
      useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
    },
    'react-native': {
      ActivityIndicator: 'ActivityIndicator',
      Pressable: 'Pressable',
      TextInput: 'TextInput',
      View: 'View',
      Platform: { OS: platform },
    },
    '../../../i18n': { useI18n: () => ({ locale }) },
    '../../../shared/components': sharedComponents,
    '../../../shared/theme': {
      usePalette: () => light,
      fonts: { regular: 'DM Sans', arabicUi: 'Arabic' },
    },
    '../communityCopy': { communityText: (key: string) => key },
    '../feedCopy': { feedCopy },
    './FeedAvatar': { FeedAvatar: 'FeedAvatar' },
    './feedPresentation': { formatFeedTime: () => '2 min' },
    './groupUi': { permitted: (g: Group, key: string) => g.permissions?.includes(key) === true },
  });
  const render = () =>
    hooks.render(() =>
      GroupDiscussionSheet({
        discussion,
        group,
        draftStore,
        backend,
        busy,
        onClose: () => {
          order.push(['close']);
          discussion = undefined;
        },
        onSent: () => {
          sent++;
        },
        onDeleteComment: (...args: unknown[]) => {
          order.push(['delete', ...args]);
        },
      }),
    );
  return {
    render,
    draftStore,
    group,
    calls,
    order,
    open: (next = post) => {
      discussion = next;
    },
    setLocale: (next: typeof locale) => {
      locale = next;
    },
    setBusy: (next: boolean) => {
      busy = next;
    },
    request: (next: typeof request) => {
      request = next;
    },
    sent: () => sent,
  };
}
const input = (tree: unknown) => findElement(tree, 'TextInput', 'testID', 'group-comment-input');
const send = (tree: unknown) => findElement(tree, 'Pressable', 'testID', 'group-comment-send');

test('discussion keeps its draft when closed/reopened and on a real failed send', async () => {
  const app = mount();
  (input(app.render()).props.onChangeText as (value: string) => void)('  careful draft\n');
  const sheet = elements(app.render(), 'Sheet')[0]!;
  (sheet.props.onClose as () => void)();
  assert.equal(elements(app.render(), 'TextInput').length, 0);
  app.open();
  assert.equal(input(app.render()).props.value, '  careful draft\n');
  app.request(async () => {
    throw new Error('offline');
  });
  await press(send(app.render()));
  assert.deepEqual(app.calls, [['GROUP', 'post', '  careful draft\n', undefined, 'actor']]);
  assert.equal(app.draftStore.snapshot().comments.post?.status, 'failed');
  assert.equal(input(app.render()).props.value, '  careful draft\n');
  assert.equal(send(app.render()).props.accessibilityLabel, feedCopy.nl.retry);
  assert.equal(app.sent(), 0);
});

test('the actual send callback keeps text typed during the request and prevents a duplicate submission', async () => {
  const app = mount();
  let finish!: () => void;
  app.request(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  app.draftStore.set('first', 'post');
  const pending = press(send(app.render()));
  let tree = app.render();
  assert.equal(send(tree).props.disabled, true);
  assert.equal((send(tree).props.accessibilityState as { busy: boolean }).busy, true);
  assert.equal(elements(tree, 'ActivityIndicator').length, 1);
  (input(tree).props.onChangeText as (value: string) => void)('next draft');
  await press(send(app.render()));
  assert.equal(app.calls.length, 1);
  finish();
  await pending;
  tree = app.render();
  assert.equal(input(tree).props.value, 'next draft');
  assert.equal(app.draftStore.snapshot().comments.post?.status, 'idle');
  assert.equal(app.sent(), 1);
});

test('footer remains separate from the scrollable discussion, grows within bounds and supports Arabic input', () => {
  const app = mount();
  app.setLocale('ar');
  let tree = app.render();
  const sheet = elements(tree, 'Sheet')[0]!;
  assert.equal(sheet.props.avoidKeyboard, true);
  assert.ok(sheet.props.footer);
  assert.equal(elements(sheet.props.children, 'TextInput').length, 0);
  assert.equal((input(tree).props.style as { textAlign: string }).textAlign, 'right');
  assert.equal((input(tree).props.style as { writingDirection: string }).writingDirection, 'rtl');
  assert.equal((input(tree).props.style as { lineHeight: number }).lineHeight, 27);
  assert.equal(input(tree).props.placeholder, feedCopy.ar.writeComment);
  assert.equal(input(tree).props.maxLength, 400);
  (input(tree).props.onContentSizeChange as (event: object) => void)({
    nativeEvent: { contentSize: { height: 500 } },
  });
  tree = app.render();
  assert.equal((input(tree).props.style as { height: number }).height, 112);
  assert.equal(input(tree).props.scrollEnabled, true);
  assert.equal(elements(tree, 'Card').length, 0);
  const avatars = elements(tree, 'FeedAvatar');
  assert.equal(avatars[0]!.props.uri, 'https://example.test/member.png');
  assert.equal(avatars[1]!.props.uri, undefined);
  const summary = findElement(tree, 'View', 'testID', 'group-discussion-summary');
  assert.equal(elements(summary, 'T')[1]!.props.numberOfLines, 2);
  assert.ok(
    elements(tree, 'T').some((node) =>
      JSON.stringify(node.props.children).includes('  Exact text\\nnext line  '),
    ),
  );
});

test('readonly and moderation permissions remain distinct, and iOS deletes wait for native dismissal', async () => {
  for (const platform of ['ios', 'android']) {
    const app = mount(platform);
    app.group.permissions = [];
    let tree = app.render();
    assert.equal(elements(tree, 'TextInput').length, 0);
    assert.equal(
      elements(tree, 'Pressable').filter((node) =>
        String(node.props.testID).startsWith('group-comment-delete'),
      ).length,
      1,
    );
    app.group.permissions = ['comment.create', 'comment.moderate'];
    tree = app.render();
    assert.equal(
      elements(tree, 'Pressable').filter((node) =>
        String(node.props.testID).startsWith('group-comment-delete'),
      ).length,
      2,
    );
    await press(findElement(tree, 'Pressable', 'testID', 'group-comment-delete-other'));
    if (platform === 'ios') {
      assert.deepEqual(app.order, [['close']]);
      const hidden = elements(app.render(), 'Sheet')[0]!;
      (hidden.props.onDismiss as () => void)();
      (hidden.props.onDismiss as () => void)();
    }
    assert.deepEqual(app.order, [['close'], ['delete', 'post', 'other']]);
  }
});
