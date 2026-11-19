import assert from 'node:assert/strict';
import test from 'node:test';
import type { GroupFeedPost } from '../src/services/backend/types';
import { light } from '../src/shared/theme/colors';
import { feedCopy } from '../src/features/groups/feedCopy';
import { formatFeedTime } from '../src/features/groups/components/feedPresentation';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
} from './helpers/componentHarness';

const base: GroupFeedPost = {
  id: 'post-1',
  createdBy: 'user-1',
  displayName: 'Sarah',
  type: 'text',
  content: 'Dag 1',
  createdAt: '2026-11-19T12:00:00Z',
  editedAt: null,
  isPinned: false,
  isMine: false,
  likeCount: 0,
  likedByMe: false,
  reactionCounts: {},
  myReaction: null,
  comments: [],
};

function mount() {
  const hooks = componentHarness();
  const reactions: string[] = [];
  let replies = 0,
    menus = 0;
  let props = { post: base, locale: 'nl' as 'nl' | 'en' | 'ar', canReact: true, busy: false };
  const { GroupFeedPostCard } = loadComponentModule<{
    GroupFeedPostCard: (props: object) => unknown;
  }>(new URL('../src/features/groups/components/GroupFeedPostCard.tsx', import.meta.url), {
    react: hooks.react,
    'react-native': { View: 'View', Pressable: 'Pressable', StyleSheet: { hairlineWidth: 0.5 } },
    '../../../shared/components': sharedComponents,
    '../../../shared/theme': { usePalette: () => light },
    '../feedCopy': { feedCopy },
    './ExpandablePostText': { ExpandablePostText: 'ExpandablePostText' },
    './FeedAvatar': { FeedAvatar: 'FeedAvatar' },
    './feedPresentation': { formatFeedTime },
    './GroupImage': { GroupImage: 'GroupImage' },
  });
  return {
    reactions,
    get replies() {
      return replies;
    },
    get menus() {
      return menus;
    },
    set(next: Partial<typeof props>) {
      props = { ...props, ...next };
    },
    render: () =>
      hooks.render(() =>
        GroupFeedPostCard({
          ...props,
          onReact: (reaction: string) => reactions.push(reaction),
          onReply: () => replies++,
          onMore: () => menus++,
        }),
      ),
  };
}

test('short posts keep content-sized plain surfaces, hide zeros and expose only one Like/Reply row', () => {
  const app = mount();
  const tree = app.render();
  const card = findElement(tree, 'View', 'testID', 'feed-post-post-1');
  const style = card.props.style as Record<string, unknown>;
  assert.equal(style.backgroundColor, light.surface);
  assert.equal(style.height, undefined);
  assert.equal(style.minHeight, undefined);
  assert.equal(elements(tree, 'Card').length, 0, 'global patterned cards never wrap feed items');
  assert.equal(elements(tree, 'ExpandablePostText')[0]!.props.content, 'Dag 1');
  assert.equal(
    elements(tree, 'T').some((node) => node.props.children?.toString() === '0'),
    false,
  );
  assert.equal(elements(tree, 'Button').length, 0, 'no standalone wide reply or reaction buttons');
  press(findElement(tree, 'Pressable', 'testID', 'feed-like-action'));
  press(findElement(tree, 'Pressable', 'testID', 'feed-comment-action'));
  press(elements(tree, 'IconButton')[0]!);
  assert.deepEqual(app.reactions, ['like']);
  assert.equal(app.replies, 1);
  assert.equal(app.menus, 1);
});

test('tap toggles the current reaction, and long press opens four choices without mutating it', () => {
  const app = mount();
  app.set({ post: { ...base, myReaction: 'love', reactionCounts: { love: 1, dua: 2 } } });
  let tree = app.render();
  const like = findElement(tree, 'Pressable', 'testID', 'feed-like-action');
  assert.equal(like.props.accessibilityLabel, 'Mooi');
  assert.deepEqual(
    { ...(like.props.accessibilityState as object) },
    { selected: true, disabled: false },
  );
  press(like);
  assert.deepEqual(
    app.reactions,
    ['love'],
    'sending the same value preserves the existing toggle-off API',
  );
  (like.props.onLongPress as () => void)();
  tree = app.render();
  assert.deepEqual(app.reactions, ['love'], 'opening the picker alone never reacts');
  for (const label of Object.values(feedCopy.nl.reactions)) {
    assert.ok(findElement(tree, 'Pressable', 'accessibilityLabel', label));
  }
  press(findElement(tree, 'Pressable', 'accessibilityLabel', 'Dua'));
  assert.deepEqual(app.reactions, ['love', 'dua']);
  assert.equal(
    elements(app.render(), 'View').some((node) => node.props.testID === 'feed-reaction-picker'),
    false,
  );
});

test('the visible disclosure and assistive action make all reactions available without holding', () => {
  const app = mount();
  let tree = app.render();
  press(findElement(tree, 'Pressable', 'testID', 'feed-reaction-disclosure'));
  tree = app.render();
  assert.equal(
    findElement(tree, 'Pressable', 'testID', 'feed-reaction-disclosure').props.accessibilityLabel,
    feedCopy.nl.closeReactions,
  );
  press(findElement(tree, 'Pressable', 'testID', 'feed-reaction-disclosure'));
  tree = app.render();
  const action = findElement(tree, 'Pressable', 'testID', 'feed-like-action');
  (action.props.onAccessibilityAction as (event: object) => void)({
    nativeEvent: { actionName: 'longpress' },
  });
  tree = app.render();
  assert.ok(findElement(tree, 'View', 'testID', 'feed-reaction-picker'));
  assert.deepEqual(app.reactions, []);
});

test('long names, an image, nonzero summary and Arabic UI retain flexible layout and reading content', () => {
  const app = mount();
  const name = 'عبد الرحمن '.repeat(8);
  app.set({
    locale: 'ar',
    post: {
      ...base,
      displayName: name,
      content: 'Long content '.repeat(80),
      reactionCounts: { like: 3, love: 2, dua: 1, insightful: 1 },
      comments: [
        {
          id: 'comment-1',
          postId: base.id,
          createdBy: 'someone',
          displayName: 'Ibrahim',
          content: 'شكراً',
          createdAt: base.createdAt,
          isMine: false,
        },
      ],
      media: {
        signedUrl: 'https://example.test/image.png',
        caption: 'A shared photo',
        file_name: 'image.png',
      } as GroupFeedPost['media'],
    },
  });
  const tree = app.render();
  assert.equal(
    (findElement(tree, 'View', 'testID', 'feed-post-post-1').props.style as Record<string, unknown>)
      .direction,
    'rtl',
  );
  assert.equal(elements(tree, 'FeedAvatar')[0]!.props.name, name);
  const text = elements(tree, 'T').find(
    (node) => (node.props.children as unknown[])?.[0] === name,
  )!;
  assert.ok(text);
  assert.equal(
    text.props.numberOfLines,
    2,
    'long names have two lines while the full accessible name is retained',
  );
  assert.equal(elements(tree, 'GroupImage')[0]!.props.accessibilityLabel, 'A shared photo');
  assert.equal(
    findElement(tree, 'Pressable', 'testID', 'feed-comment-action').props.accessibilityLabel,
    feedCopy.ar.reply,
  );
  assert.ok(
    elements(tree, 'View').some(
      (node) => node.props.accessibilityLabel === feedCopy.ar.reactionsCount(7),
    ),
  );
  app.set({ busy: true });
  assert.equal(
    findElement(app.render(), 'Pressable', 'testID', 'feed-like-action').props.disabled,
    true,
  );
  app.set({ canReact: false });
  assert.equal(
    elements(app.render(), 'Pressable').some((node) => node.props.testID === 'feed-like-action'),
    false,
  );
});

test('time labels are compact, localized, year-aware and tolerate missing timestamps', () => {
  const now = Date.parse('2026-11-19T12:02:30Z');
  assert.equal(formatFeedTime(base.createdAt, 'nl', now), '2 min');
  assert.equal(formatFeedTime(base.createdAt, 'en', now), '2 min');
  assert.match(formatFeedTime(base.createdAt, 'ar', now), /د$/);
  assert.equal(formatFeedTime('2026-11-19T12:02:29Z', 'nl', now), 'zojuist');
  assert.equal(formatFeedTime('2026-11-19T10:00:00Z', 'nl', now), '2 u');
  assert.match(formatFeedTime('2025-11-19T12:00:00Z', 'en', now), /2025/);
  assert.equal(formatFeedTime('invalid', 'en', now), '');
});

test('Arabic reaction and comment summaries use complete grammatical count phrases', () => {
  const number = (value: number) => value.toLocaleString('ar');
  assert.equal(feedCopy.ar.commentsCount(0), 'لا تعليقات');
  assert.equal(feedCopy.ar.commentsCount(1), 'تعليق واحد');
  assert.equal(feedCopy.ar.commentsCount(2), 'تعليقان');
  assert.equal(feedCopy.ar.commentsCount(3), `${number(3)} تعليقات`);
  assert.equal(feedCopy.ar.commentsCount(11), `${number(11)} تعليقًا`);
  assert.equal(feedCopy.ar.commentsCount(100), `${number(100)} تعليق`);
  assert.equal(feedCopy.ar.commentsCount(102), `${number(102)} تعليق`);
  assert.equal(feedCopy.ar.reactionsCount(0), 'لا تفاعلات');
  assert.equal(feedCopy.ar.reactionsCount(1), 'تفاعل واحد');
  assert.equal(feedCopy.ar.reactionsCount(2), 'تفاعلان');
  assert.equal(feedCopy.ar.reactionsCount(3), `${number(3)} تفاعلات`);
  assert.equal(feedCopy.ar.reactionsCount(11), `${number(11)} تفاعلًا`);
  assert.equal(feedCopy.ar.reactionsCount(100), `${number(100)} تفاعل`);
});

test('an expired avatar falls back to the author initial, while a changed URL can load again', () => {
  const hooks = componentHarness();
  const { FeedAvatar } = loadComponentModule<{ FeedAvatar: (props: object) => unknown }>(
    new URL('../src/features/groups/components/FeedAvatar.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { View: 'View' },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => light },
      './GroupImage': { GroupImage: 'GroupImage' },
    },
  );
  let uri = 'https://example.test/expired.png';
  const render = () => hooks.render(() => FeedAvatar({ name: 'Sarah', uri }));
  const image = elements(render(), 'GroupImage')[0]!;
  (image.props.onError as () => void)();
  assert.equal(elements(render(), 'GroupImage').length, 0);
  assert.equal((elements(render(), 'T')[0]!.props.children as string[])[0], 'S');
  uri = 'https://example.test/current.png';
  assert.equal((elements(render(), 'GroupImage')[0]!.props.source as { uri: string }).uri, uri);
});
