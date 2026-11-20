# Group typing status — F27

The chat has an optional typing indicator. It never creates chat posts or sends draft text. A displayed name comes from the authorized membership roster, rendered literally in a complete Dutch, English or Arabic sentence. The current user's own activity is hidden. The reserved status line scales with system font size, including Arabic, and does not resize the conversation when activity appears. Long visible names use middle ellipsis; accessibility retains the full sentence.

## Authorization and deployment boundary

**The migration has been applied and tested only on isolated localhost Supabase. The hosted backend is unchanged.** The delivered client cannot enable production typing by itself: without the new authorized RPC/private-channel policy, the indicator stays empty and ordinary messages still work. There is no public Broadcast/Presence fallback and no deployment implied by this document.

The installed Supabase and Realtime SDK versions are 2.119.0. Supabase documents private-channel authorization separately from Postgres Changes: `private: true` requires RLS on `realtime.messages`. Group-post RLS does not protect Broadcast. Client-provided Presence keys and Broadcast payloads do not prove an authenticated sender. [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).

[20261115090000_group_typing_private.sql](../../supabase/migrations/20261115090000_group_typing_private.sql) therefore provides:

- `get_group_typing_channel_v1`: only an active, reading-authorized member obtains their own group/recipient topic and server time.
- `publish_group_typing_v1`: requires active membership and `post.create`; actor and expiry come from the server. Callers supply only a group ID and boolean.
- One private receive channel per account/group. The server sends only to **currently active, reading-authorized recipients**, excluding the author. Recipient-role checks use that recipient's role, not the sender's `auth.uid()`.
- Exact recipient SELECT authorization plus restrictive namespace guards. Other members, outsiders and anonymous users cannot subscribe to another recipient; direct client Broadcast writes cannot forge an actor, even if a future permissive policy is added.

This recipient fan-out is deliberate: private-channel read authorization is cached by Realtime. A previously allowed member on an old socket must stop receiving **new** activity after removal commits. The server no longer publishes to that recipient. A public channel with the same name is a separate channel and cannot observe or inject the private traffic. [Realtime concepts](https://supabase.com/docs/guides/realtime/concepts), [authorization caching](https://supabase.com/docs/guides/realtime/reports).

There is no typing-state table or application history/replay. However, database Broadcast via `realtime.send` uses Supabase's internal message transport storage, normally retained for approximately three days. This is **short-lived UI status, not a claim of zero persistent transport storage**. Payloads contain only server actor ID, boolean and server expiry; Realtime adds its transport message ID. No name, draft text or keystrokes enter that payload. Recipient fan-out produces one transport event per eligible recipient. [Database Broadcast and retention](https://supabase.com/docs/guides/realtime/broadcast).

## Client lifecycle

`services/groups/groupTyping.ts` owns the transport contract and authorized roster. `groupTypingSupabase.ts` adapts the private socket and RPC, captures the expected actor/token and isolates the socket from subsequent main-client account changes. The handshake estimates server/client clock offset; raw server expiry remains the event-order key. This was needed for a real local Docker/host clock difference.

`groupTypingController.ts` accepts only booleans about input activity. Actual focused nonempty typing starts immediately, refreshes at most once per three seconds and stops after two seconds without input. Clearing, sending, input blur, navigation blur, background and disposal stop local activity. Remote status expires within eight seconds. Sender calls are serialized with at most one in-flight request and one coalesced pending state; disconnect/disposal drops queued starts and preserves a best-effort pinned stop. A lost stop is bounded by receiver expiry.

`features/groups/hooks/useGroupTyping.ts` connects navigation focus and AppState. Retained native input focus is restored on foreground return, but no typing status is sent until fresh input. Permission loss blocks publishing. Account/group changes discard the old controller and ignore its late callbacks. Membership/name revalidation occurs every thirty seconds while connected, never in background. A failed resolve, including a missing hosted migration, closes typing; a new route focus reconnects. Ordinary socket interruptions can rejoin through the SDK. A temporary resolve/network failure is not automatically retried while the same route remains focused. None of these errors block sending or reading chat messages.

`GroupTypingStatus` is presentation only. `GroupChatScreen` integrates focus/blur, `activity(hasText)`, and `stop()` before sending. Its keyboard/layout ownership remains separate.

## Reproducible local checks

The commands below enforce project `wirdna-isolated-qa-20261113` and API/socket origin `127.0.0.1:55431`. They never read hosted credentials, deploy or change the app environment file.

```powershell
node scripts/local-backend-qa/typing-sql.mjs
npx tsx scripts/local-backend-qa/typing-runtime.mts
node scripts/local-backend-qa/typing-sql.mjs --test
npx tsx --test tests/group-typing.test.ts tests/group-chat.test.ts
```

The runtime creates **new disposable fabricated auth users and a new group per run**, then cleans up only those records. It must not globally sign out the native UI fixture users. The initial development harness did reuse those users and briefly invalidated the concurrent QA session; that disruption was identified as a harness error and excluded from native product evidence. The corrected runtime does not touch those sessions.

Seven actual runtime scenarios passed: own private channels; bidirectional typing/stop with literal aliases and server-bound metadata; anonymous/outsider/foreign-recipient denial; direct-write forgery denial and private/public separation; sender and recipient capability revocation; no new activity for a removed member's still-connected socket; no chat-post writes and account-signout cleanup. SQL assertions also prove restrictive guards under temporary broad permissive policies, rolled back afterward. Results remain in ignored `.tooling/supabase-qa/typing-runtime-results.json` and `typing-sql-test.log`.

Eleven targeted tests cover throttling, expiry/order, own-actor filtering, stale callbacks, account/route cleanup, failed/slow request coalescing, the reproduced disconnect-close race, clock skew, literal localized names, actual hook background/foreground behavior and font-scale-aware status geometry.

For parent-owned native acceptance, `typing-native.mts listen 30` observes real native member activity; `typing-native.mts pulse 30` supplies owner activity followed by an explicit stop. `typing-native.mts expire 20` sends one start and deliberately no stop, exposing receiver timeout. All modes are capped at forty seconds, use only the known fabricated local group and send no chat content. They perform no sign-out, group deletion or role change, preserving the concurrent native fixture session. Native UI observations must be recorded separately; the service/SQL checks alone do not prove keyboard layout, iOS execution or hosted operation.
