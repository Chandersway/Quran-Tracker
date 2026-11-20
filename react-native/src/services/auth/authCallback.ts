export const AUTH_REDIRECT_URL = 'qurantracker://auth';
export type AuthOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';
export type AuthCallback =
  | { kind: 'ignored' }
  | { kind: 'invalid' }
  | { kind: 'failure' }
  | { kind: 'code'; code: string; flowId?: string; recovery: boolean }
  | { kind: 'otp'; tokenHash: string; type: AuthOtpType; recovery: boolean }
  | { kind: 'session'; accessToken: string; refreshToken: string; recovery: boolean };
const otpTypes = new Set<AuthOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

/** Parse only the exact app authority. Never reflect URL tokens or error descriptions. */
export function parseAuthCallback(raw: string): AuthCallback {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: 'ignored' };
  }
  if (url.protocol !== 'qurantracker:' || url.hostname !== 'auth') return { kind: 'ignored' };
  if (
    url.username ||
    url.password ||
    url.port ||
    url.pathname ||
    raw.length > 32768 ||
    /[\r\n\t\\]/.test(raw)
  )
    return { kind: 'invalid' };
  const params = new Map<string, string>();
  for (const entries of [url.searchParams, new URLSearchParams(url.hash.slice(1))]) {
    for (const [key, value] of entries) {
      if (params.has(key) || !key || !value || /[\u0000-\u001f\u007f]/.test(value))
        return { kind: 'invalid' };
      params.set(key, value);
    }
  }
  const get = (key: string) => params.get(key);
  const type = get('type');
  if (type && !otpTypes.has(type as AuthOtpType)) return { kind: 'invalid' };
  const code = get('code'),
    tokenHash = get('token_hash');
  const accessToken = get('access_token'),
    refreshToken = get('refresh_token');
  const mechanisms =
    Number(Boolean(code)) +
    Number(Boolean(tokenHash)) +
    Number(Boolean(accessToken || refreshToken));
  if (get('error') || get('error_code'))
    return mechanisms ? { kind: 'invalid' } : { kind: 'failure' };
  if (mechanisms !== 1) return { kind: 'invalid' };
  const recovery = type === 'recovery';
  const flowId = get('sb_flow_id');
  if (flowId && !/^[a-zA-Z0-9_-]{8,64}$/.test(flowId)) return { kind: 'invalid' };
  if (code) return { kind: 'code', code, ...(flowId ? { flowId } : {}), recovery };
  if (tokenHash && type) return { kind: 'otp', tokenHash, type: type as AuthOtpType, recovery };
  if (accessToken && refreshToken) return { kind: 'session', accessToken, refreshToken, recovery };
  return { kind: 'invalid' };
}

/** An OAuth launch must stay on the configured Supabase authority and use S256. */
export function trustedGoogleOAuthUrl(raw: string, backendUrl: string): string {
  const url = new URL(raw),
    backend = new URL(backendUrl);
  if (
    url.protocol !== 'https:' ||
    url.origin !== backend.origin ||
    url.username ||
    url.password ||
    url.pathname !== `${backend.pathname.replace(/\/$/, '')}/auth/v1/authorize` ||
    url.hash
  )
    throw new Error('Invalid authentication URL');
  for (const key of new Set(url.searchParams.keys()))
    if (url.searchParams.getAll(key).length !== 1) throw new Error('Invalid authentication URL');
  const redirect = new URL(url.searchParams.get('redirect_to') ?? '');
  const flowId = redirect.searchParams.get('sb_flow_id');
  if (
    redirect.protocol !== 'qurantracker:' ||
    redirect.hostname !== 'auth' ||
    redirect.username ||
    redirect.password ||
    redirect.port ||
    redirect.pathname ||
    redirect.hash ||
    [...redirect.searchParams.keys()].some((key) => key !== 'sb_flow_id') ||
    redirect.searchParams.getAll('sb_flow_id').length > 1 ||
    (flowId && !/^[a-zA-Z0-9_-]{8,64}$/.test(flowId))
  )
    throw new Error('Invalid authentication redirect');
  if (
    url.searchParams.get('provider') !== 'google' ||
    url.searchParams.get('code_challenge_method')?.toLowerCase() !== 's256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge') ?? '')
  )
    throw new Error('Secure authentication is unavailable');
  return url.toString();
}

/** A PKCE recovery is identified by its secure saved verifier, not URL metadata. */
export function verifiedAuthRecovery(callback: AuthCallback, redirectType?: unknown): boolean {
  if (callback.kind === 'code') return redirectType === 'recovery';
  return (callback.kind === 'otp' || callback.kind === 'session') && callback.recovery;
}
