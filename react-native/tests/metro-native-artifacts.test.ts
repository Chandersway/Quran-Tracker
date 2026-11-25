import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

function blockList(root: string): RegExp[] {
  const module = { exports: {} as { resolver: { blockList: RegExp[] } } };
  vm.runInNewContext(readFileSync('metro.config.js', 'utf8'), {
    __dirname: root,
    module,
    require: (name: string) => {
      assert.equal(name, 'expo/metro-config');
      return {
        getDefaultConfig: () => ({
          resolver: { assetExts: [], blockList: /existing-rule/ },
          server: {},
        }),
      };
    },
  });
  return module.exports.resolver.blockList;
}

test('Metro ignores only generated Android dependency directories on Windows and POSIX', () => {
  for (const root of [
    'C:\\Work Space\\Quran.Tracker\\react-native',
    '/work space/Quran.Tracker/react-native',
  ]) {
    const patterns = blockList(root);
    const ignored = (relative: string, separator = '/') => {
      const fullPath = `${root}/${relative}`.replaceAll('\\', '/').replaceAll('/', separator);
      return patterns.some((pattern) => pattern.test(fullPath));
    };
    for (const separator of ['/', '\\']) {
      for (const packageName of ['expo-constants', '@react-native/example']) {
        for (const nativeProject of ['android', 'ReactAndroid']) {
          for (const generated of ['build', '.cxx', '.gradle']) {
            const directory = `node_modules/${packageName}/${nativeProject}/${generated}`;
            assert.equal(ignored(directory, separator), true, directory);
            assert.equal(
              ignored(`${directory}/generated/assets/contents.json`, separator),
              true,
              directory,
            );
            assert.equal(ignored(`${directory}-source/index.js`, separator), false, directory);
          }
          assert.equal(
            ignored(`node_modules/${packageName}/${nativeProject}/src/main/Native.kt`, separator),
            false,
          );
        }
        assert.equal(ignored(`node_modules/${packageName}/build/index.js`, separator), false);
        assert.equal(ignored(`node_modules/${packageName}/src/android.ts`, separator), false);
      }
    }
    assert.equal(
      patterns.some((pattern) => pattern.test('existing-rule')),
      true,
    );
    assert.equal(ignored('.tooling/diagnostic.log'), true);
    assert.equal(ignored('android/app/build/generated/contents.json'), true);
    assert.equal(ignored('src/features/quran/screens/ReaderScreen.tsx'), false);
  }
});

test('Windows drive-letter case does not reintroduce native generated directories', () => {
  const patterns = blockList('C:\\Work\\react-native');
  assert.equal(
    patterns.some((pattern) =>
      pattern.test(
        'c:/Work/react-native/node_modules/expo-constants/android/build/generated/assets',
      ),
    ),
    true,
  );
  assert.equal(
    patterns.some((pattern) =>
      pattern.test(
        'c:\\Work\\react-native\\node_modules\\@scope\\package\\ReactAndroid\\.cxx\\Debug',
      ),
    ),
    true,
  );
  assert.equal(
    patterns.some((pattern) =>
      pattern.test('c:/Work/react-native/node_modules/expo-constants/build/index.js'),
    ),
    false,
  );
});

test('installed Expo can compose the block list without mixed regular-expression flags', () => {
  const { composeMetroIgnorePatterns } = createRequire(import.meta.url)(
    '../node_modules/expo/node_modules/@expo/cli/build/src/utils/composeMetroIgnorePatterns.js',
  ) as { composeMetroIgnorePatterns: (patterns: RegExp[]) => RegExp };
  const composed = composeMetroIgnorePatterns(blockList('C:\\Work\\react-native'));
  assert.equal(
    composed.test(
      'c:/Work/react-native/node_modules/expo-constants/android/build/generated/assets',
    ),
    true,
  );
  assert.equal(
    composed.test('C:/Work/react-native/node_modules/expo-constants/build/index.js'),
    false,
  );
});

test('actual fallback watcher ignores native generated changes while retaining JavaScript package changes', async () => {
  const require = createRequire(import.meta.url);
  const { composeMetroIgnorePatterns } =
    require('../node_modules/expo/node_modules/@expo/cli/build/src/utils/composeMetroIgnorePatterns.js') as {
      composeMetroIgnorePatterns: (patterns: RegExp[]) => RegExp;
    };
  const { default: FallbackWatcher } =
    require('../node_modules/@expo/metro-file-map/build/watchers/FallbackWatcher.js') as {
      default: new (
        root: string,
        options: { ignored: RegExp },
      ) => {
        startWatching(): Promise<void>;
        stopWatching(): Promise<void>;
        onFileEvent(callback: (event: { relativePath: string }) => void): () => void;
        onError(callback: (error: Error) => void): () => void;
      };
    };
  const fixture = mkdtempSync(join(tmpdir(), 'f26-metro-watcher-'));
  const nativeFile = join(
    fixture,
    'node_modules/expo-constants/android/build/generated/assets/fixture.js',
  );
  const javaScriptFile = join(fixture, 'node_modules/expo-constants/build/index.js');
  for (const file of [nativeFile, javaScriptFile]) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, 'fixture1');
  }
  const watcher = new FallbackWatcher(fixture, {
    ignored: composeMetroIgnorePatterns(blockList(fixture)),
  });
  const events: string[] = [];
  const errors: Error[] = [];
  let changed: (() => void) | undefined;
  const observed = new Promise<void>((resolve) => {
    changed = resolve;
  });
  watcher.onFileEvent(({ relativePath }) => {
    const path = relativePath.replaceAll('\\', '/');
    events.push(path);
    if (path === 'node_modules/expo-constants/build/index.js') changed?.();
  });
  watcher.onError((error) => errors.push(error));
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    await watcher.startWatching();
    writeFileSync(nativeFile, 'fixture2');
    writeFileSync(javaScriptFile, 'fixture2');
    await Promise.race([
      observed,
      new Promise((_, reject) => {
        deadline = setTimeout(
          () => reject(new Error('JavaScript package change was not observed')),
          5000,
        );
      }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 250));
    assert.deepEqual(errors, []);
    assert.ok(events.includes('node_modules/expo-constants/build/index.js'));
    assert.equal(
      events.some((path) => path.includes('/android/build/')),
      false,
    );
  } finally {
    clearTimeout(deadline);
    await watcher.stopWatching();
    assert.equal(dirname(resolve(fixture)), resolve(tmpdir()));
    assert.ok(fixture.includes('f26-metro-watcher-'));
    rmSync(fixture, { recursive: true, force: true });
  }
});
