import assert from 'node:assert/strict';
import test from 'node:test';
import { GroupDraftStore } from '../src/services/groups/groupDrafts';
import { feedCopy } from '../src/features/groups/feedCopy';
import { light } from '../src/shared/theme/colors';
import {
  componentHarness,
  elements,
  loadComponentModule,
  sharedComponents,
} from './helpers/componentHarness';

function mount(send: (text: string, actor?: string) => Promise<unknown>) {
  const hooks = componentHarness();
  const drafts = new GroupDraftStore('viewer');
  let reloads = 0;
  const { GroupPostComposer } = loadComponentModule<{
    GroupPostComposer: (props: object) => unknown;
  }>(new URL('../src/features/groups/components/GroupPostComposer.tsx', import.meta.url), {
    react: {
      ...hooks.react,
      useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
    },
    'react-native': { Pressable: 'Pressable', TextInput: 'TextInput', View: 'View' },
    '../../../shared/components': sharedComponents,
    '../../../shared/theme': { fonts: {}, usePalette: () => light },
    '../../../i18n': { useI18n: () => ({ locale: 'nl' }) },
    '../feedCopy': { feedCopy },
    './FeedAvatar': { FeedAvatar: 'FeedAvatar' },
  });
  const backend = {
    auth: { getUser: async () => null },
    groups: {
      createTextPost: (_code: string, text: string, _unused: undefined, actor?: string) =>
        send(text, actor),
    },
  };
  const render = () =>
    hooks.render(() =>
      GroupPostComposer({
        backend,
        groupCode: 'LOCAL',
        draftStore: drafts,
        onSent: () => reloads++,
      }),
    );
  const open = () => {
    (elements(render(), 'Pressable')[0]!.props.onPress as () => void)();
  };
  const sheet = () => elements(render(), 'Sheet')[0]!;
  const submit = () => (elements(sheet().props.footer, 'Button')[0]!.props.onPress as () => void)();
  return { drafts, render, sheet, open, submit, reloads: () => reloads };
}

test('the feed invitation stays one line and closing/reopening keeps the scoped post draft', () => {
  const app = mount(async () => {});
  assert.equal(app.sheet().props.visible, false);
  app.drafts.set('Dag 1\nEen bewaard concept');
  assert.equal(elements(app.render(), 'T')[0]!.props.numberOfLines, 1);
  app.open();
  assert.equal(app.sheet().props.visible, true);
  (app.sheet().props.onClose as () => void)();
  app.open();
  assert.equal(elements(app.render(), 'TextInput')[0]!.props.value, 'Dag 1\nEen bewaard concept');
});

test('failed posts preserve text and a successful retry closes only after the real send', async () => {
  let fail = true;
  const sent: unknown[][] = [];
  const app = mount(async (...args) => {
    sent.push(args);
    if (fail) throw new Error('offline');
  });
  app.drafts.set('Dag 1');
  app.open();
  app.submit();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(app.sheet().props.visible, true);
  assert.equal(app.drafts.snapshot().post.text, 'Dag 1');
  assert.equal(app.drafts.snapshot().post.status, 'failed');
  fail = false;
  app.submit();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(app.sheet().props.visible, false);
  assert.deepEqual(sent, [
    ['Dag 1', 'viewer'],
    ['Dag 1', 'viewer'],
  ]);
  assert.equal(app.reloads(), 1);
});

test('edits during post submission remain open and cannot submit the same request twice', async () => {
  let finish!: () => void;
  let count = 0;
  const app = mount(() => {
    count++;
    return new Promise<void>((resolve) => {
      finish = resolve;
    });
  });
  app.drafts.set('Eerste tekst');
  app.open();
  app.submit();
  app.submit();
  app.drafts.set('Een nieuwe gedachte');
  finish();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(count, 1);
  assert.equal(app.sheet().props.visible, true);
  assert.equal(app.drafts.snapshot().post.text, 'Een nieuwe gedachte');
});
