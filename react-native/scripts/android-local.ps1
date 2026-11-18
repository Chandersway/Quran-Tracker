[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_.-]+$')][string]$AvdName = 'wirdna-dev',
    [ValidatePattern('^emulator-[0-9]+$')][string]$DeviceSerial,
    [ValidateRange(5554, 5682)][int]$EmulatorPort = 5558,
    [ValidateRange(1024, 65535)][int]$Port = 8081,
    [string]$SystemImage,
    [switch]$SkipBuild,
    [switch]$EmulatorOnly,
    [switch]$PassThru,
    [switch]$NoAudio,
    [switch]$OpenDebugger,
    [switch]$ClearMetroCache
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$toolingRoot = Join-Path $projectRoot '.tooling'
New-Item -ItemType Directory -Force -Path $toolingRoot | Out-Null

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "$Executable failed (exit $LASTEXITCODE)." }
}

if ($EmulatorPort % 2 -ne 0) { throw '-EmulatorPort must be an even Android console port, for example 5558.' }
if (-not $EmulatorOnly -and $AvdName -in @('wirdna-qa', 'wirdna-f12-qa')) {
    throw "'$AvdName' is reserved for release/local QA. Development installs use wirdna-dev. Use android:compare to open release beside development."
}
$sdkRoot = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $toolingRoot 'android-sdk'), (Join-Path $env:LOCALAPPDATA 'Android/Sdk')) |
    Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'platform-tools/adb.exe')) } |
    Select-Object -First 1
if (-not $sdkRoot) { throw 'Android SDK not found. Set ANDROID_HOME; see docs/LOCAL_DEVELOPMENT.md.' }
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$adbPath = Join-Path $sdkRoot 'platform-tools/adb.exe'
$emulatorPath = Join-Path $sdkRoot 'emulator/emulator.exe'
function Set-JavaEnvironment {
    if (-not $env:JAVA_HOME) {
        $jdkRoot = Get-ChildItem 'C:/Program Files/Java/jdk-*' -Directory -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($jdkRoot) { $env:JAVA_HOME = $jdkRoot.FullName }
        elseif (Test-Path -LiteralPath 'C:/Program Files/Android/Android Studio/jbr/bin/java.exe') {
            $env:JAVA_HOME = 'C:/Program Files/Android/Android Studio/jbr'
        }
    }
    if (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin/java.exe'))) {
        throw 'A JDK is required by Android tools. Set JAVA_HOME to a supported JDK or the Android Studio jbr folder; see docs/LOCAL_DEVELOPMENT.md.'
    }
}
if (-not $SkipBuild -and -not $EmulatorOnly) { Set-JavaEnvironment }
# Native build products have very deep paths on Windows. Keep them outside this checkout.
if (-not $env:WIRDNA_NATIVE_BUILD_DIR) {
    $env:WIRDNA_NATIVE_BUILD_DIR = Join-Path ([System.IO.Path]::GetPathRoot($projectRoot)) 'wirdna-native-build'
}
if (-not $env:ANDROID_AVD_HOME) {
    $localAvdHome = Join-Path $toolingRoot 'avd'
    $userAndroidHome = if ($env:ANDROID_USER_HOME) { $env:ANDROID_USER_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.android' }
    $userAvdHome = Join-Path $userAndroidHome 'avd'
    if (Test-Path -LiteralPath (Join-Path $localAvdHome "$AvdName.ini")) { $env:ANDROID_AVD_HOME = $localAvdHome }
    elseif (Test-Path -LiteralPath (Join-Path $userAvdHome "$AvdName.ini")) { $env:ANDROID_AVD_HOME = $userAvdHome }
    elseif (Test-Path -LiteralPath $localAvdHome) { $env:ANDROID_AVD_HOME = $localAvdHome }
    else { $env:ANDROID_AVD_HOME = $userAvdHome }
}
Write-Host "Android SDK: $sdkRoot"
Invoke-Checked $adbPath @('start-server')

function Get-EmulatorName {
    param([string]$Serial)
    $lines = @(& $adbPath -s $Serial emu avd name 2>$null)
    if ($LASTEXITCODE -ne 0) { return $null }
    $names = @($lines | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -ne 'OK' })
    if ($names.Count -eq 1) { return $names[0] }
    return $null
}
function Assert-DeviceAvd {
    $actualName = Get-EmulatorName $DeviceSerial
    if ($actualName -ne $AvdName) {
        throw "Device identity mismatch: $DeviceSerial reports '$actualName', expected '$AvdName'. No app action was performed on that device."
    }
}
function Get-ConnectedEmulators {
    $rows = @(& $adbPath devices)
    if ($LASTEXITCODE -ne 0) { throw 'adb devices failed.' }
    foreach ($row in $rows) {
        if ($row -match '^(emulator-\d+)\s+(\S+)') {
            $serial = $Matches[1]
            $state = $Matches[2]
            $name = if ($state -eq 'device') { Get-EmulatorName $serial } else { $null }
            [pscustomobject]@{ Serial = $serial; State = $state; AvdName = $name }
        }
    }
}
function New-DevelopmentAvd {
    if ($AvdName -ne 'wirdna-dev') {
        throw "AVD '$AvdName' was not found. Create that exact AVD in Android Studio, or use the automatically provisioned wirdna-dev. No other AVD will be selected."
    }
    Set-JavaEnvironment
    $avdManager = Join-Path $sdkRoot 'cmdline-tools/latest/bin/avdmanager.bat'
    if (-not (Test-Path -LiteralPath $avdManager)) {
        $avdManager = Get-ChildItem (Join-Path $sdkRoot 'cmdline-tools') -Filter avdmanager.bat -Recurse -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
    }
    if (-not $avdManager) { throw 'Install Android SDK Command-line Tools in SDK Manager, then rerun. The dev AVD has not been created.' }
    if (-not $SystemImage) {
        $images = @(Get-ChildItem (Join-Path $sdkRoot 'system-images') -Filter source.properties -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            $imageDirectory = $_.Directory.FullName
            $relative = $imageDirectory.Substring($sdkRoot.TrimEnd('\', '/').Length + 1).Replace('\', ';').Replace('/', ';')
            if ($relative -match '^system-images;android-([0-9.]+);google_apis;x86_64$') {
                [pscustomobject]@{ Package = $relative; Api = [version]($Matches[1] + $(if ($Matches[1] -notmatch '\.') { '.0' } else { '' })) }
            }
        })
        $SystemImage = $images | Sort-Object Api -Descending | Select-Object -First 1 -ExpandProperty Package
    }
    if (-not $SystemImage -or $SystemImage -notmatch '^system-images;android-[0-9.]+;[A-Za-z0-9_]+;x86_64$' -or
        -not (Test-Path -LiteralPath (Join-Path $sdkRoot ($SystemImage.Replace(';', '/') + '/source.properties')))) {
        throw 'No installed x86_64 Android system image is available. Install a Google APIs image with SDK Manager (for example system-images;android-37.0;google_apis;x86_64), or pass -SystemImage with an installed package ID.'
    }
    $avdDirectory = Join-Path $env:ANDROID_AVD_HOME "$AvdName.avd"
    if (Test-Path -LiteralPath $avdDirectory) { throw "An unregistered AVD directory already exists at $avdDirectory. Register/repair it in Android Studio; this script will not overwrite its data." }
    New-Item -ItemType Directory -Force -Path $env:ANDROID_AVD_HOME | Out-Null
    Write-Host "Creating new, separate dev AVD: $AvdName (Pixel 6, $SystemImage). No accounts or QA data are copied."
    'no' | & $avdManager create avd --name $AvdName --package $SystemImage --device pixel_6 --path $avdDirectory | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'avdmanager failed. Install the requested system image/Pixel 6 device profile in Android Studio and rerun; no existing AVD was overwritten.' }
}

$connected = @(Get-ConnectedEmulators)
if ($DeviceSerial) {
    if (-not ($connected | Where-Object { $_.Serial -eq $DeviceSerial -and $_.State -eq 'device' })) {
        throw "Requested device $DeviceSerial is not online. Start AVD '$AvdName', or omit -DeviceSerial to let the launcher start it."
    }
    Assert-DeviceAvd
} else {
    $matching = @($connected | Where-Object { $_.AvdName -eq $AvdName })
    if ($matching.Count -gt 1) { throw "More than one online emulator reports AVD '$AvdName'. Pass the exact -DeviceSerial; no device was selected." }
    if ($matching.Count -eq 1) { $DeviceSerial = $matching[0].Serial }
}
if (-not $DeviceSerial) {
    if (-not (Test-Path -LiteralPath $emulatorPath)) { throw 'Install the Android SDK Emulator package in SDK Manager.' }
    $avds = @(& $emulatorPath -list-avds | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($LASTEXITCODE -ne 0) { throw 'The emulator could not list registered AVDs.' }
    if ($avds -notcontains $AvdName) { New-DevelopmentAvd }
    $DeviceSerial = "emulator-$EmulatorPort"
    $usedPorts = @(Get-NetTCPConnection -LocalPort @($EmulatorPort, ($EmulatorPort + 1)) -State Listen -ErrorAction SilentlyContinue)
    if (($connected | Where-Object { $_.Serial -eq $DeviceSerial }) -or $usedPorts.Count -gt 0) {
        throw "Emulator console port $EmulatorPort is occupied. Choose a free even -EmulatorPort; the existing device/process will not be stopped."
    }
    Write-Host "Opening visible emulator: $AvdName on $DeviceSerial"
    $emulatorArguments = @('-avd', $AvdName, '-port', $EmulatorPort, '-no-snapshot', '-gpu', 'swiftshader')
    if ($NoAudio) { $emulatorArguments += '-no-audio' }
    Start-Process -FilePath $emulatorPath -ArgumentList $emulatorArguments `
        -WindowStyle Normal -RedirectStandardOutput (Join-Path $toolingRoot "emulator-$AvdName.log") `
        -RedirectStandardError (Join-Path $toolingRoot "emulator-$AvdName-error.log") | Out-Null
    $deviceDeadline = (Get-Date).AddMinutes(3)
    do {
        Start-Sleep -Seconds 2
        $online = @(Get-ConnectedEmulators | Where-Object { $_.Serial -eq $DeviceSerial -and $_.State -eq 'device' })
    } until ($online.Count -gt 0 -or (Get-Date) -gt $deviceDeadline)
    if ($online.Count -eq 0) { throw "AVD '$AvdName' did not connect on $DeviceSerial within three minutes; inspect .tooling/emulator-$AvdName-error.log." }
}
Assert-DeviceAvd
$bootDeadline = (Get-Date).AddMinutes(3)
do {
    $bootCompleted = ((& $adbPath -s $DeviceSerial shell getprop sys.boot_completed 2>$null) -join '').Trim()
    if ($bootCompleted -eq '1') { break }
    Start-Sleep -Seconds 2
} until ((Get-Date) -gt $bootDeadline)
if ($bootCompleted -ne '1') { throw "Android device $DeviceSerial did not finish booting." }
Assert-DeviceAvd
if ($EmulatorOnly) {
    Write-Host "Android emulator $DeviceSerial is booted as '$AvdName'. No app build, installation, Metro, or debugger was started."
    if ($PassThru) { [pscustomobject]@{ DeviceSerial = $DeviceSerial; AvdName = $AvdName; AdbPath = $adbPath; SdkRoot = $sdkRoot } }
    return
}
$deviceAbi = (& $adbPath -s $DeviceSerial shell getprop ro.product.cpu.abi).Trim()
Write-Host "Device: $DeviceSerial ($deviceAbi)"

function Install-DebugApk {
    param([string]$debugApk)
    Assert-DeviceAvd
    $localApkHash = (Get-FileHash -LiteralPath $debugApk -Algorithm SHA256).Hash.ToLowerInvariant()
    $installedBase = (& $adbPath -s $DeviceSerial shell pm path com.Ameender.qurantracker 2>$null) |
        Where-Object { $_ -match '^package:.*/base\.apk$' } | Select-Object -First 1
    $installedHash = ''
    if ($installedBase) {
        $installedBase = $installedBase.Substring('package:'.Length).Trim()
        $hashLine = & $adbPath -s $DeviceSerial shell sha256sum $installedBase 2>$null
        if ($LASTEXITCODE -eq 0 -and $hashLine -match '^([a-fA-F0-9]{64})\s') { $installedHash = $Matches[1].ToLowerInvariant() }
    }
    if ($installedHash -eq $localApkHash) {
        Write-Host 'Reusing the identical installed debug APK and its compiled Android startup cache.'
    } else {
        Assert-DeviceAvd
        Invoke-Checked $adbPath @('-s', $DeviceSerial, 'install', '--no-streaming', '-r', $debugApk)
        $deviceSdk = [int](& $adbPath -s $DeviceSerial shell getprop ro.build.version.sdk).Trim()
        $isEmulator = (& $adbPath -s $DeviceSerial shell getprop ro.kernel.qemu).Trim() -eq '1'
        if ($isEmulator -and $deviceSdk -ge 37) {
            Write-Host 'Preparing this app startup cache on the API 37 emulator; the first optimization can take several minutes.'
            $optimizationTimer = [Diagnostics.Stopwatch]::StartNew()
            Invoke-Checked $adbPath @('-s', $DeviceSerial, 'shell', 'cmd', 'package', 'compile', '-m', 'speed', '-f', 'com.Ameender.qurantracker')
            $optimizationTimer.Stop()
            Write-Host "App startup cache prepared in $([math]::Round($optimizationTimer.Elapsed.TotalSeconds, 1)) seconds."
        }
    }
}
$debugApk = Join-Path $projectRoot 'android/app/build/outputs/apk/debug/app-debug.apk'
if (-not $SkipBuild) {
    Invoke-Checked 'npx.cmd' @('expo', 'prebuild', '--platform', 'android', '--no-install', '--no-clean')
    Invoke-Checked (Join-Path $projectRoot 'android/gradlew.bat') @('-p', 'android', ':app:assembleDebug', "-PreactNativeArchitectures=$deviceAbi", '--console=plain')
    Install-DebugApk $debugApk
} elseif (Test-Path -LiteralPath $debugApk) {
    Install-DebugApk $debugApk
} else {
    $installedPackage = (& $adbPath -s $DeviceSerial shell dumpsys package com.Ameender.qurantracker) -join "`n"
    if ($installedPackage -notmatch 'flags=\[[^\]]*\bDEBUGGABLE\b') {
        throw 'No debug development client or previously built debug APK is available for this dev AVD. Run npm run android:dev without -SkipBuild once; existing app data is preserved.'
    }
}

$startedMetro = $false
function Test-Metro {
    try {
        $responseBody = (Invoke-WebRequest "http://127.0.0.1:$Port/status" -UseBasicParsing -TimeoutSec 10).Content
        if ($responseBody -is [byte[]]) { $responseBody = [Text.Encoding]::UTF8.GetString($responseBody) }
        return $responseBody -match 'packager-status:running'
    }
    catch { return $false }
}
function Assert-MetroProject {
    # /status alone identifies Metro, not its checkout. Expo SDK58 exposes the
    # actual server root in this JSON manifest; never print the manifest/config.
    try {
        $manifest = Invoke-RestMethod "http://127.0.0.1:$Port/?platform=android" `
            -Headers @{ Accept = 'application/json'; 'expo-platform' = 'android' } -TimeoutSec 15
        $serverRoot = $manifest.extra.expoGo.developer.projectRoot
        $serverIsDevelopment = $manifest.extra.expoGo.packagerOpts.dev -eq $true
        $matchesProject = $serverRoot -and ([IO.Path]::GetFullPath($serverRoot).TrimEnd('\', '/') -eq [IO.Path]::GetFullPath($projectRoot).TrimEnd('\', '/'))
    } catch { $matchesProject = $false; $serverIsDevelopment = $false }
    if (-not $matchesProject -or -not $serverIsDevelopment) {
        throw "Port $Port does not identify a development Metro server for this checkout. Check its owner/project before stopping it, or choose another -Port. No device was attached to that server."
    }
}
if (-not (Test-Metro)) {
    $existingListener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existingListener) {
        Write-Host "Waiting for the existing server on port $Port (PID $($existingListener.OwningProcess))"
        $existingDeadline = (Get-Date).AddMinutes(1)
        do { Start-Sleep -Seconds 1; $metroReady = Test-Metro } until ($metroReady -or (Get-Date) -gt $existingDeadline)
        if (-not $metroReady) { throw "Port $Port is occupied by PID $($existingListener.OwningProcess), but Metro is not responding. Stop that server after checking its project, then rerun." }
    }
}
if (-not (Test-Metro)) {
    Write-Host "Starting Metro on port $Port"
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $expoCli = Join-Path $projectRoot 'node_modules/expo/bin/cli'
    if (-not (Test-Path -LiteralPath $expoCli)) { throw 'Expo CLI is missing. Run npm ci in this checkout, then rerun.' }
    $metroArguments = @("`"$expoCli`"", 'start', "`"$projectRoot`"", '--dev-client', '--localhost', '--port', $Port)
    if ($ClearMetroCache) { $metroArguments += '--clear' }
    $metroProcess = Start-Process -FilePath $nodePath -ArgumentList $metroArguments `
        -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $toolingRoot "metro-$Port.log") `
        -RedirectStandardError (Join-Path $toolingRoot "metro-$Port-error.log")
    $metroProcess.Id | Set-Content (Join-Path $toolingRoot "metro-$Port.pid")
    $startedMetro = $true
    $metroDeadline = (Get-Date).AddMinutes(1)
    do {
        Start-Sleep -Seconds 1
        $metroProcess.Refresh()
        if ($metroProcess.HasExited) { throw "Metro exited before becoming ready. Inspect .tooling/metro-$Port-error.log." }
    } until ((Test-Metro) -or (Get-Date) -gt $metroDeadline)
    if (-not (Test-Metro)) { throw "Metro failed to start. Inspect .tooling/metro-$Port-error.log." }
} elseif ($ClearMetroCache) {
    Write-Host '-ClearMetroCache only applies when starting Metro. The existing server/cache was left intact.'
}
Assert-MetroProject
Write-Host "Using verified development Metro for this checkout on port $Port"
Assert-DeviceAvd
Invoke-Checked $adbPath @('-s', $DeviceSerial, 'reverse', "tcp:$Port", "tcp:$Port")
if ($startedMetro) {
    # A running development client can retain its old Metro connection after a restart.
    Invoke-Checked $adbPath @('-s', $DeviceSerial, 'shell', 'am', 'force-stop', 'com.Ameender.qurantracker')
}
$developmentUrl = 'qurantracker://expo-development-client/?url=' + [Uri]::EscapeDataString("http://127.0.0.1:$Port")
Assert-DeviceAvd
Invoke-Checked $adbPath @('-s', $DeviceSerial, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', $developmentUrl, 'com.Ameender.qurantracker')
Write-Host "Quran Tracker development client is opening on $DeviceSerial ($AvdName). Save JS/TS for Fast Refresh; enable it in the developer menu if previously disabled."
if ($OpenDebugger) {
    $debuggerStarted = Get-Date
    $debuggerDeadline = $debuggerStarted.AddSeconds(180)
    $nextDebuggerProgress = $debuggerStarted
    do {
        try { $debugTargets = @(Invoke-RestMethod "http://127.0.0.1:$Port/json/list" -TimeoutSec 10) }
        catch { $debugTargets = @() }
        $debugTarget = $debugTargets | Where-Object { $_.appId -eq 'com.Ameender.qurantracker' } | Select-Object -First 1
        if ($debugTarget) { break }
        if ((Get-Date) -ge $nextDebuggerProgress) {
            Write-Host "Waiting for the first development bundle and Hermes connection ($([int]((Get-Date) - $debuggerStarted).TotalSeconds)/180 seconds); Metro logs: .tooling/metro-$Port.log"
            $nextDebuggerProgress = (Get-Date).AddSeconds(15)
        }
        Start-Sleep -Seconds 1
    } until ((Get-Date) -gt $debuggerDeadline)
    if (-not $debugTarget) { throw "The app did not connect to Hermes within 180 seconds. Inspect .tooling/metro-$Port.log and AndroidRuntime/ActivityManager logs; finish any emulator prompts, then retry -SkipBuild -OpenDebugger." }
    Invoke-WebRequest "http://127.0.0.1:$Port/_expo/debugger?appId=com.Ameender.qurantracker" -Method Post -UseBasicParsing -TimeoutSec 10 | Out-Null
    Write-Host 'Opened React Native DevTools.'
} else { Write-Host 'Use the developer menu to open DevTools, or rerun with -SkipBuild -OpenDebugger.' }
