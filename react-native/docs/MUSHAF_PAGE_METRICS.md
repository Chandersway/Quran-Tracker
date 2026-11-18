# Mushaf page metrics

The page rail shows a count of unique ayahs on a page as tick thickness. A tick represents an inclusive range of pages; its value is the mean page count for that range, normalized using the minimum and maximum individual page counts in the selected edition. Known densities use `1.25 + 3 * sqrt(density)` dp of width; unknown data uses a neutral 1.5 dp. The current page has a separate color and height. F26 connects read state to explicit recorded history; viewing or scrubbing does not record reading.

Read state and density have different evidence. `features/quran/model/readPageMetrics.ts` requires full coverage of every represented verified page. A recorded page proves only that page in its own edition; inclusive canonical bounds on a continued ayah never imply that an adjacent or differently paginated page was read. Whole known passage records can cover verified page ranges. Hafs Maknoon/PDF density profiles below do not establish their canonical reading ranges: unmapped read-state remains neutral even where density is known. [Read-history contracts](../tests/reader-page-history.test.ts) cover these boundaries.

- **Bundled Hafs / selectable QPC V1**: distinct surah-and-ayah pairs in `hafs-positions.json`, with multiple line segments counted once. The selectable reader uses the same profile. This is a distinct layout from the KFGQPC profile below.
- **Warsh Maknoon**: distinct local Warsh surah-and-ayah pairs in `warsh_maknoon_positions.json`; these are the printed edition's numbers, not the count after mapping into Hafs numbering.
- **Muhammadi**: distinct pairs from `muhammadi-positions.json`; its initial empty array is a sentinel, not a physical page.
- **Hafs Maknoon PNG**: the 604 KFGQPC counts in `hafs-kfqc-page-counts.json`, indexed by printed page number minus one.
- **Quran.ws Hafs PDF**: the same 604 printed-page counts after a physical cover with count zero. The publisher PDF has 605 physical pages: physical page 1 is the cover, and page 2 is printed page 1. The cover is included in this edition's min/max normalization. A loaded PDF with a different physical page count uses neutral ticks.
- **IndoPak PDF**: neutral ticks. Its 612-page scanned PDF has no verified matching per-page ayah map; neither its page count nor another Hafs layout establishes that map.

## Provenance and verification

The KFGQPC counts are derived from the publisher's [Hafs text file](https://text.quran.ws/files/mushaf/hafs.json), SHA-256 `9b9eb07ff5cff144bf964400924e593d97115e4b937db3c61783f782a5168075`. All 604 page starts in that file coincide with ayah starts; the derived page counts sum to 6,236. The publisher describes the [PDF as built on Quran SVG](https://quran.ws/), whose [ayah polygons are derived from the page's own medallions](https://quran.ws/docs/reference/quran-svg/). Its versioned SVG metadata agreed with the text-derived counts for pages 1, 2, 3, 50, 120, 531, 598 and 604.

For printed pages 1, 50, 120, 531, 598 and 604, the corresponding individual Quran.ws PDFs and actual [Maknoon PNGs](https://maknoon.com/download/quran/hafs/) were rendered or inspected and their ayah spans matched the metadata. Complete-PDF content streams at physical pages 2, 51, 121, 532, 599 and 605 were also byte-identical after decompression to the corresponding publisher single-page PDFs. Maknoon's author describes its [PNG pages as conversions of the KFGQPC digital vectors](https://www.maknoon.com/community/threads/142/). These are six sample checks, not an independent visual inspection of all 604 pages.

Quran Foundation's `by_page` response requires care: in sampled QPC V1 pages, the verse-object sets matched bundled Hafs geometry, but `pagination.total_records` and generic `word.page_number` reflected a different layout. Do not use those generic fields as QPC V1 per-page counts. The KFGQPC file and the bundled QPC geometry differ on 33 pages by count, so do not substitute one profile for the other.

Run `python scripts/verify-mushaf-page-metrics.py` to fetch the pinned source, check its SHA-256, derive the counts and compare the checked-in table. For offline verification use `python scripts/verify-mushaf-page-metrics.py --source <downloaded-hafs.json>`. The script only reads and reports; it does not rewrite app data.
