import { AppleDeletionError, createAppleDeletionHandler } from "./handler.ts";
import { createAppleProvider } from "./appleProvider.ts";

const base = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
const apiKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const configuration = {
  clientId: Deno.env.get("APPLE_CLIENT_ID") ?? "",
  teamId: Deno.env.get("APPLE_TEAM_ID") ?? "",
  keyId: Deno.env.get("APPLE_KEY_ID") ?? "",
  privateKey: Deno.env.get("APPLE_PRIVATE_KEY") ?? "",
};
const apple = createAppleProvider(configuration);
async function api(path: string, bearer: string, body?: unknown) {
  const result = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    signal: AbortSignal.timeout(10000),
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!result.ok) {
    const details = await result.json().catch(() => ({}));
    const known = ["owns_groups", "linked_data", "recent_login_required"];
    const code = known.find((candidate) =>
      String(details.message ?? "").includes(candidate),
    );
    throw new AppleDeletionError(
      code ?? "APPLE_DELETE_AUTH_REQUIRED",
      code ? 409 : 401,
    );
  }
  const text = await result.text();
  return text ? JSON.parse(text) : null;
}
Deno.serve(
  createAppleDeletionHandler({
    ...apple,
    configured: () =>
      Boolean(
        base &&
          apiKey &&
          Object.values(configuration).every((value) => value.trim()),
      ),
    async actor(bearer) {
      const user = await api("/auth/v1/user", bearer);
      if (!user?.id || typeof user.email !== "string")
        throw new AppleDeletionError("APPLE_DELETE_AUTH_REQUIRED", 401);
      return {
        id: user.id,
        email: user.email,
        appleSubjects: (Array.isArray(user.identities) ? user.identities : [])
          .filter(
            (identity: {
              provider?: string;
              identity_data?: { sub?: unknown };
            }) =>
              identity.provider === "apple" &&
              typeof identity.identity_data?.sub === "string",
          )
          .map(
            (identity: { identity_data: { sub: string } }) =>
              identity.identity_data.sub,
          ),
      };
    },
    preflight: (bearer) =>
      api("/rest/v1/rpc/account_deletion_status_v1", bearer, {}),
    async authenticate(identityToken, nonce) {
      const session = await api("/auth/v1/token?grant_type=id_token", apiKey, {
        provider: "apple",
        id_token: identityToken,
        nonce,
      });
      if (!session?.user?.id || typeof session.access_token !== "string")
        throw new AppleDeletionError("APPLE_DELETE_AUTH_REQUIRED", 401);
      return { id: session.user.id, bearer: session.access_token };
    },
    deleteAccount: (bearer, confirmationEmail) =>
      api("/rest/v1/rpc/delete_my_account_v1", bearer, {
        confirmation_email: confirmationEmail,
      }),
    closeSession: (bearer) => api("/auth/v1/logout?scope=local", bearer, {}),
  }),
);
