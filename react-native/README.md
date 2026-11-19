# Quran Tracker — React Native

De Kotlin-app in de bovenliggende map is de functionele bron. De React Native-app gebruikt de oorspronkelijke inhoud en werkt lokaal op Android; de store- en cloudpublicatie zijn nog niet uitgevoerd.

Voor het gebruik van de app: [Nederlandstalige gebruikershandleiding](docs/GEBRUIKERSHANDLEIDING.md). Deze beschrijft lezen, vertalingen, selectie, audio, statistieken, planning, groepen, instellingen en het bewaren van je gegevens.

Voor onderhoud: [technische appgids en volledige bronindex](docs/TECHNISCHE_APPGIDS.md). Voor de online functies: [live chat, typing en push instellen](docs/LIVE_CHAT_SETUP.md), [iOS-push](docs/IOS_PUSH_SETUP.md) en [Apple-aanmelding en accountverwijdering](docs/APPLE_SIGN_IN_SETUP.md).

Voor latere uitbreiding: [plan voor OTA-updates, nieuwe menu-items en een online mushafcatalogus](docs/OTA_EN_MUSHAF_CATALOGUS_PLAN.md). Dit is een uitvoeringsplan; OTA en de dynamische catalogus zijn nog niet ingericht.

## APK, iOS-bestand en stores

Vanuit `react-native/` zijn deze npm-scripts beschikbaar:

| Opdracht                    | Resultaat                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build:apk`         | Bouwt op Windows een lokale Android-release voor arm64 en de x86_64-emulator, inclusief controles. APK: `output/builds/quran-tracker-local.apk`; SHA-256 en metadata staan ernaast. |
| `npm run build:apk:cloud`   | EAS-preview-APK, downloadbaar vanaf de buildpagina.                                                                                                                                 |
| `npm run build:aab`         | Android-productie-AAB via EAS, met de ingestelde store-uploadidentiteit.                                                                                                            |
| `npm run build:ios`         | iOS-productie-IPA via EAS; kan vanaf Windows worden gestart nadat Apple-signering is ingericht.                                                                                     |
| `npm run build:ios:preview` | Ad-hoc-IPA voor vooraf geregistreerde iPhones/iPads.                                                                                                                                |
| `npm run build:status`      | Status en ID's van EAS-builds.                                                                                                                                                      |
| `npm run release:check`     | Controleert de releaseconfiguratie zonder te publiceren.                                                                                                                            |

De lokale APK is voor testen en gebruikt lokale testsignering. Gebruik voor Google Play de AAB met de juiste bestaande uploadkey. Cloudbestanden download je vanaf de EAS-buildpagina; een iOS-export van JavaScript is geen IPA.

**Google Play, stap voor stap:**

1. Bereid de ontwikkeltools voor en voer `npm ci` uit.
2. Koppel het Expo-project, configureer de bestaande Android-uploadkey en zet `EXPO_PROJECT_ID` plus de publieke appconfiguratie in de juiste EAS-omgeving. De GitHub Secrets en signingstappen staan in de [releasehandleiding](docs/RELEASE_HANDLEIDING.md).
3. Open de bestaande app in Play Console, of maak de listing aan als die nog niet bestaat. Behoud `com.Ameender.qurantracker` en kies een versienummer boven de reeds gepubliceerde versie.
4. Bouw met `npm run build:aab` en wacht in EAS op **Finished**. Download de AAB en bewaar het build-ID.
5. Upload naar een testtrack, handmatig waar nodig of via **Actions → React Native release → submit → android → production**, met dat exacte build-ID. De huidige submitconfiguratie maakt een concept op de interne testtrack.
6. Vul de storevermelding, privacy-/Data safety-gegevens, classificatie en reviewtoegang in. Rond de toepasselijke testvereisten en controles van Play Console af.
7. Test de update en gegevensoverdracht op een echt toestel. Dien daarna bewust de gekozen productierelease in en bepaal de uitrol.

**App Store, stap voor stap:**

1. Koppel een Apple Developer-team, de App ID `com.Ameender.qurantracker`, distributiecertificaat en provisioning via EAS credentials. Configureer de benodigde pushcapability.
2. Maak of controleer dezelfde app in App Store Connect en configureer submittoegang via EAS. Zet het numerieke Apple ID van de app als **ASC_APP_ID** in de GitHub-omgeving `production`; de workflow vult hiermee de verplichte `ios.ascAppId` in. Private keys blijven buiten Git.
3. Bouw met `npm run build:ios`. EAS bouwt op macOS; wacht op **Finished** en download de IPA vanaf de buildpagina.
4. Upload het exacte build-ID via **Actions → React Native release → submit → ios → production**.
5. Wacht op verwerking in App Store Connect en test de build via TestFlight op echte toestellen.
6. Vul metadata, screenshots, privacygegevens en reviewinformatie in, selecteer de geteste build en dien de versie in voor App Review.
7. Kies de gewenste publicatie na goedkeuring. Een TestFlight-upload publiceert de app niet automatisch in de App Store.

Voor iedere secret, opdracht, signingkeuze en foutcontrole: [volledige releasehandleiding](docs/RELEASE_HANDLEIDING.md). De [GitHub-workflow](../.github/workflows/react-native-release.yml) scheidt bouwen en indienen. Handmatig starten vanuit de Actions-interface vereist dat de workflow ook op de defaultbranch bekend is; een push van deze werkbranch merge niet automatisch naar `main`. Native iOS-acceptatie en store-inrichting blijven afzonderlijke stappen.

## Lezen, luisteren en groepen

- **Mushaf** is de ene ingang naar de lezer. Iedere nieuwe passage opent direct fullscreen, ook vanuit Soera, Hizb, Juz, bladwijzers en agenda. Gebruik de verplaatsbare verkleinknop om de gewone **Boek**-/ **Tekst lezen**-bediening te tonen. **Soera's** is de inhoudsopgave; de **Mushafbibliotheek** beheert uitgaven en downloads. Een oude opgeslagen Quran-snelkoppeling wordt automatisch Mushaf.
- In fullscreen begint de halftransparante, vrij versleepbare **afspeelknop rechtsonder**; buiten fullscreen is **Luisteren** zichtbaar. Dezelfde centrale speler verzorgt starten, pauzeren en hervatten. Via **Meer → Audio en reciteur** zijn de reciteur en luistervoorkeuren direct bereikbaar. De audiobediening biedt daarnaast de bestaande recitator-, herhaal- en afspeelopties; niet ieder studieboek heeft een audio-opname.
- Open een groep en kies **Open groepschat**. De chat en de bestaande feed gebruiken dezelfde beveiligde groepsberichten. Concepten blijven per account en groep bewaard zolang het appproces draait. De lokale controles en de nog benodigde hosted inrichting staan in [LOCAL_BACKEND_QA](docs/LOCAL_BACKEND_QA.md).
- Bij de vier originele mushafweergaven met geverifieerde selectiegebieden houdt **Selecteren** hetzelfde boek, dezelfde pagina en dezelfde zoom. **Bladeren** schakelt die selectie weer uit. Een willekeurige PDF krijgt geen verzonnen tekstlaag; een afzonderlijke knop opent daar expliciet de selecteerbare Hafs-weergave. Een andere paginakeuze keert alleen mee terug als de koppeling binnen dezelfde uitgave geverifieerd is.

De [uitvoering van de Kotlin-pariteitscontrole](docs/PARITY_IMPLEMENTATION_2026-11-17.md) beschrijft de herstelronde per onderdeel, behoud van oorspronkelijke inhoud en het verschil tussen bron-/toesteltests en latere cloud- of storeconfiguratie.

## Starten op Windows

Voer deze opdrachten uit vanuit `react-native/`:

```powershell
npm ci
npm run android:dev
```

`android:dev` en `android:local` openen uitsluitend de aparte AVD **wirdna-dev** (standaard `emulator-5558`), bouwen en installeren de native development client en verbinden die met Metro op poort 8081. De eerste build en eerste JavaScript-bundel kunnen enkele minuten kosten. Ontbreekt de dev-AVD, dan maakt het script een nieuwe Pixel 6 aan met een lokaal geïnstalleerde Google APIs x86_64-image. Bestaande emulatorgegevens blijven behouden.

De bestaande release naast de ontwikkelapp openen, zonder opnieuw native te bouwen:

```powershell
npm run android:compare
```

Dit opent de bestaande **wirdna-qa** (`emulator-5554`) met de huidige release-APK uit `android/app/build/outputs/apk/release/`, als die bestaat, en **wirdna-dev** met de beschikbare debugbuild. Beide zijn echte native Android-apps. De release toont de gebouwde momentopname; in de development client verschijnen JS/TS-wijzigingen via **Fast Refresh**. Native dependencies, configplugins en native code vereisen een nieuwe build: `npm run android:dev`, of `npm run android:compare -- -RebuildDev`. Voor alleen opnieuw openen gebruik je `npm run android:dev -- -SkipBuild`.

De twee AVD's hebben aparte accounts, downloads en voorkeuren. Het script kopieert geen lokale QA-fixtures. De lokale test-AVD **wirdna-f12-qa** op 5556 met Metro 8087 blijft gescheiden. Selectie gebeurt op de werkelijke AVD-naam; een expliciete verkeerde serial wordt geweigerd. Een Metro-server wordt alleen hergebruikt als die deze checkout in ontwikkelmodus bedient.

Alleen de simulator openen, zonder de app te bouwen of te vervangen:

```powershell
npm run android:emulator
```

Nieuwe emulators starten met geluid aan, zodat de Koranrecitatie hoorbaar is. Voor een bewust stille testsessie kun je `npm run android:emulator -- -NoAudio` gebruiken. Deze optie geldt alleen bij het starten van een nieuwe emulator; een al draaiende emulator behoudt zijn audio-instelling.

Opnieuw openen met de bestaande ontwikkelbuild en React Native DevTools:

```powershell
npm run android:dev -- -SkipBuild -OpenDebugger
```

## Een andere Windows-pc voorbereiden

1. Installeer **Git**, **Node.js 24 LTS met npm**, een **JDK** en **Android Studio**. Dit project is lokaal gecontroleerd met JDK 24. Stel `JAVA_HOME` in op de JDK-installatiemap als die niet automatisch wordt gevonden.
2. Zet hardwarevirtualisatie aan in het BIOS/UEFI. Gebruik op Windows de **Windows Hypervisor Platform**-functie voor de emulator en herstart Windows als dat nodig is.
3. Installeer via Android Studio → SDK Manager: **Android SDK Platform 37.0**, **Build-Tools 37.0.0**, **Platform-Tools**, **Command-line Tools**, **Android Emulator**, **NDK 27.1.12297006** en **CMake 3.22.1**. De gegenereerde Gradle-configuratie bepaalt de vereiste versies.
4. Installeer via Android Studio → SDK Manager een **Google APIs x86_64**-image, bij voorkeur dezelfde API 37-image als de release. Het script maakt **wirdna-dev** zo nodig zelf aan. Voor vergelijken is daarnaast de bestaande release-AVD **wirdna-qa** nodig; maak die op een nieuwe pc afzonderlijk aan. Een bestaande andere dev-AVD kan expliciet met `-AvdName` worden gekozen.
5. Stel `ANDROID_HOME` in op de SDK-map wanneer die niet automatisch wordt gevonden. De gebruikelijke Windows-map is `%LOCALAPPDATA%\Android\Sdk`; de `.tooling`-map van deze pc is geen overdraagbare SDK-installatie.
6. Open de **bijgewerkte volledige repository**, ga naar `react-native/` en voer `npm ci` en `npm run android:dev` uit. Gebruik de migratiebranch `work/react-native-complete-audit-20261118` zodra deze op GitHub staat; een checkout van de oude `main` bevat deze nieuwe app niet automatisch.

Een emulator met een andere naam starten:

```powershell
npm run android:local -- -AvdName MijnPixel
```

De gebundelde Koran en leesgegevens werken zonder backendconfiguratie. Voor aanmelden en groepen kopieer je `.env.example` naar `.env.local` en vul je de publieke Supabase-configuratie in. Gebruik daarin nooit een service-role key. Het lokale Android-project kan de bestaande Firebase-clientconfiguratie uit de Kotlin-map gebruiken; pushregistratie heeft de bijbehorende platformconfiguratie nodig. Productiewaarden komen later uit GitHub Secrets.

Kopieer geen `node_modules/`, gegenereerde `android/`- of `ios/`-map of machinegebonden `.tooling/` naar de andere pc. Installeer de tools opnieuw en bewaar lokale configuratie buiten Git. Zie [de volledige Windows-handleiding](docs/LOCAL_DEVELOPMENT.md) voor SDK-opdrachten, logbestanden en foutdiagnose.

## Andere besturingssystemen

`android:dev`, `android:local`, `android:compare` en `android:emulator` zijn Windows PowerShell-scripts. Op macOS/Linux installeer je Node, een passende JDK en de Android SDK, start je de bedoelde emulator via Android Studio en gebruik je `npm run android`. Voor de iOS-simulator zijn macOS en Xcode nodig; gebruik daar `npm run ios`. Die native omgevingen zijn nog niet op deze Windows-pc getest.

## Bronstructuur

De app start in `App.tsx`; `src/app` stelt providers en navigatie samen. `src/features` bevat schermen en hun eigen onderdelen, `src/domain` de regels, `src/services` de platform- en netwerkadapters en `src/shared` de algemene interface en het thema. Gebundelde gegevens en vertaalde interfacekopij staan in `src/content` en `src/i18n`. Zie [de mapgids](src/README.md) en [architectuur](docs/ARCHITECTURE.md) voor verantwoordelijkheden, voorbeelden en resterend werk.

## Werken aan de app

```powershell
npm run verify
npm run format:check
```

De leesweergave ondersteunt boek- en tekstvorm, met een onafhankelijke vertaalkeuze. Nederlands en Engels zijn gebundeld. Nieuwe vertalingen worden toegevoegd via [het vertalingenregister](src/content/translations.ts), met de bijbehorende brondata/importer en labels; bestaande vertalingen worden niet tijdens het lezen automatisch vertaald.

Onder het boek staat een paginabalk: pagina één staat rechts en de pijlen gaan telkens één pagina verder of terug. Tijdens slepen toont de balk een voorvertoning en het verschil met de pagina waarop je begon; pas bij loslaten verandert de pagina. Tik op het paginanummer voor een exacte sprong. Onderaan staan zoomen, het paginanummer en een vinkpictogram voor expliciet als gelezen markeren. In Bladeren gaat een boekveeg per zichtbare spread verder. Het vinkje is een toggle per account, uitgave en pagina: opnieuw tikken verwijdert die markering en haar bijdrage aan de statistieken. Footer, leesmenu en fullscreen delen dezelfde status, ook na opnieuw openen. Eerdere lezingen en geïmporteerde geschiedenis blijven behouden; daardoor kan de historische paginarail nog gelezen blijven na het verwijderen van de nieuwe markering. Herhaalde leesregistraties blijven beschikbaar via snelle check-in en plannen.

De dikte van de streepjes gebruikt echte ayatellingen van de gekozen uitgave. Een streepje dat meerdere pagina's vertegenwoordigt gebruikt hun gemiddelde telling. Beschikbaar zijn de gebundelde Hafs-, Warsh Maknoon- en Muhammadi-layouts, Hafs Maknoon met 604 gedrukte pagina's en de Quran.ws/Madina-PDF met 605 fysieke pagina's inclusief de omslag. IndoPak en een afwijkend PDF-paginatotaal blijven neutraal zolang een bijpassende kaart ontbreekt. Gelezen-status per streepje gebruikt exact geregistreerde pagina’s van dezelfde uitgave; onbekende koppelingen blijven neutraal. Zie [paginametrieken en broncontrole](docs/MUSHAF_PAGE_METRICS.md) voor de exacte koppelingen, bronhash en steekproeven; niet alle pagina's zijn visueel geïnspecteerd.

Iedere nieuwe mushafopening begint fullscreen. De gewone lezerbediening en sliders zijn verborgen; de vrij verplaatsbare verkleinknop, de zwevende afspeelknop en een actieve focustimer blijven bereikbaar. De timer staat onder de systeemstatusbalk. Gedrukte pagina's staan doorlopend verticaal onder elkaar met de uitsnede van hun eigen uitgave. Bij geverifieerde Hafs-/Warsh-/Muhammadi-/Maknoon-selectiegebieden opent tikken of lang indrukken de juiste aya-acties met markering; dit verlaat fullscreen niet. Een willekeurige PDF krijgt geen verzonnen selectiegebieden en behoudt een paginatik als extra uitgang. De verkleinknop en Android Terug verlaten fullscreen. Buiten fullscreen blijven zoom, paginabalk, selectie en registratievink beschikbaar. De native PDF houdt knijpzoom. Native resultaten worden vastgelegd in [native QA](docs/NATIVE_QA.md).

Hizb-rijen in de Korancatalogus en voortgangsweergave tonen de naam van de openingssoera en de eerste aya van die Hizb. Per rij kun je de gebundelde Nederlandse of Engelse vertaling openklappen. Hiervoor worden de bestaande bronteksten gebruikt; de app vertaalt de aya niet opnieuw.

De selecteerbare Hafs-weergave gebruikt één doorlopende Unicode-tekst voor de hele pagina. Op Android wordt de tekst eerst buiten beeld opgemaakt, zodat je de tussenliggende verkleinstappen niet ziet. Kies binnen deze weergave **Bladeren** voor paginavegen en korte woordtikken, of **Selecteren** voor native letter-/tekstselectie en selectiehandvatten. Selecteren schakelt woordknoppen en paginavegen uit; de expliciete paginabediening blijft beschikbaar. Op een oorspronkelijke pagina met geverifieerde selectiegebieden kiest Selecteren een aya op dezelfde afbeelding, met behoud van pagina en zoom. Wisselen naar **Selecteerbare boektekst** of terug naar **Originele gedrukte uitgave** doe je afzonderlijk in het leesmenu. Originele scans en PDF's krijgen geen native tekstlaag. Woordgegevens openen het lexicon: geverifieerde QAC-morfologie, lemma/wortel, woordfamilies, alle vindplaatsen en oorspronkelijke offline Lane-wortelartikelen met bron en licentie. De 1.296 exact gekoppelde wortels bevatten 20.354 artikelen; 346 wortels hebben expliciet nog geen geverifieerde Lane-koppeling. Contextuele glossen blijven apart van woordenboekartikelen. Zoeken op wortel of lemma staat onder Meer. iOS heeft nog geen native gebaarobserver; gebruik daar de expliciete paginaknoppen. De native iOS-interactie is nog niet getest.

Voor **Warsh Maknoon** houdt **Selecteren** eveneens de oorspronkelijke scan in beeld en maakt geverifieerde aya-acties beschikbaar. Via het leesmenu kun je afzonderlijk **Selecteerbare Warsh-tekst** openen voor native tekstselectie. Die regels zijn gereconstrueerd en kunnen doorlopen buiten het scherm; dit is geen tekstlaag op de scan. Het juiste Warsh-lettertype is meegeleverd. Alle 604 pagina’s met 77.431 oorspronkelijke Warsh-woorden zijn als afzonderlijke lokale assets gebundeld en worden bij openen gecontroleerd. Alleen bij een ontbrekende of beschadigde lokale pagina gebruikt de app dezelfde geverifieerde online bron als herstelpad; de oorspronkelijke scan blijft apart beschikbaar. Warsh-woorden worden niet aan ongecontroleerde Hafs-woordbetekenissen gekoppeld. Zie [bron, lettertype en controles](docs/WARSH_UNICODE_SOURCE.md).

De QF-paginabron vraagt nu expliciet V1-pagina- en regelgegevens (`code_v1` en `v1_page`) op. Het generieke `page_number` bleek bij grenspagina's bij een andere layout te horen en liet daardoor onder meer 5:90 op pagina 123 en 98:6–7 op pagina 598 weg. De broncorrectie behoudt deze woorden en weigert ontbrekende V1-metadata. De uitgevoerde bron- en apparaatcontroles staan afzonderlijk in [native QA](docs/NATIVE_QA.md).

Open **Meer** en kies bij **Pagina's** voor **Selecteren** om maximaal drie eigen snelkoppelingen in de ondernavigatie te bewaren. Soera, Hizb en Juz blijven daarnaast direct beschikbaar; dubbele bestemmingen worden samengevoegd. De gewone lijst onder Meer toont de bestemmingen die niet al in de onderbalk staan; de selectielijst bevat alle instelbare bestemmingen. **Standaard herstellen** zet Statistieken, Mushaf en Groepen terug als eigen snelkoppelingen. Ook een bewust lege keuze wordt opgeslagen; een volledig beschadigde keuze valt terug op de standaard. Installatie en native resultaten worden afzonderlijk vastgelegd in [werkstatus](docs/WORK_STATUS.md).

De PDF-lezer gebruikt een vastgezette `react-native-pdf`-versie (`7.0.5`). De bijgehouden `withPdfRuntime`-plugin past bij Android-prebuild gecontroleerde runtimecorrecties toe. De zoomknoppen en native knijpzoom delen dezelfde zoomwaarde. Na wijzigingen aan deze plugin is een nieuwe native build nodig; Fast Refresh alleen is onvoldoende.

Een download uit de mushafbibliotheek loopt door wanneer je naar een ander scherm gaat. Boven de inhoud verschijnt een dunne voortgangslijn: tik erop om de actieve download, voortgang en geschatte resterende tijd te bekijken. Zonder betrouwbare downloadsnelheid of bestandsgrootte wordt geen tijd verzonnen. Annuleren gebeurt expliciet in de bibliotheek. Voltooide pagina's blijven bewaard en worden bij hervatten overgeslagen; een onvolledig PDF-bestand wordt opnieuw gedownload. Android DownloadManager en een herstelwachtrij, en op iOS een background URLSession, beheren downloads nu native buiten JavaScript. Opnieuw openen herstelt de opgeslagen taak; alleen gevalideerde bestanden worden geïnstalleerd. Dit vereist een opnieuw gebouwde native app. Android force-stop, iOS user force-quit en platformbeperkingen kunnen voortgang onderbreken of uitstellen. Bron-/contracttests bewijzen deze implementatie; daadwerkelijke achtergrond- en iOS-acceptatie staan apart in native QA.

Kaarten gebruiken drie verschillende, deels weggeveegde patronen: geometrische zellij, kalligrafische arabesken en open boogwerk. `Card` en `StatisticsSurface` ondersteunen een expliciete familie, bijvoorbeeld `ornament="zellij"`, en kiezen anders stabiel per gemonteerde kaart. De decoratie blijft los van de dekkende achtergrond en de aanraakbediening. Zie [gedeelde componenten](src/shared/components/README.md) en [assets en herkomst](assets/ornaments/README.md).

Via **Instellingen → Uiterlijk → Kaartpatronen** kies je tussen patronen en effen kaarten. De keuze geldt direct voor alle kaartpatronen en decoratieve Arabische watermerken en blijft lokaal bewaard na een herstart. Standaard staan patronen aan. Het grote Hifz-/herhaaloverzicht op Stats blijft altijd zonder achtergrondpatroon.

Zie [F27-implementatie en bewijsgrenzen](docs/IMPLEMENTATION_F27.md), [F26-implementatie](docs/IMPLEMENTATION_F26.md), [architectuur](docs/ARCHITECTURE.md), [de F24/F25-controle](docs/UI_UX_REVIEW_F24.md), [bijgewerkte broninventaris](docs/FEATURE_GAPS.md), [native testresultaten](docs/NATIVE_QA.md) en [releaseconfiguratie](../docs/release.md). Slagende tests zijn geen bewijs dat alle native interacties of storepublicatie zijn gecontroleerd.

## Interface-aanpassingen van 19 november 2026

Stats toont na de leessamenvatting het hizboverzicht, de recente geschiedenis en daarna het hifz-overzicht. Beoordeelde scores staan in een compacte intern scrollbare kaart, met de bestaande scorekleuren en herhaaladvies onder 60. De misleidende lijst Sterk en het dubbele blok Planning vandaag zijn verwijderd; herhalingen blijven direct naar Agenda te plannen.

Mijn leesplan blijft onafhankelijk van dagelijkse doelen. Tests voeren de echte opslag- en correctieacties uit en bevestigen dat alleen de aparte leesplanopslag verandert. Echte leesregistraties kunnen beide overzichten wel voeden. Khatma-plannen tonen voor ieder deel de werkelijke soeranaam en begin-/eindaya, met direct openen van de passage; de opgeslagen rubgrenzen blijven als berekeningsbasis behouden.

De actieve focustimer staat klein en transparant rechtsboven, onder de systeemstatusbalk, en blijft ook over de fullscreen-mushaf zichtbaar. De Tahajjud-kop scrollt mee met de lijst. De notitie-editor reserveert het meeste scherm voor schrijven, met een compacte werkbalk en aparte panelen voor context en opmaak.

Notities heeft nu een **importknop** voor de bestaande Kotlin/RN JSON-export (schema 2). De import behoudt tekst, alle vijf verwijzingstypen en opmaak; ongeldige bestanden worden atomair geweigerd, bestaande notities worden niet overschreven en identieke notities worden overgeslagen. De limiet is 10 MiB / 10.000 records. Maak algemene, ook lege mappen met **Map maken**. Sleep een notitie met de vierpijlengreep naar een map in de onderste balk; tikken op die greep opent de toegankelijke verplaatskiezer. Verplaatsen behoudt de verwijzing en opmaak. De bestaande Android-database-import en het exportformaat zijn niet gewijzigd.

**Bladwijzers** staat onder Meer en in Instellingen. De lijst combineert bewaarde aya's en boekpagina's en opent de juiste passage of oorspronkelijke uitgave. Sorteren kan op **Quranvolgorde**, **Soeranaam** en **Recent per type**. Oude paginabladwijzers bevatten geen bewaardatum; de recente paginavolgorde gebruikt daarom de toevoegvolgorde.

De onderbalkbestemmingen **Hizb** en **Juz** hebben ieder hun eigen vaste indeling zonder de andere categorietabs. De uitgebreide categorieknoppen onder **Soera** lopen zo nodig over meerdere regels. Eigen snelkoppelingen blijven instelbaar onder Meer; Audio en reciteur is ook direct in dat menu opgenomen.

Instellingen begint met **Account en gemeenschap**; **Uiterlijk** staat onderaan. Naast **Mat · Middernacht** zijn **Mat · Oceaan en goud** en **Mat · Pruim en perkament** beschikbaar. Deze matte thema's kiezen schakelt kaartpatronen uit; ze kunnen daarna handmatig weer aan.

Dagelijkse leesherinneringen zijn **lokale toestelmeldingen**. Na de introductie biedt de app op Android 13+ en iOS eenmalig systeemtoestemming aan voor actieve herinneringen. Na toestemming plant het toestel de standaardtijd **08:00** of de eerder gekozen tijd. De tijdkiezer toont een eventuele weigering. Het Android-kanaal en het standaardgeluid zijn gecontroleerd. Groepspush gebruikt afzonderlijke FCM-/APNs- en serverconfiguratie. [Kotlin-vergelijking en stappen voor een ontvangstproef](docs/LOCAL_REMINDER_PARITY_2026-11-19.md)

### Fullscreenbediening

De verkleinknop begint linksboven en de afspeelknop rechtsonder. Beide zijn klein, halftransparant en over het scherm versleepbaar: horizontaal, verticaal en diagonaal. Ze blijven binnen de schermranden; slepen activeert de knop niet. Tik op de verkleinknop om de gewone bediening te openen; tik op afspelen voor de bestaande start-/pauze-/hervatactie. Op gecontroleerde originele scans blijft de pagina zelf voor ayahselectie beschikbaar. PDF-paginatik kan fullscreen verlaten zolang geen geverifieerde selectiegebieden bestaan.

De wijzigingen vragen daarnaast de gebruikelijke native acceptatiecontrole. Een documentatievermelding is geen bewijs dat iedere interactie, bestandkiezer, achtergrondmelding of iOS-functie al op een toestel is getest.
