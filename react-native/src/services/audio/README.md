# Audioservices

`audio.ts` implements `AudioService` without a backend dependency. Reciter catalogs are bundled; an optional audio-base URL supplies a mirror with original-source fallback. Keep existing catalog contents and mirrored object paths stable.

Downloads use a temporary file, MP3-header validation and a completion marker tied to the final size. Reads require the complete marker and a valid header; incomplete/corrupt files are ignored. Concurrent downloads for the same destination deduplicate. Cleanup always addresses the original temporary path: Expo `File.move()` can mutate a file object's URI. The moved recording must survive cleanup.

Unmirrored per-ayah files include the verse in their cache filename. Timed clips of one surah share one recording. `repeatSelection.ts` builds deterministic queues from verified printed-page geometry and the unchanged Warsh bridge; it rejects unsupported PDF-page inference and missing timing rows. Validated timing metadata is saved locally so previously prepared Warsh selections also work offline. Failure to cache metadata does not prevent online playback.

`audio-catalog.ts` validates catalog/timing data and normalizes riwaya filter labels without changing source metadata. `audio-queue.ts` defines finite/infinite round advancement. `audioDownload.ts` supplies a portable download port, keeping platform filesystem calls in the service.

`tests/audio-service.test.ts` executes the real service against disk-backed Expo equivalents, including move-URI mutation, concurrent requests, mirror fallback, corrupt files, verse-cache separation and offline timing reuse. The opt-in `.tooling/parity-audio-implementation-live.ts` probe fetches only three short known recordings and three small timing responses, verifies byte counts/hashes and offline reuse, then removes its temporary files. Its evidence is `docs/parity-2026-11-17/audio-implementation-live.json`.
