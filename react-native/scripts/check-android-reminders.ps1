[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9_.:-]+$')][string]$DeviceSerial,
    [string]$AdbPath
)

$ErrorActionPreference = 'Stop'
$applicationId = 'com.Ameender.qurantracker'
if (-not $AdbPath) {
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $sdkRoot = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $projectRoot '.tooling/android-sdk')) |
        Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'platform-tools/adb.exe')) } |
        Select-Object -First 1
    if (-not $sdkRoot) { throw 'Android SDK not found. Set ANDROID_HOME or provide -AdbPath.' }
    $AdbPath = Join-Path $sdkRoot 'platform-tools/adb.exe'
}
function Read-Android {
    param([string[]]$Arguments)
    $result = (& $AdbPath -s $DeviceSerial @Arguments 2>$null) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Android diagnostics failed. Check the selected device and its connection.' }
    return $result
}

# Read-only: never grants permissions, edits schedules, posts a test notification,
# exports app storage, or prints notification bodies/group messages.
$package = Read-Android @('shell', 'dumpsys', 'package', $applicationId)
if ($package -notmatch 'Package \[com\.Ameender\.qurantracker\]') { throw 'Quran Tracker is not installed on this device.' }
$permission = [regex]::Match($package, 'android\.permission\.POST_NOTIFICATIONS: granted=(true|false)')
$alarms = Read-Android @('shell', 'dumpsys', 'alarm')
$notifications = Read-Android @('shell', 'dumpsys', 'notification')
# Android versions print either the bare package or pkg=<name> after AppSettings.
$appChannels = [regex]::Match($notifications, '(?ms)^[ \t]*AppSettings:[ \t]+(?:pkg=)?com\.Ameender\.qurantracker(?=[\s(]|$)(?<body>.*?)(?=^[ \t]*AppSettings:|\z)')
$channel = [regex]::Match($appChannels.Groups['body'].Value, "NotificationChannel\{mId='reading-plans'[^\r\n]*?mImportance=([0-9]+)")

[ordered]@{
    device = $DeviceSerial
    application = $applicationId
    notificationPermission = if ($permission.Success) { $permission.Groups[1].Value -eq 'true' } else { $null }
    reminderChannelImportance = if ($channel.Success) { [int]$channel.Groups[1].Value } else { $null }
    androidAlarmPackageReferences = [regex]::Matches($alarms, [regex]::Escape($applicationId)).Count
    note = 'Alarm references are Android diagnostic references, not an exact count of scheduled reminders. Null means the OS dump did not expose that field. No delivery test was performed.'
} | ConvertTo-Json
