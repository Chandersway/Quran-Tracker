/** Web and iOS have no home-screen widget; publishing is a no-op there. */
export function publishHomeWidget(_json: string): Promise<void> {
  return Promise.resolve();
}
