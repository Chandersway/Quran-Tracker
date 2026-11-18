import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Actual component callbacks are invoked with native events in tests.
export type HookNode = { type: string; props: Record<string, any>; children: unknown[] };
export function hookNodes(value: unknown): HookNode[] {
  if (Array.isArray(value)) return value.flatMap(hookNodes);
  if (!value || typeof value !== 'object') return [];
  const node = value as HookNode;
  return [node, ...hookNodes(node.children)];
}
export function mountHookComponent(
  file: string,
  name: string,
  modules: Record<string, unknown>,
  initialProps: Record<string, unknown> = {},
) {
  const slots: unknown[] = [];
  let index = 0,
    dirty = false;
  let props = initialProps;
  let tree: HookNode;
  const effects: Array<() => void> = [];
  const same = (a: unknown[], b: unknown[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  const react = {
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useRef(value: unknown) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: value };
      return slots[slot];
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
    useMemo(fn: () => unknown, deps: unknown[]) {
      const slot = index++;
      const old = slots[slot] as { deps: unknown[]; value: unknown } | undefined;
      if (!old || !same(old.deps, deps)) slots[slot] = { deps, value: fn() };
      return (slots[slot] as { value: unknown }).value;
    },
    useEffect(fn: () => (() => void) | void, deps: unknown[]) {
      const slot = index++;
      const old = slots[slot] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (!old || !same(old.deps, deps)) {
        const next: { deps: unknown[]; cleanup?: () => void } = { deps };
        slots[slot] = next;
        effects.push(() => {
          old?.cleanup?.();
          next.cleanup = fn() ?? undefined;
        });
      }
    },
  };
  const exports: Record<string, (props: Record<string, unknown>) => HookNode> = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText,
    {
      exports,
      Error,
      RangeError,
      TypeError,
      process: { env: {} },
      setTimeout,
      clearTimeout,
      require(module: string) {
        if (module === 'react') return react;
        assert.ok(module in modules, `Missing component module ${module}`);
        return modules[module];
      },
    },
  );
  function render() {
    dirty = false;
    index = 0;
    tree = exports[name]!(props);
    effects.splice(0).forEach((effect) => effect());
  }
  render();
  return {
    get nodes() {
      return hookNodes(tree);
    },
    find(type: string, predicate: (node: HookNode) => boolean = () => true) {
      const node = hookNodes(tree).find((node) => node.type === type && predicate(node));
      assert.ok(node, `${type} node should exist`);
      return node;
    },
    render,
    update(next: Record<string, unknown>) {
      props = { ...props, ...next };
      render();
    },
    async settle() {
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setImmediate(resolve));
        if (dirty) render();
      }
      assert.equal(dirty, false, 'Component must settle');
    },
  };
}
