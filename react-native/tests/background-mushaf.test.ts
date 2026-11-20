import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { createMushafDownloadManager } from '../src/services/mushaf/downloadManager';
import type {
  BackgroundMushafPort,
  BackgroundMushafTask,
} from '../src/services/mushaf/backgroundTypes';
import { mushafOptions, type MushafDownloadPort } from '../src/services/mushaf/library';

const require = createRequire(import.meta.url);
const plugin = require('../plugins/withBackgroundMushafDownloads');
const flush = () => new Promise<void>((done) => setImmediate(done));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function task(patch: Partial<BackgroundMushafTask> = {}): BackgroundMushafTask {
  return {
    id: 'native-job-1',
    edition: 'hafs_maknoon',
    status: 'downloading',
    completed: 600,
    total: 604,
    unit: 'pages',
    waiting: false,
    ...patch,
  };
}
function fixture(initial: BackgroundMushafTask | null = null) {
  let current = initial,
    time = 0,
    resume = () => {};
  const callbacks = new Set<() => void>();
  const cancelled: string[] = [];
  const starts: string[] = [];
  const native: BackgroundMushafPort = {
    inspect: async () => current,
    start: async (edition) => {
      starts.push(edition);
      return (current = task({ edition, completed: 0, id: 'new-job' }));
    },
    cancel: async (id) => {
      cancelled.push(id);
      if (current?.id === id) current = { ...current, status: 'cancelled' };
      return current;
    },
    onResume(callback) {
      resume = callback;
      return () => {
        resume = () => {};
      };
    },
  };
  const files: MushafDownloadPort = {
    has: async () => current?.status === 'completed',
    fetch: async () => assert.fail('JS must never transfer persistent native work'),
  };
  const manager = createMushafDownloadManager(files, {
    background: native,
    now: () => time,
    setInterval: ((callback: () => void) => {
      callbacks.add(callback);
      return callback;
    }) as unknown as typeof setInterval,
    clearInterval: ((callback: () => void) => {
      callbacks.delete(callback);
    }) as unknown as typeof clearInterval,
  });
  return {
    manager,
    native,
    cancelled,
    starts,
    current: () => current,
    set: (value: BackgroundMushafTask | null) => {
      current = value;
    },
    advance: (ms: number) => {
      time += ms;
      callbacks.forEach((callback) => callback());
    },
    resume: () => resume(),
    polls: () => callbacks.size,
  };
}

test('restores native ownership before allowing a second edition; observer removal cannot cancel OS work', async () => {
  const f = fixture(task());
  assert.equal(f.manager.start('hafs_indopak_15'), false, 'restoration owns the initial guard');
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().active?.completed, 600);
  assert.equal(f.manager.getSnapshot().active?.remainingSeconds, null);
  const stop = f.manager.subscribe(() => {});
  stop();
  assert.equal(f.manager.start('hafs_madina_pdf'), false);
  assert.equal(f.current()?.status, 'downloading');
  assert.deepEqual(f.cancelled, []);
  assert.deepEqual(f.starts, []);
  f.manager.cancel();
  await f.manager.whenSettled();
  assert.deepEqual(f.cancelled, ['native-job-1']);
  assert.equal(f.polls(), 0);
});

test('reopened/foregrounded ETA samples only new progress; waiting state suppresses estimates', async () => {
  const f = fixture(task());
  await f.manager.refresh();
  f.set(task({ completed: 602 }));
  f.advance(2000);
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().active?.remainingSeconds, 2);
  f.resume();
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().active?.remainingSeconds, null);
  f.set(task({ completed: 603, waiting: true }));
  f.advance(2000);
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().active?.stalled, true);
  assert.equal(f.manager.getSnapshot().active?.remainingSeconds, null);
  f.manager.cancel();
  await f.manager.whenSettled();
});

test('background completion updates installation and stable lastTask without restarting completed work', async () => {
  const f = fixture(task());
  await f.manager.refresh();
  const settled = f.manager.whenSettled();
  f.set(task({ status: 'completed', completed: 604 }));
  await f.manager.refresh();
  await settled;
  assert.equal(f.manager.getSnapshot().active, null);
  assert.equal(f.manager.getSnapshot().installed.hafs_maknoon?.ready, true);
  const last = f.manager.getSnapshot().lastTask;
  assert.equal(last?.status, 'completed');
  assert.equal(f.polls(), 0);
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().lastTask, last);
  assert.deepEqual(f.starts, []);
});

test('cancel during native enqueue waits for the new native ID and cannot cancel a previous job', async () => {
  const f = fixture();
  await f.manager.refresh();
  const enqueued = deferred<BackgroundMushafTask>();
  f.native.start = () => enqueued.promise;
  assert.equal(f.manager.start('hafs_maknoon'), true);
  f.manager.cancel();
  assert.equal(f.manager.getSnapshot().active?.status, 'cancelling');
  f.set(task({ id: 'enqueuing-job', completed: 0 }));
  enqueued.resolve(f.current()!);
  await f.manager.whenSettled();
  assert.deepEqual(f.cancelled, ['enqueuing-job']);
  assert.equal(f.manager.getSnapshot().lastTask?.status, 'cancelled');
  assert.equal(f.polls(), 0);
});

test('a stale inspection cannot replace a newly started job or cancel a replacement owner', async () => {
  const f = fixture();
  await f.manager.refresh();
  const old = deferred<BackgroundMushafTask | null>();
  f.native.inspect = () => old.promise;
  const inspecting = f.manager.refresh();
  await flush();
  f.manager.start('hafs_maknoon');
  await flush();
  old.resolve(null);
  await inspecting;
  assert.equal(f.manager.getSnapshot().active?.edition, 'hafs_maknoon');
  f.set(task({ id: 'replacement-job', edition: 'warsh_maknoon' }));
  f.manager.cancel();
  await flush();
  assert.deepEqual(f.cancelled, ['new-job']);
  assert.equal(f.manager.getSnapshot().active?.edition, 'warsh_maknoon');
  f.native.inspect = async () => f.current();
  f.manager.cancel();
  await f.manager.whenSettled();
  assert.deepEqual(f.cancelled, ['new-job', 'replacement-job']);
});

test('failed native task remains retryable; transient inspect failure retains current ownership', async () => {
  const f = fixture(task());
  await f.manager.refresh();
  f.native.inspect = async () => {
    throw new Error('Native service temporarily unavailable');
  };
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().active?.completed, 600);
  assert.ok(f.manager.getSnapshot().error);
  assert.equal(f.manager.start('hafs_madina_pdf'), false);
  f.set(task({ status: 'failed', error: 'No storage' }));
  f.native.inspect = async () => f.current();
  await f.manager.refresh();
  assert.equal(f.manager.getSnapshot().lastTask?.error, 'No storage');
  assert.equal(f.manager.retry(), true);
  await flush();
  assert.deepEqual(f.starts, ['hafs_maknoon']);
  f.manager.cancel();
  await f.manager.whenSettled();
});

test('native catalog exactly matches every downloadable source, format and page count', () => {
  const catalog = JSON.parse(
    readFileSync(resolve('plugins/backgroundMushafDownloads/catalog.json'), 'utf8'),
  );
  assert.equal(Object.keys(catalog).length, 4);
  for (const option of mushafOptions.filter((option) => option.type !== 'bundled'))
    assert.deepEqual(catalog[option.id], {
      type: option.type,
      pages: option.pages ?? 1,
      url: option.url,
    });
});

test('a lost start acknowledgment restores accepted OS ownership before retry can duplicate work', async () => {
  const f = fixture();
  await f.manager.refresh();
  f.native.start = async () => {
    f.set(task({ id: 'accepted-with-lost-response', completed: 0 }));
    throw new Error('Bridge response lost');
  };
  assert.equal(f.manager.start('hafs_maknoon'), true);
  await flush();
  assert.equal(f.manager.getSnapshot().active?.edition, 'hafs_maknoon');
  assert.equal(f.manager.getSnapshot().lastTask, null);
  assert.equal(f.manager.start('hafs_maknoon'), false);
  f.manager.cancel();
  await f.manager.whenSettled();
  assert.deepEqual(f.cancelled, ['accepted-with-lost-response']);
});

test('Android manifest/application registration is idempotent and preserves existing components', () => {
  const manifest = {
    manifest: { application: [{ $: {}, service: [{ $: { 'android:name': 'ExistingService' } }] }] },
  };
  plugin.configureManifest(manifest);
  const first = JSON.stringify(manifest);
  plugin.configureManifest(manifest);
  assert.equal(JSON.stringify(manifest), first);
  assert.match(first, /BIND_JOB_SERVICE/);
  assert.match(first, /RECEIVE_BOOT_COMPLETED/);
  assert.match(first, /DOWNLOAD_COMPLETE/);
  assert.match(first, /ExistingService/);
  assert.doesNotMatch(
    first,
    /DOWNLOAD_WITHOUT_NOTIFICATION|WRITE_EXTERNAL_STORAGE|FOREGROUND_SERVICE_DATA_SYNC/,
  );
  const source =
    'class MainApplication {\n // add(MyReactNativePackage())\n add(ExistingPackage())\n}';
  const patched = plugin.patchApplication(source);
  assert.equal(plugin.patchApplication(patched), patched);
  assert.match(patched, /ExistingPackage/);
  assert.throws(() => plugin.patchApplication('unknown template'));
});

test('iOS real Expo template receives native source, catalog, zlib and lifecycle once', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'mushaf-native-config-'));
  t.after(() => {
    assert.ok(
      resolve(directory).startsWith(resolve(tmpdir()) + '\\') ||
        resolve(directory).startsWith(resolve(tmpdir()) + '/'),
    );
    assert.ok(basename(directory).startsWith('mushaf-native-config-'));
    rmSync(directory, { recursive: true, force: true });
  });
  const ios = join(directory, 'ios');
  mkdirSync(join(ios, 'HelloWorld'), { recursive: true });
  mkdirSync(join(ios, 'HelloWorld.xcodeproj'));
  const template = require.resolve('expo/template.tgz');
  for (const name of [
    'HelloWorld.xcodeproj/project.pbxproj',
    'HelloWorld/HelloWorld-Bridging-Header.h',
  ]) {
    const bytes = execFileSync('tar', ['-xOf', template, 'package/ios/' + name]);
    writeFileSync(join(ios, name), bytes);
  }
  const { IOSConfig } = require('@expo/config-plugins');
  const project = IOSConfig.XcodeUtils.getPbxproj(directory);
  plugin.configureIos(project, ios, 'HelloWorld');
  const once = project.writeSync();
  plugin.configureIos(project, ios, 'HelloWorld');
  assert.equal(project.writeSync(), once);
  assert.match(once, /BackgroundMushafDownloads.m in Sources/);
  assert.match(once, /mushaf_download_catalog.json in Resources/);
  assert.match(once, /libz.tbd/);
  const header = readFileSync(join(ios, 'HelloWorld/HelloWorld-Bridging-Header.h'), 'utf8');
  assert.equal(header.match(/BackgroundMushafDownloads.h/g)?.length, 1);
  const app = execFileSync('tar', ['-xOf', template, 'package/ios/HelloWorld/AppDelegate.swift'], {
    encoding: 'utf8',
  });
  const patched = plugin.patchDelegate(app);
  assert.equal(plugin.patchDelegate(patched), patched);
  assert.match(patched, /BackgroundMushafDownloads.handleEvents/);
  assert.match(patched, /super.application\(application, handleEventsForBackgroundURLSession/);
});
