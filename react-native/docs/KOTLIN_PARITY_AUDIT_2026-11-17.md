# Kotlin → React Native: controle van alle 21 onderdelen

**Vervolg:** de hieronder beschreven auditbevindingen zijn daarna geïmplementeerd en gecontroleerd. Zie het [uitvoeringsverslag](PARITY_IMPLEMENTATION_2026-11-17.md) voor de huidige stand, builds en resterende platform-/cloudacceptatie. Dit auditdocument blijft de historische situatie vóór de herstelronde beschrijven.

Gecontroleerd op 17 november 2026. **De oorspronkelijke inhoud is grotendeels aantoonbaar behouden, maar de React Native-app is nog niet functioneel gelijkwaardig aan de Kotlin-app.** Er zijn concrete navigatie-, registratie-, audio- en interfaceverschillen. Een aanwezige route, broncatalogus of groene test is geen bewijs dat de volledige gebruikershandeling correct is overgenomen.

## Werkwijze en begrenzing

De aangeleverde lijst van 21 onderdelen is vergeleken met de lokale Kotlin-bron en de huidige React Native-werkmap. De Kotlin-basis is git-commit `4428ece9b5c9ce15b75a86fbe972e8209e1b0df1`, 14 oktober 2026. De 124 Kotlin-bestanden onder `app/src/main` omvatten 43.599 regels; die bestanden en de oorspronkelijke acquisitiescripts wijken niet af van HEAD. De eerdere inventaris van 198 Kotlin-bestanden heeft een ruimere scope, waaronder andere source sets; die telling is geen bewijs van 198 volledig geteste appmodules.

Drie onafhankelijke reviews behandelden lezer/audio/studie, tracking/planning en community/account. De hoofdreview behandelde introductie/talen/inhoud, controleerde de belangrijkste bevindingen tegen beide implementaties en reproduceerde meerdere verschillen met de echte RN-functies/componentcallbacks. De huidige appcode, imports, exportimplementatie, gebruikersgegevens en cloudconfiguratie zijn niet veranderd. Alleen auditdocumentatie en geïsoleerde controlebestanden zijn toegevoegd.

Betekenis van de oordelen:

- **Aanwezig:** bereikbare bediening en bijbehorende logica zijn in de bron teruggevonden. Dit betekent niet automatisch native of online volledig getest.
- **Gedeeltelijk:** de hoofdfunctie bestaat, maar concrete bediening, informatie of gedrag ontbreekt of wijkt af.
- **Bewust anders:** een latere expliciete gebruikerswens gaat voor exacte overname van de oude bediening.
- **Niet bewezen:** platform-, provider- of serverwerking is niet door deze controle vastgesteld.

## De 21 onderdelen

| Nr. | Onderdeel | Bevinding |
|---:|---|---|
| 1 | Mushaf, Hafs/Warsh, uitsnedes | **Gedeeltelijk.** Editiebibliotheek, originele pagina's, PDF en selecteerbare boektekst bestaan. De actieve vaste Maknoon-vergrotingen en algemene PDF-uitsnedes ontbreken. Originele Hafs Maknoon-selectiestroken ontbreken; Unicode-tekst is daarvoor een alternatieve weergave. De actieve RN-keuze Muhammadi zoekt bovendien een verkeerde assetnaam en toont daardoor geen van de 638 meegeleverde pagina's. |
| 2 | Soera/hizb/juz/rub en zoeken | **Gedeeltelijk.** Navigatie bestaat, maar 56 van 240 Warsh-rubbestemmingen verschillen van de gecontroleerde oude starts; 18 gaan naar een andere pagina. Zoeken in alle Quran-verzen ontbreekt: de hoofdlijst zoekt namen/nummers, de tekstreader zoekt alleen binnen de geopende soera. |
| 3 | Selectie, ayahacties, bladwijzers, positie | **Gedeeltelijk.** Acties en opgeslagen posities bestaan. Bij samengevoegde Warsh-verwijzingen gebruiken kopiëren/delen/woorddetails alleen het eerste canonieke vers. Afzonderlijke hervatposities per soera zijn vervangen door een globale cursor en pagina per editie. Selectiemodus is een later gevraagde wijziging. |
| 4 | Registreren en opnieuw lezen | **Gedeeltelijk.** Nieuwe lezingen tellen opnieuw; verwijderen bestaat. Soera heeft de oude count/markeer-opnieuw/verwijder/annuleer-flow. Juz en rub gebruiken bulkselectie in plaats van dat dialoogvenster. Het later gevraagde paginavinkje blijft een aparte, bewuste toggle. |
| 5 | Hifz-scores en bereik | **Gedeeltelijk.** Onafhankelijke scores, 0 = onbeoordeeld, 0–100-slider en bereik zijn aanwezig. De aan/uit-instelling voor hifz-kleuren en overeenkomstige kaarttinten ontbreken. Gewoon lezen wijzigt bovendien de beoordelingsdatum van een beoordeelde soera/juz en daarmee het herhaaladvies. |
| 6 | Snelle check-in | **Gedeeltelijk.** Alle vier typen, kwartkeuze, meerselectie en één hizbregistratie plus vier rubmarkeringen bestaan. De oude vergrendeling tijdens opslaan, bevestiging na duurzame opslag en foutafhandeling in het dialoog ontbreken. |
| 7 | 60-hizboverzicht | **Aanwezig in bron en domeintests.** Periodefilters, nulwaarden, selectie, horizontaal scrollen en uitklappen bestaan. Vier losse rubregistraties worden niet tot een hizbregistratie samengevoegd. Bij een volledig lege periode tonen beide apps een lege-melding. |
| 8 | Statistieken en doorklikbare ringen | **Grotendeels aanwezig.** Registratieringen, legenda, detailfilters, openingswoorden, hoeveelheden, hifzgemiddelde, historie en reset bestaan. De weekactiviteit telt in RN alleen lezen; Kotlin telt daar alle geschiedenisacties. Exacte native interacties zijn niet allemaal opnieuw getest. |
| 9 | Tahajjud-checklist | **Aanwezig.** Gedeelde ayahdekking, gedeeltelijk/volledig, onafhankelijk stoppunt, hervatten, readerlinks en afzonderlijke resets zijn teruggevonden. Geen concrete ontbrekende functie vastgesteld. |
| 10 | Focus | **Aanwezig, met bewuste fullscreenuitzondering.** Intenties, tijden, eigen duur, pauzeren/hervatten/reset, afronding en zwevende timer zijn aanwezig. Fullscreen verbergt de bediening conform de latere gebruikerswens; de timer blijft in zijn provider bestaan. |
| 11 | Dagdoelen en leesreis | **Gedeeltelijk.** Drie doelen, carry/spread/skip en doelafhankelijke leesreis bestaan. Verschillende intenties voor hetzelfde onderdeel/datum worden in planning onterecht samengevoegd. Registraties vanuit Doelen krijgen kunstmatig 12:00 als tijd. |
| 12 | Mijn leesplan | **Kern aanwezig; koppeling heeft een fout.** Alle eenheden, optional einddatum, herhaalde lezingen, correcties en afzonderlijke opslag bestaan. Een plan gestart na 12:00 kan latere doelregistraties missen door de tijdsfout bij punt 11. |
| 13 | Agenda | **Gedeeltelijk.** Week/maand, datums, plannen, statussen, done/undo/delete, doelen en herinneringen bestaan. Nu/+30 minuten/vanavond ontbreken. Dezelfde-intentiecontrole verschilt tussen UI en reducer. Direct afronden bewaart de herinneringstijd, waardoor ongedaan maken die later weer kan activeren. |
| 14 | Audioplayer | **Gedeeltelijk.** Centrale speler, snelheden, seek, autoplay, trackloop en slaaptimer bestaan. Reciteur wisselen begint opnieuw en hervat ook een gepauzeerde track. Sommige mini-controls/metadata zijn alleen uitgebreid of niet zichtbaar; omhoog swipen om uit te klappen ontbreekt. |
| 15 | Audioherhaling | **Gedeeltelijk.** Pagina-/ayahbereiken, herhaalrondes en Hafs/Warsh-reciteurs bestaan. De expliciete huidige-pagina/hele-soera-keuzen en oude defaults zijn vervangen door handmatige bereiken. Originele Hafs Maknoon mist paginaherhaling; Warsh-invoer gebruikt andere versnummering. Willekeurige PDF-pagina's worden terecht niet ongemerkt aan canonieke ayahs gekoppeld. |
| 16 | Notities | **Gedeeltelijk.** Alle vijf scopes, editor, opmaak, zoeken/filteren/mappen/tags/pins en export van alle notities bestaan. Contextlinks vanuit juz/hizb/soera ontbreken en maken ook de onderliggende-notitiesfilter daar slecht bereikbaar. Exportvolgorde wijkt af; de editor sluit vóór bevestigde opslag. |
| 17 | Groepen en ranglijsten | **Gedeeltelijk.** Groepen, feed, leden, media, taken, evenementen, reacties/edit/pin, ranglijst en leesdetails bestaan. Oude dashboardtotalen, actieve-leden/streakweergave en gerealiseerde groepsdoelvoortgang zijn verminderd of ontbreken. Uitgaande links zijn alleen custom-scheme; save-and-share kan zonder postrecht worden aangeboden. |
| 18 | Notificaties | **Gedeeltelijk.** Dagelijks/extra/agenda/stille uren, categorieën en groepsvoorkeuren bestaan. De shortcut naar Android-meldingsinstellingen en actuele systeem-/kanaalstatus ontbreken. Gehoste Realtime/typing en daadwerkelijke FCM/APNs-aflevering zijn niet met deze broncontrole bewezen. |
| 19 | Vertaling en studie | **Aanwezig, met gedeeltelijke Asbab-bediening.** NL/EN, acht tafsirbronnen, mutashabihat, iʿrab, Asbab en zeven fiqhboeken zijn teruggevonden. Asbab valideert bronbeschikbaarheid, maar mist de oude uitsluitend-beschikbare keuzelijsten en voorwaardelijke actieweergave. Remote bronnen/native boekflows zijn niet opnieuw end-to-end getest. |
| 20 | Introductie, talen, uiterlijk/media | **Gedeeltelijk.** Drie talen, zes afzonderlijke demo's, checkpoint en replay bestaan. Tien oude kleurvarianten ontbreken; appbrede RTL is gedeeltelijk. Een oudere gebruiker met alleen voorkeuren en zonder stageflag kan introductie opnieuw krijgen. Audio-instellingen missen naam-/riwayafilter en kiezen-zonder-starten. |
| 21 | Account en persoonlijke gegevens | **Aanwezig in bron, met gewijzigde registratie.** E-mail/Google/sign-out/herstel/wijzigingen/profiel/avatar/verwijdercontrole bestaan. De dubbele wachtwoordinvoer bij registratie is verdwenen. Persoonlijke gegevens blijven lokaal; inloggen synchroniseert ze niet automatisch. Echte Google-, verwijder- en toesteltests zijn hiermee niet volledig afgedekt. |

## Bevestigde fouten die eerst moeten worden aangepakt

### 1. Warsh-bestemmingen en samengevoegde ayahs

De Warsh-startdata zijn aanwezig en bytegelijk aan Kotlin, maar de actieve RN-rubnavigatie gebruikt algemene Hafs-startpunten. Met **de echte `findMushafAyah`-functie** zijn alle 240 targets gecontroleerd: 56 verschillen, waaronder 18 andere pagina's. Voor rub 40 gaat RN naar pagina 100/gedrukt vers 134; de oude gevalideerde Warsh-start is pagina 99/gedrukt vers 129.

Daarnaast zijn de echte callbacks van `AyahActionsSheet` geïsoleerd uitgevoerd met native clipboard/share vervangen. De eerste gedrukte Warsh-ayah op pagina 1 correspondeert met twee canonieke verzen. De sheet toont beide, maar copy/share bevat alleen het eerste; woorddetails openen ook alleen het eerste.

Bronnen: [oude Warsh-lookup](../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt), [RN-navigatie](../src/features/quran/screens/QuranScreen.tsx), [RN-geometrie](../src/content/mushafGeometry.ts), [ayahacties](../src/features/quran/components/AyahActionsSheet.tsx). [Uitkomst echte RN-proeven](parity-2026-11-17/parity-2026-11-17-reader-probes.json), [alle 240 vergelijkingen](parity-2026-11-17/parity-2026-11-17-warsh-rubs.json).

### 2. Onafhankelijke plannen worden weggefilterd

De plannings-UI accepteert lezen, hifz en herhalen van hetzelfde onderdeel op dezelfde dag als verschillende sessies. De reducer laat `goalId` weg uit zijn duplicaatsleutel. In de proef met drie intenties `[1,2,3]` bleef alleen `[1]` over, terwijl de UI daarna een opgeslagen-melding kan geven.

Bronnen: [PlanningScreen](../src/features/planning/screens/PlanningScreen.tsx), [reducer](../src/state/reducer.ts), oude `data/GoalRepository.kt:154`. Dit betreft onterecht niet toevoegen van een plan, niet het verwijderen van bestaande andere plannen.

### 3. Doelregistratie krijgt een verkeerde tijd

Een leesplan gestart om 14:00 telt een registratie van 18:00 niet mee wanneer Doelen deze op 12:00 opslaat. Dezelfde registratie met de werkelijke tijd telt wel. Dit raakt ook de volgorde van registraties op dezelfde dag. Dagdoelen blijven de registratie via de datum tellen; het is geen universeel verlies van de lezing.

Bronnen: [GoalsScreen](../src/features/practice/screens/GoalsScreen.tsx), [leesplanberekening](../src/domain/readingPlan.ts), oude `data/GoalRepository.kt:144`. [Proefuitkomsten voor planning/tijd/hifz](parity-2026-11-17/parity-date-tracking-probe.json).

### 4. Opslaan wordt te vroeg als klaar behandeld

Quick check-in en notities sluiten of melden succes direct na `dispatch`. De echte AsyncStorage-opslag gebeurt later. Kotlin wacht in deze flows op de databasewrite. Er is in RN wel een globale opslagfout met retry; die herstelt niet de oorspronkelijke flow waarbij het formulier bij een fout openblijft. De check-in maakt bovendien bij elke handleraanroep een nieuwe request-ID. De bestaande test met tweemaal dezelfde request-ID bewijst daarom geen bescherming tegen dubbel tikken.

Bronnen: [QuickCheckInSheet](../src/features/practice/components/QuickCheckInSheet.tsx), [notitie-editor](../src/features/notes/hooks/useNoteEditor.ts), [store](../src/state/store.tsx). Dit is bronbewijs; er is in deze audit geen echte volle-schijf- of fysieke dubbelkliktest op het gebruikertoestel uitgevoerd.

### 5. Reciteur wisselen verliest positie en pauzestand

De bestaande providerharness is hergebruikt met de **echte `AudioProvider`**. Voor wisselen: 45 seconden, gepauzeerd. Na dezelfde `play(replacement)`-aanroep als de reciteurselector: 0 seconden en afspelen hervat. Kotlin `replaceCurrentTrack` bewaart de tijd en ontvangt de gewenste speel/pauzestand.

Bronnen: [ReaderScreen](../src/features/quran/screens/ReaderScreen.tsx), [AudioProvider](../src/features/audio/providers/AudioProvider.tsx), oude `ui/GlobalAudioPlayer.kt:445` en `MainActivity.kt:379`. [Uitkomst](parity-2026-11-17/parity-2026-11-17-audio-probe.json). Geen echte audio/netwerkaflevering geclaimd.

### 6. Lezen verandert hifz-herhaaladvies

Bij een beoordeelde soera/juz verandert gewone leesregistratie `lastUpdated`; het herhaaladvies interpreteert dat als de beoordelingsdatum. In de proef bleef de score 30, maar veranderde het advies van twee dagen te laat naar over één dag. Kotlin houdt bij een bestaande beoordeling die datum ongewijzigd wanneer alleen lezen wordt geregistreerd. Numeriek dezelfde score is dus onvoldoende om de twee functies onafhankelijk te houden.

### 7. Groepsbediening en getoonde gegevens

De oude groepsvoortgang toont gerealiseerd versus doel, actieve leden, streaks en meer totalen. RN berekent een deel daarvan maar toont ze niet. Dit is een echte vermindering bovenop de reorganisatie van acht tabs naar tabs plus een hulpmenu.

Verder krijgt iemand met `progress.create` maar zonder `post.create` toch de optie opslaan-en-delen. De gedeelde serverfunctie weigert dat terecht en draait de transactie terug. Dit is een verkeerd aangeboden actie, geen doorbraak van toegangsrechten. Uitgaande uitnodigingen gebruiken alleen `qurantracker://`; Kotlin deelde HTTPS-links met app-/webbestemming.

Bronnen: [GroupProgressPanel](../src/features/groups/components/GroupProgressPanel.tsx), [GroupScreen](../src/features/groups/screens/GroupScreen.tsx), [groupMetrics](../src/services/groups/groupMetrics.ts), [gedeelde SQL-controle](../../supabase/migrations/20260904230000_group_detail_v2_app_api.sql). De volledige verschillen en lagere prioriteiten staan in [community/account](parity-2026-11-17/community-account.md).

### 8. Muhammadi-bestanden aanwezig, maar niet weergegeven

Bij de laatste hoofdcontrole is de werkelijke `PrintedMushafPage`-renderfunctie uitgevoerd met de werkelijke gegenereerde assetmap. De map bevat `hafs` en `muhammadi`; de component zoekt voor Muhammadi naar `warsh`. Voor **alle 638 aanwezige Muhammadi-pagina's** verschijnt daardoor de fouttekst in plaats van een afbeelding. De editie is actief selecteerbaar in de RN-reader en kan niet naar de selecteerbare Unicode-weergave uitwijken, die alleen Hafs en Warsh Maknoon ondersteunt.

Dit is een actueel RN-defect. Het is niet automatisch een regressie van een nog actieve Kotlin-keuze: de laatste Kotlin-versie migreert de oude `warsh`-keuze naar Maknoon/Hafs. Die nuance verandert niet dat de opnieuw aangeboden RN-keuze moet werken.

Bronnen: [PrintedMushafPage](../src/features/quran/components/PrintedMushafPage.tsx), [gegenereerde assetmap](../src/content/generated/printedPages.ts), [MushafScreen](../src/features/quran/screens/MushafScreen.tsx), oude `MainActivity.kt:119–124`. [Uitkomst echte renderfunctie](parity-2026-11-17/parity-2026-11-17-muhammadi-probe.json). Native rendering, effecten en afbeeldingsmoduleloads zijn vervangen; geen toesteltest geclaimd.

## Overige concrete verschillen

- De vaste actieve Maknoon-/PDF-uitsnedes en selectie op originele Hafs Maknoon moeten samen worden hersteld of expliciet opnieuw ontworpen; alleen de afbeelding schalen is onvoldoende.
- Globaal zoeken naar ayahtekst, afzonderlijk hervatten per soera en contextlinks naar notities ontbreken in hun oude vorm.
- Hifz-kleuren aan/uit, tien themavarianten, volledige RTL, de snelle agendatijden en Android-notificatie-instellingen ontbreken geheel of gedeeltelijk.
- Audio mist reciteurnaam-/riwayafilters, kiezen zonder starten, omhoog swipen op de mini-player, enkele mini-controls en duidelijke bereikmetadata. Herhalen mist directe moduskeuzen en verschilt voor originele Hafs Maknoon/Warsh-nummering.
- Notitie-export bevat alle inhoud, maar de volgorde wijkt af na gewone bewerkingen: nieuwe onvastgezette notitie komt vóór oudere vastgezette notitie. Dit is met echte reducer/export gereproduceerd; schema en velden zijn niet verloren.
- De weekactiviteit filtert te veel acties. Home berekent bovendien het hifzgemiddelde van de gekozen categorie waar Kotlin een gecombineerd Home-gemiddelde gebruikte; het hizbgemiddelde op Stats is wel behouden.
- Lange groepsposts zijn altijd volledig uitgeklapt; automatisch geformateerde voortgang delen is vervangen door afzonderlijke acties met eigen tekst. De wachtwoordbevestiging bij registratie ontbreekt.
- Asbab heeft nog wel beschikbaarheidscontrole, maar de gerichte keuze uit alleen beschikbare passages is vervangen door algemene invoer met een geen-bronmelding.
- Een voltooide agendaherinnering vuurt niet alsnog door dit verschil: de scheduler sluit voltooide plannen uit. Wel kan undo de bewaarde toekomstige tijd opnieuw activeren; Kotlin wist die tijd bij afronden.

## Wat aantoonbaar behouden is

De [inhoudscontrole](parity-2026-11-17/parity-2026-11-17-content.json) vergeleek de lokale bron rechtstreeks, zonder die opnieuw te genereren of aan te passen:

- 6.236/6.236 Arabische ayahteksten exact gelijk.
- 6.236/6.236 Nederlandse en 6.236/6.236 Engelse vertalingen exact gelijk.
- Alle 6.236 woord-/grammaticarecords en 114 audio-optiecatalogi gelijk.
- 1.365 database-, indelings-, licentie- en afbeeldingskopieën bytegelijk, waaronder 1.242 mushafafbeeldingen en 114 oorspronkelijke soerakaarten.
- Alle 1.712 bestaande tekstcatalogusitems gelijk aan verse extractie in het geheugen; zeven boekbeschrijvingen en de bronliteralinventaris eveneens gelijk.

Dit bewijst bronbehoud. Het bewijst niet dat iedere tekst op de juiste RN-pagina verschijnt, dat de volledige audioverzameling gedownload is, of dat elke externe studiebron bereikbaar is. De oude copy-/featureledgers met verouderde paden zijn geen voldoende acceptatiebewijs.

Ook de belangrijkste functies die eerder ten onrechte als afwezig werden beschreven zijn teruggevonden: post bewerken/vastzetten, reacties, ledenleesdetails, week-/maandranglijsten, vijf notitiescopes, checklist, leesplan, doelresolutie, studieboeken en de statistiekdrilldown.

## Correcties op het aangeleverde overzicht en bewuste veranderingen

1. Het speciale Warsh Quran World PDF-cropprofiel staat nog in Kotlin, maar de actuele bron migreert die keuze en biedt hem niet normaal aan. Dit is historische code, geen automatisch nog actief productvereiste. De algemene PDF-uitsnede en beide Maknoon-vergrotingen zijn wel actief.
2. De Kotlin-hizbkaart heeft herhaaldialogen voor de vier rubs; een afzonderlijk volledig-hizbdialoog is niet aangetoond. Volledige hizbregistratie loopt via check-in.
3. Beide apps tonen bij een volledig lege hizbperiode een lege-melding. Nulhizbs blijven in het onderliggende overzicht aanwezig wanneer er activiteit is.
4. Groepsnaam zoeken betekent in beide bronversies zoeken binnen eigen groepen. Een volledige publieke groepszoekmachine is niet aangetoond.
5. Groepstaal wordt door Kotlin getoond; een actieve editor voor die taal is in geen van beide gevonden. Enkele Kotlin-regels/moderatie-API's hadden evenmin een actieve oude UI; RN maakt daarvan juist meer bereikbaar.
6. De gewone ayah-actie Afspelen start in beide bronversies de soera. Vers-/bereikherhaling is de route voor geselecteerde ayahs; dit onderscheid moet in de bediening duidelijk blijven.
7. Eén Mushaf-ingang, de selectietoggle, fullscreen zonder gewone interface, verborgen zwevende bediening in fullscreen en het omkeerbare paginavinkje zijn latere expliciete wensen. Ze worden niet als ongewenst verlies van Kotlin-bediening aangemerkt.
8. Een agentmelding over verdwijnende Arabische cijfers is na hoofdreview verworpen: `Field` normaliseert die vóór het tijdveld ze filtert. Deze fout staat niet op de herstelagenda.

## Uitgevoerde verificatie en wat nog openstaat

`npm run verify` is op deze bron opnieuw geslaagd: **TypeScript, ESLint en 546/546 tests**. De communityreview heeft 46 relevante bestaande tests aanvullend uitgevoerd; deze zitten in de volledige suite en worden niet bij 546 opgeteld. De hoofdreview reproduceerde Warsh-routing, echte copy/share-callbacks, Muhammadi-rendering, reciteurwissel, plan-deduplicatie, registratietijd, hifz-beoordelingsdatum, exportvolgorde en migratievoorkeuren met geïsoleerde gegevens.

Er is geen nieuwe native build nodig geweest voor deze audit omdat appcode niet is aangepast. **Niet uitgevoerd:** een volledige oorspronkelijke-Kotlin-versus-RN schermmatrix, fysieke Android/iOS-bediening, echte platformshare/clipboard/audio-aflevering, gehoste groepsrechtenmatrix, Google-accountflow, pushaflevering en beschikbaarheid van alle remote studie/audioaanbieders. Eerdere lokale/native resultaten blijven afzonderlijk gedateerd bewijs; ze zijn geen nieuwe volledige acceptatie van alle 21 onderdelen.

Aanbevolen herstelvolgorde:

1. Correctheid: Muhammadi-pagina's, Warsh-routing/merged selectie, planning-identiteit/tijd, bevestigde opslag/dubbel-submit, hifz-beoordelingsdatum en reciteurwissel.
2. Ontbrekende bediening en inhoud: groepsdashboard, globaal zoeken, scanselectie/crops, notitiecontext, instellingen/RTL en audiokeuzen.
3. Gerichte regressietests voor bovenstaande gebruikershandelingen; daarna native acceptatie met foutgevallen, beide leesmodi, edities, talen en oriëntaties.
4. Afzonderlijke gehoste Realtime/typing/FCM/APNs-verificatie. Bronaanwezigheid en lokale tests sluiten die stap niet af.

## Volledige deelrapporten en reproduceerbaarheid

- [Lezer, audio en studie: 1–3, 14–15, 19 en media-instellingen](parity-2026-11-17/reader-audio-study.md)
- [Registraties, hifz, statistieken, doelen en planning: 4–13](parity-2026-11-17/tracking-planning.md)
- [Notities, groepen, meldingen en account: 16–18, 21](parity-2026-11-17/community-account.md)
- [Introductie, talen, uiterlijk, broninhoud en migratie: 20](parity-2026-11-17/onboarding-content.md)

De geïsoleerde scripts staan lokaal in `.tooling`: `parity-2026-11-17-content.py`, `parity-2026-11-17-warsh-rubs.py`, `parity-2026-11-17-reader-probes.ts`, `parity-2026-11-17-muhammadi-probe.ts`, `parity-2026-11-17-audio-probe.ts`, `parity-date-tracking-probe.ts`, `parity-2026-11-17-migration-probes.ts`, `parity-2026-11-17-notes-export-repro.ts`. Pythonproeven draaien met `python`; TypeScriptproeven met `npx tsx`, vanuit de RN-map. Ze gebruiken fictieve invoer of bronbestanden en schrijven alleen audituitvoer. De volledige verifylog staat in `.tooling/parity-2026-11-17-verify.log`.
