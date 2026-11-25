/** Mirrors GroupErrors.kt: only whole backend reason codes map to curated messages. */
export function groupErrorKey(reason: unknown): string | null {
  const messages: string[] = [];
  let current: unknown = reason;
  for (let depth = 0; current && depth < 10; depth++) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = current.cause;
    } else if (typeof current === 'object') {
      const row = current as Record<string, unknown>;
      if (typeof row.message === 'string') messages.push(row.message);
      if (typeof row.details === 'string') messages.push(row.details);
      current = row.cause;
    } else {
      messages.push(String(current));
      break;
    }
  }
  const raw = messages.join('\n');
  const codes = new Set(raw.match(/\b[A-Z][A-Z_]+\b/g) ?? []);
  const mapping: Record<string, string> = {
    INVITATION_INVALID_OR_EXPIRED: 'inviteInvalid',
    INVITATION_NOT_FOUND: 'inviteInvalid',
    INVITATION_EMAIL_MISMATCH: 'wrongAccount',
    INVITATION_EMAIL_INVALID: 'emailInvalid',
    INVITATION_EXPIRY_INVALID: 'expiryInvalid',
    GROUP_INVITATION_REQUIRED: 'approval',
    GROUP_MEMBER_BLOCKED: 'blocked',
    GROUP_NOT_FOUND: 'notFound',
    ALREADY_GROUP_MEMBER: 'alreadyMember',
    GROUP_PERMISSION_DENIED: 'permission',
    GROUP_NOT_VISIBLE: 'permission',
    GROUP_POST_FORBIDDEN: 'permission',
    GROUP_PROGRESS_FORBIDDEN: 'permission',
    GROUP_COMMENT_FORBIDDEN: 'permission',
    GROUP_UPDATE_FORBIDDEN: 'permission',
    GROUP_ACCESS_FORBIDDEN: 'permission',
    GROUP_ROLE_RANK_DENIED: 'permission',
    AUTH_REQUIRED: 'login',
    JOIN_REQUEST_MESSAGE_TOO_LONG: 'messageLong',
    JOIN_REQUEST_NOT_FOUND: 'requestMissing',
  };
  for (const [code, key] of Object.entries(mapping))
    if (codes.has(code)) return `groups.error.${key}`;
  const lower = raw.toLowerCase();
  if (
    ['user not found', 'refresh token', 'session', 'jwt expired'].some((value) =>
      lower.includes(value),
    )
  )
    return 'groups.error.session';
  if (
    ['unable to resolve host', 'network', 'failed to connect', 'timeout', 'timed out'].some(
      (value) => lower.includes(value),
    )
  )
    return 'groups.error.network';
  if (['geen groep gevonden', '0 rows', 'cannot coerce'].some((value) => lower.includes(value)))
    return 'groups.error.notFound';
  return lower.includes('log eerst in') ? 'groups.error.login' : null;
}

export function requiresGroupAccessRequest(reason: unknown, hasInvitation: boolean): boolean {
  if (hasInvitation) return false;
  let current = reason;
  for (let count = 0; current && count < 10; count++) {
    if (typeof current === 'object') {
      const row = current as { message?: unknown; details?: unknown; cause?: unknown };
      if (
        [row.message, row.details].some(
          (value) => typeof value === 'string' && /\bGROUP_INVITATION_REQUIRED\b/.test(value),
        )
      )
        return true;
      current = row.cause;
    } else return typeof current === 'string' && /\bGROUP_INVITATION_REQUIRED\b/.test(current);
  }
  return false;
}
