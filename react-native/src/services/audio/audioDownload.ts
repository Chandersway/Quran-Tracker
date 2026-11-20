export type AudioDownloadPort = {
  complete(): string | null;
  download(url: string): Promise<void>;
  validate(): Promise<boolean>;
  commit(): Promise<string>;
  cleanup(): Promise<void>;
};
/** Publish only a completed download; a missing mirror falls back to its source. */
export async function downloadAudio(
  urls: readonly string[],
  port: AudioDownloadPort,
): Promise<string> {
  const cached = port.complete();
  if (cached) return cached;
  try {
    const sources = [...new Set(urls)];
    let lastError: unknown;
    for (const url of sources) {
      try {
        await port.download(url);
        if (!(await port.validate())) throw new Error('Invalid audio download');
        return await port.commit();
      } catch (error) {
        lastError = error;
        await port.cleanup();
      }
    }
    throw lastError ?? new Error('No audio source');
  } finally {
    await port.cleanup();
  }
}
export function validMp3Header(bytes: Uint8Array): boolean {
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  // Some source MP3s have padding before their first MPEG frame.
  for (let i = 0; i < bytes.length - 1; i++)
    if (bytes[i] === 0xff && (bytes[i + 1]! & 0xe0) === 0xe0) return true;
  return false;
}
