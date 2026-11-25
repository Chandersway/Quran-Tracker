/**
 * Serial, coalescing snapshot persistence. A save resolves only after a write
 * containing that snapshot (or a newer complete snapshot) succeeds. Callers
 * retain optimistic state after a failure and can retry the same operation.
 */
export function createSnapshotWriter<T>(
  write: (snapshot: T) => Promise<unknown>,
  onResult: (error: Error | null) => void = () => {},
) {
  type Waiter = { resolve: () => void; reject: (error: Error) => void };
  let pending: { snapshot: T; waiters: Waiter[] } | undefined;
  let running = false;

  async function drain() {
    while (pending) {
      const batch = pending;
      pending = undefined;
      try {
        await write(batch.snapshot);
        onResult(null);
        batch.waiters.forEach(({ resolve }) => resolve());
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error('Local storage write failed.');
        onResult(error);
        batch.waiters.forEach(({ reject }) => reject(error));
      }
    }
    running = false;
  }

  return {
    save(snapshot: T): Promise<void> {
      const promise = new Promise<void>((resolve, reject) => {
        if (pending) {
          pending.snapshot = snapshot;
          pending.waiters.push({ resolve, reject });
        } else pending = { snapshot, waiters: [{ resolve, reject }] };
      });
      if (!running) {
        running = true;
        queueMicrotask(() => void drain());
      }
      return promise;
    },
  };
}
