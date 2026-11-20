# React Native backend and audio mirror

## Provider boundary

`react-native/src/services/types.ts` defines the app-facing service contracts. `createBackend()` in `react-native/src/services/backend.ts` supplies the Supabase implementation for auth and group operations plus a provider-neutral audio service. Notes, planning, reading progress, and app preferences remain local-first in the app store; they are not sent to guessed server tables.

Supabase group calls use the existing server-side authorization API: `list_my_groups_v2`, `get_group_detail_v3`, `create_group_v3_full`, and `join_group_v2_by_code`. Group feed, membership, roles, tasks, and permissions likewise use the existing v2/v3 RPCs. Do not replace these with direct writes to group tables.

Runtime config is supplied through `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; only the public anon key belongs in a client build. Server-side storage publishing uses `SUPABASE_SERVICE_ROLE_KEY` in a trusted environment and must never be added to app config. None of these values are embedded in this document or the client source.

## Audio sources and local mirror

The Android source contains 114 audio catalogs, each with 158 reciter/rewaya entries, currently sourced from MP3Quran. The React Native app bundles those catalogs as offline `.quran` assets and loads them only when a surah's reciter list is requested. Word-by-word and grammar details use the same lazy local-asset path; text and translations remain synchronously available from lightweight Quran data. The web export measured 11,616,206 bytes of entry JavaScript after this split, down from a 39,676,178-byte baseline, while all 228 study/audio data assets remain in the offline app package. Audio catalogs preserve source reciter/rewaya names and retain the original `sourceUrl` in catalog/manifest records when playback resolves to a mirror. MP3Quran's published [privacy/copyright policy](https://www.mp3quran.net/eng/privacy) says visitors and developers may copy site material and use the site's URLs. Attribute each file as `Recitation by <reciter>. Audio source: MP3Quran.net.` The Kotlin repeat flow also uses the MP3Quran [audio API](https://docs-staging.mp3quran.net/) for ayah timing; timing values are normalized from milliseconds to seconds at the service boundary.

The mirror script is resumable and writes only to ignored `react-native/audio-cache/`:

```powershell
python react-native/scripts/audio-mirror.py --reciter 1
python react-native/scripts/audio-mirror.py --all --preflight-only
python react-native/scripts/audio-repeat-mirror.py
```

It requests file sizes before transfer, checks local free space with 10% headroom, limits concurrency to at most eight requests, validates downloaded lengths, writes a checkpointed JSON manifest, and skips completed tracks on rerun. Repeated `--reciter` arguments share a resumable manifest. The all-reciter preflight found 158 IDs × 114 tracks (18,012 files), estimated at 263,662,393,020 bytes (~263.66 GB); 10% headroom raises that to ~290.03 GB, more than the 252.48 GB then available. The full set was not downloaded. Three complete surah recitations are mirrored locally: ID 1 Ahmed Al-Hawashi (1,308,043,111 bytes), ID 131 Mishary Al-Afasy (1,718,021,595 bytes), and ID 122 Mahmoud Khalil Al-Hosary (2,689,038,859 bytes), totaling 5,715,103,565 bytes (~5.72 GB). The separate `audio-repeat-mirror.py` preflight found 6,236/6,236 EveryAyah Alafasy clips, totaling 1,706,672,026 bytes (~1.71 GB); all clips were downloaded to `audio-cache/ayah/alafasy/`. The combined local audio cache is 7,421,775,591 bytes (~7.42 GB). The EveryAyah manifest records source/backlink attribution, but the site does not provide a clear site-wide redistribution grant; confirm rights before hosting these clips publicly. Audio files and manifests are ignored by Git; no binary audio is committed.

## Future storage publishing

After reviewing the manifest and provisioning a destination, run `react-native/scripts/audio-upload.py`. Supabase Storage needs `AUDIO_UPLOAD_ENDPOINT` (project URL), `SUPABASE_SERVICE_ROLE_KEY`, and a bucket (default `quran-audio`). For a VPS/static uploader, use `--backend put --endpoint https://<host>/upload-root`; configure `AUDIO_UPLOAD_BEARER_TOKEN` only if the endpoint expects it. The uploader targets `audio/<reciter-id>/<NNN>.mp3` for surah tracks and `audio/ayah/alafasy/SSSAAA.mp3` for verse clips. Pass `--manifest react-native/audio-cache/repeat-manifest.json` for EveryAyah. It checks local file lengths against the manifest and never writes credentials into the manifest. It has not been run against Supabase or a VPS; no remote storage writes have been made.

Before serving mirror files publicly, configure the bucket/origin for public reads and verify its cache and object-size limits. App URL resolution expects:

```text
<audioBaseUrl>/audio/<reciter-id>/<NNN>.mp3
```

## Credential discovery

The Android source has a Supabase project URL and publishable/anon client-key configuration. No server-side storage credential is required or included for local migration. Keep secrets in local environment or deployment secret stores, and do not print their values when checking configuration.
