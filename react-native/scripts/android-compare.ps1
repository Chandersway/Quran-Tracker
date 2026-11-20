[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_.-]+$')][string]$ReleaseAvdName = 'wirdna-qa',
    [ValidatePattern('^emulator-[0-9]+$')][string]$ReleaseDeviceSerial,
    [ValidateRange(5554, 5682)][int]$ReleaseEmulatorPort = 5554,
    [ValidatePattern('^[A-Za-z0-9_.-]+$')][string]$DevAvdName = 'wirdna-dev',
    [ValidatePattern('^emulator-[0-9]+$')][string]$DevDeviceSerial,
    [ValidateRange(5554, 5682)][int]$DevEmulatorPort = 5558,
    [ValidateRange(1024, 65535)][int]$Port = 8081,
    [string]$ReleaseApk,
    [switch]$KeepInstalledRelease,
    [switch]$RebuildDev,
    [switch]$NoAudio,
    [switch]$OpenDebugger,
    [switch]$ClearMetroCache
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$launcher = Join-Path $PSScriptRoot 'android-local.ps1'
$applicationId = 'com.Ameender.qurantracker'
if ($ReleaseAvdName -eq $DevAvdName -or $ReleaseEmulatorPort -eq $DevEmulatorPort -or
    ($ReleaseDeviceSerial -and $ReleaseDeviceSerial -eq $DevDeviceSerial)) {
    throw 'Release and development must use separate AVDs and emulator ports/serials.'
}
if ($DevAvdName -in @('wirdna-qa', 'wirdna-f12-qa') -or $ReleaseAvdName -in @('wirdna-dev', 'wirdna-f12-qa')) {
    throw 'The release AVD, dedicated development AVD and local QA AVD cannot exchange roles.'
}
if ($KeepInstalledRelease -and $ReleaseApk) { throw 'Choose either -KeepInstalledRelease or -ReleaseApk, not both.' }
if ($ReleaseApk) {
    if (-not (Test-Path -LiteralPath $ReleaseApk -PathType Leaf)) { throw "Release APK not found: $ReleaseApk" }
    $ReleaseApk = (Resolve-Path -LiteralPath $ReleaseApk).Path
} elseif (-not $KeepInstalledRelease) {
    # Only the current Gradle release output is automatic. Never guess among
    # historical backups, QA artifacts, or files named app-debug.apk.
    $candidate = Join-Path $projectRoot 'android/app/build/outputs/apk/release/app-release.apk'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { $ReleaseApk = $candidate }
}

$releaseOptions = @{
    AvdName = $ReleaseAvdName; EmulatorPort = $ReleaseEmulatorPort
    EmulatorOnly = $true; PassThru = $true; NoAudio = $NoAudio
}
if ($ReleaseDeviceSerial) { $releaseOptions.DeviceSerial = $ReleaseDeviceSerial }
$releaseDevice = & $launcher @releaseOptions
if (-not $releaseDevice.DeviceSerial -or -not $releaseDevice.AdbPath) { throw 'The release AVD launcher did not return a verified device.' }
$releaseSerial = $releaseDevice.DeviceSerial
$adbPath = $releaseDevice.AdbPath

function Assert-ReleaseDevice {
    $identity = @(& $adbPath -s $releaseSerial emu avd name 2>$null)
    $identityExit = $LASTEXITCODE
    $identity = @($identity | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -ne 'OK' })
    if ($identityExit -ne 0 -or $identity.Count -ne 1 -or $identity[0] -ne $ReleaseAvdName) {
        throw "Release device identity changed. Expected '$ReleaseAvdName' on $releaseSerial; no further app actions will run."
    }
}
function Invoke-ReleaseAdb {
    param([string[]]$Arguments)
    Assert-ReleaseDevice
    & $adbPath -s $releaseSerial @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'Release adb action failed. No uninstall or data reset is attempted; inspect the error above before retrying.'
    }
}

if ($ReleaseApk) {
    $aapt = Get-ChildItem (Join-Path $releaseDevice.SdkRoot 'build-tools') -Filter aapt.exe -Recurse -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
    if (-not $aapt) { throw 'Install Android SDK Build-Tools to verify the release APK, or use -KeepInstalledRelease for the already installed snapshot.' }
    $badging = (& $aapt dump badging $ReleaseApk) -join "`n"
    if ($LASTEXITCODE -ne 0 -or $badging -notmatch "(?m)^package: name='com\.Ameender\.qurantracker'" -or $badging -match '(?m)^application-debuggable') {
        throw 'The selected APK is not a non-debuggable Quran Tracker release. It was not installed.'
    }
    Assert-ReleaseDevice
    $localHash = (Get-FileHash -LiteralPath $ReleaseApk -Algorithm SHA256).Hash.ToLowerInvariant()
    $basePath = (& $adbPath -s $releaseSerial shell pm path $applicationId 2>$null) |
        Where-Object { $_ -match '^package:.*/base\.apk$' } | Select-Object -First 1
    $installedHash = ''
    if ($basePath) {
        $devicePath = $basePath.Substring('package:'.Length).Trim()
        $hashLine = (& $adbPath -s $releaseSerial shell sha256sum $devicePath 2>$null) -join ''
        if ($LASTEXITCODE -eq 0 -and $hashLine -match '^([a-fA-F0-9]{64})\s') { $installedHash = $Matches[1].ToLowerInvariant() }
    }
    if ($installedHash -ne $localHash) {
        Write-Host "Updating the release snapshot on $releaseSerial with install -r (app data preserved): $ReleaseApk"
        Invoke-ReleaseAdb @('install', '--no-streaming', '-r', $ReleaseApk)
    } else { Write-Host 'The current release APK is already installed; preserving its startup cache.' }
}
Assert-ReleaseDevice
$installedRelease = (& $adbPath -s $releaseSerial shell pm path $applicationId 2>$null) -join ''
$packageInfo = (& $adbPath -s $releaseSerial shell dumpsys package $applicationId 2>$null) -join "`n"
if ($installedRelease -notmatch '^package:' -or $packageInfo -match 'flags=\[[^\]]*\bDEBUGGABLE\b') {
    throw 'No standalone release is installed on the release AVD. Provide -ReleaseApk with a verified release APK, or build :app:assembleRelease first. Development will not replace this device.'
}
Invoke-ReleaseAdb @('shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LAUNCHER', '-n', "$applicationId/.MainActivity")

$devOptions = @{
    AvdName = $DevAvdName; EmulatorPort = $DevEmulatorPort; Port = $Port
    SkipBuild = (-not $RebuildDev); NoAudio = $NoAudio
    OpenDebugger = $OpenDebugger; ClearMetroCache = $ClearMetroCache
}
if ($DevDeviceSerial) { $devOptions.DeviceSerial = $DevDeviceSerial }
& $launcher @devOptions
Write-Host "Comparison ready: '$ReleaseAvdName' is a standalone release snapshot; '$DevAvdName' is a separate native development client with Metro on $Port. Accounts, downloads and preferences are separate."
