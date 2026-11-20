const listeners = new Set<() => void>();
export function onNotificationPreferencesChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function notifyNotificationPreferencesChanged(): void {
  for (const listener of listeners) listener();
}
