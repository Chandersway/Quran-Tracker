param([string]$DistinguishedName)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$signingDirectory = Join-Path $projectRoot '.signing'
$keystorePath = Join-Path $signingDirectory 'quran-tracker-upload.jks'
$keytoolPath = 'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe'

if (-not (Test-Path -LiteralPath $keytoolPath)) {
    throw 'Android Studio keytool is niet gevonden. Er is niets aangemaakt.'
}
if (Test-Path -LiteralPath $keystorePath) {
    throw 'De uploadkeystore bestaat al. Deze wordt NIET vervangen.'
}
New-Item -ItemType Directory -Path $signingDirectory -Force | Out-Null
Write-Host 'Maak een uniek, sterk wachtwoord en bewaar dit in je wachtwoordmanager.'
Write-Host 'Je invoer blijft onzichtbaar. Deel het wachtwoord niet in de chat.'
if ($DistinguishedName) {
    Write-Host "Certificaatgegevens: $DistinguishedName"
} else {
    Write-Host 'Vul daarna je eigen certificaatgegevens in. Landcode voor Nederland: NL. Alias: upload.'
}
Write-Host 'Bij het aparte sleutelwachtwoord: druk Enter om hetzelfde wachtwoord te gebruiken.'

# Native interactive prompt: no password in command arguments, files or transcript output.
$certificateArguments = @()
if ($DistinguishedName) { $certificateArguments = @('-dname', $DistinguishedName) }
& $keytoolPath -genkeypair -v -storetype JKS -keystore $keystorePath -alias upload -keyalg RSA -keysize 3072 -validity 10000 @certificateArguments
if ($LASTEXITCODE -ne 0) {
    throw 'Aanmaken niet voltooid. Bewaar eventuele bestanden; probeer niet blind opnieuw.'
}
Write-Host ''
Write-Host "Uploadkeystore aangemaakt: $keystorePath"
Write-Host 'Maak nu een beveiligde back-up buiten deze computer; bewaar het wachtwoord apart.'
Write-Host 'Deze sleutel is voor uploads. Google Play App Signing beheert de distributiesleutel.'
