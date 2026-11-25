import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import type { openReadOnlyAssetDatabase } from '../src/services/storage/readOnlyAssetDatabase';

function loader(platform: 'ios' | 'android' | 'web', valid = true) {
  const calls: unknown[][] = [];
  const database = {
    execAsync: async (sql: string) => {
      calls.push(['sql', sql]);
    },
    getFirstAsync: async () => ({ value: JSON.stringify({ source: valid ? 'bundled' : 'wrong' }) }),
    closeAsync: async () => {
      calls.push(['close']);
    },
  };
  const modules: Record<string, unknown> = {
    'react-native': { Platform: { OS: platform } },
    'expo-sqlite': {
      defaultDatabaseDirectory:
        platform === 'ios' ? '/Documents/SQLite' : '/data/user/0/app/files/SQLite',
      importDatabaseFromAssetAsync: async (...args: unknown[]) => {
        calls.push(['import', ...args]);
      },
      openDatabaseAsync: async (...args: unknown[]) => {
        calls.push(['open', ...args]);
        return database;
      },
      deleteDatabaseAsync: async (...args: unknown[]) => {
        calls.push(['delete', ...args]);
      },
      deserializeDatabaseAsync: async () => {
        calls.push(['deserialize']);
        return database;
      },
    },
    'expo-asset': {
      Asset: { fromModule: () => ({ downloadAsync: async () => ({ uri: '/bundle/source.db' }) }) },
    },
    'expo-file-system': { Paths: { cache: { uri: 'file:///Library/Caches/' } } },
  };
  const code = ts.transpileModule(
    readFileSync('src/services/storage/readOnlyAssetDatabase.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  const exports: { openReadOnlyAssetDatabase?: typeof openReadOnlyAssetDatabase } = {};
  vm.runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
  });
  return {
    calls,
    open: () =>
      exports.openReadOnlyAssetDatabase!({
        assetId: 7,
        name: 'reference-abc.db',
        expected: { source: 'bundled' },
      }),
  };
}

test('iOS reproducible database copies live under Library/Caches, outside user backups', async () => {
  const f = loader('ios');
  await f.open();
  assert.equal(
    f.calls.find(([kind]) => kind === 'import')?.[3],
    'file:///Library/Caches/read-only-content',
  );
  assert.equal(
    f.calls.find(([kind]) => kind === 'open')?.[3],
    'file:///Library/Caches/read-only-content',
  );
});

test('Android reference location still matches the narrow backup XML exclusion', async () => {
  const f = loader('android');
  await f.open();
  assert.equal(
    f.calls.find(([kind]) => kind === 'open')?.[3],
    '/data/user/0/app/files/SQLite/read-only-content',
  );
});

test('invalid metadata removes only the selected iOS reference copy after closing it', async () => {
  const f = loader('ios', false);
  await assert.rejects(f.open(), /metadata is invalid/);
  assert.deepEqual(f.calls.slice(-2), [
    ['close'],
    ['delete', 'reference-abc.db', 'file:///Library/Caches/read-only-content'],
  ]);
});

test('web reference loading stays in memory without native directory operations', async () => {
  const f = loader('web');
  await f.open();
  assert.equal(f.calls[0]?.[0], 'deserialize');
  assert.equal(
    f.calls.some(([kind]) => ['import', 'open', 'delete'].includes(String(kind))),
    false,
  );
});
