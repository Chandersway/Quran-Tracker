# Kotlin → React Native parity audit: sections 16, 17, 18 and 21

Date: 2026-11-17. Audit only. No application, Kotlin, migration, SQL or source assets were modified. Paths below are relative to `react-native/`; `../app/` is the Kotlin source and `../supabase/` is the shared server contract.

## Implementation follow-up — 2026-11-17

The audit below is the historical baseline. The follow-up changed React Native community/account/notification modules and added tests; original Kotlin, imported assets and deployed backend configuration were preserved. CA01–CA03 belong to the separate notes/storage work.

| Finding | Follow-up disposition |
|---|---|
| CA04 | Restored group goal achieved/target/bar, total points and recorded readings, active-today count, page equivalents and explicit Juz/Hizb/Surah totals, week/month leaders (with total fallback), recent dated progress, per-member streak/activity/totals and existing reading ranges. Header displays privacy and stored language to ordinary members. No language editor was invented. Components are split into `GroupProgressSummary`, `GroupOverviewPanel`, and `GroupMemberReadingSheet`; calculations remain in `services/groups/groupMetrics.ts`. |
| CA05 | `ExpandablePostText` measures the full literal body, initially limits long feed posts to six lines, and exposes accessible expand/collapse controls without changing the content. |
| CA06 | Invitation copy/share and group share now use `groupShareUrl`: HTTPS on the existing configured `qurantracker-8f775.web.app` host, encoded invitation token and selected language. Existing incoming app/HTTPS acceptance remains intact. Independent read-only HTTP checks confirmed the live fallback page and Android association document; iOS association details remain empty, so automatic iOS universal-link opening is not claimed. Deployment was not changed. |
| CA07 | The sharing action requires both `progress.create` and `post.create`; the service rereads current group capabilities. Private save remains available with progress permission alone and passes no feed message. Explicit save-and-share previews a generated localized message or the user's optional replacement. One RPC retains SQL atomicity, and a failed share never retries as a different private action. A synchronous in-flight guard rejects duplicate taps. |
| CA08 | Added live system permission and separate reading/group channel status, app-resume refresh, and Android `APP_NOTIFICATION_SETTINGS` with app-settings fallback. Opening the panel only reads state. Daily/extra/planning reminders, quiet hours, category and group settings remain in their existing modules. |
| CA09 | Rejected finding remains rejected. Shared numeric `Field` normalization for Arabic-Indic/Persian input is retained. |
| CA10 | Added sign-up repeat-password field, inline mismatch feedback, disabled invalid submit and independent callback equality validation before calling auth. Existing recovery/change-password confirmation is preserved. |

Metric details: estimated page/ayah conversions retain Kotlin's integer ratios; explicit unit totals remain raw unit counts and task awards affect points only. The goal now honors its configured daily/last-7-day/last-30-day/total period. This intentionally fixes Kotlin's all-time calculation for period goals. Surah/lesson/custom goals use their recorded unit counts rather than Kotlin's fallback treating ayah equivalents as those units. `none` has no fixed target. Total goal achievement is not visually capped at the target; only the progress bar is capped.

The independent review exposed and fixed two aggregate defects. The progress adapter now reads all visible entries in stable UUID order with batches of at most 500 and an exclusive cursor, including when the server imposes a lower row cap; a later-page failure rejects the aggregate. Group reading days, streaks and 7/30-day reading windows use UTC calendar boundaries, matching the existing SQL `occurred_on = current_date` contract and verified local database timezone. Date-only rows are never converted as instants. Group summary/member views disclose UTC; personal statistics retain local dates. Task-award periods retain their existing server rolling-hour contract. No schema or hosted configuration changed.

The additional adapter/service and community regression run passed **30/30**, including 1,501 entries, a 125-row server cap, scope isolation, later-page errors, Berlin midnight and UTC year/leap-month boundaries. TypeScript and scoped ESLint passed. The detailed independent review and remaining deployment limits are recorded in `.tooling/parity-community-independent-review.md`.

Verification uses actual service functions and component callbacks with fabricated data. New cases cover goal conversions and periods, explicit totals, independent permission combinations, generated explicit sharing, duplicate taps, signup mismatch and correction, encoded HTTPS round-trips, literal post expansion, system permission/channel distinctions, resume refresh and stale response disposal. The focused community/account/auth/notification run passed **100/100** (`.tooling/parity-community-implementation-tests.log`), complete TypeScript checking passed, and scoped ESLint/formatting passed. The UI detector reported no findings. Native rendering is not implied by these callback tests.

The existing isolated localhost Supabase project was started with its outbound dispatcher disabled. `scripts/local-backend-qa/progress-parity.mjs` passed a real SQL transaction test: private save creates no post; forbidden sharing rolls back its inserted progress; allowed sharing creates both records; revoking progress permission blocks further writes. Its fixture changes roll back. Realtime integration passed **8/8**, private typing integration **7/7**, and typing SQL privacy checks passed. Evidence stays in `.tooling/supabase-qa/progress-parity.log`, `community-runtime-results.json`, `typing-runtime-results.json`, and `typing-sql-test.log`. The older Realtime test was corrected to wait for observable deletion reconciliation: silent background polls deliberately never set the foreground `busy` flag.

No hosted migration, cloud configuration, real message, push delivery, account deletion, commit, push or deployment was performed. Hosted publication/typing readiness, live Google OAuth, actual FCM/APNs delivery and physical-device notification settings/resume remain separate acceptance work requiring the authorized test accounts, platform credentials and devices. The source contains the server dispatcher, FCM/APNs paths, registration and access gates; this is not a claim that production delivery is configured. Typing continues to fail closed if its private RPC is unavailable; ordinary chat retains polling fallback.

## Method and verification limits

Traced reachable Kotlin UI callers, their repositories, current RN navigation/components/services, and the shared SQL RPCs. A repository function or model property alone is not counted as a reachable feature. Absence statements identify the searched alternative paths. Shared SQL was inspected read-only; no database migration, cloud message, account change, native notification or live user action was performed.

Focused existing tests passed **46/46**: notes editor/format, group operations/readings, auth/confirmation/profile services, group push policy, local preferences and notification destinations. Output: `.tooling/parity-2026-11-17-community-tests.log`. A separate fabricated-data reproduction, `.tooling/parity-2026-11-17-notes-export-repro.ts`, runs real `appReducer`, `prepareNoteSave` and `buildNotesExport` and confirms finding CA02. Root owns the full verification run.

These tests verify local logic and mocked adapters, not production deployment or device delivery. The already recorded cloud Realtime error F29 remains separate. Typing has local-test evidence only. There **is** shared server delivery code, including dispatcher SQL, reply enqueue/claim policy, an Edge Function, FCM and APNs paths; do not repeat an obsolete “no server code” finding.

## Concrete parity failures and changes

### CA01 — Missing Juz/Hizb/Surah note entry points also strand the descendant filter (P2, partial)

Kotlin has active note-count buttons in `../app/src/main/java/com/Ameender/qurantracker/ui/JuzzScreen.kt:344`, `ui/HizbScreen.kt:294`, `ui/SurahScreen.kt:340`, and the reader chapter list at `ui/QuranReaderScreen.kt:437`. These are actually wired by `../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt:621`, `:640`, `:659` and `:674` into `openNotes(QuranNoteTarget(...))`; they are not unused callback defaults.

RN supports the target parameter (`src/app/navigation/types.ts:20`, `src/features/notes/screens/NotesScreen.tsx:39`) and the five-scope picker (`src/features/notes/components/NoteTargetControl.tsx:60`), but the only scoped caller is ayah actions at `src/features/quran/components/AyahActionsSheet.tsx:100`. Global callers are `src/features/home/screens/MainScreen.tsx:111` and `src/app/navigation/NavigationDock.tsx:68`. An all-`src` search for `Notes`, `navigate('Notes'`, `noteCount`, `notesCount`, `onOpenNotes`, and target navigation found no alternative Juz/Hizb/Surah caller. Therefore the context-dependent descendant toggle at `src/features/notes/screens/NotesScreen.tsx:143`/`:166` is not normally reachable for those parent scopes, although its filter logic is implemented at `src/features/notes/editor/noteFilters.ts:42`.

The regression is those contextual links/counts, not missing note scopes or CRUD. Rub notes can be created through the picker. I did not find a separate active Kotlin rub-row note button, so a missing rub-row shortcut is not asserted as a Kotlin regression.

### CA02 — Notes export order differs after ordinary edits/saves (P2, reproduced)

Kotlin exports the complete `allNotes` list: `../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt:273`, `:593`, `:841`. That list comes through `../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt:51` from `../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt:51`, whose query is `ORDER BY isPinned DESC, updatedAt DESC`.

RN also exports all notes, not the filtered view (`src/features/notes/hooks/useNoteEditor.ts:150`), but `src/state/reducer.ts:334` prepends every saved/pinned note. `src/exporting/notesExport.ts:105` maps that insertion order without the Kotlin ordering. Reproduction: save unpinned note 2 after pinned note 1. RN exports IDs `[2,1]`; Kotlin DAO order is `[1,2]`. Pinning/unpinning a note can similarly move an older note ahead of newer notes without changing `updatedAt`.

Schema version, five scopes, text/whitespace, formatting, local-device marker, tags and timestamps are retained. This is specifically the observable array order, not an export-data-loss finding.

### CA03 — Note editor reports Saved and closes before durable local persistence (P2, cross-cutting persistence issue)

Kotlin waits for the repository write before closing, and retains the editor/text with an error when it fails: `../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt:410`–`:444`; `../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt:18` explicitly makes persistence awaitable.

RN `src/features/notes/hooks/useNoteEditor.ts:117` dispatches, then immediately shows the saved message and clears the editor at `:119`–`:126`. The actual AsyncStorage write runs later in `src/state/store.tsx:140`–`:151`. A rejected write therefore cannot keep the editor open or suppress its success feedback. The global storage error/retry path **does** exist (`src/state/store.tsx:148`, `src/app/navigation/AppNavigator.tsx:67` and the hydrated app banner), so this is changed success/durability ordering, not “no storage handling.” Root should merge this with its general asynchronous persistence finding.

### CA04 — Group overview/progress/streak details are calculated or stored but not shown (P2, partial)

The active Kotlin group tab dispatcher calls the dashboard/progress/ranking components at `../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt:3604`, `:3614` and `:3624`. The dashboard displays active-today counts, total page/Juz/Hizb/Surah amounts, best week/month readers, and recent progress at `:5001`–`:5055`. The group progress component calculates and renders current amount versus target and its bar at `:5796`–`:5822`. Leaderboard rows show streak plus page/Juz/Hizb/Surah totals at `:7103`–`:7109`. The header displays privacy and group language at `:3807` and `:3827`.

RN `src/features/groups/screens/GroupScreen.tsx:444`–`:481` provides an overview containing description, member count, the configured target and code/share action. `src/features/groups/components/GroupProgressPanel.tsx:64`–`:99` renders aggregate points/pages, period ranking, and each member's pages/points. It never renders achieved goal progress or streak/activity, even though `src/services/groups/groupMetrics.ts:44`–`:65` calculates `streak` and `activeToday`. There is no consumer of those fields anywhere under `src/features/groups`; no other `goal_target` consumer renders an achieved/target calculation. `language_code` exists in `src/services/backend/types.ts:64` but has no group UI consumer. Non-managers also lose the displayed group privacy metadata.

This does **not** mean the leaderboard or member reading sheet is absent: RN period sorting works (`GroupProgressPanel.tsx:29`–`:31`), rows are clickable (`:87`–`:98`), and dated reading entries/ranges render at `:175`–`:194`.

The requested language-editing control is absent from both active Kotlin create/settings forms (`HamburgerMenu.kt:3001`, `:6251`; `GroupV2Repository.kt:617`, `:680` omit language) and RN `GroupFormFields.tsx:7`/`:33`. Kotlin displays the stored language; RN does not. Do not describe an editable-language control as something lost from Kotlin.

### CA05 — Long feed posts no longer have read-more/read-less controls (P3, behavior changed)

Kotlin's active `FeedPostCard` collapses text to six lines and exposes expansion/collapse: `../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt:7232`–`:7241`.

RN renders the entire post unconditionally at `src/features/groups/components/GroupFeedPanel.tsx:231`–`:233`, and the chat surface has no replacement folding action. Searches for `expanded`, `readMore`, `readLess`, `numberOfLines` and post-content rendering across both group screens/components found paging buttons but no per-post expansion state. The text is available; the missing behavior is folding very long posts, not content truncation or absent feed.

### CA06 — Invitation/group sharing emits only the custom scheme (P2, partial)

Kotlin creates a shareable HTTPS invitation with encoded token and language at `../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt:1480`–`:1484`, copies it at `:1490`, and sends that HTTPS link via the platform share sheet at `:1494`–`:1502`. Generic group sharing similarly uses its HTTPS group link (`:960`).

RN builds only `qurantracker://group/...?...invite=...` at `src/features/groups/components/GroupMembersPanel.tsx:55`–`:57`, copies/shares it at `:329`–`:340`, and generic group sharing at `src/features/groups/screens/GroupScreen.tsx:470`–`:475` also emits only the custom scheme. HTTPS incoming links remain supported (`src/app/navigation/linking.ts:4`, `src/services/groups/groupJoin.ts`), but no outgoing HTTPS alternative was found under `src/features/groups` or `src/services/groups`.

Installed-app token acceptance remains implemented and shares the SQL acceptance RPC. The changed output no longer provides the Kotlin web/app-link fallback for a recipient who opens the invitation outside an installed app. This is source-observed URL behavior; website deployment/fallback behavior was not exercised.

### CA07 — Save-and-share is offered when post permission is denied (P2, reachable permission mismatch)

Kotlin gates the progress-sharing form on both permissions at `../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt:3626`: `progress.create && post.create`.

RN gates the form only on `progress.create` (`src/features/groups/components/GroupProgressPanel.tsx:107`) and offers Save and share at `:159`–`:162` without checking `post.create`. The four settings switches are independent (`src/features/groups/components/GroupFormFields.tsx:127`–`:148`), so an owner can enable sharing progress while disabling posting messages. `src/services/groups/groupOperations.ts:273` forwards `p_share_to_feed`, but the shared `../supabase/migrations/20260904230000_group_detail_v2_app_api.sql:298`–`:300` rejects a sharing call with `GROUP_POST_FORBIDDEN`. The transaction rolls back, so this is an impossible enabled action and failed save/share, not an authorization bypass. The standalone non-feed Save action can still work.

Related observable change: Kotlin's Save action always records and shares a generated localized progress message (`../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt:1812`–`:1818`). RN primary Save calls `save(false)` (`src/features/groups/components/GroupProgressPanel.tsx:149`); its separate Save and share calls `save(true)` at `:162` and requires typed message text at `:161`. Both capabilities exist, but the original one-click auto-formatted sharing behavior is changed.

### CA08 — Notifications screen lacks the OS settings/status shortcut (P2, absent UI action)

Kotlin reads both system permission and channel importance at `../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt:34`–`:36`, refreshes status on resume at `:41`–`:45`, and opens `ACTION_APP_NOTIFICATION_SETTINGS` from its visible button at `:57`.

RN renders the local preferences panel (`src/features/account/screens/NotificationsScreen.tsx:393`) and a push registration status/action based on stored registration (`:240`–`:245`, `:436`–`:455`). A denied permission merely shows instruction text (`src/features/account/components/LocalRemindersPanel.tsx:72`–`:74`; `NotificationsScreen.tsx:348`–`:350`). There is no `Linking.openSettings` or equivalent action/status row anywhere in `src/features/account/screens/NotificationsScreen.tsx`, `src/features/account/components/LocalRemindersPanel.tsx`, `src/features/account/screens/SettingsScreen.tsx`, or `src/services/notifications`. Permission requests and push registration are implemented; the settings shortcut and equivalent refreshed OS/channel status are missing.

### CA10 — Email sign-up removes the repeat-password check (P3, behavior changed)

Kotlin's reachable sign-up form contains repeat password at `../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt:9021`–`:9040`; `validateSignup()` rejects mismatch at `:8783`–`:8788` and is invoked at `:9071`.

RN sign-up displays optional display name plus one password (`src/features/account/screens/AccountScreen.tsx:484`–`:499`), and directly calls signUp after only checking nonempty password at `:230`–`:231`. The `confirmation` state/field exists only for account-management actions at `:186` and `:643`–`:661`, not registration. Registration itself is implemented; this is the removed confirmation safeguard, not absent registration or a claim that the server accepts weak passwords.

## Requirement coverage

### 16 — Notes

| Requested behavior | Current status and traced evidence |
|---|---|
| Five scopes: Juz, Hizb, Rub, Surah, Ayah | **Present in reachable editor.** Kotlin `data/QuranNoteTarget.kt`, `ui/NoteTargetComponents.kt`; RN `NoteTargetControl.tsx:60`, `noteEditor.ts:53`–`:67`, `:117`–`:125`, `domain/quran.ts:15`–`:90`. No “ayah-only” finding is valid. |
| Scope-aware picker/links and descendants | **Picker/filter logic present; contextual callers partial.** Kotlin active callers and RN missing links are CA01. RN picker also derives start/end and quarter/Hizb transitions. |
| Search, scope/folder/tag/pinned filters, sort | **Present.** Kotlin `ui/AyahNotesScreen.kt:375`–`:389`, `:620`–`:629`; RN `NotesScreen.tsx:182`, `NoteFilterSheet.tsx`, `noteFilters.ts:22`–`:73`. Search covers body/title/tags/folder/surah/target title; pinned-first display sorting exists. |
| CRUD/pin and unsaved prompt | **Present, with durability ordering difference CA03.** RN `useNoteEditor.ts:68`–`:142`; `NotesScreen.tsx:93` uses navigation prevention; Kotlin `AyahNotesScreen.kt:326`–`:328`, `:361`, `:676`–`:692`. |
| Bold/italic/underline/headings/colors/lists/spans | **Present.** RN `NoteEditorView.tsx:136`–`:267`, `noteEditor.ts:146`–`:170`, `FormattedNote.tsx:32`–`:116`; Kotlin `AyahNotesScreen.kt:892`–`:954`, `:1199`–`:1260`. Native attributed input at `RichNoteInput.native.tsx:19`; web textarea has formatted preview. Neither active Kotlin preview nor RN supplies an interactive todo toggle, so the optional unused Kotlin toggle helper is not a regression. |
| JSON export all notes, original schema/local scope/order | **All/schema/values present; order fails CA02.** Kotlin `AyahNotesScreen.kt:839`–`:879`; RN `notesExport.ts:31`–`:135`, `useNoteEditor.ts:144`–`:157`. |
| Original import behavior | No separate notes-JSON import action in active Kotlin notes screen; RN likewise offers export, not an invented notes-import flow. Existing Android migration remains separate and was not changed. Root owns the wider import/data audit. |

### 17 — Groups

| Requested behavior | Current status and traced evidence |
|---|---|
| Create/open/search | **Present.** Kotlin `ui/GroupsOverviewScreen.kt:57`, `ui/HamburgerMenu.kt:3001`; RN `GroupsScreen.tsx:165`–`:282`, `GroupCreateWizard.tsx:25`, shared `backend.ts:271`–`:300`; `create_group_v3_full` in SQL `20261009120000_group_member_permissions.sql:53`. Search is within joined groups in both active implementations, not global discovery. |
| Join code, invitations, requests | **Present; outgoing link regression CA06.** RN `GroupJoinFlow.tsx:38`–`:94`, `GroupMembersPanel.tsx:25`–`:38`, `:120`–`:203`, `:308`; services `groupOperations.ts:124`–`:154`. Shared membership SQL plus idempotent acceptance `20261009070000_idempotent_group_invitation_acceptance.sql:4`. Kotlin overview “invitations” is a code/link entry card (`GroupsOverviewScreen.kt:131` and `:339`), not a hidden personal invitation inbox; no inbox loss asserted. |
| Name/description/type/goal/privacy/member permissions | **Present.** Kotlin `HamburgerMenu.kt:6251`–`:6382`, RN `GroupFormFields.tsx:33`–`:153`, `GroupSettingsPanel.tsx:48`–`:64`; service `backend.ts:496`. Shared SQL independently enforces `group.update`. |
| Group language | **Stored contract present; baseline editing absent; RN display lost (CA04).** Kotlin header `HamburgerMenu.kt:3827`, RN group type `backend/types.ts:64`. Both create/update RPC clients omit editable language. |
| Logo and personal group profile | **Present.** Kotlin `ui/GroupLogo.kt:32`, `HamburgerMenu.kt:3796`, `:8140`; RN `GroupProfilePanel.tsx:13`–`:124` reached from tools at `GroupScreen.tsx:267`/`:502`; service `groupOperations.ts:83`–`:122`; logo SQL `20260907010000_group_logos.sql`. |
| Roles, remove/block, delete group | **Present.** RN `GroupMembersPanel.tsx:49`–`:57`, `:213`–`:264`; `GroupSettingsPanel.tsx:67`–`:93`; `groupOperations.ts:73`–`:81`; shared membership SQL `20260905010000_group_membership_v2_actions.sql:21` and `:93`. UI excludes self/owner/higher ranks and checks permissions; server rechecks. No separate leave/ownership-transfer UI was found in either active baseline; not counted as lost. |
| Eight original tabs | **Reorganized, not eight missing functions.** Kotlin eight tabs at `HamburgerMenu.kt:4912`–`:4920`; RN shows Feed/Ranking/Members at `GroupScreen.tsx:355`–`:357`, with Overview/Media/Tasks/Events under tools at `:256`–`:267`. Progress and Ranking are merged. Overview/progress content reductions are CA04. This exact eight-tab structure is not preserved. |
| Text/progress/media posts | **Present.** RN `GroupFeedPanel.tsx:65`–`:164`; `GroupProgressPanel.tsx:48`; `GroupMediaPanel.tsx:27`–`:156`; `backend.ts:374` and `groupOperations.ts:165`, `:273`. Save/share behavior change and permission mismatch CA07. |
| Comments/reactions/edit/pin/delete/report | **Present.** RN feed actions `GroupFeedPanel.tsx:235`–`:258`, `:313`–`:412`, comment sheet `:433` onward; services `backend.ts:406`, `:431`, `groupOperations.ts:292`–`:315`; shared feed SQL `20260904233000_group_feed_v2_actions.sql:3`, `:50`, `:97`, `:262`, comment redaction override `20261009160000_allow_redacted_deleted_comments.sql:10`. Prior claims that edit/pin are missing are incorrect. |
| Expand long posts | **Changed**, CA05. Full content is available. |
| Media list/open/upload/share/delete | **Present.** RN `GroupMediaPanel.tsx:21`–`:173`; services `groupOperations.ts:155`–`:198`; shared `20260905020000_group_media_v2_actions.sql`. Kotlin active UI `HamburgerMenu.kt:3951`, `:4530`. Media here is group attachments; no unsupported generic image-visibility preference is asserted. |
| Tasks/events | **Present.** Kotlin `HamburgerMenu.kt:4058`, `:4642`, create/progress/event dialogs; RN `GroupTasksPanel.tsx:18`–`:289`, `GroupEventsPanel.tsx:11`–`:230`; backend task `:442`–`:493`, operations event `:201`–`:222`; shared `20260905030000_group_tasks_v2_actions.sql`, point-aware override `20260905040000_group_events_profiles_points_v3.sql:246`/`:297`, events `:409`/`:472`. |
| Rules/notices/moderation/audit | **RN reachable implementation; not a missing Kotlin UI.** Kotlin repository functions exist at `GroupV2Repository.kt:1065`–`:1197`, but all-package caller search found no active rules editing, moderation queue or audit UI; report-post and notification-tap handling are active. RN tools dispatch to `GroupGovernancePanels.tsx` and `GroupNoticesPanel.tsx` at `GroupScreen.tsx:498`–`:515`. Shared governance SQL in `20260906010000_group_management_api_v2.sql`. Mark as RN additions beyond Kotlin's reachable surface, not proof of old complete governance UI. |
| Reading + task points, total/week/month ranking | **Present.** RN `groupMetrics.ts:53`–`:65` combines ayah equivalents with point awards for trailing 7/30-day windows; `groupOperations.ts:283`–`:290` reads both entries and `list_group_point_totals_v2`; UI periods at `GroupProgressPanel.tsx:79`–`:99`. Kotlin matching algorithm `GroupV2Repository.kt:1398`–`:1466`; point SQL `20260905040000_group_events_profiles_points_v3.sql:344`. |
| Activity/streak and member reading dates/ranges | **Streak/activity calculated but hidden, CA04; reading details present.** RN `GroupProgressPanel.tsx:175`–`:194`, `groupReading.ts:6`–`:38`; Kotlin active row `HamburgerMenu.kt:7047`–`:7062`, `ui/GroupMemberReadingSheet.kt:76`–`:111`. |
| Separate from personal hifz | **Preserved.** Group writes go only through group RPCs (`groupOperations.ts:273`, `backend.ts:484`); group components do not dispatch personal hifz/read-history reducer actions. Shared group-progress tables are distinct. |

### 18 — Notifications

| Requested behavior | Current status and traced evidence |
|---|---|
| Menu access/device local enable | **Present.** Kotlin menu `ui/HamburgerMenu.kt:375`–`:378`; RN settings row `SettingsScreen.tsx:292`, route `AppNavigator.tsx:207`, local switch `LocalRemindersPanel.tsx:160`. |
| Daily plus extra reminder with separate times | **Present in scheduling code, including localized digit input.** RN `LocalRemindersPanel.tsx:161`–`:167`, `localReminders.ts:68`–`:92`, `planningReminderPort.ts:44`–`:58`; Kotlin `NotificationsScreen.kt:64`–`:70`, `NotificationCoordinator.kt:54`–`:65`. RN numeric fields normalize Arabic-Indic and Persian digits through `src/shared/components/Field.tsx:22`–`:23` before the time component filters them. |
| Agenda/planning reminders | **Present.** RN `localReminders.ts:58`–`:66`, planning coordinator `PlanningReminderCoordinator.tsx:18`–`:40`; Kotlin `NotificationCoordinator.kt:67`–`:68`, `:95`–`:106`. Local plan tests passed. Native OS scheduling/delivery not exercised. |
| Quiet hours | **Present.** RN `notificationPreferences.ts:47`–`:61`, `localReminders.ts:61`, push gate `groupPushPolicy.ts:56`–`:85`, push-device sync; Kotlin `NotificationPolicy.kt`, coordinator quiet checks. |
| Fixed reminders still fire after goal completion | **Present in code.** Kotlin `NotificationPolicy.kt:38` ignores target/done and coordinator passes zeros; RN `desiredLocalReminders` at `localReminders.ts:49`–`:93` uses enabled/time preferences, never daily-goal completion. Repeating DAILY triggers at `planningReminderPort.ts:44` cannot be cancelled by goal achievement alone. Device firing remains unverified. |
| OS settings/status | **Partial/absent action**, CA08. |
| Global group categories and per-group all/important/mentions/muted | **Present.** RN `NotificationsScreen.tsx:283`–`:327`, `:401`–`:428`, `:481`–`:497`; service `backend.ts:532`–`:592`; Kotlin `NotificationsScreen.kt:95`–`:129`. Temporary mute parameters exist in service but neither active Kotlin settings nor RN UI exposes duration selection; do not infer a missing RN duration control from unused strings. |
| Server group delivery | **Present in code; deployment/delivery unverified.** Latest comment trigger/dispatch in `../supabase/migrations/20261009190000_immediate_group_push_and_mute.sql:43`–`:58`; cron dispatcher `20261009181000_group_push_dispatcher.sql:44`; native device registration/claim `20261113090000_group_push_ios.sql:5`/`:37`; Edge dispatcher `../supabase/functions/group-push/index.ts:74`–`:119`; FCM/APNs credentials are environmental. RN registration is `pushDevice.ts:82`–`:138`, target/recipient gating `groupPushPolicy.ts:67`–`:92`, tap handling `PushNotificationHandler.tsx:48` onward. Only replies in participated discussions are currently the delivery contract, also stated by Kotlin `NotificationsScreen.kt:87`–`:88`; category controls do not prove all categories are pushed. |

### 21 — Account and local personal data

| Requested behavior | Current status and traced evidence |
|---|---|
| Email registration/sign-in | **Present; confirmation safeguard changed CA10.** Kotlin `SupabaseService.kt:1051`–`:1064`, active UI `HamburgerMenu.kt:9045`–`:9091`; RN `AccountScreen.tsx:220`–`:243`, auth adapter `auth.ts:62`–`:88`. RN additionally supports resend-confirmation UI/service. |
| Google sign-in and sign-out | **Present; real-provider round trip unverified.** Kotlin `SupabaseService.kt:1067`/`:1149`, `HamburgerMenu.kt:8949`; RN `AccountScreen.tsx:205`–`:218`, `:316`–`:329`, `googleOAuth.ts:5`–`:17`, `auth.ts:93`–`:98`. `linking.ts:7` routes auth callbacks to Account; root `AuthLinkHandler` verifies callbacks and handles recovery. Do not call recovery unreachable merely because the handler does not navigate explicitly. |
| Reset/change email/change password | **Present.** Kotlin `ui/AccountManagement.kt:111`–`:122`, `:152`–`:175`, service `SupabaseService.kt:1071`–`:1111`; RN `AccountScreen.tsx:171`–`:203`, `:269`–`:302`, `auth.ts:100`–`:147`, callback handler. New-password confirmation and 12–128 checks are retained for recovery/change. |
| Profile name/avatar | **Present.** Kotlin `HamburgerMenu.kt:9146`–`:9256`, `ProfileAvatarService.kt`; RN `AccountScreen.tsx:402`–`:430`, `hooks/useAccountProfile.ts:11`–`:127`, `services/profiles/profiles.ts:15`–`:84`. Tests verify upload bytes/path and profile update ordering; native picker/live storage delivery unverified. |
| Confirmed deletion and ownership/dependency restrictions | **Present.** Kotlin `AccountManagement.kt:145`–`:157`, `SupabaseService.kt:1114`–`:1127`; RN `AccountScreen.tsx:176`–`:202`, auth `auth.ts:149`–`:171`; shared `../supabase/migrations/20261007010000_account_management.sql:5`–`:45` rejects ownership/storage/restrictive linked data; `:49`–`:98` verifies caller, existing session, matching email, recent authentication and rechecks dependencies atomically. No actual deletion attempted. |
| Personal readings/hifz/notes/bookmarks remain local; login is not cloud sync | **Preserved architecture.** Kotlin personal data uses Room (`data/QuranProgressRepository.kt:39`–`:76`, `data/ReadingHistory.kt:6`, `data/AyahNote.kt:14`), bookmarks use device preferences (`ui/HamburgerMenu.kt:10920`). RN state includes these records (`src/state/models.ts:141`–`:156`) and persists to one local AsyncStorage snapshot (`src/state/store.tsx:140`–`:151`). Backend return at `src/services/backend/backend.ts:616` exposes auth/groups/notifications/audio/profiles, not a personal-data synchronization service. Auth changes attribute local history (`store.tsx:113`–`:124`) without uploading notes, hifz or bookmarks. Wider import/ownership behavior belongs to root's data audit. |

## Explicitly avoided false findings

- Post edit/pin, total/week/month ranking and dated member reading details exist in reachable RN UI and services.
- Rules/moderation/audit repository symbols in Kotlin do not establish corresponding active Kotlin UI; RN makes several of those capabilities reachable.
- Both native and server push code exist. Production configuration, migration application, FCM/APNs delivery and Realtime connectivity were not established by this source audit.
- No claim is made that a generic hide-images/group-media preference is missing. Root clarified item 20 refers to audio media settings; hifz-color switching is owned by the tracking audit.
- CA09 was rejected after root review and independent verification: `src/features/account/components/LocalRemindersPanel.tsx:200`/`:209` use `number-pad`; `src/shared/components/Field.tsx:22`–`:23` runs `normalizeNumericDigits` before the local regex handler; `src/shared/forms/inputNormalization.ts:14`–`:17` normalizes Arabic-Indic and Persian digits. The isolated regex was misleading; localized time input is implemented.
- All changes made by this audit are confined to `.tooling` reports/reproduction/logs.
