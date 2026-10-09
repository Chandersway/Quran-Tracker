// The only credential exported to FCM is a short-lived OAuth token.
// No client-provided recipients, device tokens or message bodies are accepted.
const base = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function rpc(name: string, body: unknown = {}) {
  const response = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`RPC_${name}_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const encode = (value: unknown) => b64(new TextEncoder().encode(JSON.stringify(value)));
let cached: { token: string; expires: number; project: string } | undefined;
async function credentials() {
  if (cached && cached.expires > Date.now() + 60000) return cached;
  const account = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") ?? "{}");
  if (account.project_id !== "qurantracker-8f775" || !account.private_key || !account.client_email) throw new Error("FCM_CONFIGURATION");
  const keyBytes = Uint8Array.from(atob(account.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", keyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: AbortSignal.timeout(10000),
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64(new Uint8Array(signature))}` }) });
  if (!response.ok) throw new Error(`FCM_AUTH_${response.status}`);
  const result = await response.json();
  cached = { token: result.access_token, expires: Date.now() + result.expires_in * 1000, project: account.project_id };
  return cached;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const bearer = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  if (bearer.length < 32 || bearer.length > 256) return new Response("Unauthorized", { status: 401 });
  try {
    if (!await rpc("verify_group_push_dispatcher_v1", { p_token: bearer })) return new Response("Unauthorized", { status: 401 });
    const auth = await credentials(); // Fail before claiming if secrets/OAuth are unavailable.
    const deliveries = await rpc("claim_group_push_v1");
    let sent = 0;
    for (const item of deliveries) {
      let outcome = "retry";
      try {
        // Recheck preferences and membership immediately before each outbound request.
        if (!await rpc("group_push_claim_allowed_v1", { p_delivery: item.delivery_id, p_claim: item.claim })) {
          outcome = "failed";
        } else {
          const response = await fetch(`https://fcm.googleapis.com/v1/projects/${auth.project}/messages:send`, {
            method: "POST", signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: { token: item.token,
              data: { kind: "group_reply", event_id: item.event_id, recipient: item.recipient },
              android: { priority: "HIGH", ttl: "86400s" } } }),
          });
          if (response.ok) { outcome = "sent"; sent++; }
          else {
            console.warn(`FCM_SEND_${response.status}`);
            const error = await response.json().catch(() => ({}));
            const unregistered = error?.error?.details?.some((d: { errorCode?: string }) => d.errorCode === "UNREGISTERED");
            outcome = unregistered ? "invalid_token" : (response.status === 429 || response.status >= 500 || response.status === 401 ? "retry" : "failed");
            if (response.status === 401) cached = undefined;
          }
        }
      } catch { /* Transient errors leave a bounded, retriable delivery. */ }
      await rpc("finish_group_push_v1", { p_delivery: item.delivery_id, p_claim: item.claim, p_result: outcome });
    }
    return Response.json({ processed: deliveries.length, sent });
  } catch (error) {
    // Never log request headers, tokens, notification contents or service-account JSON.
    console.error(error instanceof Error && /^(RPC_|FCM_)/.test(error.message) ? error.message : "PUSH_DISPATCH_FAILED");
    return new Response("Dispatch unavailable", { status: 503 });
  }
});
