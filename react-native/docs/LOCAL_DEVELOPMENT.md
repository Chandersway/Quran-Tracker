# Local Android development on Windows

From `react-native/`, install dependencies with `npm ci`, then run:

```powershell
npm run android:dev
```

`android:dev` and `android:local` use the separate **wirdna-dev** AVD, starting a visible window on console port 5558 if it is not already running. They generate the ignored native Android project, build/install the debug development client, start hidden Metro on port 8081, and attach the exact device through `adb reverse` and a development-client deep link. The first native build takes several minutes; later builds reuse Gradle/CMake caches. Updates use `install -r`, preserving app data. The launcher never uninstalls, clears data, copies QA accounts, or selects the first arbitrary connected emulator.

JavaScript and TypeScript edits use Fast Refresh without rebuilding the APK. After installing new native dependencies or changing native config plugins, rerun the full command. To reopen an already installed development build:

```powershell
npm run android:dev -- -SkipBuild
```

`-SkipBuild` installs an existing `android/app/build/outputs/apk/debug/app-debug.apk`, or reuses the installed debuggable client if no APK is present. An identical installed APK is retained with its compiled startup cache. If neither exists, the script explains how to perform the initial native build; it does not substitute a release or Expo Go.

## Release beside development

```powershell
npm run android:compare
```

| Role | AVD | Default serial | Metro |
| --- | --- | --- | --- |
| Native standalone release | `wirdna-qa` | `emulator-5554` | None |
| Native development client | `wirdna-dev` | `emulator-5558` | `8081` |
| Separate local acceptance fixtures | `wirdna-f12-qa` | `emulator-5556` | `8087`; untouched by these commands |

Both comparison windows run native Android. The release renders its compiled JS/assets snapshot, while development reads this checkout through Metro and applies JS/TS edits with Fast Refresh. Accounts, reading progress, downloaded books and preferences belong to each AVD separately. No QA fixture state is copied into the new dev device. Public backend configuration still comes from this checkout; sign in deliberately on each device when needed.

Compare opens the existing release AVD and installs the current Gradle `android/app/build/outputs/apk/release/app-release.apk` when present, first verifying its app ID and that it is non-debuggable. It does not choose historical APK backups by modification time. If that output is absent, it keeps the installed standalone release. Use `-KeepInstalledRelease` to keep a particular installed snapshot, or `-ReleaseApk C:/path/app-release.apk` to select one explicitly. Missing release/device prerequisites produce an actionable error. Compare does not build a release.

Development normally uses the existing native binary in comparison mode. After native dependency/config/plugin changes, use `npm run android:compare -- -RebuildDev`, or `npm run android:dev` for development alone. Fast Refresh cannot update native code and does not change the release snapshot. The release is updated only by installing a newly built release APK.

## Device selection and options

The launcher verifies each emulator's actual name through `adb -s SERIAL emu avd name`. It reuses only the requested AVD. An explicit `-DeviceSerial` must match `-AvdName`; disconnected, mismatching or ambiguous devices fail before any app action. Development installs reject the protected release and local QA names. The requested even console port must be free when starting a new emulator; occupied ports are not reassigned and existing processes are not stopped.

```powershell
npm run android:dev -- -SkipBuild -DeviceSerial emulator-5558
npm run android:dev -- -AvdName MyDevPixel -EmulatorPort 5560 -Port 8082
npm run android:emulator
```

`android:emulator` starts only the selected AVD, without installing/building an app or starting Metro. Optional dev arguments include `-AvdName`, `-DeviceSerial`, `-EmulatorPort`, `-Port`, `-SystemImage`, `-OpenDebugger` and `-ClearMetroCache`. Compare forwards `-Port`, `-OpenDebugger`, `-ClearMetroCache` and `-NoAudio` to development, and accepts explicit `-ReleaseAvdName`/`-DevAvdName`, `-ReleaseDeviceSerial`/`-DevDeviceSerial` and the corresponding emulator ports. Its build switch is `-RebuildDev`.

New emulator windows have audio enabled by default; use `-NoAudio` only for deliberately silent test sessions. A reused emulator keeps its launch-time audio/window configuration. If it was started headless, close that specific emulator and rerun to obtain a visible window; no data reset is needed. `-ClearMetroCache` applies only when starting a new Metro process and does not silently restart an existing server.

The script selects `ANDROID_HOME`, then `ANDROID_SDK_ROOT`, then this checkout's `.tooling/android-sdk`, then `%LOCALAPPDATA%/Android/Sdk`. It uses an existing `JAVA_HOME`, a JDK under `C:/Program Files/Java`, or Android Studio's bundled `jbr`. These settings apply to the command process only. An explicit `ANDROID_AVD_HOME` is respected; otherwise an existing matching checkout-local or user AVD is used. A new dev AVD is created in the selected AVD directory, without overwriting an existing directory.

## Android tools

The verified local setup uses JDK 24, Android SDK platform 37.0, build-tools `37.0.0`, NDK `27.1.12297006`, CMake `3.22.1`, Android Emulator, platform-tools, and a Google APIs `x86_64` API 37 image. The generated Gradle project specifies its required SDK versions. Install matching packages using Android Studio's SDK Manager or `sdkmanager.bat` from Android command-line tools. Set `JAVA_HOME` and `ANDROID_HOME` to your installations if they are outside the locations above.

If **wirdna-dev** is absent, the launcher uses `avdmanager` to create a fresh Pixel 6 with the highest installed Google APIs x86_64 system image (API 37 on the current machine). Pass `-SystemImage 'system-images;android-37.0;google_apis;x86_64'` when creating it to require that exact installed image. It does not download images automatically. If command-line tools, Java, the device profile or an image are missing, install them using SDK Manager and retry. Existing AVDs are never recreated or wiped.

You can instead create an AVD using Android Studio's Device Manager. For an explicitly checkout-local AVD directory:

```powershell
$env:ANDROID_HOME = Join-Path $PWD '.tooling/android-sdk'
$env:ANDROID_AVD_HOME = Join-Path $PWD '.tooling/avd'
New-Item -ItemType Directory -Force -Path $env:ANDROID_AVD_HOME | Out-Null
'no' | & "$env:ANDROID_HOME/cmdline-tools/latest/bin/avdmanager.bat" create avd --name wirdna-dev --package 'system-images;android-37.0;google_apis;x86_64' --device pixel_6
```

The Windows CMake config plugin hashes long object filenames. The launcher also sets a short native build directory at `<checkout drive>:/wirdna-native-build`, avoiding Windows path limits in deeply nested checkouts. Override this with `WIRDNA_NATIVE_BUILD_DIR` if needed. `.tooling/`, native generated directories, and build outputs are ignored by Git.

## Source checkout and checks

Copy or clone the complete repository, including the sibling `app/` and `supabase/` source trees. Runtime data, original fonts, 604 offline Warsh pages, lexicon databases, dictionary/source notices, and native plugin sources are repository inputs. Do not omit `assets/`, `data/`, `src/content/`, `plugins/` or the lockfile when moving the project to another computer. `npm ci` installs JavaScript dependencies; it does not regenerate or download the Quran corpus. Normal startup needs none of this computer's `.tooling` research caches.

Run from `react-native/`:

```powershell
node scripts/check-config.mjs --local
npm run verify
npm run format:check
```

The tests use Node's test runner through `tsx`; no Jest setup, running Metro, emulator, account, or backend is required. A JDK with `javac` and `java`, plus `tar`, must be on `PATH` for the small isolated native-source probes. Setting `JAVA_HOME` alone does not add its binaries to `PATH` for a separately run `npm test`. For this terminal, add them with `$env:Path = "$env:JAVA_HOME/bin;$env:Path"`. CI explicitly selects Node 24 and Temurin 21 for these probes; local Android compilation remains governed by the generated Gradle project.

Asset preparation is a separate maintenance task. The existing Kotlin importer is `python scripts/prepare-content.py`; QAC uses `python scripts/prepare-lexicon.py` with its checked-in immutable input; original surah art/offline Warsh use `npx tsx scripts/prepare-reader-assets.ts` (or `--source <archived-provider-response.json>`). Lane regeneration needs the exact upstream archive/database/license described in [the lexicon service guide](../src/services/lexicon/README.md), placed in ignored `.tooling/lane`; the runtime DB and pinned mapping evidence are already included. Do not run these generators as part of ordinary installation or silently replace pinned source data with newer downloads.

Changes to `plugins/withBackgroundMushafDownloads.js`, its `.kt`/`.m`/`.h` sources/catalog, gesture modules, or the PDF runtime plugin require a fresh native prebuild/build. Fast Refresh, Expo Go and a previously installed development client cannot add those modules. The normal `npm run android:local` path reapplies the plugins before building; `-SkipBuild` is only suitable when the installed native code already matches. macOS/Xcode is required to compile or interactively validate the iOS native implementation.

For fabricated local community acceptance, the guarded harness is `scripts/local-backend-qa/start.ps1`; `-Realtime` enables the local socket service while preserving the isolated project's volumes. Credentials stay in ignored `.tooling/supabase-qa`. These scripts reject non-loopback API requests and are separate from normal app startup and production provisioning.

## Debugging

On the first development-client launch, Android may ask for nearby-device access and Expo shows an introduction to its developer menu. Finish those prompts, then close the menu to see the app. Open React Native DevTools with:

```powershell
npm run android:dev -- -SkipBuild -OpenDebugger
```

You can also press `j` in an interactive Metro terminal, or choose **Open DevTools** in the developer menu. Use `adb -s emulator-5558 shell input keyevent 82` to open that menu; enable **Fast Refresh** there if it was previously disabled. Metro started by the launcher writes `.tooling/metro-8081.log`, `.tooling/metro-8081-error.log` and `.tooling/metro-8081.pid` (the port changes with `-Port`); the emulator writes `.tooling/emulator-wirdna-dev*.log`. A manually started server retains its own log locations. To run Metro interactively yourself:

```powershell
npx expo start --dev-client --localhost --port 8081
```

If the app cannot reach Metro, verify `http://localhost:8081/status` returns `packager-status:running`, then rerun with `-SkipBuild`. A healthy `/status` is not enough to reuse a server: the launcher also reads the Expo Android JSON manifest and checks `extra.expoGo.developer.projectRoot` against this checkout plus `packagerOpts.dev`. A different/unknown project is rejected without killing its process or attaching a device. The manifest/configuration is never printed. Check the port's process and working project yourself before stopping it, or choose another `-Port`.

A blank initial screen can mean the first bundle is still compiling; watch the Metro log. If this checkout's Metro has stalled, stop its identified process, then rerun with `-SkipBuild -ClearMetroCache`. Metro excludes local SDK, AVD, audio-cache and build-output folders from file watching. To check native errors, run `adb -s emulator-5558 logcat -s ReactNativeJS AndroidRuntime`. Use the full `.tooling/android-sdk/platform-tools/adb.exe` path when it is not on `PATH`. If an APK update reports an incompatible signing key or version downgrade, resolve that artifact mismatch; the launcher never uninstalls or deletes the app's existing data to bypass the error.

The Metro block list also excludes native generated `android`/`ReactAndroid` `build`, `.cxx` and `.gradle` directories inside dependency packages. Gradle writes there as well as the app's top-level `android/`; watching transient native outputs can overwhelm the Windows fallback watcher. JavaScript package outputs such as `node_modules/expo-constants/build/index.js` and native `android/src` remain available. Restart an existing Metro process after updating `metro.config.js`; Fast Refresh does not apply server configuration changes. On a busy build machine, a manually started server can additionally use `--max-workers 2` to bound transform workers.

Only public client configuration belongs in `.env`; copy names from `.env.example`. Offline reading works without backend credentials. Supabase sign-in, groups, and remote audio need the corresponding configured services. Local debug builds use Android's development signing key and are separate from store releases. Windows cannot run the iOS simulator; the EAS workflow builds iOS in the cloud, while interactive iOS simulation requires macOS and Xcode.
