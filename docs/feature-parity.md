# Kotlin to React Native feature parity

This inventory is based on the Kotlin Android app routes, screens, repositories, manifest, and packaged Quran assets in `app/`. The entries below describe React Native screen and interaction code inspected on 13 November 2026. “Partial” is a source inspection, not a claim of complete parity or native end-to-end verification. External services, platform behavior, and device accessibility still need the checks named below.

## User-facing feature inventory

| Kotlin feature | Kotlin evidence | React Native parity |
| --- | --- | --- |
| Onboarding, first-run language choice, onboarding replay | `OnboardingShell`, onboarding previews, `LanguageSelectionScreen`, `OnboardingReplay` | Partial: introduction, language selection, skip and replay controls exist; native restart behavior needs verification. |
| Dashboard/home, progress overview, daily goal hub | `DashboardScreen`, `GoalHubPanel` | Partial: resume, real activity, goal and navigation UI exist; validate calculations and device flows. |
| Quran reader and chapter navigation | `QuranReaderScreen`, `SurahScreen` | Partial: catalog, reader, search, jump and chapter navigation exist; verify ranges and long-list behavior on devices. |
| Hizb and juz progress, selection, hifz coloring, rub navigation | `HizbScreen`, `JuzzScreen`, `HizbMultiSelect`, Warsh/rub navigation helpers | Partial: unit selection, check-in and recall scoring are present; compare semantics and visual encoding with Kotlin. |
| Reading history, streak/progress stats, stats drilldown and ayah-range details | `StatsScreen`, `StatsDrilldown`, reading metrics/history repositories | Partial: statistics screen exists; drilldown and calculation parity require verification. |
| Daily goals and goal sessions linked to the reader | `DailyGoal`, `GoalHubPanel`, `GoalRepository` | Partial: goal screen and reader check-in exist; goal-session behavior requires verification. |
| Reading plans, calendar agenda, planning reminders | `ReadingPlanScreen`, `AgendaScreen`, planning repository and worker | Partial: dated plans, calendar, journey and undo UI exist; per-plan reminder parity requires verification. |
| Reading checklist (Tahajjud) with direct Quran navigation | `ReadingChecklistScreen`, checklist store | Partial: cross-unit coverage, stopping place and reader links exist; validate persistence and Kotlin parity. |
| Ayah, surah, juz, and hizb notes; scoped note editing | `AyahNotesScreen`, note targets/repository | Partial: scoped editing, filtering and deletion confirmation exist; validate compatibility and native text editing. |
| Notes export to a JSON document | `AyahNotesScreen` document-create action and notes export format | Partial: JSON export/share code exists; validate document destinations on both platforms. |
| Focus timer with goal and duration selection | `FocusSessionScreen` | Partial: duration, pause, resume and persisted timer exist; verify background completion and goal association. |
| Quran audio playback, reciter selection, repeats, page/ayah range and timing controls | `GlobalAudioPlayer`, reader repeat components, 114 per-surah audio metadata files | Partial: player, reciter, repeat and download UI exist; validate timing, offline and background behavior on devices. |
| Quran translation (English and Dutch assets are present) | `TranslationScreen`, bundled translation JSON | Partial: reader selects English, Dutch or off; verify content parity and rendering. |
| Tafsir lookup and related availability handling | `TafsirScreen`, `AsbabAvailability` | Partial: source selection and availability UI exist; verify provider data and failure states. |
| Mutashabihat search/lookup with navigation to an ayah | `MutashabihatScreen`, bundled dataset | Partial: similar-passage lookup and reader links exist; compare search and source coverage. |
| Minhaj al-Talibin book reader | `BookReaderScreen` | Partial: book list, reader, page/chapter navigation and search exist; validate source and device rendering. |
| Group spaces: create/join, feed, comments, member reading and permissions | `GroupsOverviewScreen`, group V2 repository and related sheets | Partial: group UI and service integration exist; configured backend and permission flows remain unverified. |
| Group invitations and notification deep links | Android `qurantracker://group` and verified web group links; group join routing | Partial: custom-scheme routing exists; verified web links and actual notification entry need device verification. |
| Authentication, account management, provider profile/avatar and deep link callback | Supabase auth, `AccountManagement`, Android `qurantracker://auth` | Partial: account and callback code exist; configured provider and device flows remain unverified. |
| Local and group notifications, push mute/preferences, notification routing | Notification screens, Firebase messaging service, notification scheduler/workers | Partial: reminder and notification controls exist; delivery, permissions and push routing need real-device verification. |
| App language selection and localized app text | Language selection/store and localized screen text | Partial: English, Dutch and Arabic selection and strings exist; complete coverage and RTL need review. |
| Group and profile image selection, profile names and avatars | `GroupLogo`, `ProfileAvatarService`, group/account settings | Partial: profile and image selection UI exist; configured storage and permissions need verification. |
| Reader immersive mode, adjustable reading presentation and audio mini-player | `QuranReaderScreen`, reader mode state, `GlobalAudioPlayer` | Partial: text size, theme, translation and mini-player exist; immersive-mode parity and device behavior need verification. |
| Mushaf modes and Warsh-specific references/layout | Warsh maps, maknoon positions, geometry and navigation helpers | Partial: edition, page and mapped-verse UI exist; validate mapping, accessible selection and native rendering. |

## Platform and data responsibilities

The Android app also includes offline Room persistence and migrations for reading progress, notes, goals, plans, and checklist data; Android scheduled reminders; Firebase Cloud Messaging for group push; Supabase Auth, PostgREST, and Storage; image/avatar handling; notification and invitation deep links; and bundled Quran, translation, word-by-word, mutashabihat, Warsh, and audio metadata assets. Each requires an equivalent React Native implementation or a clearly documented product decision before parity can be marked complete.

## Updating this inventory

Update an individual row only after verifying its behavior in the React Native code and app flow. Record partial work as partial, with the missing behaviors stated. Preserve platform-only differences (for example, push permissions and background scheduling) as explicit notes rather than silently marking the whole feature complete.
