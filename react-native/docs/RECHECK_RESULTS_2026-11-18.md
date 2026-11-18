# Resultaat van de tweede Kotlin-controle

Deze controle volgt op de implementatieronde van 17 november. De oorspronkelijke broncode is opnieuw vergeleken met de React Native-app; eerdere rapporten zijn gebruikt om te zoeken, niet als bewijs dat alles al klopte. Vijf gespecialiseerde werkpakketten plus de hoofdagent controleren de onderdelen en elkaars wijzigingen. De [uitvoering staat in het plan](RECHECK_PLAN_2026-11-18.md).

**Lokale eindcontrole afgerond:** alle vijf inhoudelijke controles en hun reparaties zijn samengevoegd. De gezamenlijke controles, platformbundels en nieuwe Android-APK slagen. Onderstaande bronfuncties en lokale tests zijn geen claim dat alle clouds of iOS-toestellen getest zijn. Het afleveringsbewijs staat onderaan.

## Wat is opnieuw gevonden en gerepareerd?

| Onderdeel           | Concrete correctie                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warsh-studie        | Grammaticale uitleg toont alle canonieke aya's van een samengestelde gedrukte selectie, niet alleen de eerste.                                                                          |
| Audio               | Hervatten na een bronfout gebruikt de laatst bevestigde afspeelpositie, ook wanneer native audio de klok op nul terugzet of net achteruit is gespoeld.                                  |
| Tafsir              | Benoemde soerakeuze en vorige/volgende aya zijn weer bereikbaar; vastgelegde Warsh-selecties blijven begrensd.                                                                          |
| Notitie-aantallen   | Directe badges op soera-, juz-, hizb- en rubrijen tellen de juiste eigen scope.                                                                                                         |
| Checklist           | Vier rubs onder een hizb, acht onder een juz, uitklappen en teruggaan naar de bewaarde stop.                                                                                            |
| Juz/Hizb-voortgang  | De status herkent volledige onderliggende kwartieren; geen extra leesgeschiedenis wordt verzonnen. De lijst opent op het eerste onvoltooide onderdeel.                                  |
| Juz-kaarten         | Beginverwijzing en Arabische beginaya zijn terug.                                                                                                                                       |
| Notities            | Contextsamenvatting in lijst/preview, eigen tags als suggesties en zoeken op de soeranaam wanneer een geïmporteerde naam leeg is.                                                       |
| Dagdoelen           | Historische doelen gebruiken hun destijds opgeslagen eenheid en tonen hoe gemiste dagen zijn afgehandeld. Een achtergebleven Engelse zin gebruikt weer oorspronkelijke vertaalde kopij. |
| Agenda              | Een planningsmelding opent de juiste agendadatum; de passage blijft bereikbaar via het item.                                                                                            |
| Groepen             | Nieuwe groepen krijgen in de service dezelfde veilige standaard voor uitnodigingsrechten als Kotlin en de wizard.                                                                       |
| Lokale backendtests | Nieuwe checkouts worden correct als geïsoleerde testomgeving herkend; geen afhankelijkheid meer van één oude lokale projectnaam. Typingtests vergelijken ook echte servertijd.          |
| Releasecontrole     | Onbekende keys, JWT's zonder anon-rol en serverkeys met spaties worden geweigerd. iOS-submit vereist een expliciet App Store Connect-app-ID.                                            |

Aanvullend gerepareerd en gecontroleerd:

- **Accountmutaties:** wachtwoord, e-mailadres en herstel gebruiken de vastgelegde accountidentiteit; een tussentijdse accountwissel kan niet de andere account wijzigen. De tijdelijke SDK-client vervangt de actieve sessie niet.
- **Profiel:** eerder opgehaalde eigen naam/avatar blijven per account beschikbaar bij herstart en een onbereikbare server. Oude aanvragen kunnen nieuwere profielgegevens of een verwijderde cache niet terugdraaien.
- **Meldingen:** iOS-provisional toestemming wordt herkend; de lokale leesschakelaar overschrijft groepspush niet. Een blijvende administratie voorkomt dubbele eenmalige meldingen en haalt niet eerder aangeboden agenda-items begrensd in. Ook de onafhankelijk gereproduceerde stille-uren-replay is hersteld.
- **Instellingen opslaan:** de herinneringseditor wacht op beide duurzame statewijzigingen voordat succes wordt getoond; bij falen blijft de invoer staan.
- **Onboarding:** ook een lege bestaande Room-installatie wordt herkend. De planningsdemo kan iedere geldige minuut kiezen zonder echte planning te veranderen.
- **iOS-opslag:** opnieuw te maken QAC/Lane-kopieën staan in Caches. Oude bestanden en persoonlijke gegevens worden niet verwijderd.
- **Apple:** native aanmelding, nonce/state-controle, behoud van een eigen profielnaam, intrekkingscontrole en een afzonderlijke serverroute voor accountverwijdering zijn toegevoegd. De functie controleert identiteit en bestaande databasevoorwaarden; providergeheimen blijven op de server. De gedocumenteerde handmatige route behoudt de eis van recente authenticatie.

## De oorspronkelijke 21 onderdelen

| Onderdeel uit de overdracht         | Waar vind je de implementatie en onderbouwing?                                                       | Relevante grens                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Mushaf, uitgaven en uitsnedes       | Reader-/studierapport; originele afbeeldingen, gecontroleerde geometrie, PDF-cropservice.            | Niet iedere willekeurige PDF heeft ayah- of woordkoppelingen.                                               |
| Soera/juz/hizb/rub en zoeken        | Quran/Progress, navigatieregels, volledige Arabische/NL/EN-zoekindex en Warsh-grenzen.               | Uitgaven hebben eigen pagina-indelingen.                                                                    |
| Selectie, bladwijzers en ayahacties | Mushaf/Reader, BookPresentation, studie en lexicon.                                                  | Scanselectie is aya-selectie; vrije letterselectie gebruikt de aparte tekstweergave.                        |
| Registreren en opnieuw lezen        | Check-in, PartActions, reducer; paginavinkje blijft de later gevraagde toggle.                       | Een onderdeelregistratie verwijderen is niet overal uitsluitend de laatste lezing ongedaan maken.           |
| Hifz                                | Progress, sliders, bereikactie en hifz-regels.                                                       | 0 is onbeoordeeld; scores blijven onafhankelijk van leestellers.                                            |
| Snelle check-in                     | Bewaakte batch, meerdere hizbs, duurzame opslag en retry-identiteit.                                 | Nieuwe bewuste check-in telt opnieuw.                                                                       |
| Hizboverzicht                       | Alle 60 hizbs, perioden, nulwaarden en details.                                                      | Vier losse rubs worden geen volledige hizb-check-in.                                                        |
| Statistieken                        | Rings, drilldowns, activiteit, motivatie, beheersing en gerichte reset.                              | Registratieaandeel is geen Quran-dekkingspercentage.                                                        |
| Tahajjud                            | Gedeelde ayadekking, gedeeltelijke vinkjes, rubs, stop en aparte resets.                             | Geen automatische gewone leesregistratie.                                                                   |
| Focus                               | Vier intenties, standaard/eigen duur, pauze/hervatten en timer tussen schermen.                      | Tijd vervangt geen hoeveelheidsregistratie.                                                                 |
| Dagdoelen                           | Drie intenties, historische snapshots, registreren, plannen en carry/spread/skip.                    | Oude snapshots behouden hun eigen eenheid.                                                                  |
| Zelfstandig leesplan                | Hoeveelheden, start/einddatum, tempo, herhaling en correctie.                                        | Geen minutenplan; correctie wijzigt geen leesgeschiedenis.                                                  |
| Agenda                              | Week/maand, planning, herinneringen, uitvoeren, verwijderen en leesreis.                             | OS-bezorging heeft platformacceptatie nodig.                                                                |
| Audioplayer                         | Globale speler, transport, snelheden, autoplay, trackrepeat, slaaptimer en reciteurwissel.           | Niet alle externe opnamen zijn volledig gespiegeld.                                                         |
| Bereikherhaling                     | Pagina/paginabereik/soera/ayahs, Hafs/Warsh, rondes en geselecteerde offline audio.                  | Geverifieerde pagina-/verskoppeling en beschikbare reciteur vereist.                                        |
| Notities                            | Vijf scopes, context, folders/tags, opmaak, zoeken, pinnen en volledige JSON-export.                 | Export is geen volledige back-up; geen oorspronkelijke gebruikersimportknop.                                |
| Groepen                             | Groepsbeheer, leden/rechten, feed/chat, taken, events, media, ranking en voortgang.                  | Realtime in de gehoste omgeving staat nog uit; groeptaal wordt getoond maar heeft geen editor.              |
| Meldingen                           | Lokale herinneringen, stille uren, apparaatregistratie en groepsoverrides.                           | Aanwezig serverpad verstuurt discussie-antwoorden, geen algemene nieuwe-chatpush.                           |
| Studie                              | NL/EN, tafsir, iʿrab, beschikbare asbab, mutashabihat en zeven boeken.                               | Externe beschikbaarheid en brondekking blijven expliciet.                                                   |
| Introductie, talen, uiterlijk       | Bewaarde introductie, drie talen, RTL, oorspronkelijke thema's en nieuwe patroonvoorkeur.            | Demonstraties wijzigen geen echte gegevens.                                                                 |
| Account en profiel                  | E-mail, Google/Apple, herstel, profielcache, actorvaste accountacties en lokale persoonlijke opslag. | Apple-provider en verwijderfunctie moeten worden ingericht; inloggen is geen volledige cloudsynchronisatie. |

Een andere plek in de nieuwe navigatie is niet automatisch een verdwenen functie. Tegelijk bleek uit de concrete reparaties hierboven dat de vorige controle geen volledige garantie gaf. Daarom blijven bronaanwezigheid, gedragstests, native waarneming en productie-inrichting afzonderlijk beschreven.

## Inhoud en oorspronkelijke code behouden

De hoofdagent heeft alle **198 oorspronkelijke Kotlin-bestanden** vergeleken met de bewaarde SHA-256-inventaris: geen inhoudsverschillen. De nieuwe app blijft naast `app/` staan; de oorspronkelijke Kotlin-code wordt niet vervangen of verwijderd.

De [onafhankelijke dekkingsmatrix](recheck-2026-11-18/kotlin-review-coverage.json) wijst alle **125 productiebronnen** toe aan expliciete inhoudelijke reviews: geen onverdeelde productiemodule. De overige bestanden zijn 72 oorspronkelijke tests en één debugbestand. Elf tests zijn als specificatie gelezen; de Kotlin-testsuite is niet uitgevoerd. Grote gedeelde bestanden hebben expliciete deelscopes. Dit is onderbouwde brondekking, geen bewijs dat iedere native gedragsvertakking is uitgevoerd. [Controle op bronbehoud](recheck-2026-11-18/original-source-preservation.json).

De onafhankelijke inhoudscontrole vergelijkt alle 6.236 Arabische aya's, beide vertalingen, woord-/grammaticagegevens, audiocatalogi, oorspronkelijke afbeeldingen, surakaarten, mushafgrenzen en boekdatabase met de Kotlin-bronnen. Het resultaat en de reproduceerbare probe staan in [reader-content-probe.json](recheck-2026-11-18/reader-content-probe.json) en het reader-rapport. De oorspronkelijke import-/exportcontracten blijven behouden.

## Documentatie en volledige vindbaarheid

- [Gebruikershandleiding](GEBRUIKERSHANDLEIDING.md): bediening per functie, begrippen, offline gebruik en foutoplossing.
- [Technische appgids](TECHNISCHE_APPGIDS.md): schermen, instellingen, verantwoordelijkheden en gedragsregels.
- [Volledige bronindex](recheck-2026-11-18/CODE_INDEX.md): ieder opgenomen bestand en de benoemde declaraties, met bronlinks; automatische indexering is geen semantisch bewijs.
- [Live chat instellen](LIVE_CHAT_SETUP.md): exacte code, omgevingsvariabelen, migraties, RLS, publicatie, typing, push en diagnose.
- [iOS-push](IOS_PUSH_SETUP.md): capabilities, provisioning, APNs, serveromgeving, registratie en acceptatie.
- [Apple-aanmelding en verwijderen](APPLE_SIGN_IN_SETUP.md): provider, native login, servergeheimen, intrekking, fouten en grenzen.
- [Releasehandleiding](RELEASE_HANDLEIDING.md): lokale APK, EAS-AAB/IPA, signing, secrets en stappen voor beide stores.
- [Dependency-audit](DEPENDENCY_AUDIT_2026-11-18.md): één nog ongepatchte picomatch-advisory achter de 32 npm-meldingen.

## Deelcontroles

- [Reader, audio en studie](recheck-2026-11-18/reader-audio-study.md): 35 Kotlin-bestanden, vier reparaties, 147 gerichte tests en bron-/providerproeven.
- [Registraties, planning en notities](recheck-2026-11-18/tracking-planning-notes.md): 58 Kotlin-bestanden, uitgebreide regel-/klassenmapping en 105 gerichte tests.
- [Community, realtime en push](recheck-2026-11-18/community-realtime-push.md): 167 bron-/test-/serverbestanden; 64 unit-/servicetests, 8 chat- en 7 typinggevallen plus SQL-controles.
- [Account, platform en introductie](recheck-2026-11-18/accounts-platform.md): 30 productiebronnen met afgebakende scopes, zeven reparaties en 144 gerichte tests.
- [Onafhankelijke eindcontrole](recheck-2026-11-18/independent-review.md): zeven concrete bevindingen, regressies, brondekking en aanvullende review van Apple en meldingen.

De afzonderlijke testselecties overlappen en worden niet tot een kunstmatig totaal opgeteld.

## Open inrichting en acceptatie

- **Gehoste live chat:** de read-only controle van 18 november meldt op alle vijf kanalen `RealtimeDisabledForConfiguration`. Code en lokale echte chat-/typingcontroles werken; de live-chathandleiding beschrijft de serverstappen. Er is geen hosted instelling gewijzigd.
- **Push en Apple:** FCM/APNs-configuratie, Apple-provider, deploy van `apple-account-delete`, signing en echte toestelbezorging vereisen de beschreven account-/serverinrichting. Nieuwe algemene chatberichtpush is geen bestaande producer; de huidige groepspush bezorgt discussie-antwoorden.
- **iOS:** geen ondertekende IPA of native iPhone-acceptatie in deze Windows-sessie. De EAS-opdracht staat klaar; projectkoppeling, Apple-identiteit, provisioning en storegegevens moeten kloppen. De iOS-JavaScript-export is afzonderlijk bewijs.
- **Audiohosting:** luisteren en gekozen offline downloads zijn aanwezig. De volledige externe audiocatalogus is niet naar Supabase gekopieerd; de mirror-/VPS-route blijft configureerbaar en beschreven.
- **Dependencies:** de actuele picomatch-advisory heeft nog geen gepubliceerde patch. De [dependency-audit](DEPENDENCY_AUDIT_2026-11-18.md) beschrijft het bereik en de vervolgstap; er is geen gedwongen Expo-downgrade uitgevoerd.
- **Fysieke acceptatie:** update over een bestaande ondertekende Android-installatie, OS-slaapstand/back-upherstel en de volledige iOS-interactiematrix moeten op de bedoelde toestellen worden aangetoond.

## Definitieve verificatie en aflevering

- `npm run verify`: **760/760 tests**, TypeScript en ESLint geslaagd; geen overgeslagen tests.
- `npm run format:check`: geslaagd.
- `npm run export -- --output-dir dist-recheck-final`: Android-, iOS- en webbundels geslaagd. Dit is geen native iOS-build.
- Apple-server: Deno-typecheck en **3/3** tests met echte lokaal ondertekende JWT's geslaagd. Deze controle draait ook in CI en de releaseworkflow.
- `npm run build:apk -- -SkipChecks`: na bovenstaande controles geslaagd in **2m07s**, 810 Gradle-taken; **arm64-v8a en x86_64**.
- APK: `output/builds/quran-tracker-local.apk`, **251.580.739 bytes**, SHA-256 `c7bc1fb5a398382cabac5f144a0f7cdf4acd99325dbc6a17af4c0b523e34ce07`. Lokale testsignering, geen Play Store-uploadidentiteit.
- Native aflevering: `install -r` op `wirdna-qa`/`emulator-5554`; bestaande package-UID behouden, teruggelezen APK-hash gelijk, launch geslaagd, statistieken zichtbaar en geen `AndroidRuntime`-/`ReactNativeJS`-errorregels voor het nieuwe proces. Geen appgegevens gewist. [Afleveringsmeting](recheck-2026-11-18/android-delivery.json).
- Documentatie: nieuwe gidsen, bronrapporten en folder-README's gecontroleerd op bestaande lokale linkdoelen. [Linkcontrole](recheck-2026-11-18/documentation-link-check.json).

Afleverbranch: [`work/react-native-complete-audit-20261118`](https://github.com/Chandersway/Quran-Tracker/tree/work/react-native-complete-audit-20261118). De finale secretscan en remote commitcontrole worden bij de branchaflevering vastgelegd. De branch verandert `main` niet; de stores en backend worden niet gepubliceerd. De GitHub-CI controleert ook pushes onder `work/**`.
