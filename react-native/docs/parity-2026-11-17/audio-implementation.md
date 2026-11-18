# Audio and media implementation — 17 November 2026

This implements audit sections 14, 15 and the audio/media portion of 20 in the current React Native app. The original audit remains a record of the pre-fix state. Quran text, reciter catalogs, source URLs, import pipelines and private backend configuration were not changed.

| Audit gap | Implemented behavior | Evidence |
|---|---|---|
| Reciter replacement resets time and starts paused playback | Dedicated `replaceTrack` preserves absolute seconds and pause/play intent; clamps to a shorter recording; stale loads cannot resume; selection queues cannot be replaced accidentally | Real provider regression callbacks at 45 seconds, playing/paused and rapid replacements |
| Choosing a reciter starts playback immediately | Media choice persists first; idle choice starts nothing; active same-surah choice uses preserving replacement; separate Start now action | Actual MediaSettings callback tests, including failed persistence |
| Media settings/search/riwaya filters absent | Reusable sheet reachable from Settings, Reader and expanded player; search by name, category filters, all six speeds, chosen-surah download | Actual filter/selection callbacks; original catalogs parsed for all 114 surahs |
| Mini expansion only by tap | Tap and upward swipe exceeding 24 points open the same expanded player | Actual PanResponder callbacks including rejection of horizontal gestures |
| Mini controls/metadata reduced | Direct speed, backward/forward seek, play/pause/stop, loading, time/progress and selected range/current round | Actual control callbacks; shared accessible timeline |
| Expanded options | Six speeds 0.75–2, 5/10-second seek, autoplay, track loop, sleep, media/repeat access and stop retained | Provider speed/skip, autoplay/loop precedence, sleep-deadline tests |
| Repeat modes/defaults changed | Explicit current page/page range/whole surah/ayah range; Mushaf menu defaults to current page, selected verse actions to verse range; otherwise whole surah | Actual RepeatSheet start callback and source-linked mode tests |
| Rounds/defaults | 2/3/5/unlimited choices; default 2; first pass included; successful choices persist; completed queue replay starts its first clip | Actual provider/RepeatSheet callbacks and queue tests |
| Original Hafs Maknoon page repeat excluded | Verified known 604-page geometry accepted | All 604 pages compared with their actual source strips |
| Warsh input numbering differs | Fields use printed Warsh numbers; initial canonical selection converts to printed number; untimed recordings expand the source bridge; timed recordings retain printed indices | Warsh printed 1 maps to canonical 1+2 for clips but one timing row for whole-surah recordings |
| Arbitrary PDF mapping | Unmapped PDF editions still cannot infer page-to-ayah correspondence | Null-edition page queue rejected; named ayah/surah selections remain available |
| Local cache/download confidence | Fixed moved-file cleanup deleting final audio; fixed per-ayah cache collisions; validates cached header/size marker; timings persist locally; selection downloads deduplicate whole-surah recordings | Real service with disk-backed Expo filesystem behavior; HTTP evidence below |

The feature remains separated into a player/context, presentation components, pure repeat rules and portable audio services. New text is supplied in Dutch, English and Arabic. The Reader's font adjustment now uses the shared 20–54 bounds added by the appearance work; loading existing preferences does not rewrite them.

## Automated and live verification

Run the focused suite:

```powershell
npx tsx --test tests/repeat-sheet.test.ts tests/audio-provider.test.ts tests/audio-ui.test.ts tests/audio-service.test.ts tests/audio-repeat-selection.test.ts tests/audio.test.ts tests/audio-download.test.ts tests/audio-queue.test.ts tests/audio-playback.test.ts tests/reader-lifecycle.test.ts
```

The final focused run passed **65/65 tests** (51 audio/service/component cases and 14 Reader lifecycle cases). The existing RepeatSheet harness was updated for persisted settings and all four mode callbacks while retaining its prior numbering, page-range and invalid-input assertions. Its obsolete Hafs Maknoon exclusion now checks the verified geometry, while arbitrary PDFs remain excluded from page mapping. TypeScript and targeted ESLint checks passed. The Impeccable detector reported no findings for the five audio UI components. The provider/component harnesses execute the real functions with native I/O substituted; they do not claim native rendering or audible playback.

[`audio-implementation-live.json`](audio-implementation-live.json) records real HTTP requests through the actual service and queue functions, with no Supabase or audio mirror configured. All 114 bundled catalogs parse into 18,012 options. Three short recordings (Ahmed Al-Hawashi surah 1, Alafasy 1:1 and timed Husary Warsh surah 1) downloaded successfully: 717,115, 146,830 and 473,723 bytes. Remote content lengths and local SHA-256 hashes matched; headers validated and cached files were reused with network access disabled in the test adapter. Temporary audio files were removed after verification. Warsh timing providers 120, 16 and 80 returned seven valid printed-verse timings for surah 1; each was subsequently read from the local cache offline.

The implementation uses the installed Expo 58 audio/file APIs. The [Expo audio reference](https://docs.expo.dev/versions/latest/sdk/audio/) documents player replacement, seconds-based seek, duration and background configuration. The [Expo filesystem reference](https://docs.expo.dev/versions/latest/sdk/filesystem/) documents File handles, downloads and move semantics. Native equivalents are replaced only in the deterministic test harness.

## Native acceptance checks

The integrated Android run started Ahmed Al-Hawashi from Media. The OS media session reported PLAYING, an advancing position and no error. The visible player advanced automatically through surahs 112, 113 and 114, then completed at 0:30/0:30. Tapping the mini player opened the expanded controls. A separate native swipe check exposed the RN responder resetting distance on grant; the implementation now retains the pre-grant distance. The added regression runs the installed RN PanResponder and fails before that correction. The final release APK on emulator 5554 then passed the actual upward-drag check while Al-Fatihah played: the expanded player opened, its clock advanced, and Stop ended playback. This supplements the initial focused run; the remaining device combinations below are not implied to have passed.

1. Start a normal surah, seek to 45 seconds, pause, open Media and choose another reciter. Confirm the replacement stays paused near 45 seconds. Repeat while playing, then use Start now and confirm restart at the beginning.
2. Open Settings → Media, choose a name/riwaya filter and select a reciter without starting audio. Reopen and confirm the selected reciter remains chosen. Start/download the chosen surah.
3. Tap and swipe the mini player upward. Verify speed cycling, both skip controls, timeline tap, pause/resume, stop and loading states. Check Dutch/English/Arabic, large text and dark mode.
4. In original Hafs Maknoon, open repeat from the page menu and confirm current page is selected. Verify a multi-page range and whole-surah selection. In Warsh page 1, use printed verse 1: a per-ayah reciter queues canonical 1+2; a timed reciter plays one printed segment.
5. Save a small selection offline, disable networking, then play it. Timed Warsh playback must reuse the cached recording and timing rows. Repeated rounds must start at the first included clip and show range/round information.
6. Check track loop versus autoplay, 5/10-second clipping, all six playback speeds and a short sleep timer. Separately check Android/iOS lock-screen playback, interruptions and background deadline behavior; JS background scheduling varies by platform.

Only the subset actually exercised on a native runtime should be reported as device-verified. This report does not claim coverage of the entire online recording catalog, native OS audio focus or iOS background execution.
