/** Native worker owns only the supplied newly-created cache .partial file. */
export type NativePdfCropModule = {
  protocolVersion?: number;
  prepare(sourceUri: string, destinationUri: string, jobId: string): Promise<boolean>;
  cancel(jobId: string): void;
};

function cancelled(): Error {
  const error = new Error('PDF preparation cancelled');
  error.name = 'AbortError';
  return error;
}

/** Abort requests worker cancellation, then waits for stream close and native cleanup. */
export async function runNativePdfCrop(
  module: NativePdfCropModule | null,
  sourceUri: string,
  destinationUri: string,
  signal: AbortSignal,
  jobId: string,
): Promise<boolean> {
  if (signal.aborted) throw cancelled();
  if (!module) return false;
  const onAbort = () => {
    // A disappearing bridge must not throw out of AbortSignal.dispatchEvent.
    // We still await the original worker promise before the caller removes files.
    try {
      module.cancel(jobId);
    } catch {
      /* Completion below remains authoritative. */
    }
  };
  signal.addEventListener('abort', onAbort, { once: true });
  try {
    const completed = await module.prepare(sourceUri, destinationUri, jobId);
    if (signal.aborted) throw cancelled();
    if (completed !== true) throw new Error('Native PDF preparation did not complete');
    return true;
  } catch (error) {
    if (signal.aborted) throw cancelled();
    throw error;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}
