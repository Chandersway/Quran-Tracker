# Import, export, and backup compatibility

## Existing Android behavior

The Android app has **notes export**, but no user-facing notes import, whole-app JSON import/export, or backup-file picker. Keep that distinction visible in the React Native UI: an exported JSON file is a portable record, but the Android app has no reciprocal file-import workflow to reproduce.

The export action is available from the Notes screen when the local note list is non-empty. Android opens the system document-creation picker for `application/json`, writes UTF-8 JSON, and reports success only when the output stream write succeeds. The suggested filename is `quran_tracker_notes_export_YYYY-MM-DD.json`, with the date taken in UTC.

`schemaVersion` is `2`. The top-level object has these ordered fields:

1. `schemaVersion`: `2`
2. `exportedAt`: ISO-8601 UTC instant
3. `app`: `"Quran Tracker"`
4. `type`: `"notes_export"`
5. `userScope`: `"local_device"`
6. `notes`: complete array, pinned first and then most recently updated first, matching the Kotlin all-notes DAO

Each note object has the following ordered fields. Preserve names and nulls exactly; for example, `text` is the local note body and `surahNumber` is the local `surahId`.

| Field                                                                       | Value                                               |
| --------------------------------------------------------------------------- | --------------------------------------------------- |
| `id`                                                                        | local note ID                                       |
| `userId`                                                                    | always `null`                                       |
| `scope_type`                                                                | `ayah`, `surah`, `juz`, `hizb`, or `rub`            |
| `juz_number`, `hizb_number`, `rub_number`                                   | scope values or `null`                              |
| `surahNumber`, `ayahNumber`                                                 | surah/ayah values or `null`                         |
| `surahName`                                                                 | stored surah name (empty for non-surah scopes)      |
| `title`, `text`, `folder`                                                   | note content                                        |
| `tags`                                                                      | normalized string array                             |
| `rawTags`                                                                   | original tags string                                |
| `fontSize`, `headingLevel`, `isBold`, `isItalic`, `isUnderline`, `isStrike` | formatting properties                               |
| `listMode`, `textColorKey`, `formatSpans`                                   | formatting properties                               |
| `isPinned`                                                                  | pin state                                           |
| `createdAt`                                                                 | always `null`                                       |
| `updatedAt`                                                                 | ISO-8601 UTC instant from the millisecond timestamp |
| `updatedAtMillis`                                                           | original epoch milliseconds                         |

Tag normalization splits on comma, semicolon, or `#`, trims whitespace, removes empty values, then removes case-insensitive duplicates while keeping the first spelling and order. `rawTags` remains unchanged. The export contains only note rows; it excludes accounts and cloud state. `src/exporting/notesExport.ts` implements this contract.

## Android automatic backup

Android enables OS-managed cloud backup and device transfer. It does not define a custom archive. The backup rules exclude these transient shared-preference files in both legacy and Android 12+ extraction rules:

- `pending_navigation.xml` (invitation/navigation capability)
- `firebase_device.xml` (device push registration)
- `group_push_delivered.xml` (device delivery receipts)

Room's `quran_database` is subject to Android's automatic app-data backup. Its compatibility baseline is database version 20. The migrations preserve persisted rows and user content; migration 16→17 changes note scopes and copies legacy notes as `ayah`; 17→18 adds history quantity/source key, goal-day snapshots, and planning goal fields while converting legacy khatma history; 18→19 adds `contentType` and initializes it from `type`; 19→20 adds history owner ID, an owner/timestamp index, and the check-in request table. Migrations 1→16 are registered individually and call the schema-repair helper that creates missing current tables/columns with their declared defaults. See `app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt` and `NoteScopesMigration.kt` in the Android source.

## Bundled Quran data is app content, not user import data

The Android app ships its Quran sources and derived lookup data as package assets. This includes the Quran and books SQLite databases, translations, word-by-word text, per-surah audio metadata, Hafs/Warsh page and rub mappings, Warsh geometry, and mutashabihat data. Build/audit scripts under `scripts/` regenerate or check selected derived files. These are not import schemas and do not represent user backups. Migration work must retain their data and licenses when porting relevant reader features; this domain module does not copy the large assets.

## React Native implementation boundary

The current modules preserve note-export serialization, Quran target validation and progress IDs, reading-plan goal derivation, and repeat-selection rules. The Notes screen already integrates native file creation/sharing and web download through its export service. A future note importer would be a new product behavior and must define conflict handling, validation, ID replacement, user scope, and rollback before it is described as compatible with Android. An exported notes file is not a full backup.

## In-place Android upgrade data bridge

`src/migration/legacyAndroid.native.ts` provides `importLegacyAndroidData(initial)`. It checks for the original `databases/quran_database` inside the same Android app-private data directory, copies it and any WAL/rollback journal into a unique cache directory, and opens only that snapshot with SQLite `query_only`. The original is never opened with the SQLite engine: even closing a read-only connection could otherwise checkpoint its WAL. Snapshot cleanup cannot remove original source files. The v20 Room identity hash is checked when `user_version` is 20; versions 16–20 are accepted. It maps progress IDs, notes and formatting, history including `extraInfo`/owner/content/source keys, planning rows including Arabic text, all daily goals, goal-day snapshots, reading journey metadata, and check-in request IDs. The state also retains whitelisted source preferences and reader/checklist settings under `legacyAndroid`.

The bridge reads only UI-related SharedPreferences files: `settings`, `reader_state`, `reader_bookmarks`, `reading_checklist_v1`, `independent_reading_plan`, and `notification_preferences_v1`. It never opens the excluded push/navigation files or account credential stores. It uses the existing package sandbox path: Expo SQLite's Android `files/SQLite` directory is resolved to the sibling `databases/quran_database`, and preference XML is resolved under sibling `shared_prefs/`. The app ID and signing identity must remain the same for Android to expose these app-private files to an in-place upgrade. Web and iOS return the initial input unchanged rather than searching for Android files.

Hydration calls this bridge only when the RN state key is absent. It persists the returned state first, the checklist sidecar second, and the completion marker last. A retry after interruption resumes from the saved RN snapshot. An existing empty/damaged RN value is still user data: decoding fails rather than rerunning migration or replacing it with defaults. If the RN state already contains user data, the pure mapper returns it unchanged. Missing, unsupported, malformed, or inaccessible legacy sources return warnings without altering the source; warnings block writable app hydration until resolved. Unit/service tests cover XML filtering, row-to-state preservation, write ordering and overwrite prevention. Physical in-place upgrade and device backup/restore remain separate acceptance checks. Schemas older than Room 16 are not read by this bridge.

## Reproducible reference copies and personal data

Android backup remains enabled for personal data; `withSourceAndroidBackup` additionally excludes only SecureStore and `files/SQLite/read-only-content`. On iOS, QAC/Lane copies now use `Library/Caches/read-only-content`, while personal state keeps its existing storage. Apple excludes `Library/Caches` from backups and may purge it; these databases can be reimported from bundled assets. This relocation does not delete any old Documents copy or alter user databases. [Apple: file-system storage and backup](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html).
