import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as progress from '../src/services/groups/groupProgress';
import * as metrics from '../src/services/groups/groupMetrics';
import * as copy from '../src/features/groups/groupProgressCopy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Execute shipped callbacks without a native renderer.
type Node = { type: string; props: Record<string, any>; children: unknown[] };
function renderModule(
  file: string,
  name: string,
  modules: Record<string, unknown>,
  props: unknown,
) {
  let slot = 0;
  const slots: unknown[] = [];
  const react = {
    Fragment: 'Fragment',
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useState(initial: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value: unknown) => {
          slots[index] = typeof value === 'function' ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
  };
  const catalog = JSON.parse(
    readFileSync(new URL('../src/i18n/source-catalog.json', import.meta.url), 'utf8'),
  ).entries;
  const t = (key: string): string => catalog[key]?.values.en ?? key;
  const shared = ['View', 'Button', 'Card', 'Empty', 'Field', 'Notice', 'Row', 'Segments', 'T'];
  const mocked: Record<string, unknown> = {
    react,
    'react-native': {
      View: 'View',
      Pressable: 'Pressable',
      useWindowDimensions: () => ({ fontScale: 1 }),
    },
    '../../../shared/components': Object.fromEntries(shared.map((value) => [value, value])),
    '../../../shared/theme': { usePalette: () => ({}) },
    '../../../i18n': {
      useI18n: () => ({
        locale: 'en',
        t,
        format: (key: string, ...args: unknown[]) => {
          let i = 0;
          return t(key).replace(/%[sd]/g, () => String(args[i++]));
        },
      }),
    },
    ...modules,
  };
  const output = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports: Record<string, (props: unknown) => Node> = {};
  vm.runInNewContext(output, {
    exports,
    require: (module: string) => {
      assert.ok(module in mocked, module);
      return mocked[module];
    },
  });
  let tree: Node;
  const render = () => {
    slot = 0;
    tree = exports[name]!(props);
    return tree;
  };
  const nodes = (value: unknown = tree): Node[] => {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('type' in value)) return [];
    const node = value as Node;
    return [node, ...node.children.flatMap(nodes)];
  };
  const find = (type: string, title?: string) => {
    const value = nodes().find(
      (node) =>
        node.type === type && (!title || node.props.title === title || node.props.label === title),
    );
    assert.ok(value, `${type}: ${title}`);
    return value;
  };
  return { render, nodes, find };
}

function progressPanel(permissions: string[], record: (...args: unknown[]) => Promise<void>) {
  const resource = {
    value: [],
    busy: false,
    error: '',
    reload: async () => {},
    run: async (action: () => Promise<void>) => action(),
  };
  return renderModule(
    '../src/features/groups/components/GroupProgressPanel.tsx',
    'GroupProgressPanel',
    {
      '../../../services/groups/groupMetrics': metrics,
      '../../../services/groups/groupProgress': progress,
      '../groupProgressCopy': copy,
      './groupUi': {
        permitted: (group: { permissions: string[] }, key: string) =>
          group.permissions.includes(key),
        useGroupResource: () => resource,
        ResourceState: 'ResourceState',
      },
      './GroupProgressSummary': { GroupProgressSummary: 'GroupProgressSummary' },
      './GroupMemberReadingSheet': { GroupMemberReadingSheet: 'GroupMemberReadingSheet' },
    },
    {
      backend: { groups: { recordProgress: record } },
      group: { code: 'PAR-1234', name: 'Continue', permissions },
    },
  );
}

test('progress-only members get a working private save and no feed-sharing action', async () => {
  const calls: unknown[][] = [];
  const f = progressPanel(['progress.create'], async (...args) => {
    calls.push(args);
  });
  f.render();
  assert.equal(
    f.nodes().some((node) => node.props.title === 'Save and share'),
    false,
  );
  f.find('Button', 'Save without a feed post').props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['PAR-1234', 'page', 1, 'manual', false, undefined]);
});

test('explicit save-and-share generates a localized message and repeated taps wait for the same write', async () => {
  const calls: unknown[][] = [];
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const f = progressPanel(['progress.create', 'post.create'], async (...args) => {
    calls.push(args);
    await pending;
  });
  f.render();
  assert.equal(calls.length, 0);
  const share = f
    .nodes()
    .find(
      (node) =>
        node.type === 'Button' &&
        /share/i.test(node.props.title) &&
        node.props.title !== 'Save without a feed post',
    );
  assert.ok(share);
  assert.equal(share.props.disabled, false);
  share.props.onPress();
  share.props.onPress();
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.[4], true);
  assert.match(String(calls[0]?.[5]), /^Read 1 /);
  finish();
  await new Promise((resolve) => setImmediate(resolve));
});

test('post text folds at six lines and expands/collapses without translating or changing content', () => {
  const content = 'Continue\n' + 'A long personal message. '.repeat(35);
  const f = renderModule(
    '../src/features/groups/components/ExpandablePostText.tsx',
    'ExpandablePostText',
    {},
    { content },
  );
  f.render();
  const measuring = f.nodes().find((node) => node.props.onTextLayout);
  assert.ok(measuring);
  measuring.props.onTextLayout({ nativeEvent: { lines: Array(7).fill({}) } });
  f.render();
  const visible = () => f.nodes().find((node) => node.props.selectable);
  assert.equal(visible()?.props.numberOfLines, 6);
  assert.equal(visible()?.props.translate, false);
  assert.equal(visible()?.children[0], content);
  assert.equal(f.find('Pressable').props.accessibilityState.expanded, false);
  f.find('Pressable').props.onPress();
  f.render();
  assert.equal(visible()?.props.numberOfLines, undefined);
  assert.equal(f.find('Pressable').props.accessibilityState.expanded, true);
  f.find('Pressable').props.onPress();
  f.render();
  assert.equal(visible()?.props.numberOfLines, 6);
  measuring.props.onTextLayout({ nativeEvent: { lines: Array(3).fill({}) } });
  f.render();
  assert.equal(
    f.nodes().some((node) => node.type === 'Pressable'),
    false,
  );
});
