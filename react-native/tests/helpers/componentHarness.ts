import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

export type TestElement = { type: unknown; props: Record<string, unknown> };

/** Executes the real component callbacks with native rendering replaced. */
export function componentHarness() {
  let index = 0;
  let dirty = false;
  const slots: unknown[] = [];
  let effects: Array<() => void> = [];
  const same = (a: unknown[], b: unknown[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  const memo = (create: () => unknown, deps: unknown[]) => {
    const slot = index++;
    const before = slots[slot] as { value: unknown; deps: unknown[] } | undefined;
    if (!before || !same(before.deps, deps)) slots[slot] = { value: create(), deps };
    return (slots[slot] as { value: unknown }).value;
  };
  const react = {
    Fragment: 'Fragment',
    createElement(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) {
      return { type, props: { ...props, children } };
    },
    useState(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof value === 'function' ? value() : value;
      return [
        slots[slot],
        (next: unknown) => {
          const value = typeof next === 'function' ? next(slots[slot]) : next;
          if (!Object.is(value, slots[slot])) {
            slots[slot] = value;
            dirty = true;
          }
        },
      ];
    },
    useRef(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: value };
      return slots[slot];
    },
    useMemo: memo,
    useCallback: (callback: unknown, deps: unknown[]) => memo(() => callback, deps),
    useEffect(effect: () => void, deps: unknown[]) {
      const slot = index++;
      const previous = slots[slot] as unknown[] | undefined;
      if (!previous || !same(previous, deps)) {
        slots[slot] = deps;
        effects.push(effect);
      }
    },
  };
  return {
    react,
    render(component: () => unknown): TestElement {
      let result: unknown;
      let renders = 0;
      do {
        index = 0;
        dirty = false;
        effects = [];
        result = component();
        effects.forEach((effect) => effect());
        assert.ok(++renders < 20, 'Component effects settled');
      } while (dirty);
      return result as TestElement;
    },
  };
}

export function loadComponentModule<T>(
  path: URL,
  modules: Record<string, unknown>,
  globals: Record<string, unknown> = {},
): T {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    ...globals,
    require(name: string) {
      assert.ok(name in modules, `Missing component dependency ${name}`);
      return modules[name];
    },
  });
  return exports as T;
}

export function elements(root: unknown, type?: unknown): TestElement[] {
  if (Array.isArray(root)) return root.flatMap((child) => elements(child, type));
  if (!root || typeof root !== 'object' || !('props' in root)) return [];
  const node = root as TestElement;
  const children =
    node.type === 'Sheet' && node.props.visible === false
      ? []
      : [node.props.children, node.props.footer];
  if (node.type === 'FlatList' && Array.isArray(node.props.data)) {
    const renderItem = node.props.renderItem as (info: { item: unknown; index: number }) => unknown;
    children.push(node.props.data.map((item, index) => renderItem({ item, index })));
  }
  return [
    ...(type === undefined || node.type === type ? [node] : []),
    ...children.flatMap((child) => elements(child, type)),
  ];
}

export function findElement(
  root: unknown,
  type: unknown,
  key: string,
  value: unknown,
): TestElement {
  const result = elements(root, type).find((node) => node.props[key] === value);
  assert.ok(result, `Expected ${String(type)} ${key}=${String(value)}`);
  return result;
}

export const press = (element: TestElement) =>
  (element.props.onPress as () => void | Promise<void>)();
export const change = (element: TestElement, value: string) =>
  (element.props.onChange as (value: string) => void)(value);

export const sharedComponents = Object.fromEntries(
  [
    'Button',
    'Field',
    'Icon',
    'IconButton',
    'Notice',
    'Segments',
    'Sheet',
    'T',
    'Empty',
    'Screen',
    'Card',
    'ProgressBar',
    'Row',
    'Section',
  ].map((name) => [name, name]),
);
