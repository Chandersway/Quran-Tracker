import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createBackgroundMushafManager } from '../src/services/mushaf/backgroundManager';
import type { BackgroundMushafTask } from '../src/services/mushaf/backgroundTypes';
import { mushafOptions } from '../src/services/mushaf/library';
import nativeCatalog from '../plugins/backgroundMushafDownloads/catalog.json';

const require = createRequire(import.meta.url);
const plugin = require('../plugins/withBackgroundMushafDownloads.js') as {
  patchApplication(source: string): string;
  patchDelegate(source: string): string;
  configureManifest(manifest: object): {
    manifest: {
      'uses-permission': { $: Record<string, string> }[];
      application: {
        receiver: { $: Record<string, string> }[];
        service: { $: Record<string, string> }[];
      }[];
    };
  };
};

test('background plugin registration is idempotent and preserves existing lifecycle integrations', () => {
  const application = 'class MainApplication {\n // add(MyReactNativePackage())\n}';
  const first = plugin.patchApplication(application);
  assert.equal(plugin.patchApplication(first), first);
  assert.equal((first.match(/add\(BackgroundMushafDownloadsPackage\(\)\)/g) ?? []).length, 1);
  assert.throws(() => plugin.patchApplication('class MainApplication {}'), /Could not register/);
  const delegate = 'public class AppDelegate: ExpoAppDelegate {\n}';
  const patched = plugin.patchDelegate(delegate);
  assert.equal(plugin.patchDelegate(patched), patched);
  assert.match(
    patched,
    /super\.application\(application, handleEventsForBackgroundURLSession: identifier/,
  );
  assert.throws(
    () =>
      plugin.patchDelegate('class AppDelegate { func handleEventsForBackgroundURLSession() {} }'),
    /explicit integration/,
  );
  const manifest = {
    manifest: {
      application: [{}],
      'uses-permission': [{ $: { 'android:name': 'android.permission.INTERNET' } }],
    },
  };
  plugin.configureManifest(manifest);
  const result = plugin.configureManifest(manifest).manifest;
  assert.equal(
    result['uses-permission'].filter(
      (item) => item.$['android:name'] === 'android.permission.INTERNET',
    ).length,
    1,
  );
  assert.equal(result.application[0]!.receiver.length, 1);
  assert.equal(result.application[0]!.service.length, 1);
  assert.equal(
    result.application[0]!.service[0]!.$['android:permission'],
    'android.permission.BIND_JOB_SERVICE',
  );
});

test('both native catalogs offer precisely the existing sources and do not expose arbitrary URLs or destinations', () => {
  const options = mushafOptions.filter((item) => item.type !== 'bundled');
  assert.deepEqual(Object.keys(nativeCatalog).sort(), options.map((item) => item.id).sort());
  for (const option of options) {
    const native = nativeCatalog[option.id as keyof typeof nativeCatalog];
    assert.equal(native.url, option.url);
    assert.equal(native.type, option.type);
    assert.equal(native.pages, option.type === 'pdf' ? 1 : option.pages);
    assert.equal(new URL(native.url).protocol, 'https:');
  }
  const bridge = readFileSync('src/services/mushaf/backgroundTypes.ts', 'utf8');
  assert.match(bridge, /start\(edition: DownloadEdition\)/);
  assert.doesNotMatch(bridge, /start\([^)]*(url|path|destination)/i);
});

const task = (patch: Partial<BackgroundMushafTask> = {}): BackgroundMushafTask => ({
  id: 'cbd7b243-2dde-46ef-8f70-98cefcc38caf',
  edition: 'warsh_maknoon',
  status: 'downloading',
  completed: 10,
  total: 604,
  unit: 'pages',
  waiting: false,
  ...patch,
});

test('a new JavaScript owner restores persistent native work and refreshes installation after completion', async () => {
  let current: BackgroundMushafTask | null = task();
  let installed = false,
    fetches = 0;
  let resume: (() => void) | undefined;
  const polls: (() => void)[] = [];
  const manager = createBackgroundMushafManager(
    {
      has: async (edition) => installed && edition === 'warsh_maknoon',
      fetch: async () => {
        fetches++;
        throw new Error('Transfers must remain native');
      },
    },
    {
      inspect: async () => current,
      start: async () => {
        throw new Error('Existing work must not restart');
      },
      cancel: async () => current,
      onResume: (listener) => {
        resume = listener;
        return () => undefined;
      },
    },
    {
      setInterval: ((callback: () => void) => {
        polls.push(callback);
        return 1;
      }) as unknown as typeof setInterval,
      clearInterval: (() => undefined) as typeof clearInterval,
    },
  );
  await manager.refresh();
  assert.equal(manager.getSnapshot().active?.completed, 10);
  assert.equal(manager.start('hafs_maknoon'), false);
  assert.equal(polls.length, 1);
  installed = true;
  current = task({ status: 'completed', completed: 604 });
  resume!();
  await manager.refresh();
  assert.equal(manager.getSnapshot().active, null);
  assert.equal(manager.getSnapshot().lastTask?.status, 'completed');
  assert.equal(manager.getSnapshot().installed.warsh_maknoon?.ready, true);
  assert.equal(fetches, 0);
});

test('cancellation requested while native start is pending cancels the newly returned task exactly once', async () => {
  let resolveStart: (value: BackgroundMushafTask) => void = () => undefined;
  const starting = new Promise<BackgroundMushafTask>((resolve) => {
    resolveStart = resolve;
  });
  const cancelled: string[] = [];
  const manager = createBackgroundMushafManager(
    {
      has: async () => false,
      fetch: async () => {
        throw new Error('No JS transfer');
      },
    },
    {
      inspect: async () => null,
      start: async () => starting,
      cancel: async (id) => {
        cancelled.push(id);
        return task({ id, status: 'cancelled' });
      },
    },
    {
      setInterval: (() => 1) as unknown as typeof setInterval,
      clearInterval: (() => undefined) as typeof clearInterval,
    },
  );
  await manager.refresh();
  assert.equal(manager.start('warsh_maknoon'), true);
  manager.cancel();
  assert.equal(manager.getSnapshot().active?.status, 'cancelling');
  resolveStart(task());
  await manager.whenSettled();
  assert.deepEqual(cancelled, [task().id]);
  assert.equal(manager.getSnapshot().active, null);
  assert.equal(manager.getSnapshot().lastTask?.status, 'cancelled');
});
