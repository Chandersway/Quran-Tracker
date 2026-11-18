/** Supabase Storage is CORS-enabled; arbitrary avatar hosts retain their own policy. */
export function isCorsGroupStorageImage(uri: string): boolean {
  try {
    const url = new URL(uri);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      /^\/storage\/v1\/object\/(?:sign|public)\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}
