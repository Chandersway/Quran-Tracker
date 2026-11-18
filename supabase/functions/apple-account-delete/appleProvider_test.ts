import assert from "node:assert/strict";
import {
  createLocalJWKSet,
  exportJWK,
  exportPKCS8,
  generateKeyPair,
  jwtVerify,
  SignJWT,
} from "npm:jose@6.2.17";
import { createAppleProvider, verifyAppleIdentity } from "./appleProvider.ts";

const clientId = "com.Ameender.qurantracker";
const nonce = "ab".repeat(32);
const nonceHash = Array.from(
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce)),
  ),
  (value) => value.toString(16).padStart(2, "0"),
).join("");
const keys = await generateKeyPair("RS256");
const publicKey = await exportJWK(keys.publicKey);
const jwks = createLocalJWKSet({
  keys: [{ ...publicKey, kid: "test-key", alg: "RS256", use: "sig" }],
});
async function token(patch: Record<string, unknown> = {}) {
  return new SignJWT({ nonce: nonceHash, ...patch })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer("https://appleid.apple.com")
    .setAudience(clientId)
    .setSubject("apple-subject")
    .setIssuedAt()
    .setExpirationTime("5 minutes")
    .sign(keys.privateKey);
}

Deno.test(
  "real Apple JWT verification accepts only signed, fresh, nonce-bound issuer/audience claims",
  async () => {
    assert.deepEqual(
      await verifyAppleIdentity(await token(), nonce, clientId, jwks),
      { subject: "apple-subject" },
    );
    for (const [jwt, rawNonce, audience] of [
      [await token(), "cd".repeat(32), clientId],
      [await token(), nonce, "different.native.bundle"],
      [await token({ nonce: "wrong-hash" }), nonce, clientId],
    ])
      await assert.rejects(
        verifyAppleIdentity(jwt!, rawNonce!, audience!, jwks),
        /APPLE_DELETE_IDENTITY_MISMATCH/,
      );
    const expired = await new SignJWT({ nonce: nonceHash })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://appleid.apple.com")
      .setAudience(clientId)
      .setSubject("apple-subject")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 1000)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 600)
      .sign(keys.privateKey);
    await assert.rejects(
      verifyAppleIdentity(expired, nonce, clientId, jwks),
      /APPLE_DELETE_IDENTITY_MISMATCH/,
    );
    const wrongIssuer = await new SignJWT({ nonce: nonceHash })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://attacker.invalid")
      .setAudience(clientId)
      .setSubject("apple-subject")
      .setIssuedAt()
      .setExpirationTime("5 minutes")
      .sign(keys.privateKey);
    await assert.rejects(
      verifyAppleIdentity(wrongIssuer, nonce, clientId, jwks),
      /APPLE_DELETE_IDENTITY_MISMATCH/,
    );
    const otherKeys = await generateKeyPair("RS256");
    const wrongSignature = await new SignJWT({ nonce: nonceHash })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://appleid.apple.com")
      .setAudience(clientId)
      .setSubject("apple-subject")
      .setIssuedAt()
      .setExpirationTime("5 minutes")
      .sign(otherKeys.privateKey);
    await assert.rejects(
      verifyAppleIdentity(wrongSignature, nonce, clientId, jwks),
      /APPLE_DELETE_IDENTITY_MISMATCH/,
    );
  },
);

Deno.test(
  "Apple transport signs short-lived ES256 client secrets and uses form-encoded native exchange/revoke endpoints",
  async () => {
    const signing = await generateKeyPair("ES256", { extractable: true });
    const calls: string[] = [];
    const provider = createAppleProvider(
      {
        clientId,
        teamId: "TESTTEAM01",
        keyId: "TESTKEY001",
        privateKey: await exportPKCS8(signing.privateKey),
      },
      async (input, options) => {
        const url = String(input);
        calls.push(url);
        assert.equal(options!.method, "POST");
        assert.equal(
          (options!.headers as Record<string, string>)["Content-Type"],
          "application/x-www-form-urlencoded",
        );
        const form = options!.body as URLSearchParams;
        assert.equal(form.get("client_id"), clientId);
        const secret = await jwtVerify(
          form.get("client_secret")!,
          signing.publicKey,
          {
            algorithms: ["ES256"],
            issuer: "TESTTEAM01",
            subject: clientId,
            audience: "https://appleid.apple.com",
          },
        );
        assert.equal(secret.protectedHeader.kid, "TESTKEY001");
        assert.ok(secret.payload.exp! - secret.payload.iat! <= 300);
        assert.equal(form.has("redirect_uri"), false);
        if (url.endsWith("/token")) {
          assert.equal(form.get("grant_type"), "authorization_code");
          assert.equal(form.get("code"), "one-use-code");
          return Response.json({
            id_token: "verified-in-handler",
            refresh_token: "temporary-refresh",
          });
        }
        assert.equal(url, "https://appleid.apple.com/auth/revoke");
        assert.equal(form.get("token"), "temporary-refresh");
        assert.equal(form.get("token_type_hint"), "refresh_token");
        return new Response(null, { status: 200 });
      },
    );
    const result = await provider.exchangeCode("one-use-code");
    await provider.revoke(result.refreshToken);
    assert.deepEqual(calls, [
      "https://appleid.apple.com/auth/token",
      "https://appleid.apple.com/auth/revoke",
    ]);
  },
);

Deno.test(
  "Apple exchange errors and malformed successful responses fail closed without exposing provider bodies",
  async () => {
    const signing = await generateKeyPair("ES256", { extractable: true });
    const configuration = {
      clientId,
      teamId: "TESTTEAM01",
      keyId: "TESTKEY001",
      privateKey: await exportPKCS8(signing.privateKey),
    };
    const rejected = createAppleProvider(configuration, async () =>
      Response.json({ secret: "never expose" }, { status: 400 }),
    );
    await assert.rejects(
      rejected.exchangeCode("code"),
      /^Error: APPLE_CODE_EXCHANGE_FAILED$/,
    );
    await assert.rejects(
      rejected.revoke("token"),
      /^Error: APPLE_REVOKE_FAILED$/,
    );
    const malformed = createAppleProvider(configuration, async () =>
      Response.json({ id_token: "missing-refresh" }),
    );
    await assert.rejects(
      malformed.exchangeCode("code"),
      /APPLE_CODE_EXCHANGE_FAILED/,
    );
  },
);
