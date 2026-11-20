# Warsh Unicode source and font

## F26 offline packaging

The current implementation bundles the provider's complete validated response as 604 lazy `.quran` page assets with 77,431 original word objects. [Provenance](../assets/warsh-unicode/provenance.json) records the response hash, source URL, split-only transformation and every page hash. Original codepoints, attached signs, numbering, font bytes and printed-page validation remain unchanged. The source and rights notices accompany the data under `assets/warsh-unicode`.

`scripts/prepare-reader-assets.ts` reproduces the assets from the same provider response, or from an archived response using `--source`. Ordinary installation uses the prepared repository assets and requires no research cache or regeneration. `warshMushaf.ts` loads/validates the local page first and uses the same online provider only for an unavailable/corrupt local page. This creates no inferred Hafs word or lexicon alignment. New device acceptance belongs in [native QA](NATIVE_QA.md); the historical F23/F21 observations below do not establish F26 native acceptance.

This is a separate Unicode Warsh book surface. It does not put invented word rectangles over Maknoon artwork or replace Warsh text/numbering with Hafs. The historical F23 implementation had targeted Android evidence in [native QA](NATIVE_QA.md#f23--warsh-selection-and-reader-integration-14-november-2026). Current installed builds and F26 device results are recorded separately there; source/font checks alone are not native acceptance.

## Source and attribution

Data from [quran-text by Quran.ws](https://github.com/quran-ws/quran-text), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The underlying Quran text and fonts remain subject to KFGQPC's own terms; the data project's licence does not override them. The [upstream LICENSE](https://github.com/quran-ws/quran-text/blob/7bdefdead812bc2020644b3be91f22c875a70827/LICENSE) and [NOTICE](https://github.com/quran-ws/quran-text/blob/7bdefdead812bc2020644b3be91f22c875a70827/NOTICE.md) distinguish these rights. Attribution is retained here even where upstream waives it for product use.

- Inspected upstream commit: `7bdefdead812bc2020644b3be91f22c875a70827`.
- Normative Warsh dataset: `data/mushaf/warsh.json`, SHA-256 `2ad99415cf4ba9e06b5fba670244d98c3a66e9ba182f14d9e5c189d53175b6ed`, 77,431 words. At F23 this file was acquired for ignored research/coverage checking. F26 separately packages the complete attached-sign provider response into 604 local assets, with its own response/page hashes as described above; these are distinct provenance records.
- The page endpoint preserves original Unicode spelling and attached signs. Source line numbers are reconstructed layout aids. Eight sampled pages agreed with local Warsh ayah sets; matching ayah sets is not proof of exact word placement on a scan. Page 1's reconstructed lines differ from the artwork.
- Keep the source codepoints and combining-mark order. Normalization, stripping signs, or applying a Hafs font changes the source contract. A canonical Hafs lexical reference requires a separately verified mapping; a Warsh ayah number alone is insufficient.

## Required font

The source names **KFGQPC Warsh Uthmanic Script, Version 3.0**, PostScript name `KFGQPCWarshUthmanicScript-Regul`. The unmodified asset is [UthmanicWarsh-v-3.0.ttf](../assets/fonts/UthmanicWarsh-v-3.0.ttf), registered under the React Native alias **`QpcWarshOriginal`**.

- Bytes: **251,428**.
- SHA-256: `b644f1c6665baa95c9c0ab40b01a7f3e89edc42a0f50d3b244318a843bec81a9`.
- Downloaded from the [immutable public Quran.ws mirror](https://raw.githubusercontent.com/quran-ws/quran-text/7bdefdead812bc2020644b3be91f22c875a70827/data/fonts/UthmanicWarsh-v-3.0.ttf); its hash matches the dataset font metadata and manifest.
- Provenance limit: upstream explicitly records no original publisher URL for the 3.0 package. The current KFGQPC developer/font hosts could not be fetched during this check. This is mirror-manifest verification, not independent reacquisition of a publisher 3.0 package.
- The embedded EULA grants use, copying and distribution with its licence and forbids sale/modification of the font. The complete original embedded notices and mirror rights notice accompany the asset in [its licence file](../assets/fonts/UthmanicWarsh-v-3.0.LICENSE.txt). No conversion, subsetting, renaming of embedded metadata, or font-byte modification was performed.

The existing Hafs asset is a different font: **KFGQPC HAFS Uthmanic Script, Version 2.2**, React Native alias `QpcHafsOriginal`. It is unchanged. Amiri is unchanged and is not a fallback for source Warsh words; it is used only for generated end-marker spans, as explained below.

## Coverage and remaining native checks

`tests/warsh-font.test.ts` reads the real Warsh font cmap and checks its immutable hash against the complete normative Warsh word alphabet, the signs actually referenced by Warsh's `marks`/`mark_types`, eight actual attached-sign page samples, Arabic-Indic ayah digits, spaces and the ayah marker: **84 source/basic codepoints**. Generated brackets U+FD3E/U+FD3F are not part of this Warsh font contract. The generic `mark_signs` catalogue also lists signs belonging to other editions; those are not asserted to occur in Warsh. The test also rejects the existing Hafs font as a substitute. Nonprinting RLM is not a missing glyph; the visible ayah marker U+06DD needs coverage even though Unicode categorizes it as a format character.

The existing Hafs font misses eight codepoints found in the eight Warsh samples: U+0870, U+0872, U+0874, U+0888, U+08CC and open tanwin U+08F0–U+08F2. Bundled Amiri misses the first five. The specified Warsh font has mappings for the required source alphabet. The renderer must show loading/error until that font is ready, rather than silently falling back.

Cmap coverage does not prove correct shaping, mark attachment, line fit or selection on Android/iOS. Native review must inspect Extended-B alefs, open tanwin, small high signs and stacked combining marks, copy their exact codepoints, and check ordinary/zoomed/landscape layouts. Selection handles must remain native, and unknown alignments must remain unavailable rather than guessed.

## F20 marker defect and F21 follow-up

F20 native capture `.tooling/f20-warsh158-ready.png` exposed a semantic font defect: the generated U+FD3E/U+FD3F marker brackets inherited the Warsh font and painted a fixed **٢٨٦** medallion beside every actual ayah number. Both codepoints existed in the cmap, so the coverage test passed while the visible result was wrong. These brackets were generated presentation, not source Warsh word characters.

The comparison `.tooling/warsh-font-validation/generated-markers.png` uses the unchanged local font files in a Windows GDI diagnostic. Warsh repeats the fixed medallion; bundled **Amiri** draws ordinary ornate brackets around the actual ٥٧, ٥٨ and ٥٩ numbers. [Amiri's upstream notes](https://github.com/aliftype/amiri/blob/main/NEWS.md) document U+FD3E/U+FD3F ornate-parenthesis support. This diagnostic establishes the difference between those font files; it is not an Android or iOS acceptance result.

F21's scoped correction assigns **`Amiri_400Regular` only to generated end-marker spans**. Source words and attached signs retain `QpcWarshOriginal`; the source text, font bytes and copy buffer are unchanged. Marker font readiness must be explicit. The font test separately checks the 12-character marker alphabet (the two brackets and ten Arabic-Indic digits) in the reviewed Amiri file, SHA-256 `d26cd95609ed51b6419e3c7d4a066cb9fac7b73117868622f5b7f03998c68568`.

**F21 passed the targeted native marker and copy checks on isolated Android emulator `5556`.** The visible numbers 57–66 were correct and the fixed ٢٨٦ ornament was absent; an independent visual review confirmed the captured 57–61 viewport. Native Select All → Copy → paste retained all 1,244 codepoints of page 158 after whitespace-only comparison. All 133 source words matched the captured endpoint text without Unicode normalization. Opening pages 1 and 2 rendered their own Warsh basmallah, and page 2 exposed the original Dutch and English full-verse translations. Evidence: `.tooling/f21-native-summary.json`, `.tooling/f21-warsh-copy.json` and the `f21-*.png/.xml` captures.

F21 was **not delivered to the user's emulator**: fullscreen testing found that its vertical rail became active only after an initial body scroll, and its accessibility text retained the earlier fit message. The next build addresses measured overflow and reserves the Warsh fullscreen gutter from the first frame. Native acceptance of that correction is recorded separately in [native QA](NATIVE_QA.md). Native iOS, corpus-wide shaping/copy and full accessibility acceptance remain open. This Unicode surface deliberately preserves overflow instead of claiming exact scan line fit.
