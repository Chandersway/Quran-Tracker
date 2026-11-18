import {
  decodeReadingPlan,
  defaultReadingPlan,
  validateReadingPlan,
  type IndependentReadingPlan,
} from '../../domain/readingPlan';

export const READING_PLAN_KEY = 'wirdna:independent-reading-plan:v1';
type StoragePort = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};
export type ReadingPlanSnapshot = { plan: IndependentReadingPlan; ready: boolean; error: boolean };

/** A shared sidecar, matching the source's independent_reading_plan preferences. */
export function createReadingPlanRepository(storage: StoragePort) {
  let snapshot: ReadingPlanSnapshot = { plan: defaultReadingPlan, ready: false, error: false };
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  function publish(next: ReadingPlanSnapshot) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }
  return {
    snapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load(legacy?: unknown, retry = false): Promise<void> {
      if (snapshot.ready && !retry) return Promise.resolve();
      if (loading) return loading;
      loading = (async () => {
        try {
          const raw = await storage.getItem(READING_PLAN_KEY);
          const plan = raw
            ? decodeReadingPlan(JSON.parse(raw))
            : legacy
              ? decodeReadingPlan(legacy)
              : { ...defaultReadingPlan };
          // Legacy import is committed before publishing success. Corrupt or
          // unreadable state is never overwritten with defaults.
          if (!raw && legacy) await storage.setItem(READING_PLAN_KEY, JSON.stringify(plan));
          publish({ plan, ready: true, error: false });
        } catch {
          publish({ ...snapshot, ready: false, error: true });
        } finally {
          loading = null;
        }
      })();
      return loading;
    },
    async save(plan: IndependentReadingPlan): Promise<void> {
      if (!snapshot.ready) throw new Error('Reading plan storage is not ready');
      validateReadingPlan(plan);
      // Preserve source SharedPreferences.commit semantics: failed persistence
      // must not advance the progress shown elsewhere in the application.
      await storage.setItem(READING_PLAN_KEY, JSON.stringify(plan));
      publish({ plan: { ...plan }, ready: true, error: false });
    },
  };
}
