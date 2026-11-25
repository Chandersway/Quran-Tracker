# Kotlin-pariteit: uitvoering van 17 november 2026

Dit is het uitvoeringsverslag bij de [broncode-audit](KOTLIN_PARITY_AUDIT_2026-11-17.md). De audit beschrijft de situatie vóór deze wijzigingen en blijft als historisch bewijs bewaard. De uitvoering volgt de concrete verschillen uit die audit en de latere gebruikerswensen; oude navigatie wordt daarom niet opnieuw naast de gecombineerde Mushaf-lezer gezet.

## Implementatie per onderdeel

| Nr. | Onderdeel | Uitvoering |
|---:|---|---|
| 1 | Mushaf en uitsnedes | Muhammadi gebruikt de juiste 638 afbeeldingen. Hafs/Warsh Maknoon hebben weer de vaste vergroting van 115%/112%, met dezelfde transformatie voor selectiegebieden. PDF-uitsnedes worden in een afzonderlijk cachebestand gemaakt; het oorspronkelijke bestand blijft intact. |
| 2 | Navigatie en zoeken | Alle 240 Warsh-rubbestemmingen gebruiken de gecontroleerde bronindeling. Soera/juz/hizb houden hun eigen navigatiecontract. Globaal zoeken door alle Arabische verzen en de bestaande NL/EN-vertalingen is toegevoegd. |
| 3 | Selectie en hervatten | Bladeren/selecteren houdt op de vier ondersteunde originele afbeeldingen hetzelfde boek, pagina en zoom. Samengevoegde Warsh-ayahs behouden alle canonieke verwijzingen bij kopiëren, delen en woordstudie. Afzonderlijke soerahervatposities worden opgeslagen en uit oude voorkeuren hersteld. |
| 4 | Leesregistraties | Juz en rub hebben weer de individuele dialoog met bestaand aantal, opnieuw lezen, verwijderen en annuleren. Het later gevraagde paginavinkje blijft een toggle. |
| 5 | Hifz | Kleurweergave kan onafhankelijk aan/uit. Lezen verandert de beoordelingsdatum niet meer. Scores, leestellers en groepspunten blijven afzonderlijke gegevens. |
| 6 | Snelle check-in | Eén bewaakte opslagopdracht voor de hele selectie; succes volgt na bevestigde lokale opslag. Een mislukte poging kan met dezelfde identiteit opnieuw worden opgeslagen zonder dubbele registratie. |
| 7 | Hizboverzicht | Het bestaande overzicht met 60 hizbs, periodefilters, nulwaarden en details is behouden. Vier losse rubs worden niet alsnog een volledige hizb-check-in. |
| 8 | Statistieken | Weekactiviteit telt weer alle geschiedenisacties; leesringen blijven uitsluitend leesregistraties tellen. Het gecombineerde Home-hifzgemiddelde is hersteld. Doorklikken, details, reset en onafhankelijk hizbgemiddelde op Stats blijven bestaan. |
| 9 | Tahajjud | Bestaande gedeelde ayahdekking, gedeeltelijke vinkjes, stoppunt, hervatten en afzonderlijke resets blijven behouden. |
| 10 | Focus | Intenties, duurkeuze, pauze/hervatten, afronden en timer tussen schermen blijven behouden. Fullscreen verbergt de gewone bediening zonder de sessie te stoppen. |
| 11 | Dagdoelen | Plannen met verschillende intenties op dezelfde datum worden niet meer samengevoegd. Registraties bewaren de echte kloktijd op de gekozen datum. |
| 12 | Leesplan | De juiste registratietijd voorkomt dat een latere doelsessie buiten een nieuw leesplan valt. Hoeveelheden, correcties, herhaling en optionele einddatum blijven onafhankelijk van dagelijkse doelen. |
| 13 | Agenda | Nu, over 30 minuten en vanavond zijn toegevoegd. Afronden wist de herinneringsvelden; ongedaan maken activeert geen oude herinnering. De gewone categorie- en stille-urenregels blijven gelden. |
| 14 | Audio | Reciteurwisselen behoudt tijdpositie en pauzestand. De minispeler heeft seek, snelheid, laadstatus, bereik/ronde en omhoog vegen. Media-instellingen bieden zoeken/filteren en kiezen zonder automatisch starten. |
| 15 | Herhalen | Expliciete modi voor huidige pagina, paginabereik, hele soera en ayahbereik; 2/3/5/onbeperkt. Warsh gebruikt de juiste gedrukte nummering en canonieke audioverwijzingen. De selectie kan offline worden opgeslagen. |
| 16 | Notities | Contextlinks voor soera/juz/hizb/rub, alle vijf scopes, volledige export en oorspronkelijke sorteervolgorde. De editor wacht op opslag, houdt een mislukte invoer open en bewaart wijzigingen die tijdens het opslaan zijn getypt. Het toetsenbord schuift het invoerveld zichtbaar omhoog. |
| 17 | Groepen | Dashboard met doelvoortgang, totalen, actieve leden, reeksen, ranglijst en recente activiteit. Automatische voortgangspreview respecteert zowel registratie- als postrechten. Lange posts kunnen inklappen. Uitnodigingen gebruiken de bestaande HTTPS-bestemming. |
| 18 | Meldingen | Actuele apparaat-/kanaalstatus, verversen bij terugkomst en een shortcut naar Android-meldingsinstellingen. Lokale Realtime-, typing- en SQL-rechtencontroles zijn afzonderlijk uitgevoerd. |
| 19 | Studie | Asbab toont alleen beschikbare bronnen, soera's en ayahs; de actie verschijnt alleen waar inhoud bestaat. NL/EN, tafsir, iʿrab, mutashabihat en zeven boeken blijven behouden. |
| 20 | Talen en uiterlijk | Alle twaalf oorspronkelijke thema's plus systeemkeuze; appbrede RTL zonder herstart, met fysieke mushafgeometrie behouden. Voorkeuren-only migratie slaat de introductie correct over. Arabische tekstgrootte heeft overal hetzelfde bereik van 20–54. |
| 21 | Account | Wachtwoordbevestiging bij registreren is terug. Een oude mislukte sessieaanvraag kan een nieuwere ingelogde sessie niet meer overschrijven. Persoonlijke voortgang blijft lokale data; inloggen wordt niet als automatische cloudsynchronisatie gepresenteerd. |

## Extra fouten gevonden tijdens uitvoering

- De Expo-bestands-API verandert na `move()` de URI van het bestandsobject. Opruimen via dat object verwijderde daardoor gedownloade audio; hetzelfde probleem is in de nieuwe PDF-cache tijdens onafhankelijke review gevonden en hersteld. Tests gebruiken nu asynchrone I/O en de echte URI-mutatie.
- Versaudio gebruikte dezelfde cachenaam voor verschillende ayahs binnen één soera. Iedere ayah heeft nu een eigen identiteit; tijdsindelingen worden gecontroleerd en lokaal bewaard.
- Groepstotalen mogen niet op de eerste databasepagina stoppen. De adapter leest stabiel gesorteerde vervolgpagina's en geeft een fout door als een latere pagina mislukt.
- Groepsdatums volgen de UTC-dag van het bestaande SQL-contract; de interface vermeldt dit. Persoonlijke statistieken blijven de lokale kalender gebruiken.
- De native header telde de bovenste veilige marge dubbel. Dit is verwijderd zonder de veilige marges rond de scherminhoud weg te halen.
- React Native zet de swipeafstand opnieuw op nul wanneer de minispeler de aanraking van een onderliggende knop overneemt. De minispeler bewaart nu ook de al afgelegde afstand; een snelle omhoogbeweging gaat daardoor niet verloren. De regressie gebruikt de werkelijk geïnstalleerde RN-responder.
- Na diagonaal pannen kon Android bij terugzoomen een horizontale schuifpositie buiten de kleinere pagina behouden. De lezer begrenst die positie nu wanneer de nieuwe pagina-afmetingen binnenkomen. De fout is gereproduceerd in de release-emulator en in een regressietest. Na de correctie is terugzoomen naar een volledige pagina opnieuw gecontroleerd in development met de selecteerbare weergave én in de definitieve release met de oorspronkelijke Hafs-afbeelding.

## Structuur en onderhoud

Schermen blijven onder `features/<functie>/screens`, herbruikbare featureonderdelen onder `components` en besturing onder `hooks`/`model`. Externe I/O blijft achter services. Algemene interfaceonderdelen staan in `shared`, appcompositie en navigatie in `app`, pure rekenregels in `domain` en gebruikersgegevens in `state`.

De gewijzigde mappen hebben README-uitleg. `state/persistence/snapshotWriter.ts` bundelt achtereenvolgende volledige snapshots en schrijft ze in volgorde. Formulieren gebruiken `commit()` wanneer ze op duurzame opslag moeten wachten. Gewone bediening kan `dispatch()` blijven gebruiken; opslagfouten worden centraal zichtbaar en zijn opnieuw te proberen. Een mislukte write draait de zichtbare state niet stilzwijgend terug.

Het oorspronkelijke importformaat en de importers zijn niet veranderd. Herstel van extra weergavevoorkeuren gebeurt ná import in een aparte adapter. Brongegevens, afbeeldingen en zorgvuldig samengestelde teksten zijn niet opnieuw gegenereerd.

## Bewijs en grenzen

De herhaalde bronvergelijking vond geen verschillen in 6.236 Arabische verzen, 6.236 Nederlandse en 6.236 Engelse vertalingen, de woord-/grammaticarecords, 114 audiocatalogi, 1.365 oorspronkelijke bestandskopieën en 1.712 tekstcatalogusitems. Een audiocatalogus is geen bewijs dat alle opnamen al gedownload zijn.

De definitieve gezamenlijke controle slaagde met **TypeScript, ESLint en 659 tests**, zonder overgeslagen tests. Formatting is gecontroleerd. Android-, iOS- en webbundels zijn gegenereerd. De Android-debug- en releasebuilds voor **arm64-v8a en x86_64** compileren; daarnaast slagen drie JVM-tests voor de native PDF-worker. De lokale release is opnieuw geïnstalleerd op emulator 5554 en de APK-hash is teruggelezen en gelijk bevonden. Emulator 5558 draait de afzonderlijke native development client met Metro 8081; Fast Refresh is zichtbaar uitgevoerd. Er zijn geen appgegevens gewist.

De [lokale APK](../android/app/build/outputs/apk/release/app-release.apk) bevat 251.532.283 bytes, met SHA-256 `ffe05b97d1c16038272c117d96a07587babf606807ad8a441dcfc97f2ca2bfbc`. De geïnstalleerde APK op 5554 heeft exact dezelfde hash. De native releasecontrole bevestigde fullscreenzoomen, één diagonale panbeweging en ayahselectie op de oorspronkelijke Hafs-afbeelding zonder verandering van boek/zoom; de aangetikte tekst opende correct canonieke ayah 1:4 met vertaling.

De native QA gebruikte eerst de afzonderlijke lokale Android-emulator 5556. Originele Hafs-afbeelding en ayahselectie met Nederlandse vertaling, notitie-invoer boven het toetsenbord en het openen van de 612-pagina's tellende IndoPak-PDF zijn daadwerkelijk bekeken. De eerste JS-PDF-voorbereiding bleek te traag. De nieuwe native Android-worker opende dezelfde **51.351.963-byte PDF binnen de eerstvolgende controle na 5.534 ms**, inclusief navigatie, een verse uitsnede en rendering; dit is een gemeten bovengrens, geen geïsoleerde verwerkingstijd. Het oorspronkelijke bestand heeft nog dezelfde SHA-256. Alle 612 CropBox/MediaBox-resultaten komen overeen met de onafhankelijke cropformule; alle **2.279 gebruikte pagina-afbeeldingen** zijn inhoudelijk gelijk. De 17 niet door pagina's gebruikte bronobjecten worden door PDFium niet opnieuw opgeslagen. [Exacte bestand-/geometriecontrole](parity-2026-11-17/native-pdf-output.json).

Op oudere Android-shells en iOS ontbreekt deze Android-worker. De JS-fallback gebruikt grotere batches; ongecachete boeken boven 32 MiB openen meteen als origineel en bieden uitsnedevoorbereiding als expliciete actie. Dit voorkomt langdurig wachten vóór lezen. De iOS-native PDF-worker is niet geïmplementeerd of als aanwezig voorgesteld. Dit is geen claim dat iedere editie, taal en handeling op ieder toestel getest is.

Lokale Supabase-tests bevestigen Realtime (8/8), typing (7/7) en de transactionele rechtencontrole. De echte audioproef downloadde drie opnamen en controleerde bestanden plus offline hergebruik; drie Warsh-timingproviders zijn gecontroleerd. Op Android is via Media afspelen gestart: de OS-mediasessie rapporteerde PLAYING met voortgaande tijd en zonder fout; de UI ging automatisch van soera 112 naar 113 en 114 en eindigde correct. In de definitieve release is ook de omhoogveeg van de minispeler naar de uitgebreide speler daadwerkelijk uitgevoerd tijdens Al-Fatihah; Stop beëindigde daarna het afspelen. Dit bewijst niet de bereikbaarheid van alle externe aanbieders, hoorbare uitvoer of achtergrondweergave op ieder toestel.

De bestaande releaseworkflow met GitHub Environment Secrets blijft behouden. De CI-definitie controleert nu ook een gegenereerde Android-build voor beide architecturen en de native worker-tests. Die workflowwijziging is lokaal gevalideerd, niet naar GitHub gepusht of daar uitgevoerd. Het lokale APK is een testaflevering, geen App Store- of Play Store-publicatie.

Een gehoste Realtime-/pushproef, echte Google-aanmelding, App Store-signering en native iOS-acceptatie vereisen hun eigen omgeving. Er is tijdens deze lokale uitvoering niets naar productie gepubliceerd en geen bericht naar echte gebruikers verstuurd. De bestaande HTTPS-uitnodigingen hebben een webfallback; iOS Universal Links vereisen nog het later te configureren AASA/associated-domains-contract.

## Deelrapporten

- [Lezer en studie](parity-2026-11-17/reader-study-implementation.md)
- [Registraties en planning](parity-2026-11-17/tracking-planning-implementation.md)
- [Audio](parity-2026-11-17/audio-implementation.md) en [echte downloadcontrole](parity-2026-11-17/audio-implementation-live.json)
- [Groepen, meldingen en account](parity-2026-11-17/community-account.md)
- [Introductie, thema's en taal](parity-2026-11-17/onboarding-content.md)
