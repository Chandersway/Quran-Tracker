# React Native release

The React Native app lives in `react-native/`. GitHub Actions runs quality checks there and prepares EAS Build requests for Android and iOS. Starting an iOS cloud build does not require a local Mac. This configured workflow is preparation; no signed store build, account provisioning or store submission is claimed by the local checks.

For the current Dutch step-by-step commands, including local APK output and the required iOS `ASC_APP_ID`, see [RELEASE_HANDLEIDING](../react-native/docs/RELEASE_HANDLEIDING.md).

## GitHub setup

The migration branch includes the release workflows. GitHub, Expo, Supabase and store credentials still require separate provisioning; committing a workflow does not create those credentials. Before using release Actions, create GitHub environments named `preview` and `production`, then add all connection configuration as GitHub environment **secrets**:

| Name                            | Kind   | Purpose                                                                                                                                |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PROJECT_ID`               | Secret | Expo project ID; also set as `extra.eas.projectId` by the Expo app config.                                                             |
| `EXPO_PUBLIC_SUPABASE_URL`      | Secret | Supabase project URL.                                                                                                                  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Secret | Supabase publishable/anonymous client key.                                                                                             |
| `EXPO_PUBLIC_AUDIO_BASE_URL`    | Secret | Optional mirror URL. A blank secret leaves an existing EAS value unchanged; remove an old EAS value explicitly when retiring a mirror. |
| `EXPO_TOKEN`                    | Secret | Expo access token used by EAS CLI in Actions.                                                                                          |
| `GOOGLE_SERVICES_JSON`          | Secret | Contents of the existing Firebase Android client JSON for this package. Required for Android release builds.                           |

Use separate environment values when preview and production point to different backend projects. Public client configuration will be bundled into the app; never place service role keys or other server credentials in `EXPO_PUBLIC_*` values.

## Build and submit

Open **Actions → React Native release → Run workflow** after the updated repository and environment secrets are available on GitHub. Choose an environment, platform (`all`, `android`, or `ios`), and EAS profile (`preview` or `production`). The protected GitHub environment and EAS profile must have the same name: the workflow rejects a mismatch before configuration can be synchronized into the wrong cloud environment. The default action is **build**. That path runs typecheck/lint/tests/formatting, then requests the cloud build; it does not submit to either store. The workflow exits after queuing the build, so check its eventual result in EAS.

The workflow pins EAS CLI **27.10.0**, whose `env:set` command and file-variable flags have been checked locally through help output and against [Expo's CLI reference](https://docs.expo.dev/eas/cli/). No EAS authentication or remote write is needed to validate those flags. CI uses Node 24 and explicitly installs Temurin 21 for the isolated Java runtime probes in the test suite. The mobile app is not compiled by those Java probes.

Submission is a separate, explicit run: select **submit**, the matching production environment/profile, one platform, and the completed EAS build ID. The workflow checks that the ID is non-empty and submits that exact build, never whichever build happens to be latest. Store listing records and developer accounts must already exist for the matching bundle IDs. Preserve the existing Android signing identity to publish an update rather than a separate app. Before the first update, initialize the remote EAS Android/iOS build versions above the already published version codes; auto-increment alone does not establish that historical baseline.

For an iOS submit run, set the `ASC_APP_ID` production environment secret to the numeric App Store Connect app ID. `scripts/prepare-ios-submit.mjs` validates it and writes `submit.production.ios.ascAppId` into the runner's temporary checkout before non-interactive submission. This is distinct from the bundle identifier and Apple team ID. Android submissions currently target the internal track with draft status; publication remains a separate store-console action.

## EAS signing and store credentials

The first EAS build needs Android and iOS signing credentials. Configure them using EAS credentials management for this Expo project, or configure local credentials through an approved CI secret injection approach; do not commit keystores, certificates, provisioning profiles, API private keys, or credential JSON files. EAS-managed signing credentials are encrypted and associated with the Expo project. EAS Submit also needs the store account authorization appropriate to each platform; configure and verify it before running the explicit submit workflow. Keep all repository-side tokens and environment values in GitHub environment variables/secrets, never in source files.

If using your own Android upload key, preserve a secure backup. Android Play App Signing uses an upload key distinct from the app signing key managed by Google. Apple submission requires App Store Connect access and valid iOS signing configuration. The workflow intentionally cannot submit implicitly as part of a build.

EAS cloud workers do not inherit arbitrary GitHub runner variables. The release workflow synchronizes the selected GitHub environment values into the matching EAS environment (`preview` or `production`) using sensitive visibility before starting a cloud build. This writes them to Expo Services for remote build consumption; the workflow does not display their values. Values compiled under `EXPO_PUBLIC_*` are public in the installed app regardless of how securely CI stores them. The EAS CLI requires the selected Expo project to exist and `EXPO_TOKEN` to have permission to manage its environment variables. This synchronization happens only on the manual build path.

The Firebase client JSON is written to a temporary runner file, checked for the existing Android package, and synchronized as a secret **file** environment variable. EAS supplies its file path as `GOOGLE_SERVICES_JSON` during the native build, following [Expo's file environment-variable contract](https://docs.expo.dev/eas/environment-variables/faq/). The temporary runner file is removed at the end of the step. The ignored local build can reuse the original Kotlin project's client file; cloud builds require the GitHub secret. This public client configuration is distinct from the private Firebase service-account JSON used only by the push server.

## Push notification server credentials

The Supabase `group-push` Edge Function sends Android tokens through FCM and iOS device tokens through APNs. Provision these function secrets in the Supabase project only after the Apple Developer and Firebase credentials are ready:

| Supabase Edge Function secret | Purpose                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `FCM_SERVICE_ACCOUNT_JSON`    | Existing Firebase service account JSON for Android FCM.                                                  |
| `FCM_PROJECT_ID`              | Expected Firebase project identifier; supplied through deployment secrets, never a source-code constant. |
| `APNS_TEAM_ID`                | Apple Developer team identifier.                                                                         |
| `APNS_KEY_ID`                 | APNs signing key identifier.                                                                             |
| `APNS_PRIVATE_KEY`            | APNs `.p8` private key, stored as a secret and never committed.                                          |
| `APNS_TOPIC`                  | App bundle ID, currently `com.Ameender.qurantracker`.                                                    |
| `APNS_ENVIRONMENT`            | `sandbox` for development builds or `production` for store builds.                                       |

The iOS EAS build also needs the Apple push capability and an APNs-enabled provisioning profile. Device token registration is initiated by the user in Notifications settings; opening the app does not request notification permission or register a token. Apply the platform-aware database migration and deploy the updated Edge Function before enabling iOS group push. Existing Android clients continue using `register_push_device_v1`.

## Artifact size gate

Before submitting, record the actual release AAB/device download estimate, iOS archive/thinned app sizes, and EAS source archive separately. The approximately 302 MB of uncompressed source assets and a development APK are different measurements; neither establishes a store download budget.

| Artifact                    | Current published limit                                                        | Required evidence                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Play AAB base module | 500 MB compressed download; all modules/install-time asset packs together 4 GB | Estimate the release AAB's generated APK set across supported device configurations, then confirm Play Console's calculation. Above 200 MB, Play reports a non-blocking mobile-data size notice. Legacy APK upload remains capped at 100 MB. |
| iOS/iPadOS app (iOS 9+)     | 4 GB uncompressed app; 500 MB total `__TEXT` sections for each executable      | Actual Xcode archive/export and thinned variant reports; confirm the processed build's sizes in App Store Connect.                                                                                                                           |
| EAS source upload archive   | 2 GiB hard maximum; warning above 150 MiB                                      | Inspect the actual prepared project archive, including monorepo inputs, rather than summing only app assets.                                                                                                                                 |

These values were checked on 15 November 2026 against [Google Play's dedicated size policy](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en), [Apple's maximum build sizes](https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes) and [Expo's upload documentation](https://docs.expo.dev/build-reference/project-upload/). Google's dedicated size policy and [AAB FAQ](https://developer.android.com/guide/app-bundle/faq) currently say 500 MB for the base module; older general optimization text may still say 200 MB.

[bundletool](https://developer.android.com/tools/bundletool) can estimate delivery from an already generated APK set, for example `get-size total --apks=release.apks --dimensions=ALL`. Measure the base module separately when additional modules are present. Do not treat a universal/debug APK's ZIP bytes as a per-device release estimate. No release artifact has passed this gate merely because source checks or a local debug build passed. If the artifact exceeds a limit, resolve delivery/packaging deliberately while retaining verified source text, fonts, attribution and offline behavior; no silent source recompression/replacement is part of this review.

Native first lookup also creates approximately 83.55 MB of QAC/Lane reference copies in addition to packaged assets. Include that runtime storage in device acceptance and review backup treatment separately from store-download limits.

## Local validation

From a complete repository checkout, enter `react-native/` and run `npm ci`, `node scripts/check-config.mjs --local`, `npm run verify` and `npm run format:check`. The Node/tsx tests require `java`, `javac` and `tar` on PATH for their small native-source probes; they need no emulator, hosted backend or account. The original sibling `app/` and `supabase/` trees remain required by source-preservation tests. The CI path filters cover those source inputs as well as both React Native workflows.

The EAS archive uses Git's ignore rules because there is no separate `.easignore`. Runtime assets and the complete native plugin sources/catalog are included; generated `android/`/`ios/`, research `.tooling`, local environment files, signing files and caches are excluded. A cloud builder must regenerate native projects from those plugins. Never hand it only the JavaScript bundle or copy one machine's generated native directories into a clean checkout. Background downloads and PDF/gesture integrations require a new native build when their plugin sources change.

Reference data is already prepared: QAC/Lane databases and attribution/license records, original source fonts, all 604 Warsh page assets and 114 original surah illustrations are repository inputs. Startup/CI does not need ignored acquisition caches or network dictionary generation. Pinned source data, rebuild scripts and provenance must travel with the repository. Lane's original XML/source locators and complete GPL license remain bundled; unavailable root mappings are not generated at release time. See [local development](../react-native/docs/LOCAL_DEVELOPMENT.md) for asset preparation and platform tools.

After GitHub/Expo/store provisioning and platform acceptance, use the explicit manual workflow for a cloud preview. A local export confirms JavaScript/asset resolution, not signing, native iOS execution, actual background continuation or store acceptance. Windows cannot compile or run the iOS simulator locally; that verification needs Mac/Xcode or the separately provisioned cloud build/device workflow.
