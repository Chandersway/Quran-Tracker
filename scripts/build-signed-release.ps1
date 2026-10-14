$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$javaDirectory = 'C:\Program Files\Android\Android Studio\jbr'
$signer = Join-Path $javaDirectory 'bin\jarsigner.exe'
$keystore = Join-Path $projectRoot '.signing\quran-tracker-upload.jks'
$bundle = Join-Path $projectRoot 'app\build\outputs\bundle\release\app-release.aab'
$outputDirectory = Join-Path $projectRoot 'output'
$signedBundle = Join-Path $outputDirectory ("QuranTracker-release-{0}.aab" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
if (-not (Test-Path -LiteralPath $keystore)) { throw 'De nieuwe uploadkeystore ontbreekt.' }
if (-not (Test-Path -LiteralPath $signer)) { throw 'Android Studio JBR ontbreekt.' }
if (Test-Path -LiteralPath $signedBundle) { throw 'Uitvoerbestand bestaat al; niets overschreven.' }

$previousJava = $env:JAVA_HOME
Push-Location $projectRoot
try {
    $env:JAVA_HOME = $javaDirectory
    & .\gradlew.bat :app:bundleRelease --offline --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Build mislukt; er wordt niet ondertekend.' }
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    Write-Host 'Voer nu je NIEUWE keystore-wachtwoord in. De invoer is onzichtbaar.'
    # Prompt handled by jarsigner. Never pass passwords as command arguments or write them to disk.
    & $signer -keystore $keystore -signedjar $signedBundle $bundle upload
    if ($LASTEXITCODE -ne 0) { throw 'Ondertekening mislukt; gebruik het uitvoerbestand niet.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($signedBundle)
    try {
        $signature = $archive.Entries | Where-Object { $_.FullName -match '^META-INF/[^/]+\.RSA$' }
        if (-not $signature) { throw 'Geen RSA-handtekening aanwezig; bundel niet gebruiken.' }
    } finally { $archive.Dispose() }
    & $signer -verify $signedBundle
    if ($LASTEXITCODE -ne 0) { throw 'Handtekeningcontrole mislukt; bundel niet gebruiken.' }
    Write-Host ''
    Write-Host "Ondertekende releasebundel: $signedBundle"
    Write-Host 'Zelfondertekend certificaat en ontbrekende timestamp kunnen waarschuwingen geven.'
    Write-Host 'Dit controleert de ondertekening, niet alle Google Play-publicatievereisten.'
    Write-Host 'Upload alleen de .aab naar Play Console, nooit je .jks of wachtwoord.'
} finally {
    $env:JAVA_HOME = $previousJava
    Pop-Location
}
