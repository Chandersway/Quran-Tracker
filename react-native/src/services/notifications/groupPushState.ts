// Shared by the display gate and sign-out/preferences writes, without importing native modules.
let revision = 0;
export const groupPushRevision = () => revision;
export const invalidateGroupPush = () => {
  revision++;
};
let operation: Promise<unknown> = Promise.resolve();
export function withGroupPushLock<T>(work: () => Promise<T>): Promise<T> {
  const next = operation.catch(() => undefined).then(work);
  operation = next;
  return next;
}
