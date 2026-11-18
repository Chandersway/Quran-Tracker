import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { appReducer, type Action } from '../src/state/reducer';
import { initialState, type AppState } from '../src/state/models';
import { createSnapshotWriter } from '../src/state/persistence/snapshotWriter';
import type { useAppStore } from '../src/state/store';

type TestSession = { user: { id: string } } | null;
type TestAuth = {
  getSession: () => Promise<TestSession>;
  onChange: (callback: (session: TestSession) => void) => () => void;
};

function storeHarness(write: (raw: string) => Promise<void>, auth?: TestAuth) {
  let state = initialState;
  const refs: Array<{ current: unknown }> = [];
  const effects: Array<() => void | (() => void)> = [];
  const modules: Record<string, unknown> = {
    react: {
      createContext: () => ({ Provider: 'Provider' }),
      createElement: (_type: unknown, props: unknown) => props,
      useState: (input: unknown) => {
        const value = typeof input === 'function' ? input() : input;
        return [
          value,
          (next: AppState) => {
            if (value && typeof value === 'object' && 'version' in value) state = next;
          },
        ];
      },
      useRef: (current: unknown) => {
        const ref = { current };
        refs.push(ref);
        return ref;
      },
      useCallback: (callback: unknown) => callback,
      useEffect: (effect: () => void | (() => void)) => {
        effects.push(effect);
      },
    },
    '@react-native-async-storage/async-storage': {
      setItem: (_key: string, raw: string) => write(raw),
    },
    './reducer': { appReducer },
    './models': { initialState },
    '../migration/legacyAndroid': {},
    './persistence/hydrateState': { stateStorageKey: 'test' },
    './persistence/snapshotWriter': { createSnapshotWriter },
    '../config/runtime': { getBackend: () => (auth ? { auth } : null) },
  };
  const output = ts.transpileModule(readFileSync('src/state/store.tsx', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: Record<string, (props: unknown) => { value: ReturnType<typeof useAppStore> }> = {};
  vm.runInNewContext(`${output}\nexports.HydratedStore = HydratedStore;`, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  const store = exports.HydratedStore!({ initial: initialState, children: null }).value;
  if (!auth) refs[0]!.current = 'reader-a';
  return {
    store,
    state: () => state,
    owner: refs[0]!,
    start: () => {
      const cleanups = effects.map((effect) => effect());
      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}

const batch: Action = {
  type: 'checkIn/batch',
  entries: [2, 4].map((number) => ({
    type: 'checkIn' as const,
    kind: 'hizb' as const,
    number,
    name: `Hizb ${number}`,
    requestId: `durable:${number}`,
    now: 1_700_000_000_000,
    date: '2023-11-14',
  })),
};

test('actual store confirms a multi-Hizb commit after disk and attributes every entry to its owner', async () => {
  let release!: () => void;
  const disk = new Promise<void>((resolve) => {
    release = resolve;
  });
  let raw = '';
  const harness = storeHarness(async (value) => {
    await disk;
    raw = value;
  });
  let confirmed = false;
  const saved = harness.store.commit(batch).then(() => {
    confirmed = true;
  });
  await Promise.resolve();
  assert.equal(confirmed, false);
  assert.equal(raw, '');
  assert.deepEqual(
    harness.state().history.map((row) => row.ownerId),
    ['reader-a', 'reader-a'],
  );
  release();
  await saved;
  const durable = JSON.parse(raw) as AppState;
  assert.equal(durable.history.length, 2);
  assert.equal(durable.progress.rub_2_4?.readCount, 1);
  assert.equal(durable.progress.rub_4_4?.readCount, 1);
  assert.equal(confirmed, true);
});

test('actual store rejects a failed commit and retrying its stable batch does not add readings', async () => {
  let fail = true;
  let raw = '';
  const harness = storeHarness(async (value) => {
    if (fail) throw new Error('Disk full');
    raw = value;
  });
  await assert.rejects(harness.store.commit(batch), /Disk full/);
  assert.equal(raw, '');
  assert.equal(harness.state().history.length, 2);
  fail = false;
  await harness.store.commit(batch);
  assert.equal(JSON.parse(raw).history.length, 2);
  assert.equal(harness.state().progress.rub_2_1?.readCount, 1);
});

test('a prepared check-in cannot be reattributed after an account switch', async () => {
  const harness = storeHarness(async () => {});
  const prepared: Action = {
    type: 'checkIn/batch',
    entries: batch.entries.map((entry) => ({ ...entry, ownerId: 'reader-a' })),
  };
  harness.owner.current = 'reader-b';
  await assert.rejects(harness.store.commit(prepared), /account changed/);
  assert.equal(harness.state().history.length, 0);
});

test('a stale startup auth failure cannot replace an authenticated owner with a guest', async () => {
  let rejectLookup!: (error: Error) => void;
  const lookup = new Promise<TestSession>((_, reject) => {
    rejectLookup = reject;
  });
  let changed!: (session: TestSession) => void;
  let unsubscribed = false;
  const harness = storeHarness(async () => {}, {
    getSession: () => lookup,
    onChange: (callback) => {
      changed = callback;
      return () => {
        unsubscribed = true;
      };
    },
  });
  const stop = harness.start();
  await new Promise((resolve) => setImmediate(resolve));
  changed({ user: { id: 'reader-a' } });
  rejectLookup(new Error('Transient startup failure'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(harness.owner.current, 'reader-a');
  await harness.store.commit({
    ...batch,
    entries: batch.entries.map((entry) => ({ ...entry, ownerId: 'reader-a' })),
  });
  assert.deepEqual(
    harness.state().history.map((row) => row.ownerId),
    ['reader-a', 'reader-a'],
  );
  stop();
  assert.equal(unsubscribed, true);
});

test('an unresolved startup auth failure initializes guest and later account events still apply', async () => {
  let rejectLookup!: (error: Error) => void;
  const lookup = new Promise<TestSession>((_, reject) => {
    rejectLookup = reject;
  });
  let changed!: (session: TestSession) => void;
  const harness = storeHarness(async () => {}, {
    getSession: () => lookup,
    onChange: (callback) => {
      changed = callback;
      return () => {};
    },
  });
  const stop = harness.start();
  const queued = harness.store.commit(batch);
  await new Promise((resolve) => setImmediate(resolve));
  rejectLookup(new Error('No initial session'));
  await queued;
  assert.equal(harness.owner.current, '');
  assert.deepEqual(
    harness.state().history.map((row) => row.ownerId),
    ['', ''],
  );
  changed({ user: { id: 'reader-b' } });
  assert.equal(harness.owner.current, 'reader-b');
  changed(null);
  assert.equal(harness.owner.current, '');
  stop();
});
