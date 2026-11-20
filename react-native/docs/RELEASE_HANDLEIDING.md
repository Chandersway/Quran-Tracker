# APK, iOS-build en publicatie — stap voor stap

Deze handleiding beschrijft de React Native-app in `react-native/`. De oorspronkelijke Kotlin-app blijft daarnaast bestaan. De npm-opdrachten staan in [package.json](../package.json); de cloudprofielen staan in [eas.json](../eas.json). De stand van platformacceptatie staat in [WORK_STATUS](WORK_STATUS.md).

## 1. Welk bestand heb je nodig?

| Doel                                              | Opdracht vanuit `react-native/` | Resultaat                                                                    |
| ------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Zelf een Android-app installeren of delen         | `npm run build:apk`             | Lokale release-APK op Windows, in `output/builds/quran-tracker-local.apk`.   |
| Android-testbuild via EAS                         | `npm run build:apk:cloud`       | APK via het `preview`-profiel; downloadlink in EAS.                          |
| Android naar Google Play                          | `npm run build:aab`             | Met EAS ondertekende `.aab`, profiel `production`.                           |
| iOS naar TestFlight/App Store                     | `npm run build:ios`             | Met EAS ondertekende `.ipa`, profiel `production`.                           |
| iOS rechtstreeks op geregistreerde testtoestellen | `npm run build:ios:preview`     | Ad-hoc `.ipa`, profiel `preview`; de toestellen moeten in het profiel staan. |
| Cloudbuilds terugvinden                           | `npm run build:status`          | EAS-buildlijst met status en build-ID.                                       |

Een APK kan rechtstreeks op Android worden geïnstalleerd. Google Play gebruikt de AAB. Een iOS-IPA is ondertekend voor een specifieke distributievorm; een store-IPA kun je niet als een APK op iedere iPhone installeren. Gebruik daarvoor TestFlight of een passende ad-hocbuild. [Expo: APK](https://docs.expo.dev/build-reference/apk/), [interne distributie](https://docs.expo.dev/build/internal-distribution/).

De lokale APK gebruikt de lokale testsignering. Voor een update van de bestaande Play Store-app moet de cloudbuild de juiste bestaande uploadidentiteit gebruiken. Laat EAS niet onbedoeld een andere app of uploadkey aanmaken.

## 2. Een APK bouwen op deze Windows-pc

1. Installeer de ontwikkeltools volgens [LOCAL_DEVELOPMENT](LOCAL_DEVELOPMENT.md): Node/npm, JDK, Android SDK en de benodigde buildtools. Voor alleen bouwen hoeft geen emulator te draaien.
2. Open de volledige repository en ga naar `react-native/`.
3. Voer `npm ci` uit.
4. Zet de lokale publieke appconfiguratie in de genegeerde `.env.local`, volgens `.env.example`. Private serverkeys horen hier niet in. Zonder backendconfiguratie kun je lokaal lezen, maar niet de online groepsfuncties gebruiken.
5. Voer uit:

   ```powershell
   npm run build:apk
   ```

6. Het script controleert TypeScript, ESLint, tests en codeopmaak, genereert het native Android-project zonder een clean-reset en voert Gradle `assembleRelease` uit. Standaard worden `arm64-v8a` en `x86_64` meegenomen.
7. Na succes staan in `output/builds/` de APK en `quran-tracker-local.json` met omvang, architecturen, bouwtijd en SHA-256. De Gradle-versie staat daarnaast in `android/app/build/outputs/apk/release/app-release.apk`.
8. Kopieer de APK naar je Android-toestel of installeer hem met `adb install -r <pad-naar-apk>`. Android kan om toestemming voor installatie uit deze bron vragen. Bij een afwijkende ondertekening stopt een update; verwijder dan niet zomaar de oude app, want daarmee kun je lokale data verliezen.

Alleen het bouwplan bekijken zonder iets te bouwen:

```powershell
npm run build:apk -- -DryRun
```

Als de controles zojuist op exact dezelfde bron zijn geslaagd, kun je de herhaling overslaan met `-SkipChecks`. Voor een telefoonbuild zonder emulatorarchitectuur kun je `-Architectures arm64-v8a` meegeven. Deze Windows-opdracht installeert of start zelf geen emulator.

Op macOS/Linux kun je de EAS-APK-opdracht gebruiken, of met de eigen Android-toolchain Expo prebuild en Gradle uitvoeren. De bestaande `build:apk`-launcher is een PowerShell-script voor Windows.

## 3. Eenmalig: Expo-project en accounts

Voor cloudbuilds heb je een Expo-account en project nodig. Voor distributie via de stores zijn ook een Google Play Developer-account en een Apple Developer-lidmaatschap nodig. De CLI is vastgezet op `eas-cli@27.10.0`, gelijk aan de GitHub-workflow.

1. Meld je lokaal aan:

   ```powershell
   npx --yes eas-cli@27.10.0 login
   ```

2. Maak of kies het juiste Expo-project. Noteer het echte project-UUID als `EXPO_PROJECT_ID`.
3. Zet dit ID voor lokale CLI-opdrachten in de genegeerde `.env.local`. De dynamische `app.config.ts` leest het en vult `extra.eas.projectId`; schrijf geen private credentials in deze configuratie.
4. Controleer de koppeling met `npx --yes eas-cli@27.10.0 project:info`. Controleer eigenaar en project voordat je credentials instelt.
5. Behoud voor beide platforms `com.Ameender.qurantracker`. Een nieuw package/bundle-ID maakt een andere app en verbreekt de update-/migratieroute.
6. Open `npx --yes eas-cli@27.10.0 credentials --platform android` en configureer de bestaande uploadkey als dit een update van de Kotlin-app wordt. Bewaar de sleutel en het wachtwoord buiten Git.
7. Gebruik `npx --yes eas-cli@27.10.0 credentials --platform ios` voor de juiste Apple-teamidentiteit, distributiecertificaten en provisioning. Configureer ook de benodigde pushcapability.
8. Controleer vóór de eerste update de al gepubliceerde Android `versionCode` en iOS `buildNumber`. Initialiseer de EAS-versies boven de bestaande waarden met `build:version:set`. `autoIncrement` verhoogt de ingestelde reeks, maar ontdekt niet vanzelf het juiste startpunt van een oudere app.

Voor iOS-cloudbuilds is geen lokale Mac vereist. Native iOS-debugging en de simulator hebben wel macOS/Xcode nodig. Een geslaagde JavaScript-export is geen ondertekende IPA en bewijst geen native iOS-werking. [Expo: iOS indienen](https://docs.expo.dev/submit/ios/).

## 4. GitHub Secrets en EAS-omgevingen

Open de GitHub-repository, ga naar **Settings → Environments** en maak **preview** en **production**. Voeg per omgeving onderstaande secrets toe. Gebruik de waarden van de juiste omgeving; zet preview nooit onbedoeld op een andere productiebackend.

| GitHub Environment Secret       | Inhoud                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_TOKEN`                    | Expo-token met toegang tot het gekozen project en de EAS-omgevingen.                                                                                    |
| `ASC_APP_ID`                    | Alleen voor iOS-submit in `production`: het numerieke Apple ID van de app in App Store Connect → App Information. Dit is niet het bundle-ID of team-ID. |
| `EXPO_PROJECT_ID`               | Het Expo-project-UUID.                                                                                                                                  |
| `EXPO_PUBLIC_SUPABASE_URL`      | De HTTPS-URL van het bedoelde Supabase-project.                                                                                                         |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Alleen de publishable/anon-clientkey, nooit een service-role- of secretkey.                                                                             |
| `EXPO_PUBLIC_AUDIO_BASE_URL`    | Optionele basis-URL van de audiomirror. Laat dit leeg als de oorspronkelijke aanbieders worden gebruikt.                                                |
| `GOOGLE_SERVICES_JSON`          | De volledige Firebase Android-clientconfiguratie voor het bestaande package-ID. Dit is niet het Firebase Admin-serviceaccount.                          |

De handmatige releaseworkflow synchroniseert deze configuratie naar de gelijknamige EAS-omgeving. Een gewone lokale `eas build` doet die GitHub-synchronisatie niet: richt de EAS-omgeving eerst in via de workflow of beheer dezelfde waarden bewust in Expo. Een lege audiomirrorsecret verwijdert een oude EAS-waarde niet automatisch; verwijder die oude waarde expliciet bij een wijziging.

Publieke mobiele waarden blijven uit leesbare bronbestanden, maar zijn na het bouwen wel uit een app te halen. De beveiliging bestaat daarom uit aanmelding, RLS en serverrechten. Service-rolekeys, Firebase Admin-private keys en APNs-private keys mogen nooit in de appbundel staan. De pushservergeheimen worden afzonderlijk in Supabase ingericht; zie [live chat en push](LIVE_CHAT_SETUP.md), [de volledige iOS-pushinrichting](IOS_PUSH_SETUP.md) en [technische releaseconfiguratie](../../docs/release.md).

Lokaal kun je `npm run release:check` uitvoeren. Deze leest lokale env-bestanden met behoud van bestaande shell-/CI-waarden en controleert onder andere project-ID, HTTPS, package-ID en het type clientkey. Hij publiceert niets en toont geen secretwaarden.

## 5. Android naar Google Play

1. Open de bestaande app in Play Console als dit een update is. Maak alleen een nieuwe app aan wanneer er nog geen listing bestaat voor dit package-ID.
2. Controleer Play App Signing en de uploadkey. Configureer voor automatische uploads een Google Play-serviceaccount met toegang tot precies deze app, en koppel die submitcredentials via EAS. Dit staat los van de Firebase-serviceaccount voor meldingen.
3. Maak de productie-AAB met `npm run build:aab`, of gebruik de GitHub-buildstappen hieronder.
4. Wacht tot de build **Finished** is. Open de EAS-buildpagina, download de AAB en noteer het exacte build-ID.
5. Voor een eerste Android-upload kan een handmatige upload via Play Console nodig zijn; volg de setupvereisten die EAS/Play voor jouw listing aangeeft. Voor latere automatische uploads kies je in de GitHub-workflow **submit**, platform **android**, profiel/omgeving **production** en dat exacte build-ID. [Expo: Android-submitvoorwaarden](https://docs.expo.dev/submit/android/).
6. De huidige `eas.json` zet Android-submissions op **internal** met **draft**. Controleer de release in Play Console en start de testrelease bewust; de build- of submitopdracht rolt de app niet automatisch uit naar productie.
7. Vul de storevermelding en de gevraagde appgegevens in: beschrijving, screenshots, pictogram, contact, privacybeleid, doelgroep, contentclassificatie, advertenties, Data safety en app-toegang voor reviewers. Beschrijf de werkelijke gegevensverwerking. Werk waar vereist de accountverwijderingsinformatie bij.
8. Doorloop de toepasselijke interne/gesloten tests en los de controles van Play op. Sommige persoonlijke ontwikkelaccounts hebben aanvullende testvoorwaarden.
9. Kies daarna de bedoelde productierelease en landen, controleer versienummer en release notes, dien ter beoordeling in en bepaal de uitrol. Dit zijn bewuste stappen in Play Console. [Google: app instellen](https://support.google.com/googleplay/android-developer/answer/9859152).

## 6. iOS naar TestFlight en App Store

1. Controleer het Apple Developer-team, de App ID `com.Ameender.qurantracker`, de distributiecertificaten en provisioning. Zet **Sign in with Apple** aan voor de Apple-aanmeldknop, configureer de Apple-provider en accountverwijderingsserver volgens [Apple-aanmelding](APPLE_SIGN_IN_SETUP.md), en test beide met een echte native build. Zet **Push Notifications** aan wanneer je remote push gaat gebruiken en neem de capabilities mee in het profiel; volg [iOS-push](IOS_PUSH_SETUP.md) voor APNs en Supabase.
2. Maak of controleer de appvermelding in App Store Connect met hetzelfde bundle-ID. Kopieer het numerieke **Apple ID** uit App Information naar GitHub Environment Secret **ASC_APP_ID** in `production`. De workflow valideert dit en vult alleen tijdens de submitrun `submit.production.ios.ascAppId` in `eas.json`. Zonder dit ID stopt de run vóór upload. Bewaar Apple/API-private keys buiten Git en configureer de submittoegang via EAS credentials.
3. Voer `npm run build:ios` uit. EAS bouwt op macOS en maakt de ondertekende store-IPA. De opdracht kan vanaf Windows worden gestart.
4. Open na succes de EAS-buildpagina en download het `.ipa`-bestand. Bewaar het build-ID. De lokale map `output/builds/` krijgt niet automatisch een cloud-IPA.
5. Start de GitHub-workflow opnieuw met **submit**, platform **ios**, profiel/omgeving **production** en dat exacte build-ID. Voor lokaal indienen kun je het juiste app-ID in de interactieve EAS-flow kiezen, of `ASC_APP_ID` in de procesomgeving zetten en eerst `node scripts/prepare-ios-submit.mjs` uitvoeren. Die laatste opdracht schrijft het ID in je lokale `eas.json`; controleer de wijziging en commit geen tijdelijke submitconfiguratie. Dien daarna in met `npx --yes eas-cli@27.10.0 submit --platform ios --profile production --id <build-id>`.
6. Wacht in App Store Connect tot de verwerking klaar is. Stel TestFlight-testers in en test op echte iPhones/iPads. Een geüploade TestFlight-build is nog geen openbare App Store-release. [Expo: submitproces](https://docs.expo.dev/deploy/submit-to-app-stores).
7. Vul bij de storeversie de vereiste metadata, screenshots, privacygegevens, leeftijdsclassificatie en reviewinformatie in. Kies de daadwerkelijk geteste build en controleer de weergegeven compliancevragen.
8. Dien de versie in voor App Review. Kies vervolgens de gewenste releasewijze, bijvoorbeeld handmatig na goedkeuring. [Apple: app indienen](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/).

Wil je een IPA buiten TestFlight installeren, registreer dan eerst de bedoelde toestel-UDID's via `npx --yes eas-cli@27.10.0 device:create` en bouw met `npm run build:ios:preview`. Alleen apparaten in het bijbehorende ad-hocprofiel kunnen die build installeren.

## 7. De GitHub Action uitvoeren

De workflow staat in [react-native-release.yml](../../.github/workflows/react-native-release.yml).

1. Zorg dat de bedoelde commit/branch op GitHub staat en dat Expo-, signing- en omgevingsconfiguratie klaar zijn.
2. Open **Actions → React Native release → Run workflow** en selecteer de bedoelde branch.
3. Kies **build**, platform `android`, `ios` of `all`, en een gelijknamige omgeving en profiel: `preview` of `production`.
4. Start de workflow. Deze controleert de broncode en configuratie, synchroniseert de waarden naar EAS en start de cloudbuild.
5. De workflow gebruikt `--no-wait`: een groene workflow betekent dat de bouwopdracht is aangenomen, niet dat de native build al klaar is. Controleer het eindresultaat en download het bestand in EAS.
6. Start voor upload naar een store een afzonderlijke **submit**-run. Kies één platform, `production` en het exacte afgeronde build-ID. Er wordt nooit stilzwijgend de laatste willekeurige build gekozen.

GitHub toont een handmatige workflow pas normaal in Actions wanneer de workflow op de defaultbranch aanwezig is. Deze migratie wordt eerst op een **nieuwe branch** gepusht. Staat de workflow nog niet op `main`, gebruik voorlopig de lokale npm/EAS-opdrachten, of voeg de workflow na review toe aan de defaultbranch. Een nieuwe branch pushen is geen toestemming om die automatisch te mergen.

Bij de eerste branchpush op 18 november startte GitHub geen runner wegens een **billingblokkade op het account**. De run had geen uitgevoerde stappen en meldde `The job was not started because your account is locked due to a billing issue.` De accounteigenaar moet deze blokkade in GitHub oplossen en daarna de workflow opnieuw starten. Een nieuwe codewijziging of het opnieuw instellen van appsecrets lost een billingblokkade niet op. De lokale npm-bouwopdrachten blijven beschikbaar; cloudbuilds vereisen daarnaast de eigen EAS-inrichting.

## 8. Wat moet vóór een echte release nog bewezen worden?

- Signing en updategedrag over een bestaande installatie, met behoud van persoonlijke gegevens.
- Werkende aanmelding, e-mailherstel, groepsrechten, de ingestelde Realtime-kanalen en terugkeer uit notificaties op de doelomgeving.
- Echte FCM/APNs-aflevering op toestellen; lokale notificaties en online push afzonderlijk.
- iOS-native compilatie en toestelinteractie: selectie, fullscreen, audio, downloads, toetsenbord en terugkeer naar de app.
- Werkelijke AAB-/IPA-grootte en de verwerking daarvan door de stores. Een lokale APK is geen maat voor de downloadgrootte per toestel.
- De relevante schermen in Nederlands, Engels en Arabisch, inclusief landscape en grotere systeemtekst.

Deze lijst is releaseacceptatie, geen bewijs dat de bovenstaande externe stappen al uitgevoerd zijn. De actuele open punten en lokale testresultaten staan in [WORK_STATUS](WORK_STATUS.md). De gebruikersstappen staan in de [gebruikershandleiding](GEBRUIKERSHANDLEIDING.md).
