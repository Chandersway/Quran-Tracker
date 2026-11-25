# Quran Tracker

Quran Tracker helps Quran readers maintain a daily reading and memorization practice, understand what they read, and encourage one another in private groups. Its original display name and source symbol are preserved. Existing internal storage identifiers are retained for compatibility.

The source of product truth is the sibling Kotlin Android application. This migration targets Android and iOS using React Native. Preserve Quran text, source datasets, domain calculations, data scopes, deep links, and existing import/export behavior. Do not invent a new import format. Preserve Android package identity `com.Ameender.qurantracker`.

The user explicitly requested a complete migration, a modern playful interface, a maintainable architecture approachable by junior and senior engineers, Supabase initially with later VPS portability, mirrored audio, credentials held in GitHub Secrets, and release automation for both stores.

Use scene: short daily reading sessions and longer quiet study, often one-handed on a phone. The primary reading experience is a printed Mushaf, with the text/study reader as a separate tool. Statistics must show both how much was read and which Quran passages were read, including the three original distribution circles. Private groups own their own feeds. Progress should encourage without shaming.

The direction is warm paper, cypress and clay, Arabic typography, manuscript details, and three primary destinations: Statistics, Mushaf and Groups. Preserve all content-import tooling found in the original repository. Work stays local; cloud secret provisioning and store publication are deferred. Local isolated backend fixtures are separate from production. Current GitHub CLI access cannot provision repository secrets.

Success means a runnable application, truthful feature parity ledger, tests around compatibility-sensitive rules, native and web bundle verification, readable module boundaries, and explicit documentation of external provisioning and device validation still required.
