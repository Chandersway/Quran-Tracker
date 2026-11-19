[CmdletBinding()]
param(
    [ValidatePattern('^(arm64-v8a|x86_64|armeabi-v7a|x86)(,(arm64-v8a|x86_64|armeabi-v7a|x86))*$')]
    [string]$Architectures = 'arm64-v8a,x86_64',
    [switch]$SkipChecks,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "$Executable failed (exit $LASTEXITCODE)." }
}

if ($DryRun) {
    Write-Host 'Local APK build: optional verify/format checks, Expo Android prebuild (no clean), Gradle assembleRelease.'
    Write-Host "Architectures: $Architectures"
    Write-Host 'Output: output/builds/quran-tracker-local.apk plus SHA-256 manifest.'
    Write-Host 'Signing: local test key. This APK is for direct testing, not Play Store publication.'
    exit 0
}

if (-not (Test-Path -LiteralPath 'node_modules/expo/bin/cli' -PathType Leaf)) {
    throw 'Run npm ci from react-native/ first.'
}
$sdkRoot = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $projectRoot '.tooling/android-sdk'),
    (Join-Path $env:LOCALAPPDATA 'Android/Sdk')
) | Where-Object {
    $_ -and (Test-Path -LiteralPath (Join-Path $_ 'platform-tools/adb.exe'))
} | Select-Object -First 1
if (-not $sdkRoot) { throw 'Android SDK not found. Install Android Studio/SDK and set ANDROID_HOME. See docs/LOCAL_DEVELOPMENT.md.' }
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
if (-not $env:JAVA_HOME) {
    $jdk = Get-ChildItem 'C:/Program Files/Java/jdk-*' -Directory -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
    elseif (Test-Path -LiteralPath 'C:/Program Files/Android/Android Studio/jbr/bin/java.exe') {
        $env:JAVA_HOME = 'C:/Program Files/Android/Android Studio/jbr'
    }
}
if (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin/java.exe'))) {
    throw 'Set JAVA_HOME to an installed compatible JDK. See docs/LOCAL_DEVELOPMENT.md.'
}
$env:Path = (Join-Path $env:JAVA_HOME 'bin') + [IO.Path]::PathSeparator + $env:Path
if (-not $env:WIRDNA_NATIVE_BUILD_DIR) {
    $env:WIRDNA_NATIVE_BUILD_DIR = Join-Path ([IO.Path]::GetPathRoot($projectRoot)) 'wirdna-native-build'
}

if (-not $SkipChecks) {
    Invoke-Checked 'npm.cmd' @('run', 'verify')
    Invoke-Checked 'npm.cmd' @('run', 'format:check')
}
# Metro clears its transform cache for a release bundle. Keep that cache apart
# from a running dev server or export, including other projects on this PC.
$apkBuildTemp = Join-Path $projectRoot '.tooling/apk-build-temp'
New-Item -ItemType Directory -Path $apkBuildTemp -Force | Out-Null
$env:TEMP = $apkBuildTemp
$env:TMP = $apkBuildTemp
Invoke-Checked 'node.exe' @('scripts/check-config.mjs', '--local')
Invoke-Checked 'node.exe' @('node_modules/expo/bin/cli', 'prebuild', '--platform', 'android', '--no-install', '--no-clean')
Invoke-Checked (Join-Path $projectRoot 'android/gradlew.bat') @(
    '-p', 'android', ':app:assembleRelease', "-PreactNativeArchitectures=$Architectures", '--console=plain'
)

$sourceApk = Join-Path $projectRoot 'android/app/build/outputs/apk/release/app-release.apk'
if (-not (Test-Path -LiteralPath $sourceApk -PathType Leaf)) { throw 'Gradle returned without the expected release APK.' }
$aapt = Get-ChildItem (Join-Path $sdkRoot 'build-tools') -Filter aapt.exe -Recurse -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
if (-not $aapt) { throw 'Android Build-Tools/aapt is required to verify the APK.' }
$badging = (& $aapt dump badging $sourceApk) -join "`n"
if ($LASTEXITCODE -ne 0 -or $badging -notmatch "(?m)^package: name='com\.Ameender\.qurantracker'" -or $badging -match '(?m)^application-debuggable') {
    throw 'The APK is not a non-debuggable Quran Tracker release; no delivery artifact was copied.'
}

$artifactFolder = Join-Path $projectRoot 'output/builds'
New-Item -ItemType Directory -Force -Path $artifactFolder | Out-Null
$artifact = Join-Path $artifactFolder 'quran-tracker-local.apk'
Copy-Item -LiteralPath $sourceApk -Destination $artifact -Force
$hash = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [ordered]@{
    file = 'quran-tracker-local.apk'
    bytes = (Get-Item -LiteralPath $artifact).Length
    sha256 = $hash
    builtAtUtc = [DateTime]::UtcNow.ToString('o')
    architectures = $Architectures.Split(',')
    distribution = 'local-test'
    signing = 'Local test signing; configure the existing upload identity in EAS for store builds.'
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $artifactFolder 'quran-tracker-local.json')
Write-Host "APK ready: $artifact"
Write-Host "SHA-256: $hash"
Write-Host 'This local test APK is not a Play Store upload. Use npm run build:aab for the signed EAS store route.'
