"""Conservative source-to-RN audit: file coverage is exhaustive; parity is not inferred from routes."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
DOCS = ROOT / 'docs'
DOCS.mkdir(exist_ok=True)
EXCLUDE = {'node_modules', 'build', '.gradle', '.git', '.expo', 'dist', 'android', 'ios'}
# Android/iOS authored Kotlin under the source project is included. The generated
# RN native projects are excluded separately, not the original app/src tree.
files = sorted(p for p in REPO.rglob('*.kt') if not any(x in {'node_modules','build','.gradle','.git','.expo','dist'} for x in p.relative_to(REPO).parts) and 'react-native' not in p.relative_to(REPO).parts)
kt = {p.relative_to(REPO).as_posix(): p.read_text(encoding='utf8') for p in files}
rn = {p.relative_to(ROOT).as_posix(): p.read_text(encoding='utf8') for p in [*ROOT.glob('src/**/*.ts'), *ROOT.glob('src/**/*.tsx'), ROOT/'App.tsx']}


def evidence(sources, path_fragment, needle):
    hits = []
    for path, text in sources.items():
        if path_fragment not in path:
            continue
        for number, line in enumerate(text.splitlines(), 1):
            if needle in line:
                hits.append({'path': path, 'line': number, 'symbol': needle})
                break
    return hits


# Historical feature IDs/source-contract seeds. Their old RN locations and
# draft gap wording are not the current verdict: reviewed F26 metadata below
# overrides every row before output and rejects missing current anchors.
FEATURES = []
def feature(id, title, status, priority, source_file, source_symbol, target_file, target_symbol, gap, dependencies=()):
    FEATURES.append({'id': id, 'title': title, 'status': status, 'priority': priority,
        'kotlinEvidence': evidence(kt, source_file, source_symbol),
        'reactNativeEvidence': evidence(rn, target_file, target_symbol),
        'reactNativeSearchScope': target_file, 'reactNativeSearchTerm': target_symbol,
        'gap': gap, 'dependencies': list(dependencies),
        'verification': 'static source inspection; device behavior requires acceptance checks'})

feature('navigation.top-level', 'Seven top-level destinations and tab root restoration', 'partial', 'P0', 'MainActivity.kt', 'val bottomItems', 'App.tsx', 'MainTabs', 'RN composition has been redesigned during this audit; verify all seven source entrypoints and tab-root restoration. A route declaration is not behavioral parity.')
feature('copy.source-values', 'Curated source UI wording with provenance', 'partial', 'P0', 'AppText.kt', 'object AppText', 'src/i18n/index.ts', 'sourceCatalog', 'Source catalog and semantic lookup are restored. Remaining screen-local language maps and pending new RN-only copy require reconciliation.')
feature('locale.french', 'Legacy French helper translations (not a selectable source language)', 'unverified', 'P2', 'LanguageEntry.kt', 'enum class AppLanguage', 'src/i18n/index.ts', "type Locale", 'Source AppLanguage offers only Dutch/English/Arabic. Preserve French helper values as data; do not count an unsupported French locale as a confirmed parity omission.')
feature('home.motivation', 'Motivation points, bonus, levels and history', 'missing', 'P1', 'DashboardScreen.kt', 'fun MotivationPointsCard', 'features/home/HomeScreen.tsx', 'MotivationPoints', 'Source shows point totals, next level, bonuses and motivation history; RN home has no corresponding computation or panel.')
feature('home.hifz-recommendations', 'Weak/strong scores and review-due recommendations', 'missing', 'P1', 'DashboardScreen.kt', 'fun HifzOverviewCard', 'features/home/HomeScreen.tsx', 'reviewDue', 'Hifz score summaries, weakest/strongest sections and score-age review advice are omitted.', ['hifz.consistency'])
feature('home.hizb-analytics', 'Hizb check-in chart with custom date range and detail', 'missing', 'P1', 'HizbOverviewCard.kt', 'fun HizbOverviewCard', 'features/home/HomeScreen.tsx', 'HizbOverview', 'Source overview filters week/month/year/custom and taps a Hizb for details; RN basic seven-day dots do not provide this.')
feature('stats.drilldown', 'Statistics grouping, range drilldown and ayah details', 'missing', 'P0', 'StatsDrilldown.kt', 'fun ', 'features/practice/StatsScreen.tsx', 'drilldown', 'RN only aggregates unit totals and lists last 50 rows. Source drilldown periods, complete ayah ranges and overlap-aware details are absent.')
feature('stats.reading-metrics', 'Ayah equivalent, pages, coverage and motivation statistics', 'partial', 'P1', 'ReadingMetrics.kt', 'fun ', 'features/practice/StatsScreen.tsx', 'const units', 'Raw counts by unit do not implement source ayah-equivalent conversion, per-section distribution and source metric panels.')
feature('stats.clear-reading', 'Scoped clear-reading-data action preserving hifz/plans/settings', 'missing', 'P1', 'StatsScreen.kt', 'stats.clearHistoryTitle', 'features/practice/StatsScreen.tsx', 'clearHistory', 'Source destructive action explicitly clears only reading data; RN Stats has no action.')
feature('groups.discovery', 'Group discovery, search, filters and group creation wizard', 'partial', 'P1', 'GroupsOverviewScreen.kt', 'fun GroupsOverviewScreen', 'features/groups/GroupsScreen.tsx', 'create', 'RN create/join/list exists; source public discovery, topic/goal filtering and full multi-step setup require parity.')
feature('groups.feed', 'Messages, comment threads and likes', 'partial', 'P1', 'GroupV2Repository.kt', 'suspend fun loadFeed', 'features/groups/GroupScreen.tsx', 'feed', 'Basic feed/comments/likes exist. Source rich feed presentation and authorization must be checked independently.')
feature('groups.post-edit-pin', 'Edit/pin/delete posts and richer reactions', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun setPostPinned', 'services/backend.ts', 'setPostPinned', 'Backend adapter and group UI omit edit-post/pin/unpin and source reaction types.', ['groups.feed'])
feature('groups.member-reading', 'Member reading summary with individual surah details', 'missing', 'P1', 'GroupMemberReadingSheet.kt', 'fun GroupMemberReadingSheet', 'features/groups/GroupScreen.tsx', 'MemberReading', 'RN member list has no source reading activity sheet.', ['groups.permissions'])
feature('groups.permissions', 'Custom roles, role assignment, remove and block members', 'missing', 'P0', 'GroupV2Repository.kt', 'suspend fun setMemberRole', 'services/backend.ts', 'setMemberRole', 'Displayed permission strings do not implement source role/membership management operations.')
feature('groups.invitations', 'Create/revoke/accept invitations and pending states', 'missing', 'P0', 'GroupV2Repository.kt', 'suspend fun createInvitation', 'services/backend.ts', 'createInvitation', 'RN joins by code only; invitation lifecycle is absent.', ['groups.permissions'])
feature('groups.join-requests', 'Request access and approve/reject join requests', 'missing', 'P0', 'GroupV2Repository.kt', 'suspend fun reviewJoinRequest', 'services/backend.ts', 'reviewJoinRequest', 'Private/restricted membership routing lacks source request lifecycle.', ['groups.permissions'])
feature('groups.media', 'Media upload/list/preview/download/delete', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun uploadMedia', 'services/backend.ts', 'uploadMedia', 'No group media tab or native media lifecycle.', ['groups.permissions'])
feature('groups.events', 'Create events, RSVP, cancel/complete events', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun createEvent', 'services/backend.ts', 'createEvent', 'No source event tab or operations.', ['groups.permissions'])
feature('groups.tasks', 'Task creation, targets, participant progress and status', 'partial', 'P1', 'GroupV2Repository.kt', 'suspend fun createTask', 'features/groups/GroupScreen.tsx', 'task', 'RN task creation/progress exists; source statuses, filters, permissions and edit/close paths require checks.')
feature('groups.rules', 'Published group rules and history', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun publishRules', 'services/backend.ts', 'publishRules', 'Source group rules repository/UI omitted.', ['groups.permissions'])
feature('groups.moderation', 'Report posts, review reports and audit log', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun reviewModerationReport', 'services/backend.ts', 'reviewModerationReport', 'No report queue, moderation review or group audit log.', ['groups.permissions'])
feature('groups.leaderboard', 'Reading/task points leaderboard and group progress dashboard', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun loadLeaderboard', 'services/backend.ts', 'loadLeaderboard', 'RN member counts and task cards omit source points leaderboard/dashboard.')
feature('groups.profile-logo', 'Per-group display name/avatar and group logo', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun updateMyGroupProfile', 'services/backend.ts', 'updateMyGroupProfile', 'Account-wide avatar does not provide source per-group identity and group logo lifecycle.')
feature('groups.delete', 'Group deletion and destructive confirmation', 'missing', 'P1', 'GroupV2Repository.kt', 'suspend fun deleteGroup', 'services/backend.ts', 'deleteGroup', 'RN group settings omit source deletion danger zone.', ['groups.permissions'])
feature('groups.notification-routing', 'Push notification target, preferences and in-group notices', 'partial', 'P1', 'QuranMessagingService.kt', 'class QuranMessagingService', 'features/account/pushDevice.ts', 'register', 'RN push/preferences adapter exists; source remote notification behavior, read state and per-group mute policy need device/backend validation.')
feature('reader.selection-toolbar', 'Selected-ayah toolbar: copy, play, repeat, bookmark, share and study', 'partial', 'P0', 'QuranReaderScreen.kt', 'fun AyahSelectionToolbar', 'features/quran/ReaderScreen.tsx', 'renderItem', 'RN has per-ayah bookmark/note/study/share but omits contextual copy and ayah-targeted playback/repeat. Source selection is single-ayah; no unsupported multi-ayah range feature is asserted.')
feature('reader.immersive', 'Reader mode hides outer navigation chrome', 'missing', 'P1', 'QuranReaderScreen.kt', 'onReaderModeChanged', 'features/quran/ReaderScreen.tsx', 'headerShown', 'Source MainActivity hides chrome in selected-chapter reader mode; RN reader keeps stack chrome. No source autoscroll control was located, so autoscroll is not counted as a parity gap.')
feature('reader.word-by-word', 'Word-by-word grammar/translation study', 'partial', 'P1', 'QuranReaderScreen.kt', 'WordByWord', 'features/study/StudyScreen.tsx', 'word', 'Separate RN study screen exists; source inline reader interaction still requires behavioral comparison.')
feature('reader.cursor-bookmarks', 'Persistent position, page and ayah bookmarks', 'partial', 'P1', 'HamburgerMenu.kt', 'loadAllReaderBookmarkSummaries', 'features/quran/ReaderScreen.tsx', "type: 'bookmark'", 'RN ayah cursor/bookmarks exist; source per-edition page bookmarks and bookmark catalog need separate verification.')
feature('mushaf.library', 'Mushaf library with full-edition download and install state', 'partial', 'P0', 'HamburgerMenu.kt', 'fun MushafSettingsPage', 'features/quran/MushafScreen.tsx', 'loadMaknoon', 'RN supports bundled Hafs/Muhammadi and per-page Warsh Maknoon cache only. Source PDF editions, IndoPak/Hafs Maknoon and full downloads/install state are omitted.')
feature('mushaf.warsh-geometry', 'Warsh Maknoon geometry and Warsh-to-Hafs ayah mapping', 'partial', 'P0', 'WarshMaknoonGeometry.kt', 'fun ', 'features/quran/mushafGeometry.ts', 'hafsReferences', 'Geometry and reference mapping are ported, but source instrumented fixtures must pass and installed editions/page dimensions need parity checks.')
feature('audio.repeat', 'Whole-surah/ayah/page repeat queue and reciter timing', 'partial', 'P0', 'RepeatSequence.kt', 'fun ', 'domain/repeat.ts', 'build', 'RN repeat domain/queue exists; preserve source reciter compatibility, gap/round semantics, Warsh boundary rules, recovery and actual device completion.')
feature('audio.global-controls', 'Global audio player, skip interval, autoplay and sleep timer', 'partial', 'P1', 'GlobalAudioPlayer.kt', 'class GlobalAudioPlayer', 'features/audio/AudioProvider.tsx', 'MiniPlayer', 'RN global player exists; compare all source controls and lifecycle/error behavior, not player visibility alone.')
feature('focus.intentions', 'Focus goal selection and link to reading/memorization/review/tafsir', 'missing', 'P0', 'FocusSessionScreen.kt', 'data class FocusGoal', 'features/practice/FocusScreen.tsx', 'FocusGoal', 'RN timer logs time only and omits four source intentions and goal association.')
feature('focus.custom-duration', 'Custom focus session duration', 'missing', 'P1', 'FocusSessionScreen.kt', 'customPlaceholder', 'features/practice/FocusScreen.tsx', 'customPlaceholder', 'RN offers 5/15/25/45-minute presets only; source editable custom duration is omitted.')
feature('hifz.consistency', 'Independent/derived scores and optional Juz-leading consistency confirmation', 'missing', 'P0', 'HifzScores.kt', 'fun ', 'features/practice/ProgressScreen.tsx', 'consistency', 'RN saves flat scores; source derived Juz fallback, assessment age, Juz-leading preference and explicit both-Hizb update confirmation must be restored.')
feature('hifz.bulk-range', 'Bulk score range editor and multi-select', 'partial', 'P1', 'HamburgerMenu.kt', 'fun HifzRangeEditor', 'features/practice/ProgressScreen.tsx', 'selected', 'RN selected-item check-in exists; source score-range assignment and independent Juz/Hizb handling require checks.')
feature('onboarding.interactive', 'Interactive reading/hifz/planning/statistics/focus/groups previews', 'missing', 'P0', 'OnboardingReadingPreview.kt', 'fun ', 'features/onboarding/OnboardingScreen.tsx', 'const steps', 'RN static cards/text and one verse preview omit source interactive demos and their no-persistence boundaries.')
feature('onboarding.checkpoint', 'Onboarding step checkpoint, process restoration and replay', 'missing', 'P1', 'OnboardingStep.kt', 'enum class OnboardingStep', 'features/onboarding/OnboardingScreen.tsx', 'useState(0)', 'RN local index resets at process death and lacks source replay/checkpoint acceptance behavior.')
feature('notes.scopes', 'Juz/Hizb/Rub/Surah/Ayah note targets and migration', 'partial', 'P0', 'QuranNoteTarget.kt', 'data class QuranNoteTarget', 'features/notes/NotesScreen.tsx', 'target', 'RN scoped notes are partly migrated; source target validation, parent-child inclusion, collision handling and migrations need contract-level checks. Source NoteScope has no page/range target.')
feature('notes.rich-export', 'Rich text, folders/tags/pins, import/export', 'partial', 'P1', 'AyahNotesScreen.kt', 'fun FormattedNoteText', 'importing/notesExport.ts', 'export', 'RN note formatting/export exists; source full formatting span edits, folder hierarchy, import semantics and sharing require behavior checks.')
feature('planning.agenda', 'Calendar, one-off planning, reminders and completion', 'partial', 'P0', 'AgendaScreen.kt', 'fun AgendaScreen', 'features/planning/PlanningScreen.tsx', 'Calendar', 'RN calendar/plans exist. Source day/week/month layouts, session types, reminder restoration and completion relationships must be checked.')
feature('planning.reading-plan', 'Quantity-based reading plan independent of daily goal', 'missing', 'P0', 'ReadingPlanScreen.kt', 'fun ReadingPlanScreen', 'features/planning/PlanningScreen.tsx', 'ReadingPlanScreen', 'RN journey scheduling is not the source quantity-based reading plan: optional finish date, automatic unit conversion and manual total correction are distinct.')
feature('planning.journey', 'Khatma journey and optional automatic daily goal link', 'partial', 'P1', 'ReadingJourneyDialog.kt', 'fun ReadingJourneyDialog', 'domain/journey.ts', 'build', 'RN rub journey generation exists; source goal linking, forecast and adjustment controls need full comparison.')
feature('goals.unfinished-days', 'Three daily goal types with carry/spread/skip decisions', 'partial', 'P0', 'GoalHubPanel.kt', 'fun GoalHubPanel', 'domain/goals.ts', 'resolveGoalDay', 'Core domain is ported; source linked Agenda sessions, finish forecast and full UI actions require checks.')
feature('notifications.policy', 'Quiet hours, dual daily reminder and preference rollback', 'partial', 'P0', 'NotificationPolicy.kt', 'fun ', 'features/account/NotificationsScreen.tsx', 'quiet', 'RN screens/preferences exist; background delivery, timezone/DST, permission denial, quiet-hour rescheduling and atomic rollback need device validation.')
feature('account.management', 'Optional account, Google/email auth, password/email/deletion policies', 'partial', 'P0', 'AccountManagement.kt', 'fun ', 'features/account/AccountScreen.tsx', 'delete', 'RN account flows exist; server eligibility, recent login, ownership-linked restrictions, OTP and native deep-link completion need validation.')
feature('migration.room', 'Legacy Room data migration preserving local progress and notes', 'partial', 'P0', 'QuranDatabase.kt', 'class QuranDatabase', 'migration/legacyRoom.ts', 'migrate', 'RN importer exists; original Room schema versions and scope migrations must each have fixtures and durable commit validation.')

# Findings are refreshed as concrete source ports land. A port with unit-level
# evidence remains partial until its native acceptance workflow is exercised.
updates = {
 'home.motivation': ('features/home/PracticeOverview.tsx','motivationStats','Source integer conversions, bonus/levels and UI have been ported; native display/persistence verification remains.'),
 'home.hifz-recommendations': ('features/home/PracticeOverview.tsx','reviewDue','Explicit assessments, weak/strong scores and review-due recommendations are now present; verify source presentation and actions on device.'),
 'home.hizb-analytics': ('features/home/HizbOverviewCard.tsx','HizbOverviewCard','Week/month/year/custom range, owner-scoped SQL-equivalent registration counts, all 60 bars, selection and expansion are ported. Domain tests cover DST, month-end clamping and owner/type filtering; native interaction remains to verify.'),
 'stats.drilldown': ('features/practice/StatsScreen.tsx','statsReadingBuckets','Three simultaneous source registration-count rings, count/percentage legends, exact top-eight membership, period boundaries, clockwise hit testing and complete virtualized details are ported and shared with Home. Day/week/month collapsible history includes ISO week-year boundaries and source legacy Rub/day summaries. Exact recorded Mushaf page/edition takes precedence when opening detail; canonical ranges never imply full partition completion for page reads. Twelve source contracts pass; compare screenshots and device interactions before marking verified.'),
 'stats.reading-metrics': ('features/practice/StatsScreen.tsx','historyAyahEquivalent','Source summary quantities/points, repeated Surah reads, Rub markers, max(explicit, complete-quarter) Hizb/Juz progress, today/Monday-week/month equivalents and read+memorized streak are restored. Seven-day chart and explicit assessed-Hizb mastery remain present. New page registrations use trustworthy exact canonical bounds where available; legacy conversions remain unchanged. Native screenshot comparison remains.'),
 'stats.clear-reading': ('features/practice/StatsScreen.tsx','clearReading','Source-confirmed scoped reset is reachable with the exact confirmation copy. Regression tests prove reading history/counts clear while hifz, memory flags, plans and settings remain. Verify durable native flow.'),
 'reader.immersive': ('features/quran/ReaderScreen.tsx','headerShown','Source reader-mode chrome hiding is being ported; verify final callsites and native back/navigation behavior. No source autoscroll is claimed.'),
 'focus.intentions': ('features/practice/FocusScreen.tsx','focus.goals','Four source intentions and the global persisted timer are ported; verify foreground/background completion and floating controls.'),
 'focus.custom-duration': ('features/practice/FocusScreen.tsx','focus.custom','Source 10/15/25/45-minute presets and custom 1–180-minute duration are ported; native control verification remains.'),
 'onboarding.interactive': ('features/onboarding/OnboardingScreen.tsx','ReadingPreview','Six source preview steps and isolated demo state are ported; device tests must establish no demo side effects and complete navigation behavior.'),
 'onboarding.checkpoint': ('features/onboarding/OnboardingScreen.tsx','onboardingStep','Stable source step IDs, persisted checkpoint and replay are now present; process-death restoration remains a native acceptance gate.'),
 'planning.agenda': ('features/planning/PlanningScreen.tsx','AgendaCalendar','Source selected-day plans, Monday-first week strip/expandable month, day status, ordering, goal entrypoints, three session types, upcoming/all and missed lists are ported; source regression contracts pass. Native date/reminder transitions remain to verify.'),
 'planning.reading-plan': ('features/planning/ReadingPlanScreen.tsx','ReadingPlanScreen','Independent quantity plan now has its own persistent sidecar, source unit conversion, optional finish date, manual total correction and Home card. Eight tests cover counting/normalization/migration/corrupt storage/atomic commit. Native flow remains to verify.'),
 'planning.journey': ('features/planning/ReadingJourneyPanel.tsx','ReadingJourneyPanel','Source single 604-page journey follows the current reading goal and logged progress; pages/day or finish-date dialog saves the daily goal and retained-start journey together. Scheduled khatma itineraries remain separate. Domain contracts pass; native display remains to verify.'),
 'goals.unfinished-days': ('features/practice/GoalsScreen.tsx','matchingPlans','Three goal types, reminder editing, carry/spread/skip, Agenda scheduling and exact matching-plan completion are now ported. Linked registration is idempotent and clears the plan reminder; tests cover mismatches and duplicate prevention. Native flows remain to verify.'),
 'mushaf.library': ('features/quran/MushafLibraryScreen.tsx','MushafLibraryScreen','Source edition library, installation state and complete download flows are present, including PDF editions and Hafs/Warsh Maknoon. Verify downloaded page/PDF rendering, cancellation, deletion and offline restart on Android.'),
 'notes.scopes': ('features/notes/NoteTargetControl.tsx','NoteTargetControl','All five source note scopes have a searchable target picker, hierarchy-preserving transitions, full-Hizb/quarter/Juz level controls and verse opening summary. Scoped route/context updates and source migration contracts are retained. Native workflows remain to verify.'),
 'notes.rich-export': ('features/notes/FormattedNote.tsx','FormattedNote','Source export schema v2/nullable fields/ordering/UTF-8/UTC filename are unchanged and existing compatibility tests pass. Six source color keys, span precedence/colors, TODO presentation, display-size clamp, title/excerpt fallback, pin timestamp and editor back/preview behavior are restored. Native editor now forwards per-span styled Text children to native TextInput (without value/defaultValue), matching RN attributed-string support; web keeps plain editing plus rich preview. Mixed-style typing, selections, IME, back/discard and process restoration remain native acceptance gates.'),
}
for f in FEATURES:
    if f['id'] in updates:
        path, symbol, gap = updates[f['id']]
        f.update(status='partial', gap=gap, reactNativeEvidence=evidence(rn,path,symbol), reactNativeSearchScope=path, reactNativeSearchTerm=symbol)
    if f['id']=='groups.discovery':
        f.update(title="Search/filter the user's groups and creation wizard", gap='Source discovery-labelled tab searches the user’s existing groups and shows suggestions; no public-discovery RPC exists. Preserve own-list name/description/code/category filtering and source creation wizard. Native/backend verification remains.')
    if f['id']=='hifz.consistency':
        f.update(title='Independent explicit Hifz assessments and non-mutating consistency advice', status='partial', gap='The active source Dashboard uses explicit independent Juz/Hizb scores and threshold-20 advisory. derivedJuzHifzScore and Juz-leading confirmation strings are dormant source helpers/copy, not shipped behavior requirements. RN assessment/range/advice ports require native comparison.', kotlinEvidence=evidence(kt,'DashboardScreen.kt','shouldConfirmJuzHifzScore'), reactNativeEvidence=evidence(rn,'domain/hifz.ts','inconsistentJuz'))
    if f['id'] in ('groups.rules','groups.moderation'):
        f['kotlinRuntimeExposure'] = 'Repository API only; no source UI callers located. New RN operational panels use explicitly new functional copy, not fabricated source provenance.'
    if f['id'].startswith('groups.') and f['status']=='missing':
        method = f['reactNativeSearchTerm']
        hits = evidence(rn,'services/groupOperations.ts',method)
        if hits:
            f.update(status='partial',reactNativeEvidence=hits,gap='Source operation has a concrete RN backend adapter and group panels are being wired. Validate input contracts, permissions, state/error recovery and native/backend behavior before claiming parity.')
group_renames = {'groups.post-edit-pin':('features/groups/GroupFeedPanel.tsx','pinPost'), 'groups.member-reading':('features/groups/GroupProgressPanel.tsx','member?.entries'), 'groups.moderation':('features/groups/GroupGovernancePanels.tsx','reviewReport'), 'groups.leaderboard':('features/groups/GroupProgressPanel.tsx','listLeaderboard'), 'groups.profile-logo':('features/groups/GroupProfilePanel.tsx','updateMyProfile')}
for f in FEATURES:
    if f['id'] in group_renames:
        path,symbol = group_renames[f['id']]
        hits=evidence(rn,path,symbol)
        if hits: f.update(status='partial',reactNativeEvidence=hits,reactNativeSearchScope=path,reactNativeSearchTerm=symbol,gap='Concrete RN panel and renamed backend operations are present. Verify source permission rules, exact server contracts, state/error recovery and native/backend behavior; method-name differences are not a missing-feature finding.')
    if f['id']=='notes.rich-export': f['title']='Rich text, folders/tags/pins and exact notes export (no source file import)'

feature('account.google-oauth','Google OAuth launch, secure PKCE and strict native callbacks','partial','P0','SupabaseService.kt','suspend fun signInWithGoogle','services/googleOAuth.ts','googleOAuthUrl','Signed-out Account uses exact source Google labels, trusted Supabase authorize URL, secure native CSPRNG/S256 and durable secure verifier/session storage. Callback rejects userinfo/ports/paths/duplicates/mixed credentials and preserves reset/email policies. Six local no-network contracts pass; rebuilt native launch/callback/recovery and session-refresh workflows remain to verify.')

feature('checklist.coverage','Tahajjud checklist partition coverage and separate stopping position','partial','P1','ReadingChecklist.kt','fun ','features/practice/ChecklistScreen.tsx','ChecklistScreen','Partition coverage and independent saved position are present; verify source reset operations, parent/child synchronization and process persistence.')
feature('study.translation','Translation source selection and per-ayah reading','partial','P1','TranslationScreen.kt','fun TranslationScreen','features/study/StudySourcesScreen.tsx','translationProviders','Bundled/remote provider paths exist; source provider selections, fallback/error text and source attribution require workflow comparison.')
feature('study.tafsir','Arabic tafsir provider selection and ayah retrieval','partial','P1','TafsirScreen.kt','fun TafsirScreen','features/study/studyProviders.ts','tafsirProviders','Concrete providers/retrieval exist; compare all source options, HTML cleaning, caching and source availability behavior.')
feature('study.irab','Book-based grammatical commentary and reliable reference mapping','partial','P1','IrabScreen.kt','fun IrabScreen','features/study/StudySourcesScreen.tsx','irab','RN commentary exists; source mapping refusal, verse source citation and failure/rate-limit states require acceptance checks.')
feature('study.asbab','Asbab availability and source-report reading','partial','P1','AsbabAvailability.kt','fun ','features/study/StudySourcesScreen.tsx','asbab','Availability and reports are present; source book-specific coverage and unavailable-reference behavior require comparison.')
feature('study.books','Fiqh book library, metadata, contents, text search and page reading','partial','P1','BookReaderScreen.kt','fun BookReaderScreen','features/study/BooksScreen.tsx','BookReaderScreen','All seven source catalog definitions/biographies and source text are extracted verbatim with provenance. Book/chapter dropdowns, ordered page reading, 60-result text/chapter search, biography expansion and selectable Arabic text are ported; source printf page/count labels use the shared formatter. Source has no active madhhab filter, bookmarks, adjustable font or persistent book position, so those are not claimed as omitted features. Native database/selection/dropdown verification remains.')
feature('study.mutashabihat-global','Global similar-passage search by Juz and query','partial','P1','MutashabihatScreen.kt','selectedJuz','features/study/MutashabihatScreen.tsx','selectedJuz','Global screen now loads all 1344 original groups, filters all/Juz 1-30 and source/match references/Surah names, expands every match, retains source context and attribution, and opens canonical Mushaf references. Exact asset equality and four source-domain contracts pass. Native filter/expansion/navigation acceptance remains separate.')

# Reviewed paths survive the feature folder split. Fail on drift instead of
# silently regenerating a false missing-feature conclusion from an old path.
reviewed = json.loads((ROOT / 'data/feature-evidence-f26.json').read_text(encoding='utf8'))
if set(reviewed['features']) != {f['id'] for f in FEATURES}:
    raise ValueError('Every feature needs a current reviewed evidence anchor')

def current_anchor(anchor):
    path, symbol = anchor['path'], anchor['symbol']
    text = (ROOT / path).read_text(encoding='utf8')
    for line, value in enumerate(text.splitlines(), 1):
        if symbol in value:
            return {'path': path, 'line': line, 'symbol': symbol}
    raise ValueError(f'Current evidence anchor was not found: {path}: {symbol}')

for f in FEATURES:
    record = reviewed['features'][f['id']]
    f.update(status=record['status'],
             reactNativeEvidence=[current_anchor(record), *[current_anchor(a) for a in record.get('extraEvidence', [])]],
             reactNativeSearchScope=record['path'], reactNativeSearchTerm=record['symbol'])
    if 'gap' in record:
        f['gap'] = record['gap']

f26_changes = []
for change in reviewed['changes']:
    for path in change['testPaths']:
        if not (ROOT / path).is_file():
            raise ValueError(f'Correction test is missing: {path}')
    f26_changes.append({**{k: v for k, v in change.items() if k != 'reactNativeAnchors'},
                        'reactNativeEvidence': [current_anchor(a) for a in change['reactNativeAnchors']],
                        'testEvidenceMeaning': 'Contract tests are linked; the inventory generator does not execute them. Final device/build results live in NATIVE_QA and WORK_STATUS.'})

contract_tests = {
 'account.google-oauth':['tests/auth-callback.test.ts'], 'stats.drilldown':['tests/statistics.test.ts'], 'stats.clear-reading':['tests/statistics.test.ts'],
 'home.hizb-analytics':['tests/hizb-analytics.test.ts'], 'planning.reading-plan':['tests/reading-plan.test.ts'],
 'planning.journey':['tests/reading-journey.test.ts'], 'planning.agenda':['tests/agenda.test.ts'],
 'goals.unfinished-days':['tests/agenda.test.ts'], 'copy.source-values':['tests/i18n.test.ts'],
 'notes.rich-export':['tests/notes-format.test.ts','tests/import-compatibility.test.ts'],
 'notes.scopes':['tests/notes-format.test.ts','tests/legacy-room-migration.test.ts'],
 'study.books':['tests/book-catalog.test.ts'],
 'study.mutashabihat-global':['tests/mutashabihat.test.ts'],
}
for f in FEATURES:
    f['acceptanceEvidence'] = [{'path':p,'status':'source-contract test present; execution and native/backend acceptance are recorded separately'} for p in contract_tests.get(f['id'],[])]

symbols_pattern = re.compile(r'(?m)^[ \t]*(?:(?:private|internal|public|protected|override|suspend|inline|tailrec|open|abstract)\s+)*(?P<kind>fun|(?:data\s+|sealed\s+|enum\s+)?class|object|interface)\s+(?:<[^\n]+?>\s*)?(?P<name>[A-Za-z_][\w.<>?]*)')
file_rows = []
for path, text in kt.items():
    is_test = '/test/' in path or '/androidTest/' in path
    symbols = [{'kind': m['kind'], 'name': m['name'], 'line': text.count('\n',0,m.start())+1} for m in symbols_pattern.finditer(text)]
    associated = [f['id'] for f in FEATURES if any(e['path']==path for e in f['kotlinEvidence'])]
    # Map supporting modules to product areas without claiming exact parity.
    stem = Path(path).stem
    for prefix, feature_ids in [('Group', ['groups.feed','groups.permissions']), ('ReadingChecklist',['checklist.coverage']), ('Repeat',['audio.repeat']), ('Onboarding',['onboarding.interactive','onboarding.checkpoint']), ('Hifz',['hifz.consistency']), ('Hizb',['home.hizb-analytics']), ('Notification',['notifications.policy']), ('Planning',['planning.agenda']), ('Goal',['goals.unfinished-days']), ('AyahNote',['notes.scopes']), ('Authentication',['account.management']), ('Account',['account.management']), ('ReadingPlan',['planning.reading-plan']), ('ReadingJourney',['planning.journey']), ('Stats',['stats.drilldown']), ('Warsh',['mushaf.warsh-geometry']), ('QuranReader',['reader.selection-toolbar','reader.immersive']),('Translation',['study.translation']),('Tafsir',['study.tafsir']),('Irab',['study.irab']),('Asbab',['study.asbab']),('Book',['study.books']),('Mutashabihat',['study.mutashabihat-global'])]:
        if stem.startswith(prefix):
            associated.extend(feature_ids)
    associated = sorted(set(associated))
    # Every source symbol is represented even when mapping is unresolved. This
    # intentionally exposes remaining review work instead of claiming coverage.
    symbol_rows = []
    for symbol in symbols:
        exact = []
        if not is_test:
            for rn_path, rn_text in rn.items():
                if re.search(r'\b' + re.escape(symbol['name'].split('.')[-1]) + r'\b', rn_text):
                    exact += evidence({rn_path:rn_text}, rn_path, symbol['name'].split('.')[-1])[:1]
        symbol_rows.append({**symbol, 'status': 'unverified', 'candidateReactNativeEvidence': exact[:8], 'note': 'Name matches are review leads only, not proof of equivalent behavior.' if exact else 'No same-name implementation located; inspect renamed implementation before classifying missing.'})
    file_rows.append({'path':path, 'sha256':hashlib.sha256(text.encode('utf8')).hexdigest(), 'lineCount':len(text.splitlines()), 'role':'acceptance-contract' if is_test else 'debug-tool' if '/debug/' in path else 'product-source', 'status':'unverified', 'featureIds':associated, 'symbols':symbol_rows, 'imports':[m[1] for m in re.finditer(r'^import\s+([\w.*]+)',text,re.M)], 'review': 'Entire file read as UTF-8 and indexed; product behavior status is tracked per feature. Unverified means semantic/device equivalence has not been established.'})

payload = {'schemaVersion':2, 'checkpoint':'F26', 'evidenceMetadata':'data/feature-evidence-f26.json', 'scope':'All authored repository Kotlin excluding generated build/cache files, dependencies and generated RN native projects.', 'sourceFileCount':len(file_rows), 'sourceLineCount':sum(f['lineCount'] for f in file_rows), 'statusRules':{'implemented':'Behavior and acceptance criteria verified, not merely a route or method name.','partial':'Source implementation exists, but semantic or full platform/backend acceptance remains; this is not a count of missing features.','missing':'Confirmed source behavior has no corresponding RN operation/UI in inspected scope.','unverified':'Indexed and mapped, but equivalence has not been established.','implementationStatus':'F26 corrections separately use implemented for source changes with linked regression contracts; this does not imply native acceptance.'}, 'f26Corrections':f26_changes, 'features':FEATURES, 'files':file_rows}
(DOCS/'kotlin-feature-inventory.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(DOCS/'feature-gap-priorities.json').write_text(json.dumps([{**f, 'workKind':'implementation-gap' if f['status']=='missing' else 'acceptance-or-semantic-review'} for f in FEATURES if f['status']!='implemented'],ensure_ascii=False,indent=2)+'\n',encoding='utf8')

lines = ['# Kotlin feature inventory and F26 implementation evidence', '', '**F26 evidence refresh:** all feature anchors below resolve to current files and symbols. F25 found 47 stale paths among 54 RN evidence paths; those historical path failures were not missing functionality. The 55 partial rows are pending semantic/platform acceptance, not 55 missing features. See [current implementation](IMPLEMENTATION_F26.md), [the F24/F25 review](UI_UX_REVIEW_F24.md), [native QA](NATIVE_QA.md) and [work status](WORK_STATUS.md).', '', f'Indexed **{len(file_rows)} authored Kotlin files / {payload["sourceLineCount"]:,} lines** with normalized full-file SHA-256 and every declared function/class/object/interface. Tests are acceptance contracts, not extra product features. Production Kotlin and test/debug source are distinguished by role. Source inventory coverage does not prove every behavioral branch.', '', '**Two separate statuses:** the ten F26 corrections are implemented in source with linked regression contracts. Broad feature rows remain partial/unverified until their full acceptance gates are demonstrated. The generator validates paths/anchors but does not run tests, inspect devices or award a parity percentage.', '', '`feature-gap-priorities.json` now includes pending acceptance/semantic-review rows with an explicit `workKind`; its former empty missing-only array was not evidence that no work remained.', '', '## F26 concrete corrections', '', '| ID | Change | Implementation | Native acceptance | Current source / tests |', '|---|---|---|---|---|']
for change in f26_changes:
    target = ', '.join(f"`{e['path']}:{e['line']}`" for e in change['reactNativeEvidence'])
    tests = ', '.join(f"`{p}`" for p in change['testPaths'])
    lines.append(f"| {change['id']} | {change['title']} | implemented | Final root QA record; full platform acceptance remains separate | {target}; {tests} |")
lines += ['', '## Feature implementations and pending acceptance', '', '| Feature | Status | Priority | Source evidence | Current RN evidence / acceptance boundary |', '|---|---|---|---|---|']
for f in FEATURES:
    src = ', '.join(f"`{e['path']}:{e['line']}`" for e in f['kotlinEvidence']) or 'Source symbol anchor unresolved; see file inventory'
    target = ', '.join(f"`{e['path']}:{e['line']}`" for e in f['reactNativeEvidence']) or f"Searched `{f['reactNativeSearchScope']}`"
    lines.append(f"| {f['title']} | {f['status']} | {f['priority']} | {src} | {target}. {f['gap']} |")
lines += ['', '## Copy preservation', '', '`src/i18n/source-catalog.json` preserves actual Kotlin values, punctuation, interpolation and source path/line for every extracted language. `scripts/extract-kotlin-copy.py` handles AppStrings/nested group structures, semantic maps, localized constructors, goalText/label helpers, per-screen tables and Android strings.xml. Available French copy is retained. Source keys are canonical; compatibility aliases map old RN UI strings to complete source sentences. New functional RN-only copy is recorded separately and must not be mistaken for curated Kotlin text.', '', '## Complete file coverage', '', '| Kotlin file | Role | Lines | Feature mapping | Verification |', '|---|---|---:|---|---|']
for f in file_rows:
    mapping = ', '.join(f['featureIds']) or 'Supporting source / unresolved semantic mapping; symbols and imports indexed in JSON'
    lines.append(f"| `{f['path']}` | {f['role']} | {f['lineCount']} | {mapping} | unverified at file level |")
lines += ['', '## Completion gates', '', '1. Implement each missing operation and reachable UI flow, retaining its source contracts and permission rules.', '2. Port the corresponding Kotlin unit/instrumented acceptance cases to meaningful RN/domain/device checks.', '3. Verify complete curated copy in each supported locale; review explicitly new RN-only copy.', '4. Exercise Android startup, persistence, background/foreground, download, audio, notifications, deep links and failed-backend states.', '5. Update only the feature statuses whose behavior has actually been demonstrated. Re-run the inventory when source or RN changes.', '']
(DOCS/'FEATURE_GAPS.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({'files':len(file_rows), 'lines':payload['sourceLineCount'], 'features':len(FEATURES), 'missing':sum(f['status']=='missing' for f in FEATURES), 'unresolvedSourceAnchors':[f['id'] for f in FEATURES if not f['kotlinEvidence']]},ensure_ascii=False))
