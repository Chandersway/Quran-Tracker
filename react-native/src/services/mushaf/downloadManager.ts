import {
  downloadMushaf,
  installedMushaf,
  mushafOptions,
  optionFor,
  type DownloadEdition,
  type MushafDownloadPort,
  type MushafTransferProgress,
} from './library';
import { createBackgroundMushafManager } from './backgroundManager';
import type { BackgroundMushafPort } from './backgroundTypes';

export type InstalledMushaf = Readonly<{ ready: boolean; count: number; total: number }>;
export type ActiveMushafDownload = Readonly<{
  edition: DownloadEdition;
  status: 'checking' | 'downloading' | 'cancelling';
  completed: number;
  total: number | null;
  unit: 'pages' | 'bytes';
  fraction: number | null;
  remainingSeconds: number | null;
  stalled: boolean;
}>;
export type MushafDownloadSnapshot = Readonly<{
  active: ActiveMushafDownload | null;
  lastTask: Readonly<{
    edition: DownloadEdition;
    status: 'completed' | 'cancelled' | 'failed';
    error?: string;
  }> | null;
  installed: Readonly<Partial<Record<DownloadEdition, InstalledMushaf>>>;
  checking: boolean;
  error: string | null;
}>;
type Options = {
  background?: BackgroundMushafPort;
  now?: () => number;
  prepare?: () => Promise<void>;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
};

/** A single app-runtime owner. Observers never acquire cancellation ownership. */
export function createMushafDownloadManager(port: MushafDownloadPort, options: Options = {}) {
  if (options.background) return createBackgroundMushafManager(port, options.background, options);
  const now = options.now ?? Date.now;
  const listeners = new Set<() => void>();
  let snapshot: MushafDownloadSnapshot = Object.freeze({
    active: null,
    lastTask: null,
    installed: Object.freeze({}),
    checking: false,
    error: null,
  });
  let controller: AbortController | null = null;
  let preparation: Promise<void> | null = null;
  let refreshWork: Promise<void> | null = null;
  let task: Promise<void> = Promise.resolve();
  function publish(patch: Partial<MushafDownloadSnapshot>) {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    listeners.forEach((listener) => listener());
  }
  function prepare() {
    if (!preparation)
      preparation = (options.prepare?.() ?? Promise.resolve()).catch((error) => {
        preparation = null;
        throw error;
      });
    return preparation;
  }
  function refresh(): Promise<void> {
    if (refreshWork) return refreshWork;
    // Install the coalescing guard before notifying synchronous subscribers.
    const work = Promise.resolve().then(async () => {
      try {
        await prepare();
        const entries = await Promise.all(
          mushafOptions
            .filter((item) => item.id !== 'hafs')
            .map(async (item) => {
              const id = item.id as DownloadEdition;
              return [id, Object.freeze(await installedMushaf(id, port))] as const;
            }),
        );
        publish({ installed: Object.freeze(Object.fromEntries(entries)), error: null });
      } catch (error) {
        publish({
          error: error instanceof Error ? error.message : 'Could not check downloaded Mushafs',
        });
      } finally {
        refreshWork = null;
        publish({ checking: false });
      }
    });
    refreshWork = work;
    publish({ checking: true });
    return work;
  }
  function start(edition: DownloadEdition): boolean {
    if (controller) return false;
    const abort = new AbortController();
    controller = abort;
    const pdf = optionFor(edition).type === 'pdf';
    let active: ActiveMushafDownload = Object.freeze({
      edition,
      status: 'checking',
      completed: 0,
      total: pdf ? null : (optionFor(edition).pages ?? null),
      unit: pdf ? 'bytes' : 'pages',
      fraction: null,
      remainingSeconds: null,
      stalled: false,
    });
    publish({ active, lastTask: null, error: null });
    let previousWork = 0;
    let lastAdvance = now();
    let startedAt: number | null = null;
    let rate: number | null = null;
    const samples: Array<{ at: number; work: number }> = [];
    const update = (progress: MushafTransferProgress) => {
      if (abort.signal.aborted) return;
      const at = now();
      if (startedAt === null) {
        startedAt = at;
        lastAdvance = at;
        samples.push({ at, work: 0 });
      }
      if (progress.transferred > previousWork) {
        lastAdvance = at;
        previousWork = progress.transferred;
      }
      samples.push({ at, work: progress.transferred });
      while (samples.length > 2 && samples[1]!.at < at - 15000) samples.shift();
      const first = samples[0]!;
      const elapsed = (at - first.at) / 1000;
      rate =
        elapsed >= 1 && progress.transferred > first.work
          ? (progress.transferred - first.work) / elapsed
          : null;
      const remaining =
        progress.total === null ? null : Math.max(0, progress.total - progress.completed);
      active = Object.freeze({
        edition,
        status: 'downloading',
        completed: progress.completed,
        total: progress.total,
        unit: progress.unit,
        fraction: progress.total ? Math.min(1, progress.completed / progress.total) : null,
        remainingSeconds: rate && remaining !== null ? Math.ceil(remaining / rate) : null,
        stalled: false,
      });
      publish({ active });
    };
    const interval = (options.setInterval ?? globalThis.setInterval)(() => {
      if (abort.signal.aborted || startedAt === null) return;
      const stalled = now() - lastAdvance >= 10000;
      if (stalled && !active.stalled) {
        active = Object.freeze({ ...active, stalled: true, remainingSeconds: null });
        publish({ active });
      }
    }, 1000);
    task = (async () => {
      try {
        await prepare();
        await downloadMushaf(edition, port, abort.signal, () => undefined, update);
        publish({ lastTask: Object.freeze({ edition, status: 'completed' }) });
      } catch (error) {
        publish({
          lastTask: Object.freeze(
            abort.signal.aborted
              ? { edition, status: 'cancelled' }
              : {
                  edition,
                  status: 'failed',
                  error: error instanceof Error ? error.message : 'Download failed',
                },
          ),
        });
      } finally {
        (options.clearInterval ?? globalThis.clearInterval)(interval);
        controller = null;
        publish({ active: null });
        if (refreshWork) await refreshWork;
        await refresh();
      }
    })();
    return true;
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    start,
    cancel() {
      if (!controller || !snapshot.active) return;
      controller.abort();
      publish({
        active: Object.freeze({ ...snapshot.active, status: 'cancelling', remainingSeconds: null }),
      });
    },
    retry() {
      const previous = snapshot.lastTask;
      return previous ? start(previous.edition) : false;
    },
    refresh,
    /** Await settlement in tests or a coordinator; UI never needs to own this promise. */
    whenSettled: () => task,
  };
}
