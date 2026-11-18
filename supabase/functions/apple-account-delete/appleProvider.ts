import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
} from "npm:jose@6.2.17";
import { AppleDeletionError } from "./handler.ts";

export type AppleConfiguration = {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
};
const issuer = "https://appleid.apple.com";
const appleKeys = createRemoteJWKSet(new URL(`${issuer}/auth/keys`), {
  timeoutDuration: 10000,
});

export async function verifyAppleIdentity(
  token: string,
  nonce: string,
  clientId: string,
  keys: Parameters<typeof jwtVerify>[1] = appleKeys,
) {
  try {
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ["RS256"],
      issuer,
      audience: clientId,
      requiredClaims: ["sub", "iat", "exp", "nonce"],
      maxTokenAge: "5 minutes",
      clockTolerance: 5,
    });
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce)),
    );
    const expected = Array.from(hash, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    if (payload.nonce !== expected || !payload.sub)
      throw new Error("Apple identity mismatch");
    return { subject: payload.sub };
  } catch {
    throw new AppleDeletionError("APPLE_DELETE_IDENTITY_MISMATCH", 403);
  }
}

export function createAppleProvider(
  config: AppleConfiguration,
  send: typeof fetch = fetch,
) {
  async function clientSecret() {
    const key = await importPKCS8(
      config.privateKey.replaceAll("\\n", "\n"),
      "ES256",
    );
    return new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: config.keyId })
      .setIssuer(config.teamId)
      .setSubject(config.clientId)
      .setAudience(issuer)
      .setIssuedAt()
      .setExpirationTime("5 minutes")
      .sign(key);
  }
  async function post(path: string, fields: Record<string, string>) {
    const result = await send(`${issuer}/auth/${path}`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: await clientSecret(),
        ...fields,
      }),
    });
    if (!result.ok)
      throw new AppleDeletionError(
        path === "revoke"
          ? "APPLE_REVOKE_FAILED"
          : "APPLE_CODE_EXCHANGE_FAILED",
        502,
      );
    return result;
  }
  return {
    verifyIdentity: (token: string, nonce: string) =>
      verifyAppleIdentity(token, nonce, config.clientId),
    async exchangeCode(code: string) {
      // Native Apple requests have no redirect_uri; do not inject a web Services ID callback.
      const result = await (
        await post("token", { code, grant_type: "authorization_code" })
      ).json();
      if (
        typeof result.id_token !== "string" ||
        typeof result.refresh_token !== "string" ||
        !result.refresh_token
      )
        throw new AppleDeletionError("APPLE_CODE_EXCHANGE_FAILED", 502);
      return {
        identityToken: result.id_token,
        refreshToken: result.refresh_token,
      };
    },
    async revoke(refreshToken: string) {
      await post("revoke", {
        token: refreshToken,
        token_type_hint: "refresh_token",
      });
    },
  };
}
