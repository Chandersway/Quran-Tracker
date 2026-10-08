# Account management

The app now offers password recovery from login, password/email changes for
email accounts, correct provider labels and a separately confirmed deletion
flow. Google users manage their Google credentials with Google. Password
recovery opens a global dialog only after Supabase accepts a recovery session.
Credentials are not saved in Compose instance state or logged.

## Deployment status

2026-10-07: Applied `20261007010000_account_management.sql` through the Supabase
SQL editor to project `tboaaxcdnajgttdanfmb` (Quran_Tracer), after explicit user
approval. The transaction succeeded. Read-only catalog verification confirmed
both functions exist, use SECURITY DEFINER with a fixed empty search_path,
allow EXECUTE for authenticated and deny EXECUTE for anon. No deletion function
was invoked and no account was deleted during verification.

## Server configuration and verification

1. Allow `qurantracker://auth` in Supabase Auth Redirect URLs. Keep secure email
   change confirmations enabled and configure/test email delivery.
2. Review and apply `20261007010000_account_management.sql` in a staging project
   before production. No service-role key belongs in the Android application.
3. Review actual foreign keys and storage ownership. Deletion intentionally
   blocks group owners and accounts with restrictive dependencies or uploads.
   Transfer ownership and arrange deletion/retention of contributions with an
   administrator first. This migration does NOT invent a retention policy or
   change existing group-data constraints to cascading deletion.

If the RPC is absent or eligibility cannot be checked, deletion is disabled
and the dialog explicitly states that nothing has been removed.
The authenticated RPC accepts only confirmation_email; identity is derived
from the verified JWT. It requires a live session and an authentication-method
timestamp less than five minutes old. A token refresh alone does not qualify.
An email user reauthenticates with their password; a Google user signs in
again before retrying. All database deletion is transactional.

Local progress, notes and downloads are untouched. On confirmed server success
only the local authentication session is cleared. Account removal is not a
device wipe and does not remove Google accounts.

## Verification

- Run `gradlew testDebugUnitTest assembleDebug` for validation tests and build.
- With disposable staging accounts, verify recovery links both with the app
  closed and open, invalid/expired links, password mismatch, wrong current
  password, server password-policy rejection and optional reauthentication code.
- Verify email remains unchanged until confirmation, and that both inboxes get
  the expected confirmations. Verify the new address after refreshing sign-in.
- Verify anonymous RPC requests, missing/revoked sessions, stale JWT amr,
  another user's confirmation address and group ownership cannot delete users.
- Verify ready accounts delete only themselves; foreign-key failures must roll
  back. Verify blocked upload/group-contribution accounts retain all data.
- Verify local notes/progress survive sign-out/deletion. Never run destructive
  verification with the owner's real account or uninstall their application.

Live authentication emails and destructive account deletion have not been
exercised by the local build/tests. Server deployment was verified separately
as recorded above; this is not an end-to-end deletion test.

SDK references:
- https://supabase.com/docs/reference/kotlin/auth-resetpasswordforemail
- https://supabase.com/docs/reference/kotlin/auth-reauthentication
- https://supabase.com/docs/guides/auth/managing-user-data
