# Selectable Mushaf: primary-source feasibility

Research date: 2026-11-14. The separate online Unicode page is implemented, mounted in Mushaf navigation, and verified on the Android test emulator. Original image/PDF editions remain available. The provenance research itself did not require emulator operations.

The recommended route is a separate **selectable Madinah Hafs Unicode edition**, retaining the existing printed-page frame, page navigation, reading registration, and original image/PDF editions. Real Unicode text supplies letter selection and Arabic copying; a canonical word map supplies lexicon lookup. Existing ayah rectangles do not supply word or letter coordinates.

## Primary resources

| Resource | Verified facts | Acquisition / rights status |
| --- | --- | --- |
| [QPC Hafs font, QUL resource 245](https://qul.tarteel.ai/resources/font/245) | QPC Unicode Hafs font; documentation explicitly publishes [UthmanicHafs_V22.ttf](https://static-cdn.tarteel.ai/qul/fonts/UthmanicHafs_V22.ttf). | Downloaded for research only. 297,700 bytes, SHA256 `aa68bffce289b4c0ebac68e90502eb69e42356abcd1603cb2b8e99c2c723f145`. Embedded EULA grants free use, copying, and distribution with restrictions; preserve the original font and complete license. |
| [KFGQPC Hafs word-by-word script, resource 312](https://qul.tarteel.ai/resources/quran-script/312) | QUL identifies this as QPC Hafs word text, related to the Unicode font. Public preview shows actual Arabic characters. | Download buttons explicitly require sign-in. No full export obtained, hidden URLs guessed, or access controls bypassed. Its license tab says copyright information is unavailable. |
| [KFGQPC 1421H Hafs Unicode layout, Mushaf 27](https://qul.tarteel.ai/mushaf_layouts/27) | Public QUL catalog identifies 604 pages and 15 lines. This explicitly Unicode layout is the strongest candidate to pair with resource 312. | Public preview/catalog verified; complete matching export and its asset terms still need to be obtained through the normal publisher workflow. |
| [V1 resource 15](https://qul.tarteel.ai/resources/mushaf-layout/15) and [V2 resource 10](https://qul.tarteel.ai/resources/mushaf-layout/10) | Printed-layout resources associated with glyph fonts. | Do not substitute their word IDs for Unicode data without a complete join audit. Private/presentation glyph text alone cannot provide Arabic letter selection. |

The [QUL script documentation](https://qul.tarteel.ai/docs/quran-script) distinguishes Unicode QPC Hafs from glyph-based V1/V2/V4 scripts. The [QUL layout documentation](https://qul.tarteel.ai/docs/mushaf-layout) describes each line's type, alignment, and inclusive first/last global word IDs. QUL's public [export implementation](https://github.com/TarteelAI/quranic-universal-library/blob/main/lib/exporter/export_mushaf_layout.rb) also exports per-page lines and their exact script text. These are structural sources, not confirmation that an unexamined export matches our canonical corpus.

The [QUL repository](https://github.com/TarteelAI/quranic-universal-library) MIT license covers its software. It is not a blanket license for third-party fonts or Quran datasets. The original [QPC website](https://qurancomplex.gov.sa/) currently redirects the old font site to a new site whose font/developer downloads are marked forthcoming; no additional distribution terms were established there.

## Font evidence

The downloaded font identifies itself as `KFGQPC HAFS Uthmanic Script`, version 2.2. Its Unicode character map includes ordinary Arabic letters and combining marks and has no Private Use Area ranges. This supports real Unicode rendering; it does not establish that every Quran word is shaped correctly on every platform.

The embedded name-table EULA grants use/copy/distribution free of cost, restricts sale and modification, and disclaims warranties. A separate general copyright record has stricter reproduction language. Keep both complete notices with the exact original asset; do not rename the font internally, subset it, modify glyphs, or describe it as MIT/OFL. Asset-specific dataset terms remain independently unresolved.

Research files, source HTML, exact font, and extracted license are cached under ignored `.tooling/selectable-mushaf/`; they are not shipped app assets.

## Implementation seam

1. A build-time importer accepts explicitly supplied official word and layout exports. Record origin URLs, acquisition date, original hashes, and terms. Do not depend on runtime CDN calls or scrape around sign-in.
2. Produce lazy page data containing the original line order/type/alignment, exact Unicode text, and tokens with canonical `{surah, ayah, word}` references. Keep Quran text unchanged. Represent end markers and decorative signs explicitly rather than as invented lexical words.
3. Derive each token's UTF-16 start/end offsets from the exact rendered string and retain grapheme boundaries for letter selections. Join morphology by canonical reference only after a complete audit; never infer it by global row number, glyph count, or stripping diacritics alone.
4. Render a page within the existing book frame, keeping the publisher's line breaks. Each line should be a single shaped text container with nested word spans. Fit the entire line to the available width and preserve centered lines. Validate Arabic justification, diacritic clipping, and font shaping before calling the result a faithful printed-layout edition. Do not add kashida characters to the underlying Quran text to force a fit.
5. A word action uses the span's canonical reference. Native selection handles operate on the real Unicode string and copy Arabic. Letter-range actions use the selected offsets, including combining marks, and identify all intersecting canonical tokens.

React Native 0.88 `Text` exposes `selectable`, nesting, and touch handling, but no `onSelectionChange` prop. The installed Android `ReactTextView` delegates selectability to native `TextView`. Therefore native copy plus word taps can be prototyped with core Text; sending an arbitrary selected letter range to the lexicon requires a small native selection component/bridge, rather than pretending a Text press event provides selection offsets. An Android `TextView`/`Spannable` implementation can expose selection changes and selection-menu actions; iOS needs the corresponding `UITextView` implementation. Coordinate this native seam before promising platform parity. See the [React Native Text reference](https://reactnative.dev/docs/text).

Per-line containers initially limit native dragging to that line. Cross-line selection is a separate acceptance requirement: implement a page-level native selection surface if it is required, preserving line-specific alignment and exact offsets. Do not claim that multiple independent Text views automatically share one selection.

## Required validation before activation

- Validate all pages/lines are present, ordered, and use the intended edition; distinguish catalog Mushaf IDs from downloadable resource IDs.
- Require every layout word range to resolve exactly once; reject missing, duplicate, overlapping, or out-of-range word references. Check line/page transitions and surah headers/basmallah explicitly.
- Compare every lexical token's canonical reference with the existing Quran/QAC corpus. Produce an explicit exception table for joined/split words; fail on unexplained mismatches. Do not assume the reported three combined-glyph differences imply a universal one-to-one map.
- Verify font coverage of every character without silently falling back to another font. Inspect representative complex ligatures, small letters, stop marks, sajdah/rub signs, and ayah numbers.
- Compare beginning, middle, final, multi-surah, and long-line pages with the primary preview/printed reference at phone, landscape, and tablet sizes. The layout must remain book-like at all sizes.
- Native acceptance must include word tap, selecting an individual Arabic letter with its marks, copying exact Unicode, dragging across word boundaries, and invoking the lexicon without replacing the printed page with a long text reader. Test Android and iOS separately.

The downloadable offline route remains blocked on acquisition and full validation of matching official exports. This does not block the separate online route below. Neither route needs invented image coordinates.

## Implemented online route

The normal public legacy Quran.com endpoint returned HTTP 200 with explicit `mushaf=5`, `words=true`, and `word_fields=text_qpc_hafs,text_uthmani,page_number,line_number,position`. The [current Quran Foundation font guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) identifies Mushaf 5 as Unicode QPC Hafs. Its [page-layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/) documents grouping by the word-level page and line numbers and placing surah headings/basmallah in reserved empty slots. This supplies a viable runtime route while the QUL downloadable exports remain gated.

Implemented files:

- `src/domain/selectableMushaf.ts`: validates actual Unicode, coordinates, ordering, duplicate references, explicit verse markers, and heading slots; creates exact UTF-16 token spans.
- `src/services/selectableMushaf.ts`: explicit Mushaf 5 per-page requests, bounded requests, pagination checks, session-only eight-page cache expiring after one hour. Exact original bundled Uthmani word text and canonical position must match before a lexical reference is marked verified.
- `src/features/quran/SelectableMushafPage.tsx`: separate 15-line book frame, original unmodified QPC font, native selectable Arabic lines, and explicit verified-word/unavailable-word callbacks. It retains real line breaks; native fitting/spacing is not claimed pixel-identical to glyph artwork. Cross-line selection and selected-range lexicon actions are not implemented.
- `assets/fonts/UthmanicHafs_V22.ttf` plus its full embedded license/copyright notices. The original font bytes match the research SHA above.

Representative live validation covered pages 1, 2, 50, 137, 187, and 604: all **511 lexical tokens** matched exact original app Uthmani word text and positions; verse-end markers were excluded from lookup; opening pages, At-Tawbah, and the last three surah headings passed. All 72 unique sampled QPC characters occur in the original font's actual cmap. This is representative validation, not a claim that all 604 pages have been tested. The component currently opens contextual word information; it does not claim complete dictionary definitions.

The [Quran Foundation developer terms](https://api-docs.quran.com/legal/developer-terms/) updated 2026-10-11 distinguish end-user display from raw-data redistribution and require Content Sync for maintained offline resources where available. Ordinary API responses must not become a permanent offline database or prepackaged bundle. Therefore this implementation fetches only the viewed page and keeps a short session cache; no API-derived Quran page dataset is checked into this repository. Existing offline scan/PDF editions continue independently. Font distribution here relies on its separate original embedded EULA, not a presumed dataset license.

## Native Android acceptance

The installed F6b release was tested on the dedicated Android emulator without clearing app data. Long-pressing a lexical word displayed native selection handles and Copy; moving one handle narrowed the selection inside the word. Copying and pasting into an ephemeral app search field produced exactly one real Arabic character, `ٱ` (U+0671), rather than a private font glyph. The temporary search query was cleared. Heading and basmallah selection also displayed native handles/Copy. A subsequent short tap on the same ayah word opened the correct contextual entry, 3:2:7. An explicit long-press handler prevents the short-tap sheet from opening over native selection.

The PDF-to-selectable action opened the last known canonical Quran reference, not an inferred PDF coordinate, and left the stored PDF edition unchanged. Portrait and width-fitted single-page landscape layouts were checked, then portrait was restored. F6c changes only popup presentation and loading-label punctuation; the selection component, page adapter, domain validation, and font bytes remain identical to the native-verified F6b inputs.

Remaining limits: native selection is per line, cross-line selection and selected-range lexicon menu integration are not implemented, iOS selection has not been tested, and a first page view needs connectivity. Research/native evidence is kept in ignored `.tooling/f6b-*` artifacts, including the copied-letter JSON and selection screenshots; no user reading registration was created during these checks.
