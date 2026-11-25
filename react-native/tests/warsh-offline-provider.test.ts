import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import * as warsh from '../src/domain/selectableWarsh';

function loadModule(file: string, modules: Record<string, unknown>, fetch: unknown) {
  const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    AbortController,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    fetch,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  return exports;
}

test('offline Warsh loads exact local pages and its own basmallah without a network connection', async () => {
  const reads: number[] = [];
  const network = () => {
    throw new Error('No network permitted');
  };
  const offline = loadModule(
    'src/services/mushaf/warshOffline.ts',
    {
      '../../content/bundledAsset': {
        readBundledJson: async (id: number) => {
          reads.push(id);
          return JSON.parse(readFileSync(`assets/warsh-unicode/page-${id}.quran`, 'utf8'));
        },
      },
      '../../content/generated/warsh-page-assets': {
        warshPageAssets: Object.fromEntries(
          Array.from({ length: 604 }, (_, i) => [i + 1, () => i + 1]),
        ),
      },
      '../../domain/selectableWarsh': warsh,
    },
    network,
  );
  const provider = loadModule(
    'src/services/mushaf/warshMushaf.ts',
    {
      '../../domain/selectableWarsh': warsh,
      './warshOffline': offline,
    },
    network,
  );
  const page = (await provider.loadWarshMushafPage!(2)) as ReturnType<
    typeof warsh.buildSelectableWarshPage
  >;
  assert.equal(page.edition, 'warsh_unicode');
  assert.equal(page.lines[1]!.kind, 'basmallah');
  assert.deepEqual(reads, [2, 1]);
  await provider.loadWarshMushafPage!(158);
  assert.deepEqual(reads, [2, 1, 158]);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(provider.loadWarshMushafPage!(3, controller.signal), { name: 'AbortError' });
  assert.deepEqual(reads, [2, 1, 158], 'cancellation never starts a recovery network request');
});
