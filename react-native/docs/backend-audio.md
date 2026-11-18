# Backend and audio portability

## Service boundary

`src/services/backend.ts` exports `createBackend(config)`, which returns a Supabase client plus `auth`, `groups`, and provider-neutral `audio` services. Auth and group services wrap the existing Supabase auth APIs and deployed group RPCs/tables. Account deletion relies on `account_deletion_status_v1` and `delete_my_account_v1`; group calls use the `list_my_groups_v2`, `get_group_detail_v3`, and related group RPCs. Confirm schema/RPC versions against the target Supabase project before configuring credentials.

Notes, plans, Quran progress, bookmarks, preferences, and history are stored by the app's local-first state store. They are deliberately not mapped to guessed Supabase tables. A future provider can implement those service interfaces without changing screens or changing the local export format.

Runtime config is read from `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and optionally `EXPO_PUBLIC_AUDIO_BASE_URL`. Never put a service-role key in the app. Audio has bundled catalogs and can list source URLs offline without Supabase credentials.

## Audio corpus and source

Bundled metadata in `src/content/audio/` contains 114-surah catalogs for all 158 source reciters (about 6.65 MB). The source MP3Quran catalog links are used as the canonical fallback; a configured `EXPO_PUBLIC_AUDIO_BASE_URL` resolves only tracks with a validated `objectPath`.

Downloaded local mirror under ignored `audio-cache/` contains all 114 surahs for MP3Quran IDs 1 (Ahmed Al-Hawashi), 122 (Mahmoud Khalil Al-Hosary), and 131 (Mishary Al-Afasy): 5,715,103,565 bytes. It also contains 6,236 EveryAyah Alafasy verse clips: 1,706,672,026 bytes. Total downloaded: 7,421,775,591 bytes (about 7.42 GB). The resumable manifests and exact per-file sizes are in that cache. The entire 158-reciter MP3Quran inventory was preflighted at 263,662,393,020 bytes; it exceeded available disk with the required headroom, so it was not downloaded.

The MP3Quran source states that copying its material is allowed; retain source attribution and verify the current terms before public redistribution. EveryAyah clips were sourced from `everyayah.com/data/Alafasy_128kbps`; no explicit corpus-wide redistribution grant was found, so get rights confirmation before serving those files publicly. Do not commit audio binaries.

## Resume and publish

`scripts/audio-mirror.py` inventories the source before transfer, checks free disk with 10% headroom, downloads in bounded parallel workers, and resumes using a manifest. Example:

```powershell
python scripts/audio-mirror.py --reciter 131 --reciter 122
python scripts/audio-repeat-mirror.py --reciter alafasy
```

`scripts/audio-upload.py` can publish manifests to Supabase Storage or an HTTP PUT compatible VPS. It supports the MP3Quran keys `audio/{reciterId}/{surah:03}.mp3` and EveryAyah keys `audio/ayah/alafasy/{surah:03}{ayah:03}.mp3`. Upload has not been run. Supply credentials through environment variables on the publishing machine; never put them in source, app config, or manifests. For Supabase, use a server-side service-role key only in the publisher environment. Verify bucket access policy, CORS/Range behavior, retention, and source rights before making the bucket public.

Mobile offline downloads are managed by `src/services/audio.ts` under the app's document directory and keyed by validated object paths/source URLs. `AudioProvider` resolves an existing local copy before using a remote mirror or the catalog source.
