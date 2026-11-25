# Technische appgids: schermen, instellingen, regels en code

Deze gids is de ingang voor iemand die de app wil begrijpen of wijzigen. De [gebruikershandleiding](GEBRUIKERSHANDLEIDING.md) legt de bediening uit. De [live-chathandleiding](LIVE_CHAT_SETUP.md) behandelt de database en serverconfiguratie. De [releasehandleiding](RELEASE_HANDLEIDING.md) behandelt APK, IPA en stores.

Voor benoemde klassen, functies, interfaces en types is er daarnaast een [volledige bronindex](recheck-2026-11-18/CODE_INDEX.md) en een [doorzoekbaar JSON-bestand](recheck-2026-11-18/source-index.json). Die index bevat oorspronkelijke Kotlin, huidige React Native en de Supabase-functions, met paden, regelnummers en bestandshashes. SQL-migraties en SQL-tests zijn op bestandsniveau opgenomen; anonieme callbacks en niet afzonderlijk ontlede native methoden blijven via hun volledige bron bereikbaar. Hij wordt vernieuwd met `npm run docs:inventory`. Een automatische index is geen inhoudelijk testbewijs: daarvoor dienen de [deelcontroles](RECHECK_PLAN_2026-11-18.md) en hun regressietests.

## 1. Hoe de mappen samenwerken

```text
App.tsx
└── src/app                 Providers, hoofdnavigatie en algemene app-opbouw
    └── src/features        De functies die de gebruiker ziet
        ├── screens         Een scherm stelt onderdelen samen
        ├── components      Onderdelen die bij deze functie horen
        ├── hooks           React-besturing en levenscyclus
        └── model/editor    Eigen berekeningen, kopij of editorhelpers waar nodig

src/shared                  Componenten, thema en interactie voor meerdere functies
src/domain                  Regels en berekeningen zonder netwerk of schermbediening
src/services                Netwerk, database, audio, bestanden en platformadapters
src/state                   Appgegevens, mutaties en duurzaam opslaan/herstellen
src/content                 Gebundelde inhoud en gecontroleerde bronkoppelingen
src/i18n                    Interfacekopij per taal en de oorspronkelijke tekstcatalogus
src/migration               Oorspronkelijke Android-gebruikersgegevens inlezen
src/exporting               Het bestaande notitie-exportcontract
src/config                  Configuratie en het samenstellen van de backend
```

**Domain** betekent hier de regels van de app, bijvoorbeeld hoeveel rubs een hizb bevat, welke registraties een leesplan meetelt of wat een onbeoordeelde hifz-score betekent. Zo'n functie krijgt gegevens en geeft een resultaat terug. Zij opent geen scherm, vraagt geen toestemming en benadert geen Supabase-tabel.

**Shared components** staan in `src/shared/components`. Dit zijn algemene bouwstenen zoals knoppen, velden, kaarten en sheets. Een specifieke groepsranglijst blijft in `features/groups/components`. De vroegere brede naam `ui` is zo verdeeld over herkenbare verantwoordelijkheden. Kleine features hoeven geen lege `hooks`- of `model`-map te hebben.

Een Kotlin-klasse wordt niet noodzakelijk één React Native-klasse: een ViewModel kan hier bestaan uit een hook, een pure regelmodule en een service. De betekenis van de functie moet behouden blijven; een identieke klassenaam is daarvoor niet vereist.

Elke hoofdmap heeft een README. Begin bij [src/README](../src/README.md) of [ARCHITECTURE](ARCHITECTURE.md).

## 2. Alle schermen en ingangen

De routes zijn vastgelegd in [navigation/types.ts](../src/app/navigation/types.ts), geregistreerd in [AppNavigator](../src/app/navigation/AppNavigator.tsx) en [MainTabs](../src/app/navigation/MainTabs.tsx). De gebruikersnamen komen uit de taalbestanden; een interne routenaam is niet altijd de tekst op een knop.

| Scherm / interne route                  | Hoofdbestand onder `src/features/`                               | Ingang en verantwoordelijkheid                                                                     |
| --------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Introductie                             | `onboarding/screens/OnboardingScreen.tsx`                        | Voor eerste gebruik en opnieuw afspelen via Instellingen; taal en zes demo-onderdelen.             |
| Stats-start / `Main.Today`              | `home/screens/MainScreen.tsx`                                    | Dagoverzicht, hervatten, kaarten, hifz, planning, leesplan en snelkoppelingen.                     |
| Soera's / `Main.Quran`                  | `quran/screens/QuranScreen.tsx`                                  | Inhoudsopgave, zoeken, onderdelen openen en contextacties.                                         |
| Hizb / `Main.Practice`                  | `practice/screens/ProgressScreen.tsx`                            | Leesstatus, kwartverdeling, onderdeelacties en hifz.                                               |
| Juz / `Main.Juz`                        | `practice/screens/ProgressScreen.tsx`                            | Dezelfde feature met `initialMode="juz"`; geen tweede onafhankelijk voortgangssysteem.             |
| Agenda / `Main.Plan`                    | `planning/screens/PlanningScreen.tsx`                            | Datum, week/maand, geplande items, herinneringen, afronden en leesreis.                            |
| Groepen / `Main.Circle`, `Groups`       | `groups/screens/GroupsScreen.tsx`                                | Je groepen, ontdekken, maken en deelnemen. Twee route-ingangen naar dezelfde functie.              |
| Boeklezer / `Mushaf`                    | `quran/screens/MushafScreen.tsx`                                 | Uitgave, pagina, fullscreen, zoom/pan, selectie, ayahacties en audio.                              |
| Tekstlezer / `Reader`                   | `quran/screens/ReaderScreen.tsx`                                 | Scrollbare aya's, vertaling, hervatten, zoeken en ayahacties.                                      |
| Bibliotheek / `MushafLibrary`           | `quran/screens/MushafLibraryScreen.tsx`                          | Uitgave kiezen, downloaden, hervatten, annuleren en verwijderen.                                   |
| Notities / `Notes`                      | `notes/screens/NotesScreen.tsx`                                  | Context, filters, lijst, editor, preview en volledige export.                                      |
| Focus / `Focus`                         | `practice/screens/FocusScreen.tsx`                               | Sessie-intentie, duur, starten/pauzeren/hervatten/resetten.                                        |
| Statistiekdetails / `Stats`             | `practice/screens/StatsScreen.tsx`                               | Leesringen, registratiedetails, perioden, hifz en wissen van leesdata.                             |
| Dagdoelen / `Goals`                     | `practice/screens/GoalsScreen.tsx`                               | Drie dagelijkse intenties, sessies, gemiste dagen en snelle check-in.                              |
| Zelfstandig leesplan / `ReadingPlan`    | `planning/screens/ReadingPlanScreen.tsx`                         | Hoeveelheid, begin/einddatum, tempo, automatische telling en correctie.                            |
| Checklist / `Checklist`                 | `practice/screens/ChecklistScreen.tsx`                           | Overlappende ayadekking, deelvinkjes, stoppunt en afzonderlijke resets.                            |
| Meldingen / `Notifications`             | `account/screens/NotificationsScreen.tsx`                        | Toestelstatus, lokale herinneringen, stille uren en online groepsvoorkeuren.                       |
| Instellingen / `Settings`               | `account/screens/SettingsScreen.tsx`                             | Taal, thema, patronen, hifz-kleuren, lezen, media en accountlinks.                                 |
| Account / `Account`                     | `account/screens/AccountScreen.tsx`                              | Aanmelden, registreren, herstel, profiel en accountbeheer.                                         |
| Groepsdetail / `Group`                  | `groups/screens/GroupScreen.tsx`                                 | Groepspanelen, rechten, feed, deelnemers, taken, media, evenementen en beheer.                     |
| Groepschat / `GroupChat`                | `groups/screens/GroupChatScreen.tsx`                             | Gesprek over dezelfde groepsposts, invoer, live-invalidatie en typing.                             |
| Woord-/grammaticastudie / `Study`       | `study/screens/StudyScreen.tsx`                                  | Gebundelde woorden, grammatica en vergelijkbare passages, ook bij meerdere canonieke verwijzingen. |
| Externe studiebronnen / `StudySources`  | `study/screens/StudySourcesScreen.tsx`, `StudySourceContent.tsx` | Tafsir, iʿrab en beschikbare asbab-fragmenten, met bron- en passagekeuze.                          |
| Lexicon zoeken / `LexiconSearch`        | `lexicon/screens/LexiconSearchScreen.tsx`                        | Zoek een wortel of lemma.                                                                          |
| Lexicondetail / `Lexicon`               | `lexicon/screens/LexiconScreen.tsx`                              | Woord, grammatica, wortel-/lemmafamilie, Lane-artikelen en vindplaatsen.                           |
| Vergelijkbare passages / `Mutashabihat` | `study/screens/MutashabihatScreen.tsx`                           | Zoeken, juzfilter, broncontext en passage openen.                                                  |
| Boekenlijst / `Books`                   | `study/screens/BooksScreen.tsx`                                  | De meegeleverde studieboeken.                                                                      |
| Boekenlezer / `BookReader`              | `study/screens/BookReaderScreen.tsx`                             | Hoofdstukken, pagina's en zoeken in boektekst.                                                     |

**Meer** is een sheet van `src/app/navigation/NavigationDock.tsx`, geen apart schermbestand. Hetzelfde catalogusbestand `dockDestinations.ts` stuurt zowel de onderbalk als de selectielijst aan. Maximaal drie bestemmingen staan vast; de gewone Meer-lijst toont de overige bestemmingen.

De uitgebreide audioplayer, aya-acties, check-in, detailgrafieken en diverse editors zijn sheets/componenten binnen bovenstaande schermen. Het zijn wel functies die gecontroleerd moeten worden, maar geen extra stackroute. De globale minispeler, focustimer en downloadvoortgang worden door providers/appcompositie toegevoegd.

## 3. Alle persistente appvoorkeuren

Het hoofdcontract is `Preferences` in [state/models.ts](../src/state/models.ts). Onderstaande standaardwaarden gelden voor een nieuwe installatie; migratie en bestaande gegevens kunnen andere waarden opleveren.

| Sleutel(s)                                          | Standaard / betekenis                                                                                               | Bedieningsplek                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `language`                                          | `nl`; Nederlands, Engels of Arabisch.                                                                               | Introductie en Instellingen.                                                   |
| `theme`                                             | `system`; oorspronkelijke kleurthema's plus systeemkeuze.                                                           | Instellingen.                                                                  |
| `cardPatterns`                                      | `true`; kaartornamenten en decoratieve watermerken.                                                                 | Instellingen.                                                                  |
| `hifzColorsEnabled`                                 | `true`; alleen kleurpresentatie, geen wijziging van scores.                                                         | Instellingen.                                                                  |
| `translation`                                       | `nl`; Nederlands, Engels of uit.                                                                                    | Lezer en Instellingen.                                                         |
| `arabicFontSize`                                    | `30`; begrensd op 20–54.                                                                                            | Tekstlezer en Instellingen.                                                    |
| `reciterId`                                         | `1`; keuze uit de oorspronkelijke soeracatalogus.                                                                   | Media-/reciteurkeuze.                                                          |
| `audioPlaybackSpeed`                                | `1`; 0,75/1/1,25/1,5/1,75/2.                                                                                        | Audioplayer/media.                                                             |
| `audioSkipIntervalSeconds`                          | `10`; 5 of 10 seconden.                                                                                             | Audioplayer/media.                                                             |
| `audioRepeatEnabled`                                | `false`; huidige track herhalen.                                                                                    | Audioplayer/media.                                                             |
| `audioAutoplayEnabled`                              | `true`; verder met de volgende track.                                                                               | Audioplayer/media.                                                             |
| `audioRepeatHafsReciter`                            | `alafasy`; Hafs-bereikherhaling.                                                                                    | Herhaalinstellingen.                                                           |
| `audioRepeatWarshReciter`                           | `aldosari_warsh`; Warsh-bereikherhaling.                                                                            | Herhaalinstellingen.                                                           |
| `audioRepeatRounds`                                 | `2`; aantal rondes, inclusief eerste afspeling.                                                                     | Herhaalinstellingen.                                                           |
| `bookPresentation`                                  | `selectable`; selecteerbare boektekst of originele weergave.                                                        | Leesmenu, afzonderlijk van Bladeren/Selecteren.                                |
| `mushaf`                                            | `hafs_ayahinfo_1260`; tekst of een ondersteunde uitgave.                                                            | Leesmenu, bibliotheek en Instellingen.                                         |
| `onboardingComplete`                                | `false`; reguliere app is beschikbaar na de introductiekeuze.                                                       | Door introductie/migratie beheerd.                                             |
| `onboardingStep`                                    | `language`; hervatbare introductiestap.                                                                             | Door introductie beheerd.                                                      |
| `reminderEnabled`, `reminderHour`, `reminderMinute` | `false`, 20, 0; behouden hoofdstatevelden voor compatibiliteit. Actuele uitgebreide meldingsvoorkeuren staan apart. | Herstel/compatibiliteit; niet verwarren met alle huidige meldingsinstellingen. |
| `displayName`                                       | Leeg; lokaal bewaarde weergavenaam. Het online profiel heeft daarnaast een eigen servicecontract.                   | Account-/profielcontext.                                                       |
| `dockDestinations`                                  | Stats, Mushaf, Groepen; maximaal drie.                                                                              | Meer → Selecteren.                                                             |

Een onbekende opgeslagen waarde mag de app niet laten crashen. Decoder-/migratiecode bepaalt de terugval en welke herstelmelding verschijnt. Verander een opgeslagen veldnaam niet alleen omdat een nieuwe naam mooier klinkt; daarvoor is compatibel herstel nodig.

### Instellingen met een eigen opslagcontract

| Contract                   | Velden en betekenis                                                                                                                                                                              | Verantwoordelijke code                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Lokale meldingen           | `enabled`, `daily`, `dailyMinute`, `extra`, `extraMinute`, `planning`, `quiet`, `quietStart`, `quietEnd`. Minuten zijn 0–1439 vanaf middernacht; stille uren mogen over middernacht lopen.       | `domain/notificationPreferences.ts`, `services/notifications/localReminders.ts`.      |
| Online meldingscategorieën | `enabled`, `mention`, `reaction`, `announcement`, `invitation`, `join_request`, `update`. Een voorkeur betekent niet dat iedere categorie al een pushproducer heeft.                             | `services/backend/types.ts`, NotificationsScreen en serverfuncties.                   |
| Groepsspecifieke push      | `level`, `pushEnabled`, `mutedUntil`, `updatedAt`.                                                                                                                                               | `GroupPushPreferences` en groepsadapter.                                              |
| Apparaatregistratie        | Installatie-ID, native token, platform, enabled, tijdzone, taal en stille uren. APNs-omgeving is één globale functionsecret, geen toestelveld. Zie [iOS-pushinrichting](IOS_PUSH_SETUP.md).      | `services/notifications/pushDevice.ts` en server-RPC.                                 |
| Profielcache               | Per account-ID opgeslagen eigen naam/foto; online custom profiel → lokale custom kopie → providergegevens. Uitloggen behoudt de kopie; succesvolle accountverwijdering ruimt deze op.            | `services/profiles/profiles.ts`.                                                      |
| Planningmeldingenlogboek   | `wirdna:plan-reminder-submissions:v1`; reservering vóór OS-submission voorkomt herhaling. Nooit-ingediende plannen kunnen binnen 12 uur worden ingehaald; pre-logboekhistorie wordt niet gegokt. | `services/notifications/planningReminderLedger.ts`.                                   |
| Zelfstandig leesplan       | Planhoeveelheid, eenheid, start, eventuele einddatum en handmatige correctie.                                                                                                                    | `services/planning/independentReadingPlan.ts`.                                        |
| Checklist                  | Ayadekking en apart stoppunt.                                                                                                                                                                    | `domain/checklist.ts`, ChecklistScreen en state.                                      |
| Groep                      | Naam, omschrijving, doelen, privacy, taal, logo, lidrechten, rollen en notificatievoorkeuren.                                                                                                    | Groepspanelen en `services/groups/groupOperations.ts`; serverrechten zijn beslissend. |
| Tijdelijke leesbediening   | Zoom, actieve selectie, fullscreen, geopend panel en sleepvoorbeeld. Dit is niet allemaal een blijvende gebruikersvoorkeur.                                                                      | Mushaf/Reader-hooks en `app/providers/AppChromeContext.ts`.                           |

## 4. Regels die bij wijzigingen behouden moeten blijven

| Regel                                                                                                                                                                         | Waar controleer je dit?                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Soera/juz/hizb/rub hebben vaste aantallen en gecontroleerde ayabereiken.                                                                                                      | `domain/quran.ts`, `quranNavigation.ts`, `content/`.                             |
| Een volledige hizb-check-in schrijft één hizbgeschiedenis en werkt vier rubs bij; losse rubs vormen geen nieuwe volledige hizbgeschiedenis.                                   | `domain/quickCheckIn.ts`, `hizbAnalytics.ts`, `state/reducer.ts`.                |
| Een herhaalde bewuste check-in telt opnieuw; een retry van dezelfde opslagopdracht mag niet verdubbelen.                                                                      | Check-in request-ID, `usePracticeSave`, reducer en persistence.                  |
| Hifz 0 is onbeoordeeld; indelingen zijn onafhankelijk; leesacties veranderen de beoordelingsdatum niet.                                                                       | `domain/hifz.ts`, `hifzPresentation.ts`, reducer.                                |
| Een leesteller, registratieverdeling, ayadekking en hifzgemiddelde zijn verschillende grootheden.                                                                             | `domain/statistics.ts`, `readingMetrics.ts`, ReadingStatisticsOverview.          |
| Het paginavinkje hoort bij account, uitgave en pagina; uitvinken verwijdert zijn eigen bijdrage, geen oude historie.                                                          | `domain/mushafReading.ts`, pagina-acties en reducer.                             |
| Checklistvinkjes gebruiken gedeelde ayadekking; een stoppunt is een aparte handeling en maakt geen leesgeschiedenis.                                                          | `domain/checklist.ts`.                                                           |
| Een historisch dagdoel gebruikt zijn opgeslagen eenheid; verschuiven/verdelen/overslaan blijft zichtbaar.                                                                     | `domain/goals.ts`, `goalRegistration.ts`, GoalsScreen.                           |
| Het leesplan telt registraties vanaf zijn start, inclusief herhalingen; minuten zijn geen hoeveelheid. Correctie verandert alleen het plan.                                   | `domain/readingPlan.ts`, `services/planning/independentReadingPlan.ts`.          |
| Agenda-items met verschillende intenties worden niet als hetzelfde item samengevoegd. Afronden wist een oude herinnering; ongedaan maken plant die niet stilzwijgend opnieuw. | `domain/planning.ts`, PlanningScreen, remindercoördinator.                       |
| Persoonlijke kalenderdagen volgen lokale tijd; groepsdagaggregatie volgt het bestaande SQL/UTC-contract.                                                                      | `domain/localDate.ts`, `services/groups/groupProgressReader.ts`, server-RPC.     |
| De mushafafbeelding en selectiegebieden moeten dezelfde uitsnede/vergroting gebruiken.                                                                                        | `content/mushafGeometry.ts`, PrintedMushafPage en PDF-cropservice.               |
| Een ongekarteerde PDF krijgt geen verzonnen pagina-naar-ayah- of woordkoppeling.                                                                                              | `domain/readingContext.ts`, `bookPresentation.ts`, mushafcontent.                |
| Een samengestelde gedrukte Warsh-aya kan meerdere canonieke verwijzingen hebben; tekst, grammatica, delen en audio moeten die context behouden.                               | Warsh-bronmetadata, `domain/study.ts`, StudyScreen, herhaalselectie.             |
| Bladeren/Selecteren verandert de interactie; de oorspronkelijke/selecteerbare boekweergave is een aparte keuze.                                                               | MushafScreen, `domain/bookPresentation.ts`.                                      |
| Een contextuele woordgloss is geen volledige aya-vertaling en geen woordenboekartikel.                                                                                        | `content/translations.ts`, `services/lexicon/`, LexiconScreen.                   |
| Trackherhaling verschilt van een herhaalde ayareeks. Rondes omvatten de eerste afspeling.                                                                                     | `domain/repeat.ts`, `services/audio/repeatSelection.ts`, AudioProvider.          |
| Reciteurwisselen bij dezelfde soera behoudt tijd en pauzestand. Herstel na een audiofout gebruikt de laatst bevestigde positie.                                               | AudioProvider en audioplaybackregressies.                                        |
| Export bevat alle opgeslagen notities met oorspronkelijke scopes en opmaak, niet alleen de huidige filterresultaten.                                                          | `exporting/notesExport.ts`, `features/notes/hooks/useNoteEditor.ts`.             |
| Een mislukte notitieopslag mag het concept niet sluiten of nieuwe invoer overschrijven.                                                                                       | `useNoteEditor.ts`, `state/persistence/snapshotWriter.ts`.                       |
| De introductie schrijft uitsluitend introductievoorkeuren; demo-interactie maakt geen echte registraties of groepsposts.                                                      | `features/onboarding`, `domain/onboarding.ts`.                                   |
| Gebruikersnamen, groepsnamen en inhoud worden letterlijk weergegeven; alleen expliciete interfacekopij wordt vertaald.                                                        | `shared/components`, `i18n`, `translate={false}` waar toepasselijk.              |
| Een oudere mislukte sessieaanvraag mag een nieuwere aangemelde sessie niet overschrijven.                                                                                     | Account-/groepsauth-hooks en authservice.                                        |
| De server autoriseert iedere groepsactie; het verbergen van een knop is geen beveiliging.                                                                                     | Groepsservices, SQL-RPC/RLS en negatieve rechtencontroles.                       |
| Realtime is een signaal om geautoriseerd opnieuw te lezen. Typing is een afzonderlijk privéprotocol, zonder concepttekst.                                                     | `groupFeedController`, `groupFeedSubscription`, `groupTyping*`, LIVE_CHAT_SETUP. |
| Een pushsignaal, lokale herinnering en zichtbaar groepsbericht hebben elk hun eigen levenscyclus.                                                                             | `services/notifications/`, server `group-push` en meldingscoördinatoren.         |

## 5. Services en gegevensstromen

| Map                      | Verantwoordelijkheid en belangrijkste toegang                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `services/backend`       | Backendcontract, Supabase-adapter en gedeelde typen. Configuratie wordt door `config/runtime.ts` samengesteld.                    |
| `services/auth`          | Sessies, accountgebonden wachtwoord/e-mailacties, Google/Apple, callbacks, PKCE/crypto en Apple-verwijdering.                     |
| `services/profiles`      | Profielvelden, avataropslag en accountgerelateerde externe acties.                                                                |
| `services/groups`        | CRUD/RPC, gepagineerde lezingen, feedsnapshots, chat, realtime, typing, uitnodigingslinks en accountgebonden concepten.           |
| `services/audio`         | Catalogus, wachtrij, selectie, audio-URL's en cache/downloads. De React-playerlevenscyclus staat in de audiofeature.              |
| `services/mushaf`        | Bibliotheek, gecontroleerde bestanden, downloads, native achtergrondwerk, PDF-uitsnede en selecteerbare Hafs/Warsh-bronnen.       |
| `services/lexicon`       | Read-only QAC/Lane-databases, normalisatie, query's en expliciete bronkoppelingen.                                                |
| `services/notifications` | OS-toestemming, lokale planning, pushregistratie, deduplicatie, dempen, stille uren en notificatierouting.                        |
| `services/planning`      | Zelfstandig leesplan opslaan en herstellen.                                                                                       |
| `services/storage`       | Platformopslag, beveiligde sessieopslag, assetdatabases en notitiebestanden delen.                                                |
| `services/study`         | Externe tafsir/iʿrab/asbab-providers, validatie en verzoekidentiteit om oude resultaten niet over een nieuwe keuze heen te tonen. |

Een gewone gegevensstroom is: scherm → hook/actie → pure validatie/berekening → opslag- of netwerkservice → resultaat/state → scherm. Een achtergrondprovider houdt bijvoorbeeld downloads of audio in leven wanneer het oorspronkelijke scherm wordt gesloten.

`dispatch()` verandert de appstate en plant opslag. `commit()` laat een formulier wachten op bevestigde lokale opslag. De snapshotwriter bundelt tussentijdse opdrachten en bewaart schrijfvolgorde. Hij splitst nog niet alle grote archieven in afzonderlijke databestanden; dat blijft een schaalbaarheidskeuze, geen reeds uitgevoerde databaseherbouw.

Persoonlijke gegevens zijn lokaal; online groepsgegevens zijn een apart contract. Supabase vervangen door een andere server betekent nieuwe adapters en migratie van servergedrag. Alleen een URL aanpassen is daarvoor niet voldoende. Een VPS met dezelfde diensten kan wel veel bestaande contracten behouden.

Aanvullende grenzen uit de tweede controle:

- `auth/accountMutation.ts` voert een wachtwoord- of e-mailwijziging uit met de vastgelegde accountidentiteit. Een accountwissel tijdens de aanvraag mag de andere account niet wijzigen. Alleen de PKCE-verifier wordt met de normale callbackopslag gedeeld; deze tijdelijke client vervangt de actieve sessie niet.
- `auth/appleIdentity.ts`, de platformadapters en `appleAccountDeletion.ts` houden native Apple-credentials binnen services. De afzonderlijke Supabase-function controleert actor, Apple-identiteit, nonce en verwijdervoorwaarden. De [Apple-handleiding](APPLE_SIGN_IN_SETUP.md) beschrijft configuratie, intrekken van toegang en de beperkte handmatige route.
- De profielcache hoort bij één account en bevat alleen de eerder opgehaalde profielgegevens. Een netwerkfout mag geen standaardnaam over een bestaande naam heen schrijven.
- `notifications/planningReminderLedger.ts` bewaart welke eenmalige agendamelding al bij het OS is aangeboden. Nog niet aangeboden meldingen kunnen binnen twaalf uur worden ingehaald. Onzekere eerdere bezorging wordt onderdrukt; een wijziging van stille uren mag dezelfde gebeurtenis niet opnieuw bezorgen. De eerste upgrade gebruikt een voorzichtige baseline, omdat oude OS-bezorgingen niet volledig achteraf zijn vast te stellen.
- Dagelijkse terugkerende meldingen blijven door het OS beheerd. De schakelaar voor lokale leesherinneringen overschrijft de online groepspushkeuze niet. iOS-provisional toestemming is bruikbaar voor stille bezorging; dat is iets anders dan geweigerde toestemming.
- Alleen reproduceerbare iOS-kopieën van de QAC-/Lane-brondatabases staan in de cachelocatie. Persoonlijke gegevens en het oorspronkelijke importcontract blijven buiten deze wijziging.

## 6. Inhoud, import en platformcode

- `assets/` bevat runtimebestanden; `data/` bronmateriaal/provenance; `scripts/` voorbereiding en verificatie. Gegenereerde inhoud is geen overbodige appcode.
- De oorspronkelijke Koran, NL/EN-vertalingen, grammatica, illustraties en boekinhoud worden op gelijkheid met Kotlin gecontroleerd. Een nieuw interfaceontwerp is geen reden om die inhoud te herschrijven.
- `migration/legacyAndroid.native.ts` leest bestaande Android-data alleen bij een geschikte in-place update en afwezige RN-state. Het oorspronkelijke import-/exportschema wordt niet aangepast om een UI-probleem op te lossen.
- `.native.ts`, `.web.ts` en algemene `.ts`-bestanden zijn bewuste platformvarianten. Verwijder ze niet omdat namen op elkaar lijken.
- `plugins/` bevat de bijgehouden native uitbreidingen. `android/` en `ios/` zijn gegenereerde projecten. Native pluginwijzigingen vereisen opnieuw bouwen; Fast Refresh voert alleen JavaScript/TypeScript-wijzigingen door.
- Android-gesture- en PDF-werkers bewijzen geen gelijke iOS-native implementatie. De actuele iOS-grenzen moeten vóór de store-release op Apple-hardware worden gecontroleerd.

## 7. Praktisch wijzigen en controleren

1. Zoek de functie in de schermtabel en lees de README van de feature.
2. Zoek de bijbehorende gedragsregel en service. Wijzig gedeelde regels niet uitsluitend binnen één scherm.
3. Voeg bij een echte gedragsfout een regressie toe die vóór de reparatie faalt en het gebruikerscontract controleert.
4. Gebruik `npm run verify` voor TypeScript, ESLint en de tests; `npm run format:check` voor opmaak.
5. Controleer de relevante native interactie wanneer gebaren, toetsenbord, audio, downloads of platformcode wijzigen.
6. Werk handleiding en bronmapping bij als de bediening of verantwoordelijkheid verandert. Draai `npm run docs:inventory` voor actuele vindplaatsen.
7. Bouw met de [releaseopdrachten](RELEASE_HANDLEIDING.md) en vermeld afzonderlijk wat lokaal getest, native gezien en extern ingericht is.

De code-index maakt iedere opgenomen klasse en benoemde functie vindbaar. De deelrapporten leggen uit welke oorspronkelijke gedragingen zijn vergeleken, welke verschillen zijn hersteld en waar aanvullende platform- of cloudacceptatie nodig blijft. Een hoog testenaantal vervangt die inhoudelijke beoordeling niet.
