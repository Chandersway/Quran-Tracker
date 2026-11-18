import { createBackend, type Backend } from '../services/backend/backend';

let backend: Backend | null | undefined;

/** Return Supabase services only when both public client settings are present. */
export function getBackend(): Backend | null {
  if (backend !== undefined) return backend;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    backend = null;
    return null;
  }
  backend = createBackend({
    supabaseUrl,
    supabaseAnonKey,
    audioBaseUrl: process.env.EXPO_PUBLIC_AUDIO_BASE_URL?.trim() || undefined,
  });
  return backend;
}
