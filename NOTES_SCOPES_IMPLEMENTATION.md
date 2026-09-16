# Notes: Quran scopes

## Behaviour

- New notes explicitly choose Juz, Hizb, Rubʿ, Surah or Ayah before reference fields appear.
- Only Ayah requires an ayah number. Structural start references are presentation metadata, never fake note relationships.
- Hizb can be narrowed to one of four quarters; Juz can be narrowed to its two Hizbs.
- Small note buttons in Juz, Hizb and both Surah lists open that section's notes. Counts represent exact-scope notes, not all descendants.
- Context pages optionally include descendant notes in separate scope sections: Surah → Ayah, Hizb → Rubʿ, Juz → Hizb/Rubʿ.
- Global filters, text search, folders, tags, pinning and editing remain available. Saving clears filters that could conceal the saved note and follows a changed reference when necessary.
- Bottom navigation: Home, Hizb, Juz, Quran, More. More contains Notes, Groups, Stats and Agenda. The existing global audio space remains managed by the root Scaffold.

## Storage

Notes use the existing local Room repository, not Supabase. Database version 17 migrates the existing `ayah_notes` table without dropping content, IDs, timestamps, formatting or pins. Legacy records become `scopeType = ayah`; their old references are not inferred from titles.

`QuranNoteTarget` and repository validation enforce valid ranges and mutually exclusive reference fields. `rubNumber` is a global quarter number (1–240); its Hizb and local quarter are derived. Surah IDs and ayah numbers are nullable for other scopes. JSON export schema 2 includes all scope fields.

Partition boundaries derive from [Tanzil Quran Metadata](https://tanzil.net/docs/Quran_Metadata), with Arabic previews loaded from the app's existing Quran database.

## Verification

- Unit tests cover all 240 ordered boundaries, exact range validation, known start references, scope conversion, descendant filtering and persistence insert/update semantics.
- `NoteScopesMigrationTest` builds a separate randomly named version-16 database, runs full Room migration/schema validation and checks all five note scopes, formatting preservation, edits and isolated deletion.
- Build, unit tests and the device migration test passed on 2026-09-06.
- After deployment, a comparison against the pre-migration backup verified all original fields of the 8 existing notes and row counts of all application tables.
- Device visual checks covered Juz navigation, contextual notes, the central note list and the scope-first editor.

## Device test safety

Do not use Gradle `connectedDebugAndroidTest` on a personal device with valuable app data: its test cleanup can uninstall the target app, including private settings and downloads. Use a disposable emulator for that task. During this run cleanup did uninstall the app; the database was restored from its verified pre-test backup, but non-database private settings/login were not included in that backup.

For personal-device updates use `adb install -r` without uninstalling. Back up the complete app-private data first, not only databases. If instrumentation is essential, explicitly install both APKs with `-r` and invoke `adb shell am instrument` directly; do not use a runner lifecycle that uninstalls the target app. The test itself creates and deletes only its unique temporary database.

Manual remaining coverage: screen-reader and large-font passes, Arabic locale end-to-end, and long-running navigation/audio regression. No new Supabase migration is required for this local Notes change.
