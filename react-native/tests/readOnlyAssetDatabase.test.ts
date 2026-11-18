import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loader(platform: 'android' | 'web', valid = true) {
  const calls: Array<{ operation: string; args: unknown[] }> = [];
  const record = (operation: string, ...args: unknown[]) => calls.push({ operation, args });
  const db = {
    execAsync: async (...args: unknown[]) => {
      record('query-only', ...args);
    },
    getFirstAsync: async () => ({ value: JSON.stringify({ schemaVersion: valid ? 1 : 99 }) }),
    closeAsync: async () => {
      record('close');
    },
  };
  const modules = {
    'react-native': { Platform: { OS: platform } },
    'expo-asset': {
      Asset: {
        fromModule: (id: number) => ({
          downloadAsync: async () => {
            record('asset-js', id);
            return { uri: 'https://local-fixture.invalid/content.db' };
          },
        }),
      },
    },
    'expo-sqlite': {
      defaultDatabaseDirectory: 'file:///app/databases',
      importDatabaseFromAssetAsync: async (...args: unknown[]) => {
        record('import-native', ...args);
      },
      openDatabaseAsync: async (...args: unknown[]) => {
        record('open-native', ...args);
        return db;
      },
      deserializeDatabaseAsync: async (...args: unknown[]) => {
        record('deserialize', ...args);
        return db;
      },
      deleteDatabaseAsync: async (...args: unknown[]) => {
        record('delete', ...args);
      },
    },
  };
  const source = ts.transpileModule(
    readFileSync(
      new URL('../src/services/storage/readOnlyAssetDatabase.ts', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    },
  ).outputText;
  const exports: {
    openReadOnlyAssetDatabase?: (options: {
      assetId: number;
      name: string;
      expected: Record<string, number>;
    }) => Promise<unknown>;
  } = {};
  vm.runInNewContext(source, {
    exports,
    require: (id: keyof typeof modules) => {
      assert.ok(id in modules);
      return modules[id];
    },
    fetch: async (url: string) => {
      record('fetch', url);
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) };
    },
    Uint8Array,
  });
  return {
    open: (name = 'qac-hash.db') =>
      exports.openReadOnlyAssetDatabase!({ assetId: 17, name, expected: { schemaVersion: 1 } }),
    calls,
    db,
  };
}

test('native reference loading imports directly to its private disk folder without a JS byte buffer', async () => {
  const app = loader('android');
  assert.equal(await app.open(), app.db);
  assert.deepEqual(
    app.calls.map((call) => call.operation),
    ['import-native', 'open-native', 'query-only'],
  );
  assert.equal(app.calls[0]!.args[0], 'qac-hash.db');
  assert.equal(app.calls[0]!.args[2], 'file:///app/databases/read-only-content');
  assert.match(String(app.calls[2]!.args[0]), /query_only=ON/);
});

test('corrupt reference metadata closes and removes only that own versioned copy for retry', async () => {
  const app = loader('android', false);
  await assert.rejects(app.open(), /metadata is invalid/);
  assert.deepEqual(
    app.calls.slice(-2).map((call) => call.operation),
    ['close', 'delete'],
  );
  assert.deepEqual(app.calls.at(-1)!.args, [
    'qac-hash.db',
    'file:///app/databases/read-only-content',
  ]);
  const invalid = loader('android');
  await assert.rejects(invalid.open('../user-state.db'), /Invalid reference/);
  assert.equal(invalid.calls.length, 0);
});

test('browser reference database stays in memory and never deletes a native database on failure', async () => {
  const app = loader('web', false);
  await assert.rejects(app.open(), /metadata is invalid/);
  assert.deepEqual(
    app.calls.map((call) => call.operation),
    ['asset-js', 'fetch', 'deserialize', 'query-only', 'close'],
  );
});
