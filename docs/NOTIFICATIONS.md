# Notification implementation status

## Implemented locally

- Hamburger menu opens the dedicated Notifications screen directly. Dutch, English, Arabic and French labels are included.
- Device-level switch, quiet hours, daily and optional additional reminders, planning switch, Android permission/channel status and persistence errors.
- `NotificationCoordinator` is the only local delivery path. WorkManager performs periodic reconciliation; Android can delay execution (these are not exact alarms).
- Daily reminders read current Room goal progress and suppress completed goals. The existing goal editor and notification settings share the Room reminder time.
- Planning and agenda use the same Room items. Delivery reloads items, rejects completed/deleted/cancelled items, observes quiet hours and expires old reminders after 12 hours beyond their allowed delivery time.
- Stable notification IDs and a persisted local ledger suppress repeat delivery. Ledger entries older than 35 days are pruned. This is not an exactly-once transaction with Android's notification service.
- Daily notification opens the daily goal. Planning notification opens the agenda on the item's date; a deleted item falls back to the normal agenda. It does not yet scroll/highlight the specific row.
- Existing per-group preference RPCs are reused. New account category settings save through Supabase; UI only confirms a successful write. Authentication checking has a loading state.

## Supabase migration — NOT deployed or integration-tested

`supabase/migrations/20260916010000_notification_delivery_foundation.sql` adds account preferences, device registrations and an idempotent delivery queue. It depends on the earlier group migrations and `group_v2_set_updated_at()`.

RLS restricts client access to its own preferences/devices and read-only delivery rows. Queue creation is server-side; eligibility checks active membership and group/category preferences. Unknown event types are rejected. Existing event producers must be audited against the new category names before deployment.

The migration intentionally does not install a dispatcher. No device tokens are currently registered. Consequently group push while the app is closed is NOT implemented, even if preference writes succeed.

## Remaining work before claiming the complete requested module

1. Configure Firebase/FCM for `com.Ameender.qurantracker`; implement token registration, rotation, logout/account transfer and device preference/quiet-hour synchronization. Never ship service-account keys in the APK.
2. Implement and deploy a privileged delivery dispatcher with leases, bounded retries, invalid-token cleanup, batching/rate limiting and eligibility/quiet-hour rechecks immediately before sending. Test RLS with two real test accounts.
3. Connect and audit all group event producers (including invitations to nonmembers), category mapping and group entity deep links. The current active-membership requirement deliberately excludes nonmembers and is not sufficient for invitation push.
4. Add explicit scheduled session times and per-item/default lead-time offsets (0/5/10/15/30/60/custom). Existing items currently store a reminder time only; do not silently reinterpret that field as an event start time.
5. Improve exact-item agenda focus and define catch-up semantics. Daily reminders are same-day only; an evening reminder deferred beyond midnight is discarded instead of reporting yesterday's goal. If both daily/extra are overdue after prolonged device sleep, both can currently be delivered unless their configured times match.
6. Verify on a physical device: upgrade/startup, all four languages/RTL, actual notification delivery, app closed/reboot, permissions revoked/restored, quiet hours, deep links, offline saves and account switching. Unit tests are not a substitute for these checks.

## Verification performed

`gradlew.bat testDebugUnitTest assembleDebug` succeeds. 55 JVM tests pass, including 18 new policy tests covering goal completion, disabled categories, missing/completed items, quiet-hour boundaries, DST/time-zone changes and group preference precedence. These tests do not exercise Android delivery, Supabase RLS or a live FCM provider.

The APK is `app/build/outputs/apk/debug/app-debug.apk`. This implementation has not been installed on the user's phone as part of this notification change.
