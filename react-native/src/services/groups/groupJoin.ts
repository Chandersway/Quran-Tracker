export type GroupJoinTarget = { code: string; token: string | null };
export type GroupJoinStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
const validCode = (value: string) => /^[A-Z0-9]{3}-[0-9]{4}$/.test(value);
export const GROUP_WEB_ORIGIN = 'https://qurantracker-8f775.web.app';
export function parseGroupJoinInput(raw: string): GroupJoinTarget | null {
  const value = raw.trim();
  if (!value.includes('://')) {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const code = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    return validCode(code) ? { code, token: null } : null;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const authority = value.split('://')[1]?.split(/[/?#]/)[0] ?? '';
  if (url.username || url.password || url.port || /:\d+$/.test(authority)) return null;
  const native = url.protocol === 'qurantracker:' && url.hostname === 'group';
  const web = url.origin === GROUP_WEB_ORIGIN;
  if (!native && !web) return null;
  const match = (native ? /^\/([^/]+)\/?$/ : /^\/group\/([^/]+)\/?$/).exec(url.pathname);
  if (!match) return null;
  let code: string;
  try {
    code = decodeURIComponent(match[1]!).trim().toUpperCase();
  } catch {
    return null;
  }
  if (!validCode(code)) return null;
  const tokens = url.searchParams.getAll('invite');
  const token = tokens[0]?.trim() ?? null;
  if (
    tokens.length > 1 ||
    (tokens.length === 1 && (!token || token.length < 32 || token.length > 160))
  )
    return null;
  return { code, token };
}
export function groupJoinUrl(target: GroupJoinTarget): string {
  return `qurantracker://group/${target.code}${target.token ? `?invite=${encodeURIComponent(target.token)}` : ''}`;
}
/** The configured app-link host also serves recipients who do not have the app installed. */
export function groupShareUrl(target: GroupJoinTarget, language: string): string {
  if (
    !validCode(target.code) ||
    (target.token !== null && (target.token.length < 32 || target.token.length > 160))
  )
    throw new Error('Invalid group invitation');
  const url = new URL(`/group/${encodeURIComponent(target.code)}`, GROUP_WEB_ORIGIN);
  if (target.token) url.searchParams.set('invite', target.token);
  url.searchParams.set('lang', ['en', 'nl', 'ar'].includes(language) ? language : 'en');
  return url.toString();
}
/** Matches the source's named prefix/hash suffix, while keeping non-Latin names compatible with its ASCII code contract. */
export function buildGroupCode(name: string, timestamp = Date.now()): string {
  const prefix = name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'Q');
  let hash = 0;
  for (const character of `${name}${timestamp}`)
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return `${prefix}-${String(Math.abs(hash)).slice(-4).padStart(4, '0')}`;
}
/** Auth callbacks, malformed links and stale completions cannot erase a valid invitation awaiting confirmation. */
export function createPendingGroupStore(storage: GroupJoinStorage) {
  const key = 'pending-group-invitation-v1';
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.catch(() => undefined).then(work);
    queue = next;
    return next;
  };
  const read = async (): Promise<GroupJoinTarget | null> => {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    const row = JSON.parse(raw) as GroupJoinTarget;
    return typeof row.code === 'string' && (row.token === null || typeof row.token === 'string')
      ? parseGroupJoinInput(groupJoinUrl(row))
      : null;
  };
  return {
    load: () => serial(read),
    receive: (raw: string) =>
      serial(async () => {
        const target = parseGroupJoinInput(raw);
        if (target) await storage.setItem(key, JSON.stringify(target));
        return target;
      }),
    consume: (target: GroupJoinTarget) =>
      serial(async () => {
        const saved = await read();
        if (saved?.code === target.code && saved.token === target.token)
          await storage.removeItem(key);
      }),
  };
}
