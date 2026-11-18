import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as join from '../src/services/groups/groupJoin';
import * as progressCopy from '../src/features/groups/groupProgressCopy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Replay actual screen/form callbacks with isolated native hosts.
type Node = { type: unknown; props: Record<string, any>; children: unknown[] };

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.children)];
}

test('signed-out invitation exposes explicit Cancel, consumes only that pending link and closes without joining', async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => void values.set(key, value),
    removeItem: async (key: string) => void values.delete(key),
  };
  const pending = join.createPendingGroupStore(storage);
  const target = { code: 'QAA-1919', token: 'f'.repeat(64) };
  await pending.receive(join.groupJoinUrl(target));
  let backs = 0;
  const mutations: string[] = [];
  const backend = {
    auth: { getSession: async () => null, onChange: () => () => undefined },
    groups: Object.fromEntries(
      ['join', 'acceptInvitation', 'requestAccess'].map((name) => [
        name,
        async () => void mutations.push(name),
      ]),
    ),
  };
  let index = 0;
  let slots: unknown[] = [];
  const effects: Array<() => unknown> = [];
  const react = {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useMemo: (fn: () => unknown) => fn(),
    useState(initial: unknown) {
      const at = index++;
      const current = slots;
      if (!(at in current)) current[at] = initial;
      return [current[at], (value: unknown) => void (current[at] = value)];
    },
    useEffect(fn: () => unknown) {
      const at = index++;
      if (!(at in slots)) {
        slots[at] = true;
        effects.push(fn);
      }
    },
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': { View: 'View' },
    '@react-navigation/native': {
      useRoute: () => ({ params: { code: target.code, invite: target.token } }),
    },
    '../../../config/runtime': { getBackend: () => backend },
    '../../../services/groups/groupJoin': join,
    '../../../services/groups/pendingGroup': { pendingGroup: pending },
    '../../../services/groups/groupErrors': {},
    '../../../i18n': { useI18n: () => ({ t: (key: string) => key, format: () => '' }) },
    '../../../app/navigation/types': {
      useAppNavigation: () => ({ goBack: () => backs++ }),
    },
    '../../../shared/components': Object.fromEntries(
      ['Button', 'Field', 'Notice', 'Screen', 'T'].map((name) => [name, name]),
    ),
    '../../../services/groups/groupDrafts': {},
    '../../../shared/theme': {},
    '../communityCopy': {},
    '../chatCopy': {},
    '../groupProgressCopy': progressCopy,
    './groupUi': {},
  };
  function load(path: string): Record<string, (props: Node['props']) => Node> {
    const exports = {};
    const source = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(source, {
      exports,
      require: (name: string) => {
        if (name.startsWith('../components/')) return modules[name] ?? {};
        assert.ok(name in modules, `Missing isolated module: ${name}`);
        return modules[name];
      },
    });
    return exports;
  }
  const flow = load('src/features/groups/components/GroupJoinFlow.tsx').GroupJoinFlow!;
  modules['../components/GroupJoinFlow'] = { GroupJoinFlow: flow };
  const screen = load('src/features/groups/screens/GroupScreen.tsx').GroupScreen!;
  const screenSlots: unknown[] = [];
  function render(component: (props: Node['props']) => Node, state: unknown[], props = {}) {
    slots = state;
    index = 0;
    const tree = component(props);
    for (const fn of effects.splice(0)) fn();
    return tree;
  }
  render(screen, screenSlots);
  await Promise.resolve();
  const tree = render(screen, screenSlots);
  const route = nodes(tree).find((node) => node.type === flow);
  assert.ok(route, 'The actual signed-out GroupScreen must mount GroupJoinFlow');
  const buttons = nodes(render(flow, [], route.props));
  await pending.load();
  assert.deepEqual(await join.createPendingGroupStore(storage).load(), target);
  assert.equal(backs, 0, 'Mount/auth restoration must not silently dismiss the invitation');
  const cancel = buttons.find((node) => node.props.title === 'common.cancel');
  assert.ok(cancel, 'The signed-out invitation must expose the existing localized Cancel');
  cancel.props.onPress();
  await pending.load();
  assert.equal(await join.createPendingGroupStore(storage).load(), null);
  assert.equal(backs, 1, 'Explicit Cancel closes the actual route');
  assert.deepEqual(mutations, [], 'Cancellation never accepts, joins or requests access');
});
