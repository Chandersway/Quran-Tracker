export class AppleDeletionError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(code);
  }
}
export type AppleDeletionPorts = {
  configured(): boolean;
  actor(
    bearer: string,
  ): Promise<{ id: string; email: string; appleSubjects: string[] }>;
  preflight(bearer: string): Promise<string>;
  verifyIdentity(
    identityToken: string,
    nonce: string,
  ): Promise<{ subject: string }>;
  exchangeCode(
    code: string,
  ): Promise<{ identityToken: string; refreshToken: string }>;
  authenticate(
    identityToken: string,
    nonce: string,
  ): Promise<{ id: string; bearer: string }>;
  revoke(refreshToken: string): Promise<void>;
  deleteAccount(bearer: string, confirmationEmail: string): Promise<void>;
  closeSession(bearer: string): Promise<void>;
};
const response = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

/** No admin delete: all database operations retain the actor's RLS and existing deletion guards. */
export function createAppleDeletionHandler(ports: AppleDeletionPorts) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST")
      return response({ code: "APPLE_DELETE_METHOD" }, 405);
    let temporarySession: string | undefined;
    try {
      const bearer = request.headers
        .get("Authorization")
        ?.match(/^Bearer ([^\s]+)$/i)?.[1];
      if (!bearer || bearer.length > 16384)
        throw new AppleDeletionError("APPLE_DELETE_AUTH_REQUIRED", 401);
      const actor = await ports.actor(bearer);
      const raw = await request.text();
      if (raw.length > 48000)
        throw new AppleDeletionError("APPLE_DELETE_BAD_REQUEST", 413);
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new AppleDeletionError("APPLE_DELETE_BAD_REQUEST");
      }
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        typeof body.accountId !== "string" ||
        body.accountId !== actor.id ||
        typeof body.confirmationEmail !== "string" ||
        body.confirmationEmail.length > 254 ||
        !actor.email ||
        body.confirmationEmail.trim().toLowerCase() !==
          actor.email.trim().toLowerCase() ||
        typeof body.identityToken !== "string" ||
        body.identityToken.length < 16 ||
        body.identityToken.length > 16384 ||
        typeof body.authorizationCode !== "string" ||
        body.authorizationCode.length < 1 ||
        body.authorizationCode.length > 4096 ||
        typeof body.nonce !== "string" ||
        !/^[a-f\d]{64}$/.test(body.nonce)
      )
        throw new AppleDeletionError("APPLE_DELETE_BAD_REQUEST");
      if (!ports.configured())
        throw new AppleDeletionError("APPLE_DELETE_NOT_CONFIGURED", 503);
      if (!actor.appleSubjects.length)
        throw new AppleDeletionError("APPLE_DELETE_IDENTITY_MISMATCH", 403);
      const identity = await ports.verifyIdentity(
        body.identityToken,
        body.nonce,
      );
      if (!actor.appleSubjects.includes(identity.subject))
        throw new AppleDeletionError("APPLE_DELETE_IDENTITY_MISMATCH", 403);
      const status = await ports.preflight(bearer);
      if (status !== "ready")
        throw new AppleDeletionError(
          ["owns_groups", "linked_data"].includes(status)
            ? status
            : "APPLE_DELETE_NOT_READY",
          409,
        );
      const tokens = await ports.exchangeCode(body.authorizationCode);
      const exchanged = await ports.verifyIdentity(
        tokens.identityToken,
        body.nonce,
      );
      if (exchanged.subject !== identity.subject)
        throw new AppleDeletionError("APPLE_DELETE_IDENTITY_MISMATCH", 403);
      // Fresh AMR is required by delete_my_account_v1. This request-local session
      // never replaces the app's session or bypasses SQL's five-minute limit.
      const fresh = await ports.authenticate(body.identityToken, body.nonce);
      temporarySession = fresh.bearer;
      if (fresh.id !== actor.id)
        throw new AppleDeletionError("APPLE_DELETE_IDENTITY_MISMATCH", 403);
      await ports.revoke(tokens.refreshToken);
      await ports.deleteAccount(fresh.bearer, body.confirmationEmail.trim());
      return response({ deleted: true, accountId: actor.id });
    } catch (error) {
      return error instanceof AppleDeletionError
        ? response({ code: error.code }, error.status)
        : response({ code: "APPLE_DELETE_UNAVAILABLE" }, 503);
    } finally {
      // Fresh auth creates one temporary server-side session, including on errors.
      if (temporarySession)
        await ports.closeSession(temporarySession).catch(() => undefined);
    }
  };
}
