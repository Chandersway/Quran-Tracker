import assert from 'node:assert/strict';
import {
  readFileSync,
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
  renameSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import ts from 'typescript';
import * as catalog from '../../src/services/audio/audio-catalog';
import * as downloads from '../../src/services/audio/audioDownload';
import type { AudioService } from '../../src/services/backend/types';

/** Execute the real service with disk-backed Expo File equivalents, including move's URI mutation. */
export function audioServiceHarness({
  download,
  fetcher = fetch,
  catalogRows = [],
  baseUrl,
}: {
  download: (url: string, signal?: AbortSignal) => Promise<Uint8Array>;
  fetcher?: typeof fetch;
  catalogRows?: unknown[];
  baseUrl?: string;
}) {
  const root = mkdtempSync(join(tmpdir(), 'quran-audio-'));
  const path = (parts: Array<string | { uri: string }>) =>
    join(...parts.map((part) => (typeof part === 'string' ? part : part.uri)));
  class Directory {
    uri: string;
    constructor(...parts: Array<string | { uri: string }>) {
      this.uri = path(parts);
    }
    create() {
      mkdirSync(this.uri, { recursive: true });
    }
  }
  class File {
    uri: string;
    constructor(...parts: Array<string | { uri: string }>) {
      this.uri = path(parts);
    }
    get exists() {
      return existsSync(this.uri);
    }
    get size() {
      return this.exists ? statSync(this.uri).size : 0;
    }
    get name() {
      return basename(this.uri);
    }
    get parentDirectory() {
      return new Directory(dirname(this.uri));
    }
    create() {
      writeFileSync(this.uri, '');
    }
    delete() {
      unlinkSync(this.uri);
    }
    async move(destination: File) {
      renameSync(this.uri, destination.uri);
      this.uri = destination.uri;
    }
    async text() {
      return readFileSync(this.uri, 'utf8');
    }
    async write(value: string) {
      writeFileSync(this.uri, value);
    }
    open() {
      return {
        readBytesSync: (count: number) => new Uint8Array(readFileSync(this.uri).subarray(0, count)),
        readBytes: async (count: number) =>
          new Uint8Array(readFileSync(this.uri).subarray(0, count)),
        close() {},
      };
    }
    static async downloadFileAsync(url: string, target: File, options: { signal?: AbortSignal }) {
      writeFileSync(target.uri, await download(url, options.signal));
      return target;
    }
  }
  const modules: Record<string, unknown> = {
    'expo-file-system': { File, Directory, Paths: { document: root } },
    '../../content/audioCatalog': { loadAudioCatalogAsset: (surah: number) => surah },
    '../../content/bundledAsset': { readBundledJson: async () => catalogRows },
    './audio-catalog': catalog,
    './audioDownload': downloads,
  };
  const exports: { createAudioService?: (base?: string) => AudioService } = {};
  const code = ts.transpileModule(readFileSync('src/services/audio/audio.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    fetch: fetcher,
    AbortController,
    setTimeout,
    clearTimeout,
    require(name: string) {
      assert.ok(name in modules, `Unexpected audio service module ${name}`);
      return modules[name];
    },
  });
  return {
    service: exports.createAudioService!(baseUrl),
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
