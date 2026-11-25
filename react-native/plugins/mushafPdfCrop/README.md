# Android PDF crop worker

`withMushafPdfCrop.js` installs the authored `template/` into the generated Android `mushaf-pdf-crop` library, adds its app dependency and registers `MushafPdfCropPackage`. The template directory deliberately avoids the repository's ignored `android/` name. The existing React Native application CMake configuration is unchanged. Native output uses the existing `WIRDNA_NATIVE_BUILD_DIR` staging root with a `pdf-crop` child.

The worker uses the **already packaged `io.legere:pdfiumandroid:1.0.32`** from `react-native-pdf`. It opens the source with a read-only file descriptor on one dedicated worker thread, changes only CropBox/MediaBox, and streams `PdfDocument.saveAsCopy` into a new cache `.partial` file. It closes the output and source, reopens the result to verify page count, and resolves only after that verification closes. It never reads the PDF into JavaScript or writes the downloaded original.

The tiny JNI library links only Android's `dl` library. It resolves the existing `FPDFPage_SetCropBox`/`FPDFPage_SetMediaBox` exports from the packaged PDFium library. Signatures follow the [PDFium page-transform API](https://pdfium.googlesource.com/pdfium/+/refs/heads/main/public/fpdf_transformpage.h). `PdfPage.pagePtr` is the page pointer; `PdfDocument.mNativeDocPtr` is a wrapper and is never cast. The installed Kotlin `saveAsCopy` handles saving. Native page operations and saving share `PdfiumCore.lock` with the renderer.

Crop margins match `STANDARD_PDF_CROP`: left/right 5.5%, top 4.5%, bottom 5.5%, rotated into the page's original coordinate system. PDFium's quarter-turn rotation and its unusual RectF field mapping are handled explicitly. Missing CropBox falls back to MediaBox. Text/images remain PDF objects; there is no rasterization.

The bridge accepts `prepare(sourceUri, destinationUri, jobId)` and `cancel(jobId)`. Sources must resolve inside app files/cache/external app directories. Destinations must resolve inside the app cache, end in `.partial`, and not already exist. Canonical paths reject traversal and sibling-prefix escapes. The worker deletes only the temporary file it successfully created. The caller owns promotion to its versioned cache after successful completion.

Cancellation is checked between pages, during every output callback, and before completion. The JavaScript adapter requests cancellation but **continues awaiting native completion**, so caller cleanup cannot race an open output stream. Worker errors reject. Missing/incompatible modules, old app shells, iOS and web return `false` from the adapter so the caller can choose the JavaScript fallback. A Metro refresh does not install this module: run the normal Expo prebuild and native rebuild.

Validation performed:

- Isolated `:mushaf-pdf-crop:assembleDebug` compiled/packaged both `arm64-v8a` and `x86_64` JNI libraries.
- `:mushaf-pdf-crop:testDebugUnitTest`: three passing JVM tests cover all four rotations, invalid geometry, URI scope, traversal, sibling prefixes and temporary destination policy.
- `tests/native-pdf-crop.test.ts`: five passing tests cover real adapter availability, distinct jobs, waiting on abort, error propagation/listener cleanup and idempotent plugin installation.
- Whole-project TypeScript and scoped ESLint pass.

Integrated Android QA also opened the 51,351,963-byte, 612-page IndoPak PDF from an empty derived crop cache. The first observation after 5,534 ms already showed the rendered page; this is an upper bound including navigation, cropping and rendering, not an isolated worker benchmark. The downloaded original retained its SHA-256. An independent pdf-lib check verified every CropBox/MediaBox and all 2,279 page-used image resources against the original; see [exact output evidence](../../docs/parity-2026-11-17/native-pdf-output.json). Cancellation contracts are covered by automated tests; interactive cancellation was not separately timed on-device.

iOS/web continue using the JavaScript fallback; this plugin supplies no native iOS crop worker. Uncached books above 32 MiB open the original immediately and offer crop preparation as an explicit action.
