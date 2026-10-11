# F01 — Eerste iOS-shell en eerste iPhone-build

Datum: 9 oktober 2026. **Status: BLOCKED voor volledige F01-acceptatie.**
De Windows-voorbereiding is uitgevoerd. Er is nog geen iOS-build of fysieke
iPhone-installatie bewezen. Er is in deze sessie geen Mac/Xcode beschikbaar.

## Uitgangspunt en uitgevoerde werkzaamheden

- Repository: https://github.com/Chandersway/Quran-Tracker
- Gebruikte Git-root: `C:\Users\skale\Documents\Quran-Tracker-main\.github-upload`.
- Beginbranch: `main`; schone werkboom.
- Basiscommit: `69c09550bf6f0dad59c6af7351a9f38c3a5b50ff`.
- Nieuwe branch: `feature/ios-f01-shell`, aangemaakt met `git switch -c`.
- Tijdens de oorspronkelijke F01-voorbereiding zijn geen commits of pushes uitgevoerd. De voorbereiding is later op `feature/ios-f01-shell` naar GitHub gepusht.
- Gebruiker antwoordde `16.2` op de vraag naar model/iOS-versie. Dit is als
  **iOS 16.2** geïnterpreteerd; het iPhone-model is nog onbekend.
- Twee SwiftUI-bestanden voorbereid: één app-entrypoint en één welkomstscherm.
- De knop wisselt tussen de starttekst en een bevestiging met `@State`.
  Tweede tik herstelt de starttekst; volledig opnieuw starten reset de status.
- De interface gebruikt standaardcomponenten, systeemkleuren, schaalbare fonts,
  een scrollbaar scherm en een knop met minimaal 44 punten hoogte.
- Versie/build wordt uit de appbundle gelezen. De voorgestelde waarden zijn
  `0.1.0` en `1`. Tot Xcode deze instellingen toepast is dit geen gebouwd product.
- Geen KMP, reader, audio, accounts, database, netwerk of externe packages.

## Bestanden en structuur

Nieuwe bestanden:

```text
iosApp/
  .gitignore
  README.md
  Configuration/
    F01.xcconfig
  QuranTrackerShell/
    QuranTrackerShellApp.swift
    ContentView.swift
docs/ios/
  F01-first-ios-build.md
```

Er zijn geen bestaande gevolgde bestanden gewijzigd. De Android-module `app/`,
Gradle-configuratie, Room-schema's, Supabase en Firebase blijven ongewijzigd.
`shared/` is niet aangemaakt. De rootmap `commonMain/` is geen nieuwe KMP-module.

Er is bewust geen handmatig Xcode-project gemaakt. Op de Mac komt het door
Xcode gegenereerde project op `iosApp/QuranTrackerShell.xcodeproj`, naast de
bestaande bronmap. De naam `QuranTrackerShell` is de technische projectnaam;
de zichtbare appnaam is **Quran Tracker**.

## Beschikbare toolchains en controles op Windows

| Onderdeel | Waarneming |
|---|---|
| Host | Windows; geen verbonden Mac-buildomgeving beschikbaar in deze sessie |
| Xcode / xcrun / xcodebuild | Niet beschikbaar |
| swift / swiftc | Niet op PATH; ook geen installatie gevonden in de gecontroleerde standaardmappen |
| Java | Android Studio JBR 21.0.10, expliciet via `JAVA_HOME` geselecteerd |
| Gradle / AGP / Kotlin | Bestaande wrapper 8.13 / 8.13.2 / 2.0.0 |
| Android | compile/target SDK 36, minimum 26; ongewijzigd |
| Node | 24.16.0; alleen voor lokale tekst-/structuurcontrole |

Uitgevoerd in de bestaande Git-root:

```powershell
git rev-parse --show-toplevel
git status --short --branch
git rev-parse HEAD
git branch --list feature/ios-f01-shell
git switch -c feature/ios-f01-shell

$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
.\gradlew.bat --offline --console=plain :app:assembleDebug :app:bundleRelease :app:testDebugUnitTest :app:testReleaseUnitTest

git diff --exit-code HEAD -- app build.gradle.kts settings.gradle.kts gradle.properties gradle gradlew gradlew.bat supabase firebase.json .firebaserc
```

Android-resultaat: **BUILD SUCCESSFUL in 4s**, 107 taken: 4 uitgevoerd en
103 up-to-date. Beide unit-testtaken waren **UP-TO-DATE**, dus geen nieuwe
uitvoering van de 139 tests per variant. De opnieuw uitgevoerde F00-suites
blijven het testbewijs: debug 139/139 en release 139/139, zonder fouten/skips.
Deze incrementele F01-run bevestigt dat de geïsoleerde iOS-toevoegingen de
bestaande Android-build niet verstoren. Log:
[`build/f01-android-regression.log`](../../build/f01-android-regression.log).

Bron-/structuurcontrole omvat bestandsinventaris, één `@main`, uitsluitend
SwiftUI-imports, knop/statusbinding, configuratiesleutels, relatieve documentlinks
en diffcontrole van de beschermde Android-/backendpaden. Dit is tekstuele
statische controle, **geen Swift-parser, typecheck of compilerbewijs**.
Resultaat: alle genoemde statische controles geslaagd; ook `git diff --check`
meldt geen problemen. Uitvoer: [`build/f01-static-checks.json`](../../build/f01-static-checks.json).

Niet uitgevoerd: Swift-compilatie, SwiftUI-preview, simulator, iOS-signing,
iPhone-installatie, knopbediening op toestel, herstart, VoiceOver en iOS-crashlogs.
Er zijn geen instrumentatietests of installaties op de Android-telefoon uitgevoerd.

## Geschikte Mac en Xcode

Voor deze iOS 16.2-proef is **Xcode 26.3** een concrete uitgangsoptie. Volgens
[Apples Xcode-tabel](https://developer.apple.com/xcode/system-requirements)
ondersteunt die versie macOS Sequoia **15.6** en macOS Tahoe **26.x**, met
fysieke toestelondersteuning vanaf iOS 15. De iOS-SDK is 26.2; het deploymenttarget
blijft 16.0. SDK-versie en minimum ondersteunde iOS-versie zijn verschillende zaken.

Kies niet automatisch de nieuwste Xcode: de geraadpleegde tabel vermeldt bij
Xcode 27 fysieke ondersteuning vanaf iOS 17. Dat past niet bij de opgegeven 16.2.
Controleer bij de Mac-sessie opnieuw de tabel, de werkelijke macOS-versie en de
iPhone-versie. Bij een andere combinatie eerst compatibiliteit beoordelen.
Er is geen iPhone-update nodig als voor deze passende Xcode-combinatie wordt gekozen.

Installeer de volledige Xcode-app en een beschikbare iPhone-simulatorruntime,
open Xcode één keer en rond de componentinstallatie/licentie af. Selecteer de
geïnstalleerde Xcode onder Settings > Locations > Command Line Tools.
Leg daarna vast:

```sh
sw_vers
xcodebuild -version
xcode-select -p
xcrun --sdk iphoneos --show-sdk-version
```

Een macOS-CI-runner kan later een simulatorbuild doen met dezelfde vastgelegde
Xcode-versie. Die vervangt de fysieke iPhone-test niet. In F01 is geen runner,
workflow, betaald account of signingsecret ingericht.

## Mac-stappenplan: project met Xcode aanmaken

1. Haal op de Mac de branch `feature/ios-f01-shell` van GitHub op; daarin staan
   `iosApp/` en `docs/ios/`. Kopieer voor de shell geen Android-signingbestanden,
   lokale configuratie of buildcaches mee.
2. Controleer eerst of `iosApp/QuranTrackerShell.xcodeproj` inmiddels bestaat.
   Zo ja, open dat en controleer de instellingen; overschrijf het niet.
3. Anders: maak via **File > New > Project > iOS > App** in een aparte tijdelijke
   map een project. Product Name: exact `QuranTrackerShell`; Interface: SwiftUI;
   Language: Swift; Storage: None; geen CloudKit of extra testtargets. Kies een
   eigen Organization Identifier. Maak geen tweede Git-repository aan.
   Zie [Apples projectinstructie](https://developer.apple.com/tutorials/develop-in-swift/create-a-project).
4. Sluit het tijdelijke project. Kopieer met Finder alleen het gegenereerde
   `QuranTrackerShell.xcodeproj` naar `iosApp/`, en de gegenereerde
   `QuranTrackerShell/Assets.xcassets` naar `iosApp/QuranTrackerShell/`.
   Kopieer de twee template-Swiftbestanden niet: de voorbereide bestanden hebben
   dezelfde conventionele paden en zijn de bron voor deze app. Bewaar het
   tijdelijke project totdat de repositoryversie is gebouwd.
5. Open `iosApp/QuranTrackerShell.xcodeproj`. Controleer in de navigator en
   Target Membership dat beide voorbereide Swiftbestanden bij de app horen,
   evenals Assets.xcassets. Er moet precies één `@main` in het app-target zijn.
   Bij gewijzigde templateconventies corrigeer de bestandsreferenties via Xcode;
   maak geen tweede kopie van de bronnen.
6. Voeg `iosApp/Configuration/F01.xcconfig` via **Add Files** als referentie toe
   zonder te kopiëren. Selecteer het als Base Configuration voor **beide**
   app-targetconfiguraties Debug en Release onder Info > Configurations.
7. Controleer de effectieve Build Settings in de weergave **Levels**. Door Xcode
   ingevulde targetwaarden kunnen de xcconfig overschrijven. Stel zulke waarden
   gelijk aan de onderstaande tabel of laat ze uit de xcconfig overerven.

| Instelling | F01-waarde |
|---|---|
| Display Name | Quran Tracker |
| iOS Deployment Target | 16.0, voorlopig voor deze proef |
| Supported Destinations | iPhone / iOS; geen Mac- of visionOS-bestemming nodig |
| Targeted Device Family | 1 (iPhone) |
| Swift Language Version | Swift 5 (`SWIFT_VERSION = 5.0`) |
| Version / Build | 0.1.0 / 1 |
| Generate Info.plist File | Yes |
| Code Sign Style | Automatic |
| Bundle Identifier | Eigen unieke identifier voor deze testapp |
| Development Team | Eigen Personal Team, lokaal kiezen |

De xcconfig is nu nog niet aan een project gekoppeld. Bundle identifier en team
zijn bewust niet vooraf ingevuld. Kies bijvoorbeeld een reverse-DNS-identifier
op basis van je eigen unieke naam, met een suffix `qurantracker.f01`. Laat Xcode
de beschikbaarheid controleren. Dit is niet automatisch de uiteindelijke App
Store-identifier. Voeg geen capabilities of Swift packages toe.

Deze templateprocedure is voorbereid maar nog niet uitgevoerd: reproduceerbaarheid
is pas bewezen na de eerste succesvolle Xcode-build. Bewaar daarna het door Xcode
gemaakte project, de assetcatalogus en een gedeeld scheme voor review in Git;
geen automatische commit/push en geen `xcuserdata` meenemen.

## Simulatorbuild en herhaalbaar buildcommando

Selecteer scheme `QuranTrackerShell`, een geïnstalleerde iPhone-simulator en
**Product > Run**. Een recente simulator is prima voor deze eerste controle;
de echte iPhone met iOS 16.2 blijft de controle voor die oudere systeemversie.

Na projectaanmaak kan vanuit de repositoryroot ook dit worden uitgevoerd:

```sh
xcodebuild -list -project iosApp/QuranTrackerShell.xcodeproj
xcodebuild -project iosApp/QuranTrackerShell.xcodeproj \
  -scheme QuranTrackerShell -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath iosApp/DerivedData CODE_SIGNING_ALLOWED=NO build
```

Dit commando bouwt voor de simulator; het installeert niets en is geen bewijs
voor fysieke signing. Controleer de schemenaam met `-list`; maak het scheme in
Manage Schemes gedeeld voor latere CI. Voer geen clean-/wiscommando's uit.

## Eigen Apple-account, signing en iPhone

1. De gebruiker logt zelf in via **Xcode > Settings > Accounts > Add Apple Account**.
   Geen wachtwoord of verificatiecode in de chat of repository invoeren.
2. Kies het app-target > **Signing & Capabilities**, zet **Automatically manage
   signing** aan en selecteer het eigen **Personal Team**. Controleer de unieke
   bundle identifier. Xcode beheert development signing en provisioning.
   Zie [Apple: team toewijzen](https://help.apple.com/xcode/mac/current/en.lproj/dev23aab79b4.html).
3. Voor deze eenvoudige app is een gratis Personal Team passend. Apple vermeldt
   een geldigheid van zeven dagen voor de development provisioning; daarna
   opnieuw bouwen/installeren. TestFlight/distributie is geen onderdeel van deze
   proef. Zie [Apple: Personal Team](https://developer.apple.com/help/account/basics/about-your-developer-account).
4. Verbind de ontgrendelde iPhone met de Mac via een datakabel. Bevestig zelf
   **Vertrouw deze computer** op het toestel en wacht tot Xcode het kan koppelen.
5. Op iOS 16.2: zet indien gevraagd **Instellingen > Privacy en beveiliging >
   Ontwikkelaarsmodus** aan, herstart en bevestig op het toestel. Als de optie
   ontbreekt, eerst met Xcode koppelen. Zie
   [Apple: Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device).
6. Selecteer de gekoppelde iPhone als run destination. **Vraag vóór de fysieke
   installatie toestemming aan de gebruiker.** Product > Run bouwt, ondertekent,
   installeert en start de app. Deze stap is hier nog niet uitgevoerd.
   Zie [Apple: uitvoeren op toestellen](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices).

Op een geleende Mac beheert de gebruiker de accountaanmelding zelf. Geen
certificaat-private keys exporteren of opslaan in Git.

## Handmatige acceptatie en nog te verzamelen bewijs

| Controle | Verwacht | Werkelijke status |
|---|---|---|
| Xcode compile/link | Succesvolle simulator- en toestelbuild | Niet uitgevoerd |
| Eerste iPhone-start | Quran Tracker, welkom en testversievermelding zichtbaar | Niet uitgevoerd |
| Versie/build | 0.1.0 / 1 zichtbaar | Niet uitgevoerd |
| Eerste tik | Tekst verandert naar bevestiging; knop wordt Opnieuw beginnen | Niet uitgevoerd |
| Tweede tik | Starttekst keert terug | Niet uitgevoerd |
| Force-close/herstart, tweemaal | App opent zonder crash, starttekst hersteld | Niet uitgevoerd |
| Offline opnieuw starten | Scherm en knop blijven werken | Niet uitgevoerd |
| Grote tekst, licht/donker, VoiceOver | Leesbaar, scrollbaar en knop bereikbaar | Niet uitgevoerd |
| Android-bron/configuratie | Ongewijzigd | Voldaan via Git-diff |
| Android-buildtaken | Succesvol | Voldaan; unit-tests up-to-date |
| Backend/persoonlijke gegevens | Geen wijzigingen | Voldaan binnen deze sessie |

Vul na de Mac-sessie datum, Mac-model/architectuur, macOS, `xcodebuild -version`,
iPhone-model/iOS en gebruikte commit plus wijzigingen in. Bewaar buildresultaat,
een screenshot van beide knoptoestanden en het herstartresultaat. Controleer
Xcodes Report Navigator en eventuele crashlogs; redacteer account-/toestel-ID's.
Een simulatorpass is geen iPhonepass. Maak de status pas GO als alle verplichte
toestelcriteria daadwerkelijk zijn bewezen.

## Blockers en volgende stap

1. Geen beschikbare Mac met passende Xcode: iOS-compilatie en signing geblokkeerd.
2. Definitief Xcode-project en de koppeling van instellingen zijn nog te maken
   en te verifiëren op de Mac; Swift-bronnen zijn nog niet gecompileerd.
3. iPhone-model, daadwerkelijke iOS-versie en Personal Team moeten daar worden
   bevestigd. Toestelinstallatie wacht op toestemming bij die stap.

Volgende minimale actie: reserveer een Mac met Xcode 26.3 op een ondersteunde
macOS-versie, breng deze voorbereiding mee en voer eerst de template- en
simulatorstappen uit. Daarna development signing en de fysieke iPhone-test.
F02 begint pas na het bewezen eerste toestelresultaat.
