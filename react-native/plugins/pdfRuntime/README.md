# Android PDF runtime adapter

`withPdfRuntime.js` applies this narrow adapter during Expo Android prebuild. It patches the installed dependency reproducibly; no hand-edited `node_modules` file is required after `npm ci`.

The supported baseline is the official `react-native-pdf@7.0.5` npm tarball (`react-native-pdf-7.0.5.tgz`, npm SHA-1 `7ffa4c0aa45c6746d531b7080813a2a13589a5f2`). The installed Java files matched that artifact, including its existing Fabric first-draw and detached-viewport restoration code. `patchPdf.js` checks the package version and SHA-256 of both complete Java inputs after CRLF normalization. It also verifies exact output fingerprints. Reapplying the same patch is a no-op; the exact F13 and centered-zoom predecessor pairs upgrade without reinstalling. Unknown or partly patched inputs fail with an actionable error.

The integration has three responsibilities:

- **Zoom:** native `getZoom()` is the actual multiplier. The upstream callback divided rendered page width by its first width, so changing the viewport could report a fake zoom and feed that value back into another reload. Native pinch/double tap remain unchanged. Footer commands call AndroidPdfViewer's `zoomCenteredTo` with the viewport center, keeping the same document point beneath that center while changing scale. `zoomTo` alone only changes a field and leaves scroll offsets behind, which can expose the gutter between pages. Echoing the reported scale does nothing.
- **Reloads:** page and scale updates operate on the loaded document. Only actual changes to path or structural configuration mark the document dirty. A single queued request coalesces Fabric path-first-draw, the property transaction and reattachment; loading waits for an attached view with positive dimensions. The upstream saved viewport still restores after reattachment.
- **Reader state:** `pdfZoom.ts` rejects invalid native numbers, bounds zoom to the configured range and absorbs floating-point noise. The original PDF page order is preserved; RTL in this dependency reverses document indices and therefore is not enabled for Quran page numbering.

Paging also uses the library's public, nonanimated `performPageSnap(false)` after programmatic jumps. A normal initial load posts that snap after the base viewer's `jumpTo(defaultPage)`, which otherwise left-aligns a narrow page. Detached-viewport restoration takes precedence over the initial snap and keeps the saved zoom and offsets. Both posted snaps and posted restorations carry a document generation and check attachment/readiness, so changing the source, reloading or detaching cannot execute old document work later. This does not add another document load or change pinch zoom.

The patch does not create PDF text selection or infer Quran mappings. iOS code is untouched.

`LeadingPdfTiles.java` repairs one AndroidPdfViewer 4.0.1 tile-range defect. On a horizontally paged, centered document narrower than its viewport, the upstream `PagesLoader` uses the absolute distance from viewport start to page start. A blank leading margin can therefore become a positive first column, leaving the first visible strip covered only by its thumbnail after a reload. The helper adds just the skipped leading columns and visible rows using the viewer's exact tile grid and cache. It never changes page, scale, offsets or document lifetime. The plugin also checks the pinned viewer dependency and refuses to overwrite an unexpectedly changed installed helper.

`pdf-leading-tiles.test.ts` compiles that actual helper and replays the observed page-73 viewport (1.25 zoom, 189px leading margin, -200px vertical offset). It checks all four missing column-zero tiles, cache reuse, unchanged viewport, offscreen/recycled guards and unchanged vertical mode. Set `PDF_VIEWER_PROBE_JAR` to the installed viewer's `classes.jar` to additionally run the real upstream `PagesLoader` bytecode and prove it skips column zero before applying the helper. The local F26 probe did run this mode; ordinary tests do not require a Gradle cache.

## Changing or upgrading the dependency

1. Obtain the official package with `npm pack react-native-pdf@VERSION --ignore-scripts` into an ignored research directory. Compare its Java sources before changing the allowed version or hashes.
2. Review each transformation against the new upstream implementation. Do not bypass fingerprint checks or copy over unrelated local edits.
3. Run `npm exec -- tsx --test tests/pdf-native-runtime.test.ts tests/pdf-leading-tiles.test.ts tests/pdf-reader-zoom.test.ts` with the Android JDK in `JAVA_HOME` or its `java` and `javac` on `PATH`. The JVM test compiles the actual patched Java methods against small platform stubs and checks the callback, live zoom/page updates, structural reload coalescing, zero-size deferral and viewport restoration. It does not run Gradle or replace device acceptance.
4. Run typecheck/lint, then Android prebuild and native build. On a device verify the original first/next/back pages, footer zoom, pinch/double tap, portrait/landscape changes and returning from another screen without document-reopen loops or invalid dimensions.

Register `./plugins/withPdfRuntime` in `app.config.ts`. The config plugin is Android-only. Gradle and store release steps remain separate from these focused tests.
