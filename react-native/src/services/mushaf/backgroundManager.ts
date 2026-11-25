import type { BackgroundMushafPort, BackgroundMushafTask } from './backgroundTypes';
import type { ActiveMushafDownload, MushafDownloadSnapshot } from './downloadManager';
import {
  installedMushaf,
  mushafOptions,
  type DownloadEdition,
  type MushafDownloadPort,
} from './library';

type Options = {
  now?: () => number;
  prepare?: () => Promise<void>;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
};
/** Observes persistent OS work. JavaScript timers measure UI status, never perform transfers. */
export function createBackgroundMushafManager(
  files: MushafDownloadPort,
  native: BackgroundMushafPort,
  options: Options = {},
) {
  let snapshot: MushafDownloadSnapshot = Object.freeze({
    active: null,
    lastTask: null,
    installed: Object.freeze({}),
    checking: true,
    error: null,
  });
  const listeners = new Set<() => void>();
  const now = options.now ?? Date.now;
  let ready = false,
    mutating = false,
    cancelling = false;
  let taskId: string | null = null;
  let work: Promise<void> = Promise.resolve();
  let refreshWork: Promise<void> | null = null;
  let polling: ReturnType<typeof setInterval> | null = null;
  let sample: { at: number; completed: number } | null = null;
  let lastAdvance = now();
  let terminalId: string | null = null;
  let revision = 0;
  let preparation: Promise<void> | null = null;
  const publish = (patch: Partial<MushafDownloadSnapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    listeners.forEach((listener) => listener());
  };
  const stopPoll = () => {
    if (polling !== null) (options.clearInterval ?? clearInterval)(polling);
    polling = null;
  };
  const ensurePoll = () => {
    if (polling === null)
      polling = (options.setInterval ?? setInterval)(() => {
        void refresh();
      }, 2000);
  };
  const installed = async () => {
    if (!preparation)
      preparation = (options.prepare?.() ?? Promise.resolve()).catch((error) => {
        preparation = null;
        throw error;
      });
    await preparation;
    const entries = await Promise.all(
      mushafOptions
        .filter((item) => item.id !== 'hafs')
        .map(
          async (item) =>
            [
              item.id,
              Object.freeze(await installedMushaf(item.id as DownloadEdition, files)),
            ] as const,
        ),
    );
    publish({ installed: Object.freeze(Object.fromEntries(entries)) });
  };
  const accept = async (task: BackgroundMushafTask | null) => {
    if (!task) {
      taskId = null;
      sample = null;
      publish({ active: null });
      stopPoll();
      return;
    }
    const changed = taskId !== task.id;
    taskId = task.id;
    if (['completed', 'cancelled', 'failed'].includes(task.status)) {
      stopPoll();
      sample = null;
      cancelling = false;
      if (terminalId !== task.id + task.status) {
        await installed();
        terminalId = task.id + task.status;
        publish({
          active: null,
          lastTask: Object.freeze({
            edition: task.edition,
            status: task.status as 'completed' | 'cancelled' | 'failed',
            ...(task.error ? { error: task.error } : {}),
          }),
        });
      } else if (snapshot.active) publish({ active: null });
      return;
    }
    const at = now();
    if (changed || !sample || task.completed < sample.completed) {
      sample = { at, completed: task.completed };
      lastAdvance = at;
    }
    const elapsed = (at - sample.at) / 1000;
    const rate = elapsed >= 1 ? Math.max(0, task.completed - sample.completed) / elapsed : 0;
    if (task.completed > (snapshot.active?.completed ?? task.completed)) lastAdvance = at;
    const stalled = task.waiting || at - lastAdvance >= 10000;
    const active: ActiveMushafDownload = Object.freeze({
      edition: task.edition,
      status: cancelling ? 'cancelling' : (task.status as 'checking' | 'downloading'),
      completed: task.completed,
      total: task.total,
      unit: task.unit,
      fraction: task.total && task.total > 0 ? Math.min(1, task.completed / task.total) : null,
      remainingSeconds:
        !stalled && rate > 0 && task.total !== null
          ? Math.ceil(Math.max(0, task.total - task.completed) / rate)
          : null,
      stalled,
    });
    publish({ active, lastTask: null });
    ensurePoll();
  };
  function refresh(): Promise<void> {
    if (refreshWork) return refreshWork;
    const request = revision;
    refreshWork = Promise.resolve().then(async () => {
      try {
        const state = await native.inspect();
        if (request !== revision) return;
        await accept(state);
        if (!ready) await installed();
        ready = true;
        publish({ error: null });
      } catch (error) {
        publish({ error: error instanceof Error ? error.message : 'Could not restore downloads' });
      } finally {
        refreshWork = null;
        publish({ checking: false });
      }
    });
    publish({ checking: true });
    return refreshWork;
  }
  function start(edition: DownloadEdition): boolean {
    if (!ready || mutating || snapshot.active) return false;
    revision++;
    mutating = true;
    cancelling = false;
    sample = null;
    const previousTaskId = taskId;
    taskId = null;
    publish({
      active: Object.freeze({
        edition,
        status: 'checking',
        completed: 0,
        total: null,
        unit: 'pages',
        fraction: null,
        remainingSeconds: null,
        stalled: false,
      }),
      lastTask: null,
      error: null,
    });
    work = (async () => {
      try {
        await accept(await native.start(edition));
      } catch (error) {
        // A bridge response can fail after the OS accepted work. Restore ownership
        // before allowing retry, rather than submitting a duplicate native job.
        try {
          const recovered = await native.inspect();
          if (
            recovered &&
            (['checking', 'downloading'].includes(recovered.status) ||
              (recovered.status === 'completed' &&
                recovered.id !== previousTaskId &&
                recovered.edition === edition))
          ) {
            await accept(recovered);
          } else {
            publish({
              active: null,
              lastTask: Object.freeze({
                edition,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Download failed',
              }),
            });
          }
        } catch {
          publish({
            error:
              error instanceof Error
                ? error.message
                : 'Could not confirm native download ownership',
          });
          ensurePoll();
        }
      } finally {
        mutating = false;
        if (cancelling && taskId) await cancelCurrent(taskId);
      }
    })();
    return true;
  }
  async function cancelCurrent(id: string) {
    revision++;
    mutating = true;
    try {
      await accept(await native.cancel(id));
    } catch (error) {
      cancelling = false;
      publish({ error: error instanceof Error ? error.message : 'Could not cancel download' });
      ensurePoll();
    } finally {
      mutating = false;
    }
  }
  // Module-level owner recovers OS work even before a library screen is opened.
  native.onResume?.(() => {
    sample = null;
    lastAdvance = now();
    void refresh();
  });
  void refresh();
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
      if (!snapshot.active) return;
      cancelling = true;
      publish({
        active: Object.freeze({ ...snapshot.active, status: 'cancelling', remainingSeconds: null }),
      });
      if (!mutating && taskId) work = cancelCurrent(taskId);
    },
    retry: () => (snapshot.lastTask ? start(snapshot.lastTask.edition) : false),
    refresh,
    whenSettled: async () => {
      await work;
      if (refreshWork) await refreshWork;
      if (!snapshot.active && !mutating) return;
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!snapshot.active && !mutating) {
            listeners.delete(check);
            resolve();
          }
        };
        listeners.add(check);
        check();
      });
    },
  };
}
