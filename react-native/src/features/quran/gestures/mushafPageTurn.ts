/** Keep the pressed virtual Text mounted until React Native has dispatched its release/cancel. */
export function createReleasedMushafTurn(onTurn: (direction: 1 | -1) => void) {
  let active = true;
  let released = false;
  let pending: 1 | -1 | null = null;
  let generation = 0;
  let queued = false;
  let completed = false;
  function flush() {
    if (!active || !released || pending === null || queued) return;
    queued = true;
    const requestGeneration = generation;
    queueMicrotask(() => {
      if (!active || requestGeneration !== generation) return;
      queued = false;
      if (!released || pending === null) return;
      const direction = pending;
      pending = null;
      completed = true;
      onTurn(direction);
    });
  }
  return {
    begin() {
      generation++;
      released = false;
      pending = null;
      queued = false;
      completed = false;
    },
    request(direction: 1 | -1) {
      if (completed) return;
      pending = direction;
      flush();
    },
    release() {
      released = true;
      flush();
    },
    dispose() {
      active = false;
      generation++;
      pending = null;
    },
  };
}
