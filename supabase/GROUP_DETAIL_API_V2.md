# Group Detail API v2

The Android client uses authenticated Supabase RPC calls as its application API. Every mutation validates the active user and the required group permission on the server. Hiding an action in the UI is never the authorization boundary.

## Core contracts

| App operation | RPC | Authorization |
| --- | --- | --- |
| Get group detail and capabilities | `get_group_detail_v3(code)` | Visible group |
| List members | `list_group_members_v3(group_id)` | `member.read` |
| Update group | `update_group_v2_full(...)` | `group.update` |
| Soft-delete group | `soft_delete_group_v2(group_id)` | `group.delete` |
| Create/revoke/accept invitation | `*_group_invitation_v2` | `invitation.create` or invitation token |
| Create/review join request | `*_group_join_request_v2` | Self or `join_request.manage` |
| Create/edit/pin/delete post | Group post v2 RPCs | Matching post capability |
| React/comment/report | Group feed v2 RPCs | Active membership and target visibility |
| List/upload/delete media | Group media v2 RPCs | `media.upload` / `media.manage` |
| List/create/progress/manage task | Group task v3 RPCs | Member or `task.create` |
| List/create/respond/manage event | Group event v2 RPCs | Member or `event.create` |

## Management contracts added in phase 10

| App operation | RPC | Result |
| --- | --- | --- |
| Get active rules | `get_group_rules_v2(group_id)` | Zero or one active rule version |
| Publish rules | `publish_group_rules_v2(group_id, content)` | New immutable rule version |
| Get notification preference | `get_group_notification_preferences_v2(group_id)` | Stored preference or safe defaults |
| Update notification preference | `update_group_notification_preferences_v2(...)` | Updated preference |
| List notification inbox | `list_group_notifications_v2(...)` | Cursor-paginated notifications |
| Mark one/all notifications | `mark_group_notification_read_v2(...)` | Number of changed rows |
| Send important notification | `send_group_notification_v2(...)` | Number of recipients |
| List moderation queue | `list_group_moderation_reports_v2(...)` | Filtered, cursor-paginated reports |
| Review moderation report | `review_group_moderation_report_v2(...)` | Updated report |
| List audit log | `list_group_audit_log_v2(...)` | Cursor-paginated immutable events |

## Pagination

- Notifications and moderation reports use the pair `before_created_at` and `before_id` as a stable cursor.
- Audit entries use the monotonic `before_id` cursor.
- Page sizes are clamped server-side to `1..100`.
- Feed and media retain their existing cursor contracts.

## Error contract

PostgreSQL error codes remain machine-readable through PostgREST. A stable detail value is included for new management endpoints:

| SQLSTATE | Detail example | Meaning |
| --- | --- | --- |
| `28000` | `AUTH_REQUIRED` | No valid authenticated session |
| `42501` | `GROUP_PERMISSION_DENIED` | Authenticated but missing capability |
| `42501` | `GROUP_MEMBERSHIP_REQUIRED` | Active membership required |
| `42501` | `GROUP_NOT_VISIBLE` | Group is outside the viewer's scope |
| `P0002` | `GROUP_NOT_FOUND` | Resource does not exist or is deleted |
| `22023` | `NOTIFICATION_LEVEL_INVALID` | Invalid request input |
| `P0001` | `RATE_LIMITED` | Notification send limit exceeded |

## Security and delivery rules

- RPCs run as `security definer` with a fixed `search_path` and are executable only by `authenticated`.
- RLS remains enabled on every underlying table.
- Rules, moderation decisions and broadcast notifications create append-only audit entries.
- Notification broadcasts are limited to 20 sends per actor per group per hour.
- Notification, moderation and audit list calls do not return rows outside the requested group and viewer scope.
- Task rewards use an idempotent ledger, so retrying a completed task cannot award points twice.

The executable rollback contract is in `tests/group_management_api_v2.sql`.
