# UI/UX en featureverschillen — beoordeling van F24

Datum: 14 november 2026. Auditcheckpoint F25; de beoordeelde en geïnstalleerde app blijft **F24**. Deze controle verandert geen appcode en levert geen nieuwe appbuild op.

Methode: onafhankelijke ontwerpbeoordeling (`ux_design_review_f25`, Terra), afzonderlijke technische/native controle (`ux_evidence_review_f25`, Sol), Kotlin-vergelijking (`kotlin_parity_review_f25`, Sol) en verificatie door de hoofdagent. De ontwerpbeoordeling was afgesloten voordat de detectorresultaten werden samengevoegd. Alle zes oorspronkelijke screenshots zijn door de hoofdagent bekeken. Nieuwe native controles gebeurden uitsluitend op emulator-5556; de zichtbare gebruikerssimulator en ingelogde sessie zijn niet gewijzigd.

## Oordeel

**Ongeveer 6/10 voor de huidige UI/UX.** De eerdere 4/10 hoorde bij een veel vroegere versie. De herkenbare Mushaf, boek/tekstkeuze, Nederlandse/Engelse vertaling, rustigere navigatie en herstelde statistiekachtergronden verbeteren de ervaring merkbaar. Een mooi palet en werkende routes zijn nog geen afgewerkt product: de kerninformatie ligt te diep, de lezer geeft te veel ruimte aan bediening en belangrijke bronfuncties zijn nog niet volledig aangesloten.

Dit is een deskundigenoordeel, geen gemeten gebruikerstevredenheid. Er is geen verantwoord percentage voor volledige Kotlin-pariteit en geen bewijs dat de app nu een 10 verdient. De oude ledger met 55 gedeeltelijke rijen betekent niet dat 55 functies ontbreken.

De identiteit is herkenbaar door het cypres/papierpalet, Arabische typografie en het echte drukwerk. Buiten de lezer blijft de compositie vaak een lange reeks gelijkwaardige kaarten. Meer productkarakter moet uit de indeling, typografische verhoudingen, inhoud en gerichte interacties komen. Zellij en transparante Arabische achtergrondletters blijven ondersteunend, zonder de leesbaarheid te verminderen.

## Direct waargenomen layoutproblemen

| Bevinding | Bewijs | Gevolg en verbetering |
|---|---|---|
| De eerste dashboardweergave toont vooral titel, vandaagkaart en leesplan. Hervatten en de drie oorspronkelijke verdelingen liggen verderop. | [Dashboardcapture](../design-preview/screens/f25-home-portrait.png); `src/features/home/screens/MainScreen.tsx:116`, `:216`, `:284`. | Maak de statistieken het hoofdonderdeel: compacte vandaag-samenvatting, de oorspronkelijke drie verdelingen, exacte recente referenties en een compacte hervatactie. Dagdoel, leesplan en Hifz houden hun eigen betekenis. |
| De liggende boekweergave geeft de pagina slechts 400 van 1080 pixels schermhoogte: circa 37%, bij deze telefooninstellingen. | [Liggende Mushaf](../design-preview/screens/f25-book-landscape-settled.png); `src/features/quran/screens/MushafScreen.tsx:610`, `:786`. | Vouw secundaire bediening samen en gebruik de hoogte beter. Behoud paginarail, selectie/bladeren, compacte registratievink en fullscreen. De pagina is scrollbaar; dit is geen bewijs van onherstelbaar afgesneden tekst. |
| In de staande tekstweergave begint de eerste Arabische aya op y=1988 van 2400; de Nederlandse vertaling op y=2185. | [Tekstweergave](../design-preview/screens/f25-text-portrait.png); `src/features/quran/screens/ReaderScreen.tsx:250`. | Laat de passage direct beginnen. Maak zoeken, reciter en aanvullende opties contextueel; houd boek/tekst en vertaaltaal duidelijk bereikbaar. Behoud alle brontekst. |
| Meer bevat 13 gelijkwaardige bestemmingen en herhaalt eerst de drie vastgezette tabs. Groepdetail heeft 10 vaste en maximaal 3 extra beheertabs. | `src/app/navigation/dockDestinations.ts:15`; `src/features/groups/screens/GroupScreen.tsx:224`. | Groepeer op Lezen, Oefenen en Organiseren. Geef de groepsfeed voorrang en plaats beheer apart. Behoud maximaal drie gekozen ondertabs en standaardherstel. |
| Bij 1,3× systeemtekst is Aangepast in de Hizb-periodekiezer slechts als rand zichtbaar; de scrollindicator is verborgen. | Lokale `f25-home-font130-goal.png/xml`; `src/shared/components/Segments.tsx:23`. | Gebruik een duidelijke periodekiezer of een zichtbare aanwijzing dat er meer opties zijn. De optie is horizontaal bereikbaar, dus niet als ontbrekend tellen. |

De dagelijkse kaarten groeien en breken hun tekst correct af bij 1,3× systeemtekst. De eerder gemelde doorschijnende statistiekoverlap is in F24 hersteld en wordt niet opnieuw als actuele fout opgevoerd. Enkele segmentknoppen zijn circa 44 dp hoog, onder de eigen ontwerpafspraak van 48 dp; pictogramknoppen en dockdoelen zijn ruimer. Herhaalde aya-acties hebben dezelfde algemene toegankelijkheidsnaam als het hoofdleesmenu; daadwerkelijke TalkBack-bediening is nog niet beoordeeld.

## Vergelijking met de oorspronkelijke app

Status **aanwezig** betekent hieronder dat de concrete implementatie is gevonden. Het betekent niet dat iedere toestand op Android en iOS is geaccepteerd. Gerichte eerdere native controles blijven afzonderlijk beschreven in [NATIVE_QA.md](NATIVE_QA.md).

| Onderdeel | Huidige stand |
|---|---|
| Drie statistiekcirkels, periodekeuze, doorklikken en leesgeschiedenis | Aanwezig in `features/practice/components/ReadingStatisticsOverview.tsx` en `StatisticsHistory.tsx`. Hun zichtbaarheid en samenhang op het dashboard moeten beter. |
| Dagdoelen, zelfstandig leesplan, Hifz-beoordelingen, bereiken en herhaaladvies | Aanwezig. Leesregistraties en eigen Hifz-scores zijn gescheiden. Volledige native acceptatie van alle combinaties blijft open. |
| Mushaf, oorspronkelijke afbeeldingen/PDF, boek/tekst, NL/EN en opgeslagen positie | Aanwezig, met gerichte Android-bewijzen. Selecteerbare tekst en oorspronkelijke scans zijn verschillende weergaven. Landscape, alle uitgaven en iOS zijn niet volledig afgedekt. |
| Groepen met eigen feed, antwoorden, reacties en beheer | Aanwezig. Leden, rollen, uitnodigingen, media, taken, evenementen, regels, meldingen en audit hebben panelen en serviceacties. Volledige native acceptatie met meerdere accounts ontbreekt nog. |
| Notities, scopes, opmaak, filters en export | Aanwezig. F24 controleerde native aanmaken, bewaren, herstarten, exportvenster en verwijderen van een testnotitie. Rijke invoer, alle scopes en migratievarianten zijn niet daarmee volledig afgevinkt. |
| Agenda, focus, checklist, studieboeken, vergelijkbare passages en onboarding | Substantiële implementaties aanwezig, waaronder zes interactieve onboardingdemo's. Aanwezigheid moet nog verder door native scenario's worden bevestigd. |
| Audio, herhalen, downloads en herinneringen | Engines en bediening bestaan. De boekweergave mist enkele aansluitingen; achtergrondgedrag, onderbrekingen en echte pushbezorging blijven acceptatiewerk. |

### Concrete verschillen en regressies

| ID | Verschil | Bronbewijs en huidige locatie | Benodigde correctie |
|---|---|---|---|
| K01 | Spelen en herhalen ontbreken in het geselecteerde-aya-menu van de Mushaf. | Kotlin `QuranReaderScreen.kt:1507`, `:1513`; RN `MushafScreen.tsx:1061` geeft de callbacks niet door en `AyahActionsSheet.tsx:141` verbergt de acties. Tekstreader sluit ze wel aan. | Bestaande audio- en herhaalflow verbinden aan de boekselectie. Origineel Spelen start de soera; niet beweren dat Kotlin geselecteerde-aya-audio afknipte. |
| K02 | Contextuele Iʿrāb gebruikt een andere bron en laadt niet de oorspronkelijke boekbron. | Kotlin `QuranReaderScreen.kt:484` opent Quranpedia automatisch; RN `AyahActionsSheet.tsx:101` opent gebundelde grammatica in Study. | Quranpedia-bron openen bij de juiste referentie; gebundelde grammatica als aparte functie behouden. |
| K03 | Contextuele Asbāb kan naar een andere passage springen; vastgezette Warsh-verwijzingen gaan verloren. | Kotlin `IrabScreen.kt:53–74` behoudt geselecteerde referenties; RN `StudySourcesScreen.tsx:95`, `:108` kiest zo nodig een andere soera/aya. Route `app/navigation/types.ts:31` mist die context. | Geselecteerde referenties vasthouden; een ontbrekende bron als ontbrekend tonen. Meervoudige betrouwbare Warsh/Hafs-koppelingen behouden. |
| K04 | Studie-inhoud kan onder een inmiddels gewijzigde versreferentie blijven staan. | Kotlin `IrabScreen.kt:138`, `:150`, `:155` wist resultaat of blokkeert invoer; RN `StudySourcesScreen.tsx:123`, `:190`, `:198` koppelt lopende resultaten niet aan een onveranderlijke aanvraag. | Wis oud resultaat bij wijzigingen en accepteer alleen het resultaat van de huidige referentie/bron. |
| K05 | Groepsconcepten gaan bij wisselen van paneel verloren. | Kotlin `HamburgerMenu.kt:815–816` bewaart concepten boven de tabs; `:2195` wisselt zonder ze te wissen. RN `GroupScreen.tsx:272`, `:310` verwijdert de feedcomponent met lokale conceptstate in `GroupFeedPanel.tsx:42–43`. | Bewaar post- en antwoordconcepten per account/groep boven de wisselende panelen. Verversen behoudt concepten al; paneelwisseling is een andere situatie. Bronanalyse, nog geen nieuwe native reproductie. |
| K06 | Immersieve tekstweergave verbergt niet alle globale bediening. | Kotlin `MainActivity.kt:463`, `:675`; RN `ReaderScreen.tsx:47`, `:91`, `:210` wijzigt lokaal header/statusbar, terwijl `AppNavigator.tsx:223–224` aparte globale state gebruikt. | Ook tekstmodus aansluiten op AppChrome, met correct herstel bij teruggaan. |
| K07 | Quranpedia-fragmenten missen selecteerbaarheid en volledige bronactie. | Kotlin `IrabScreen.kt:169–180`; RN `StudySourcesScreen.tsx:284–287` toont kale deel/paginawaarden, niet-selecteerbare fragmenttekst en geen bronlink. | Oorspronkelijke bronvermelding, volume/paginalabels, bronactie en selectie terugbrengen. |
| K08 | De optionele informatie-illustratie per soera ontbreekt. | Kotlin `QuranReaderScreen.kt:564`, `:1024`, `:1088`; RN Reader heeft geen overeenkomstige kaart/toggle. | Als aparte oorspronkelijke functie terugbrengen. Dit is niet de Mushaf-pagina zelf. |
| K09 | Sommige eenheidslabels gebruiken ruwe interne waarden. | Kotlin `ReadingPlanScreen.kt:40`; RN `ReadingPlanScreen.tsx:132` gebruikt `t(value)` terwijl bijvoorbeeld `rub` geen passende bronalias heeft. | Expliciete bestaande vertaalkeys gebruiken, volledige zinnen en meervoud controleren. |
| K10 | Groepsrollen omzeilen de samengestelde vertaalteksten. | Kotlin `HamburgerMenu.kt:4625` vertaalt rollen; RN `GroupMembersPanel.tsx:104–106` toont `value.role` letterlijk. | De originele rolteksten tonen; gebruikersnamen en groepsnamen blijven letterlijk. |

Kotlin-locaties staan onder `../app/src/main/java/com/Ameender/qurantracker/ui`, behalve `MainActivity.kt` in de bovenliggende package. RN-locaties staan in hun huidige `features/.../screens`, `components` of `app/navigation` map. De onafhankelijke volledige bronnotities blijven lokaal in `.tooling/f25-parity-audit.md`.

### Aanvullende gebruikerswensen, geen verdwenen Kotlin-functies

- **Volwaardig lexicon zoals BibleHub:** corpus/repository en detail-/zoekcomponenten zijn voorbereid, maar hebben geen aangesloten approute en woordenboekprovider. Betekenissen, lemma/stam, bronnen, woordfamilies en alle vindplaatsen vormen nog geen complete gebruikersflow. Woordglossen zijn geen vervanging voor woordenboekdefinities.
- **Realtime groepschat en oudere feedberichten:** Kotlin `GroupV2Repository.kt:1242–1252` en RN `services/backend/backend.ts:153–163` halen beide maximaal 60 feedberichten op. Realtime abonnementen, verzendstatus en feedpaginering zijn uitbreiding, geen bewijs dat de migratie een complete oude chat heeft verwijderd. Meldingen/audit hebben elders wel paginering.
- **Gelezen-status in de paginarail:** een optionele `read`-waarde bestaat in `MushafFooter.tsx`, maar de app levert die nog niet aan. Tekstdichtheid heeft wel echte editiegebonden gegevens; onbekende uitgaven blijven neutraal.
- **Downloads na beëindiging van de app:** doorgaan tijdens schermwisseling bestaat. Gegarandeerd verdergaan na procesbeëindiging vereist een native achtergrondtaak.
- **Warsh offline selecteerbare tekst en betrouwbare lexicale koppelingen:** oorspronkelijke scan blijft bestaan; de afzonderlijke Unicodeweergave heeft nog geen volledige offline bundel/geverifieerde woordenboekkoppeling.

### Grenzen van de oude inventaris

De inventaris indexeert 198 authored Kotlin-bestanden; hun genormaliseerde hashes passen nog. De productiepackage bevat 124 Kotlin-bestanden. Dat bewijst inventarisdekking, geen controle van iedere gedragsvertakking. 48 bestanden hebben nog geen feature-ID. Na de refactor zijn 47 van 54 RN-bewijspaden in de oude ledger verouderd. Daarom is die ledger historische broninventaris; deze controle gebruikt de huidige locaties. De tien bovenstaande verschillen zijn concrete bevindingen, geen volledige telling van iedere ontbrekende functie. De oude lege `feature-gap-priorities.json` selecteert alleen rijen met status `missing` en mag niet worden gelezen als “geen open taken”.

## Heuristische beoordeling

Scores 0–4 per criterium, alle tien van toepassing. De onafhankelijke ontwerpbeoordeling gaf 23/40; de hoofdagent verlaagt foutpreventie van 3 naar 2 vanwege de concreet gevonden referentie-/conceptproblemen. Dit levert **22/40** op. Dit is een andere schaal dan het afgeronde algemene oordeel 6/10.

| Criterium | Score | Belangrijkste reden |
|---|---:|---|
| Zichtbare status | 3 | Actieve tabs, pagina en voortgang zichtbaar; niet alle fouttoestanden gecontroleerd. |
| Begrijpelijke taal | 2 | Bronwoorden grotendeels behouden; ruwe rollen/eenheden en onduidelijke actiecontext blijven over. |
| Controle en teruggaan | 2 | Modi/terug bestaan; conceptverlies bij tabwisseling blijft een risico. |
| Consistentie | 3 | Samenhangend palet en dock; veel afwijkende lezerbediening. |
| Foutpreventie | 2 | Lezen wordt expliciet geregistreerd; studie-inhoud kan nog bij een verkeerde actuele referentie staan. |
| Herkennen boven onthouden | 2 | Gelabelde navigatie; long press, veel gelijkwaardige tabs en verborgen opties vragen voorkennis. |
| Efficiëntie | 2 | Rail en shortcuts bestaan; kerninformatie en echte leestekst komen te laat. |
| Esthetiek en focus | 2 | Rustige basis, maar grote gelijkwaardige kaarten en te veel bediening. |
| Foutherstel | 2 | Retry en specifieke fouten bestaan; volledige herstel-/offlineflows niet geaccepteerd. |
| Hulp in context | 2 | Uitleg aanwezig; voor nieuwe lezers is de juiste volgende stap nog niet overal helder. |
| **Totaal** | **22/40** | Voorlopige expertbeoordeling, geen gebruikerstest. |

## Prioriteiten voor de uitvoering

1. **P1 — Inhoud en invoer betrouwbaar houden.** Eerst K03/K04/K05, daarna contextuele bron-/audioacties K01/K02/K06. Met gerichte regressietests aantonen dat gekozen passages, concepten, importformaat en opgeslagen leesposities behouden blijven.
2. **P1 — Stats opnieuw indelen rond hoeveel en wat gelezen is.** Compacte kop en vandaag-samenvatting; de drie oorspronkelijke cirkels als kern; directe exacte geschiedenis en hervatten. Hifz en planning krijgen duidelijke eigen secties. De stapelbeweging blijft, met dekkende vlakken, bruikbare voorgrondacties en een vlakke reduced-motionstand.
3. **P1 — Leesruimte teruggeven.** Compacte bediening in portrait en landscape; tekst direct in beeld; bron en NL/EN gemakkelijk samen raadplegen. Compacte vink blijft behouden zoals gevraagd. Selecteren, kopiëren, pagina-swipen, beide rails en editie-identiteit moeten samen blijven werken.
4. **P2 — Navigatie en woorden afronden.** Meer groeperen, groepsfeed voorop, beheer apart, heldere rol-/eenheidslabels en contextuele hulp. Geen oorspronkelijke tool verwijderen om een scherm rustiger te maken.
5. **P2 — Dezelfde Arabische identiteit op alle schermen.** Consequente typografie, tussenruimte, papiertinten, cypres en klei, met subtiele geometrie en doelgerichte beweging. Afwerken op lege, gevulde, offline en fouttoestanden; daarna toegankelijkheid en apparaatacceptatie afronden.

## Wanneer de ambitie van 10/10 geloofwaardig wordt

- Een Nederlandstalige gebruiker zonder uitleg vindt hoeveel en wat gelezen is, hervat het boek, opent de juiste NL-vertaling en registreert bewust de juiste passage. Uitgaveselectie en vertaling mogen nooit stilzwijgend inhoud wijzigen.
- De drie oorspronkelijke cirkels, een zelfstandig leesplan, dagdoelen en Hifz tonen hun eigen correcte definities. Exacte geschiedenis is bereikbaar vanuit de samenvatting; nuldata geeft een passende eerste stap.
- Boek/tekst, landscape, selectie, swipe en fullscreen houden dezelfde leespositie. De pagina krijgt de meeste beschikbare ruimte; bediening kan verschijnen zonder dat de tekst van grootte verspringt.
- Twee geïsoleerde accounts voltooien groepen, antwoorden, rollen, media, conceptbehoud, netwerkherstel en uitnodigingen. Nieuwe chatverwachtingen worden apart getest.
- Kleine telefoons, grotere tekst, licht/donker, Arabisch/RTL, TalkBack/VoiceOver en echte Android/iOS-apparaten zijn gecontroleerd. Doelmetingen worden pas als resultaat gerapporteerd na uitvoering.
- Bij een eerste gebruikerstest met 8–12 representatieve lezers meet je tijd, verkeerde afslagen en taakvoltooiing. Voor de vijf kerntaken streven we naar minimaal 90% zelfstandige voltooiing en geen inhouds-/gegevensverlies. Dat is een acceptatiedoel, geen reeds behaalde score of garantie op een 10.

## Bewijs en reikwijdte

De native controle gebruikte één begrensde ronde, inclusief tekstgrootte 1,3× en rotatie; alle aangepaste voorkeuren zijn hersteld. Geen echte gebruikersberichten, accounts of backendgegevens zijn gewijzigd. De bestaande 1.891 runtimebestanden passen nog bij de gebouwde F24-manifesthash. De eerder geslaagde 375 tests en Android-build zijn geen nieuwe testuitvoering van deze audit en bewijzen geen volledige pariteit. Native iOS en volledige geauthenticeerde communityacceptatie blijven open.

De statische Impeccable-detector gaf op 18 bronbestanden nul meldingen. Deze detector is op web gericht; de daadwerkelijke native waarnemingen hierboven blijven leidend. Er was geen browseroverlay of extra server. Lokale volledige verslagen, XML en detectoruitvoer staan onder `.tooling/f25-*`; drie representatieve screenshots zijn hierboven duurzaam aan dit verslag gekoppeld.

Vragen over de gekozen richting zijn overgeslagen op jouw eerdere verzoek om zonder vragen door te werken. Je bestaande prioriteiten — statistieken, Mushaf, complete bronfuncties en moderne Arabische uitstraling — bepalen de volgorde.
