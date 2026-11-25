# Kotlin → React Native migration

## Working plan

1. **Inventory and freeze contracts.** Map all Kotlin screens, database models, network calls, reader variants, audio sources, and import/export paths. Record gaps in `docs/FEATURE_GAPS.md`. Leave source Kotlin and existing data import scripts intact.
2. **Build the application foundation.** Expo + strict TypeScript; small feature modules; shared accessible components and design tokens; provider interfaces; offline state with serialized persistence and visible error recovery. Retain Android application identity.
3. **Port the daily practice flows.** Dashboard, Quran catalog and reader, study material, progress and hifz scoring, notes, planning, focus sessions, statistics, onboarding and preferences. Bundle the original Quran data without text edits.
4. **Integrate remote features.** Supabase authentication and group services behind replaceable interfaces; account and privacy controls; environment-driven endpoints. Document the HTTP contract for a later VPS.
5. **Mirror audio.** Extract original catalogs, download and verify files using a resumable manifest, retain source attribution, supply a Supabase uploader and stable object paths suitable for a VPS.
6. **Configure delivery.** CI runs type, lint, contract tests and exports; manual EAS build/release workflow for Android/iOS. Provision credentials from GitHub Secrets. Store submission remains an explicit workflow choice.
7. **Verify independently.** Review delegated work, run contract and integration checks, produce native bundles, inspect running UI and verify navigation/persistence. Record actual outcomes and remaining device/backend/account requirements without claiming unperformed validation.

## Team allocation

- Coordinator: architecture, design, UI, application integration, credentials audit, final verification.
- Lower-tier agent 1: import/export compatibility and pure domain logic with regression tests.
- Lower-tier agent 2: backend interfaces, Supabase adapter, audio acquisition and portability.
- Lower-tier agent 3: release automation, feature inventory and independent review.

The session has four total agent slots (coordinator plus three workers). Keep the three available worker slots useful; five concurrent workers are unavailable.

## External requirements

- GitHub access capable of setting repository/environment secrets (current CLI account receives HTTP 403).
- Supabase project access to repeat the isolated local RLS/RPC/storage checks against the eventual deployed environment. Local checks use fabricated accounts and an isolated Docker stack; they do not need production credentials.
- Expo project/account and `EXPO_TOKEN` for cloud native builds.
- Existing Android signing key for an update to the installed app, Play Console access, Apple Developer/App Store Connect access and iOS bundle identifier.
- Preserve the checked-in import/acquisition workflows and source data as the compatibility contract; do not replace them with an invented notes-file import.
- Audio redistribution permission/source terms before public hosting.

## Completion evidence

Update this document and `docs/WORK_STATUS.md`, `docs/FEATURE_GAPS.md` and `docs/NATIVE_QA.md` with real command results and external blockers as work proceeds. Build success alone does not establish complete behavioral parity or store readiness.

## Correction after user review

The first React Native implementation was a working foundation, not a complete port. It replaced too much curated copy and its default navigation/visual structure did not meet the requested Arabic design direction. Do not use compilation or a small unit-test count to label that implementation complete.

The active priorities are now:

1. Map every authored Kotlin file and its acceptance tests to concrete React Native behavior. Track each gap in `docs/FEATURE_GAPS.md` and the machine-readable inventory.
2. Preserve exact curated text with language and source-line provenance. Use semantic keys and format complete sentences; remove invented replacement slogans and word-by-word label composition.
3. Replace the navigation and visual world using the reviewed Arabic-led concept, with all original destinations discoverable. Keep source copy and live data in the rendered screens.
4. Implement the missing behavior identified by the inventory, including group tools, focus intentions, onboarding interactions and data details. Mark external-account/device checks separately from missing code.
5. Verify actual native flows and compatibility, then update the ledger with evidence. Leave the visible Android emulator, Metro and DevTools usable for local debugging.

GPT-6.1 Sol owns the exhaustive parity/copy audit and complex native behavior; GPT-6.1 Terra owns the replacement visual direction and navigation. The local development client, emulator and positive Fast Refresh have already been verified. Work and credentials remain local; publishing and secret provisioning are deferred as requested.
