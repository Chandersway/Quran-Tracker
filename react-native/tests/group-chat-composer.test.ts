import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Execute actual screen/composer callbacks with native hosts isolated.
type Node = { type: string; props: Record<string, any>; children: unknown[] };

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as Node;
  return [node, ...node.children.flatMap(nodes)];
}

function conversation(allowed = true) {
  const calls: unknown[][] = [];
  const modules: Record<string, unknown> = {
    react: {
      createElement: (type: string, props: Node['props'], ...children: unknown[]) => ({
        type,
        props: props ?? {},
        children,
      }),
      useMemo: (factory: () => unknown) => factory(),
      useRef: (current: unknown) => ({ current }),
      useState: (value: unknown) => [value, () => undefined],
      useEffect: () => undefined,
    },
    'react-native': Object.assign(
      Object.fromEntries(
        [
          'FlatList',
          'KeyboardAvoidingView',
          'View',
          'TextInput',
          'Pressable',
          'ActivityIndicator',
        ].map((name) => [name, name]),
      ),
      { Platform: { OS: 'android' } },
    ),
    '@react-navigation/native': {},
    '@react-navigation/elements': { useHeaderHeight: () => 56 },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 24 }) },
    '../../../config/runtime': {},
    '../../../services/groups/groupChat': { GroupChatScroll: class {}, GROUP_CHAT_MAX_LENGTH: 500 },
    '../../../app/navigation/types': { useAppNavigation: () => ({}) },
    '../../../i18n': { useI18n: () => ({ locale: 'nl', t: (key: string) => key }) },
    '../../../shared/components': Object.fromEntries(
      ['Button', 'Empty', 'Icon', 'IconButton', 'Notice', 'Screen', 'T'].map((name) => [
        name,
        name,
      ]),
    ),
    '../../../shared/theme': { usePalette: () => ({}), fonts: {} },
    '../components/GroupChatComposer': { GroupChatComposer: 'GroupChatComposer' },
    '../components/GroupTypingStatus': { GroupTypingStatus: 'GroupTypingStatus' },
    '../components/groupUi': { permitted: () => allowed },
    '../communityCopy': { communityText: (key: string) => key },
    '../chatCopy': { chatText: (key: string) => key },
    '../hooks/useGroupChat': {
      useGroupChat: () => ({
        value: [],
        draft: { text: '  ready  ', status: 'idle' },
        sentRevision: 0,
        setDraft: (text: string) => calls.push(['draft', text]),
        send: () => calls.push(['send']),
      }),
    },
    '../hooks/useGroupTyping': {
      useGroupTyping: (_backend: unknown, code: string, account: string, canSend: boolean) => {
        calls.push(['scope', code, account, canSend]);
        return {
          participants: [],
          activity: (hasText: boolean) => calls.push(['activity', hasText]),
          focus: () => calls.push(['focus']),
          blur: () => calls.push(['blur']),
          stop: () => calls.push(['stop']),
        };
      },
    },
  };
  function load(path: string, exposeConversation = false) {
    const exports: Record<string, (props: Node['props']) => Node> = {};
    const output = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(
      output + (exposeConversation ? '\nexports.Conversation = Conversation;' : ''),
      {
        exports,
        require: (name: string) => {
          assert.ok(name in modules, name);
          return modules[name];
        },
      },
    );
    return exports;
  }
  const screen = load('src/features/groups/screens/GroupChatScreen.tsx', true);
  const tree = screen.Conversation!({
    backend: {},
    group: { code: 'QA', name: 'Fixture' },
    accountId: 'member',
    refreshGroup: async () => {},
  });
  const props = nodes(tree).find((node) => node.type === 'GroupChatComposer')!.props;
  const composer = load('src/features/groups/components/GroupChatComposer.tsx').GroupChatComposer!(
    props,
  );
  return { calls, nodes: nodes(composer), tree, props };
}

test('native composer events reach scoped typing without altering the exact draft, and stop precedes send', () => {
  const app = conversation();
  const input = app.nodes.find((node) => node.type === 'TextInput')!;
  input.props.onFocus();
  input.props.onChangeText('  unchanged draft\n ');
  input.props.onChangeText(' \n ');
  input.props.onBlur();
  app.nodes.find((node) => node.type === 'Pressable')!.props.onPress();
  assert.deepEqual(app.calls, [
    ['scope', 'QA', 'member', true],
    ['focus'],
    ['draft', '  unchanged draft\n '],
    ['activity', true],
    ['draft', ' \n '],
    ['activity', false],
    ['blur'],
    ['stop'],
    ['send'],
  ]);
  assert.equal(input.props.multiline, true);
  assert.ok(nodes(app.tree).some((node) => node.type === 'GroupTypingStatus'));
});

test('a read-only group cannot focus a composer or advertise typing', () => {
  const app = conversation(false);
  assert.equal(app.props.allowed, false);
  assert.ok(!app.nodes.some((node) => node.type === 'TextInput'));
  assert.deepEqual(app.calls, [['scope', 'QA', 'member', false]]);
});
