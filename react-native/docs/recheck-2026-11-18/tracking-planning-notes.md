# Hercontrole: voortgang, planning en notities — 18 november 2026

Deze hercontrole vergelijkt de actuele Kotlin-bronnen met de actuele React Native-code. De oudere audit van 17 november is alleen als startpunt gebruikt. De onderstaande inventaris omvat **58 originele Kotlin-bestanden**: 57 bestanden binnen dit werkgebied plus de relevante integratie in MainActivity.kt. De tabel noemt ook iedere aangetroffen benoemde klasse, interface, enum en object in die bestanden. MainActivity is uitsluitend gecontroleerd op deze routes, notitie-aantallen, agenda-ingangen en de gedeelde focustimer; overige account-, onboarding-, reader- en groepsroutes vallen onder de andere deelrapporten.

Een bronklasse hoeft geen gelijknamige RN-klasse te hebben. Room-entities en DAO's zijn vertaald naar types, reduceracties, pure domeinfuncties en de bestaande opslaglaag. De koppeling hieronder beschrijft het gedrag, niet alleen overeenkomende bestandsnamen.

**Status:** Bevestigd = aanwezig en gecontroleerd; Hersteld = concrete ontbrekende functionaliteit in deze hercontrole toegevoegd; Aangepast = dezelfde taak in de nieuwe interface; Native open = alleen bron-/component-/domeinbewijs, nog geen nieuw toestelbewijs van deze hercontrole.

## Concrete verbeteringen

| Onderdeel | Aangetroffen verschil | Nu geïmplementeerd | Bewijs |
| --- | --- | --- | --- |
| Tahajjud / checklist | RN had geen uitklapbare kwartieren onder Hizb/Juz; de lijst opende niet op de opgeslagen stop. | Standaard Hizb, 4 Rub onder Hizb en 8 onder Juz. Start op het onderdeel dat de laatste ayah van de opgeslagen stop bevat. Lijst herstelt bij laden/tabwissel; nieuwe vinkjes of stopknoppen veroorzaken geen ongewenste sprong. De extra directe Rub-tab blijft beschikbaar. | checklist-input.test.ts; tracking-recheck-components.test.ts |
| Juz-voortgang | Alleen een directe Juz-registratie was zichtbaar; 8 voltooide kwartieren en hun telling ontbraken. | 0–8 kwartiertelling; voltooid bij directe Juz-markering of alle 8 Rub-markeringen. Hizb gebruikt dezelfde 0–4 afleiding. Alleen weergave: geen verzonnen Juz-historie of wijziging van leestellers. | tracking-ui.test.ts |
| Juz/Hizb-lijstpositie | Kotlin sprong naar het eerste ongelezen onderdeel. RN niet. | Eerste onvoltooide partitionering, of laatste rij als alles voltooid is; ook bij late gegevenshydratie. Virtualisatieherstel bij nog niet gemeten rijen. | tracking-ui.test.ts; gedeelde usePracticeListAnchor |
| Juz-kaarten | De originele beginverwijzing en Arabische beginayah ontbraken. | Bronverwijzing en tekst via de bestaande Quran-grenzen/content. | tracking-ui.test.ts; bestaande grens-/Quran-data |
| Notitiecontext | Samenvatting van verwijzing/hiërarchie/beginayah stond alleen in de keuzemodule. | Dezelfde samenvatting in contextlijst, verwijzingskeuze en notitiepreview. Kindnotities-optie bij Surah/Hizb/Juz is ook in lege context zichtbaar. | tracking-recheck-components.test.ts |
| Notitietags | Alleen vaste tags waren suggesties. | Bestaande gebruikerstags gevolgd door de bestaande curated suggesties, zonder exacte duplicaten. | notes-editor.test.ts |
| Notities zoeken | Een geïmporteerde notitie met lege opgeslagen surahName miste de oorspronkelijke zoekfallback. | Ook de canonieke Surah-naam is doorzoekbaar, inclusief in de Arabische interface. De geïmporteerde naam wordt niet herschreven. | notes-editor.test.ts |
| Notitie-aantallen | Originele exacte scope-badges ontbraken op voortgangsrijen. | NoteCountButton op Surah/Juz/Hizb/Rub; Rub gebruikt het globale nummer. Geen optelling van onderliggende scopes. Dezelfde helper/component is door de reader-agent op Quran-lijsten toegevoegd. | note-counts.test.ts; tracking-ui.test.ts |
| Historische dagdoelen | Oude snapshots konden de inmiddels gewijzigde eenheid van het huidige doel tonen/gebruiken. Afhandelstatus ontbrak. | Historische eenheid uit GoalDay voor weergave en registratie; carry/spread/skip zichtbaar met bestaande originele teksten. | tracking-ui.test.ts |
| Planningmelding | RN opende direct Mushaf; de originele agenda-context met geselecteerde datum ging verloren. | Melding opent Plan met lokale planId; PlanningScreen selecteert de datum uit dat lokale plan. De planrij opent nog steeds het exacte Mushaf-bereik. Verwijderde/afgeronde/ongeldige plannen leveren geen bestemming op. | notification-destinations.test.ts; tracking-ui.test.ts |

## Schermen, instellingen en regels

| Kotlin-scherm of regel | RN-ingang / implementatie | Gecontroleerde details | Status |
| --- | --- | --- | --- |
| DashboardScreen / TodayFocusCard / TodayGoalPie | home/MainScreen; TodayReadingCard; TodayPlanning | Dagdoelteller, doelbereikt, resterend, actuele planning, voltooiing en snelle check-in blijven bereikbaar. Nieuwe verdeling over kaarten. | Bevestigd / Aangepast |
| Dashboard: QuickCheckInDialog, QuickCheckStepper, QuickCheckSelectedInfo | practice/QuickCheckInSheet; domain/quickCheckIn | Surah 1–114, Juz 1–30, Hizb 1–60, Rub 1–4 binnen Hizb; limieten; preview; meerdere Hizb; lege selectie geblokkeerd; één batch; verzoekidentiteit bij retry; dubbele tikken/dismiss tijdens commit geblokkeerd. | Bevestigd |
| Dashboard: PointsEarnedPopup / motivatie | home/PracticeOverview; domain/motivation | Ayah-equivalenten, doelbonus 10; streakbonus 5/15/50 vanaf 3/7/30 dagen; niveaugrenzen 100/250/500/1000/2000/4000; laatste punten, week/today/bonus en disclaimer. Succesfeedback in RN-kaart/notice. | Bevestigd / Aangepast |
| Dashboard: periode | domain/motivation; domain/statistics | Vandaag, maandag-gebaseerde kalenderweek en kalendermaand. Aantal leesregistraties blijft onderscheiden van gelezen hoeveelheid. | Bevestigd |
| Dashboard: HifzOverviewCard / ReviewDueCard | home/PracticeOverview; domain/hifz | Alleen expliciete positieve scores, onafhankelijk Surah/Hizb/Juz; nieuwste beoordeling per sleutel; category browser en sterkste/zwakste; gecombineerde totaalscore blijft onafhankelijk van geselecteerde tab. Juz-consistentieadvies vanaf 20 punten verschil. | Bevestigd |
| Dashboard: herhaaladvies | domain/hifz; PracticeOverview | Intervallen 1/2/4/7/14 dagen voor 0–30/31–50/51–70/71–85/86–100. Vervallen advies wordt vandaag gepland. Geen dubbele equivalente herhaalplanning. | Bevestigd |
| HizbOverviewCard / HizbBars | home/HizbOverviewCard; domain/hizbAnalytics | Week/maand/jaar/custom; inclusieve lokale dagen en maandgrenzen; tot-datum niet na vandaag of vóór start; 60 numeriek geordende balken, nulwaarden, selectie, 150/280 hoogte, LTR numerieke volgorde ook in Arabisch. Alleen hele Hizb-check-ins van de huidige eigenaar, niet amount of afgeleide kwartieren. | Bevestigd |
| SurahScreen | practice/ProgressScreen; quran/QuranScreen (Surah-lijst) en acties | 114 hoofdstukken, leesmarkering/herhaald lezen, tellers, aparte gememoriseerd-markering, zelfstandige Hifz-score, notities per Surah, reader-ingang. Bulkselectie is RN-interfacekeuze. | Bevestigd / Aangepast |
| JuzzScreen / JuzStartInfo | practice/ProgressScreen; quran/QuranScreen (Juz-lijst) | 30 Juz, directe gelezen-status plus 8-Rub-dekking; 0–8 kwartiertelling; Arabische beginverwijzing/ayah; eerste onafgeronde rij; onafhankelijke score en contextnotities. | Hersteld |
| HizbScreen | practice/ProgressScreen; quran/QuranScreen (Hizb-lijst) | 60 Hizb, 4 individuele kwartieren, 0–4 voltooid, quarter readCount, gelezen/opnieuw/verwijderen, beginverwijzing en tekst; eerste onafgeronde rij; onafhankelijke Hizb-score; notities. | Bevestigd / Hersteld |
| Readmarks / QuranProgressRepository | domain/progressActions; reducer read/checkIn-acties | Sleutels surah_n, juz_n, hizb_(2000+n), rub_hizb_quarter blijven broncompatibel. Hele Hizb-check-in maakt één historievermelding en vier Rub-marks. Hifz wordt bij lezen niet veranderd. | Bevestigd |
| Leesmarkering verwijderen | domain/progressActions; PartActionsSheet/ProgressScreen | Surah/Juz: readCount en isRead reset, historie blijft. Rub: eigen rij reset en uitsluitend passende Rub-historie van de gekozen huidige dag weg. Geheugenscore en andere kwartieren blijven behouden. | Bevestigd |
| Surah gememoriseerd | domain/progressActions; ProgressScreen | Eigen memorized-historie/flag, onafhankelijk van readCount en Hifz-score. | Bevestigd |
| HifzScores / scorecontrols | domain/hifz; domain/hifzPresentation; HifzScoreSlider | 0 is geen beoordeling/clear; 1–100 expliciet; geen automatische Juz-Hizb-overname. Kleuren schakelen via bestaande hifzColorsEnabled. Slider/veld/presets en RTL mapping. | Bevestigd |
| ReadingCelebrationDialog / CelebrationLevel | QuickCheckInSheet/ProgressScreen feedback; PartActionsSheet | Soft/Bright/Grand-confetti is een bewuste visuele aanpassing aan het nieuwe ontwerp. Quick-check/bulk melden succes na commit. Individuele PartActions dispatchen en sluiten direct; hiervoor is geen afzonderlijke durable-success-toast toegevoegd. | Aangepast |
| StatsScreen: overzicht | ReadingStatisticsOverview / ReadingStatisticsSummary; domain/statistics | Leesacties, pagina-/ayah-equivalent, punten, Surah-aantallen, volledige Rub/Hizb/Juz voortgang; geheugen/leesstreak; geen dubbel tellen van kwartaaldekking. | Bevestigd |
| StatsScreen: perioden en verdeling | ReadingDistributionRing; statsPeriodHistory/statsReadingBuckets | Alle tijd, 7 lokale dagen, 30 lokale dagen; exclusieve volgende middernacht. Ring telt registraties, niet hoeveelheid; type via contentType fallback type; Hizb/Surah top 8. Herhaalde registraties blijven aparte rijen. | Bevestigd |
| StatsDrilldown / StatsReadingDetails | ReadingStatisticsOverview detailmodal | Ringsegment/legenda/alles opent dezelfde onderliggende registraties; nieuwste eerst; filters, aantal, datum/uur, amount, range en Hizb-opening. Lege selectie en uitleg. Exacte geregistreerde ayah-bereiken krijgen voorrang op benaderingen. | Bevestigd |
| StatsScreen: geschiedenis | StatisticsHistory; statsHistoryGroups | Dag/week/maand; ISO-jaargrens; inklappen; alle acties; historische Rub-vermeldingen per dag/Hizb samengevat met distinct kwartieren zonder ringdata te herschrijven. | Bevestigd |
| StatsScreen: wissen | ReadingStatisticsOverview; reducer reading/clear | Bevestigingsdialoog; leesgeschiedenis/leesmarkeringen wissen; Hifz, memorized-flags, planning, notities en instellingen blijven behouden. RN-opslagfouten lopen via de centrale store; geen native failure-injection in deze hercontrole. | Bevestigd / Native open |
| FocusSessionScreen / MainActivity timer | FocusScreen; FocusProvider; domain/focus | Vier intenties; 10/15/25/45 minuten plus custom 1–180; start/pauze/hervatten/reset/opnieuw na einde; Mushaf openen; gedeelde zichtbare timer buiten focusscherm. RN persistente deadline voorkomt scherm-/achtergrondtimerdrift. | Bevestigd |
| Focus tijdregistratie | FocusProvider; focusSessions | RN bewaart afgeronde sessieduur en toont die bij statistieken; dit is een RN-uitbreiding. Oude countdown-state wordt zonder reset gemigreerd. Ongeldige opgeslagen timer wordt niet stil overschreven. | Bevestigd |
| ReadingChecklistScreen / ReadingChecklistMapping | ChecklistScreen; domain/checklist | Dekking op ayah-intervallen; Surah/Hizb/Juz/Rub delen dezelfde checkmarks. Partiële dekking is mixed. Parent aan/uit behandelt exact zijn bereik. Checklist blijft apart van normale readmarks/historie. | Bevestigd |
| Checklist stoppositie | ChecklistScreen; checklistAnchor/checklistNext | Stoppositie en vinkjes zijn onafhankelijk; “Hier gestopt”, huidige plek, volgende ayah, lezen na stop, einde Quran. Reset positie laat checks staan; reset checks laat positie staan; bevestiging en save error. | Bevestigd / Hersteld |
| Checklist navigatie | usePracticeListAnchor | Standaard Hizb; 4/8 uitklapkwartieren; opgeslagen stop automatisch zichtbaar; wisselen naar Surah/Juz/Rub gebruikt laatste ayah van dezelfde stop. Scrollherstel stopt bij handmatig scrollen of een actie. | Hersteld / Native open |
| PlanningScreen / GoalHubPanel | practice/GoalsScreen | Lezen, memoriseren en herhalen als onafhankelijke actieve doelen; target/unit/edit/enable; bronlimieten en reminder. Historische datum kiezen; dag-snapshot houdt eigen target/unit. | Bevestigd / Hersteld |
| GoalDay / daily goal rules | domain/goals; domain/goalRegistration | Snapshots, carry/spread/skip exact eenmaal; geen wijziging van oud snapshot bij doelwijziging; unitwijziging geblokkeerd bij open overgedragen werk; minuten gescheiden van hoeveelheid. | Bevestigd |
| Doelsessie registreren | GoalsScreen; goalRegistration; reducer | Werkelijke actuele timestamp met gekozen lokale dateKey; content identity los van gemeten unit; pagina-doel start standaard met één gekozen hele Surah; passende planning exact eenmaal koppelen en reminder verwijderen. | Bevestigd |
| ReadingJourneyDialog / ReadingJourneyCard | planning/ReadingJourneyPanel; domain/readingJourney | Gekoppelde leesreis met actief leesdoel; hoeveelheid per dag of inclusieve einddatum; actuele forecast na wijziging dagdoel; uitsluitend read sinds start, herhaling telt; minuten leveren geen verwachte einddatum; atomic doel/reis bewaren. | Bevestigd |
| AgendaScreen: kalender | planning/PlanningScreen; AgendaCalendar; domain/agenda | Dag/week/maand, maandagstart, vandaag, geselecteerde datum, voltooid/deels/gemist/gepland/geen. Done bepaalt status vóór gemist; komende planning. | Bevestigd |
| AgendaScreen: item | PlanningScreen; domain/planning; reducer plan-acties | Surah/Hizb/Rub/Juz; correct refId/subId; naam en beginpreview; togglen/loggen/terugdraaien; deletebevestiging; volgorde onafgerond voor tijd. Lezen opent exact bereik. | Bevestigd |
| Agenda: khatma | PlanningScreen; domain/journey | 1–240 dagen; preview en dagelijkse opeenvolgende Rub-ranges; alle 240 kwartieren exact eenmaal; kalenderdagen over zomer/wintertijd; bestaande planning wordt niet stil gereset. | Bevestigd |
| Agenda: reminders | PlanningScreen; planningReminders; notificationDestinations | Per plan uur/minuut, wissen en nu; afgeronde/ongeldige/verleden plannen niet opnieuw plannen; stabiele identificatie; updates/cancel; tap kiest lokale agenda-datum; rij behoudt leesjump. | Bevestigd / Hersteld / Native open |
| ReminderScheduler / Workers | services/notifications + Expo adapter | Kotlin WorkManager vervangen door RN native scheduler; lokale data blijft bepalend voor levering/bestemming; timezone/quiet hours/permission behavior in bestaande notification-module. Werkelijke OS-aflevering vereist native toesteltest. | Aangepast / Native open |
| Onafhankelijk ReadingPlanScreen / HomeCard | planning/ReadingPlanScreen; domain/readingPlan; services/planning/independentReadingPlan | Eigen target/unit/start/optionele finish/correctie; los van dagdoelen. Leest alleen read sinds started; herlezen telt; minuten niet. Start=0 telt nul. 60 Hizb=240 Rub=30 Juz=604 pagina's=6236 ayat. | Bevestigd |
| Onafhankelijk plan: wijzigen | readingPlan; useReadingPlan | Correctie is nieuw totaal minus automatisch gelezen; start blijft behouden; correctie omrekenen bij unitwijziging; inclusieve resterende dagen/tempo; verlopen einddatum; Arabische/Perzische cijfers; durable opslag en corrupt-state blokkering. | Bevestigd |
| AyahNotesScreen: lijst | notes/NotesScreen; useNoteFilters; noteFilters | Alle 5 scopes, tekst/naam/verwijzing/folder/tag zoeken, scopefilter, pinned-only, folder, tag, titel of nieuwste sortering met pins eerst; lege staten, contextual children; geen verborgen tab. | Bevestigd / Hersteld |
| Notities: context | QuranNoteTarget; noteEditor; NoteTargetControl/Summary | Juz/Hizb/Rub/Surah/Ayah, geldige nummers/ayahs, hiërarchiebehoud bij scopewissel, expliciete targetkeuze, range/starttekst, exact-scope counts; afgeleide kinderen alleen op verzoek. | Bevestigd / Hersteld |
| Notities: editor | NoteEditorView; useNoteEditor; noteEditor | Nieuw/edit/preview, scope/titel/body/folder/tags, bestaande tagsuggesties, pin, deletebevestiging; unsaved-change bevestiging; save afwachten/dubbele submit blokkeren/retry met zelfde identiteit; body-whitespace behouden. | Bevestigd / Hersteld |
| Notities: opmaak | FormattedNote; noteFormat; RichNoteInput | Lettergrootte, H1/H2/H3, bold/italic/underline/strike, zes kleurkeys, bullet/numbered/todo; togglen todo met inspringing; bestaande spanencoding met 9 velden; verschuiven/mergen bij tekstwijziging; latere overlap wint. Native attributen/IME is eigen RN-brug. | Bevestigd / Native open |
| Notities: export | exporting/notesExport; services/storage/shareNotesFile | schemaVersion 2, notes_export, local_device, originele keys/nullwaarden/formatSpans/rawTags/timestamps; pins eerst en nieuwste eerst zonder mutatie; platform share/download exacte JSON-bytes. | Bevestigd / Native open |
| Lokale opslag/repositories | state/models, reducer, store; services/storage | Bestaande import-/exportcontracten en IDs ongewijzigd. Geen nieuwe schemafields voor deze fixes. Alleen optionele Plan-routeparameter toegevoegd. Geen echte gebruikersdata bewerkt. | Bevestigd |

## Oorspronkelijke bestanden en klassencatalogus

Kotlin-basis: app/src/main/java/com/Ameender/qurantracker/. RN-basis: react-native/src/. De regeltellingen hieronder tellen de volledige bronbestanden op schijf; zij zijn geen claim dat de overige MainActivity-functionaliteit in dit deelonderzoek is beoordeeld. UI-hulpfuncties zonder benoemde klasse staan als “functies” en zijn via de scherm-/regelrijen hierboven gekoppeld.

| # | Kotlin-bestand | Regels | Klassen / enums / interfaces / objects | RN-equivalent of integratie |
| --- | --- | ---: | --- | --- |
| 1 | data/AyahNote.kt | 68 | AyahNote, AyahNoteDao | exporting/notesExport.ts ExportableNote; state/models.ts notes; state/reducer.ts |
| 2 | data/AyahNoteRepository.kt | 115 | AyahNoteDataSource, AyahNoteRepository | features/notes/editor/noteEditor.ts; hooks/useNoteEditor.ts; state/store.ts |
| 3 | data/DailyGoal.kt | 32 | DailyGoal, DailyGoalDao | state/models.ts DailyGoal; domain/goals.ts |
| 4 | data/GoalDay.kt | 46 | GoalDay, GoalDayDao, GoalDayProgress, GoalSessionContent | state/models.ts GoalDay; domain/goals.ts; domain/goalRegistration.ts |
| 5 | data/GoalRepository.kt | 237 | GoalDataSource, GoalRepository | domain/goals.ts; domain/readingJourney.ts; domain/readingMetrics.ts; state/reducer.ts |
| 6 | data/HizbAnalytics.kt | 22 | HizbPeriod, HizbDateRange | domain/hizbAnalytics.ts HizbPeriod/HizbDateRange |
| 7 | data/HizbData.kt | 84 | HizbInfo | content/hizb.ts; content/quran.ts divisions; HizbOpeningPreview |
| 8 | data/NoteScopesMigration.kt | 32 | Functies; geen benoemde klasse | state/persistence/decodeState.ts; ExportableNote; domain/quran.ts. Android-importmigratie: zie integratierapport |
| 9 | data/PlanningItem.kt | 69 | PlanningItem, PlanningItemDao | state/models.ts Plan; domain/planning.ts; state/reducer.ts |
| 10 | data/PlanningRepository.kt | 199 | PlanningDataSource, PlanningRepository | domain/planning.ts; domain/journey.ts; reducer; planningReminders.ts |
| 11 | data/QuranDao.kt | 37 | QuranDao | state/models.ts; state/reducer.ts; domain/progressActions.ts; state/store.ts |
| 12 | data/QuranProgress.kt | 20 | QuranProgress | state/models.ts Progress |
| 13 | data/QuranProgressRepository.kt | 285 | QuranProgressDataSource, QuranProgressRepository | domain/progressActions.ts; domain/quickCheckIn.ts; state/reducer.ts; usePracticeSave.ts |
| 14 | data/QuranNoteTarget.kt | 329 | NoteScope, QuranNoteTarget, QuranStart, QuranStructure | domain/quran.ts QuranNoteTarget/NoteScope; content/quran.ts; notes/editor/noteEditor.ts |
| 15 | data/ReadingChecklist.kt | 51 | ReadingChecklistMapping, ReadingChecklistState | domain/checklist.ts ChecklistState/Coverage |
| 16 | data/ReadingChecklistStore.kt | 32 | ReadingChecklistStore | features/practice/screens/ChecklistScreen.tsx + deviceStorage |
| 17 | data/ReadingHistory.kt | 154 | ReadingHistory, ReadingHistoryDao, HizbReadingCount, CheckInRequest, SurahReadCount, HizbReadCount, TypeCount, SurahLastRead, DayActivity | state/models.ts ReadingEntry; reducer; domain/statistics.ts; hizbAnalytics.ts; quickCheckIn.ts |
| 18 | data/ReadingJourney.kt | 32 | ReadingJourney, ReadingJourneyDao | domain/readingJourney.ts ReadingJourneyConfiguration; state/models.ts LegacyReadingJourney |
| 19 | data/ReadingMetrics.kt | 112 | ProgressMeasurement, ReadingMetrics | domain/readingMetrics.ts; domain/readingUnit.ts |
| 20 | data/ReadingStatsSummary.kt | 120 | ReadingStatsSummary | domain/statistics.ts statsOverview; domain/motivation.ts |
| 21 | data/ReminderScheduler.kt | 36 | ReminderScheduler, AndroidReminderScheduler | services/notifications/planningReminders.ts; expoPlanningReminders.ts; localReminders.ts |
| 22 | domain/DailyGoalRules.kt | 10 | Functies; geen benoemde klasse | domain/goals.ts; domain/goalRegistration.ts |
| 23 | domain/HifzScores.kt | 25 | Functies; geen benoemde klasse | domain/hifz.ts; domain/hifzPresentation.ts |
| 24 | domain/QuranProgressKeys.kt | 29 | QuranProgressType, QuranAction | state/reducer.ts progressKey; domain/progressActions.ts hizbProgressId; domain/quran.ts |
| 25 | domain/PlanningLabels.kt | 8 | PlanningTypeIcon | features/planning/screens/PlanningScreen.tsx; shared Icon |
| 26 | viewmodel/QuranViewModel.kt | 151 | QuranViewModel, HistoryResetState | useAppStore; usePracticeSave; domain/statistics.ts; reducer |
| 27 | viewmodel/GoalViewModel.kt | 86 | GoalViewModel | useAppStore; domain/goals.ts; GoalsScreen |
| 28 | viewmodel/PlanningViewModel.kt | 91 | PlanningViewModel | useAppStore; domain/agenda.ts; domain/planning.ts; PlanningScreen |
| 29 | viewmodel/HizbOverviewViewModel.kt | 33 | HizbOverviewState, Loading, Error, Ready, HizbOverviewViewModel | home/HizbOverviewCard.tsx; domain/hizbAnalytics.ts; centrale storehydratie |
| 30 | viewmodel/AyahNoteViewModel.kt | 74 | AyahNoteViewModel | useNoteEditor; useNoteFilters; noteEditor; reducer |
| 31 | viewmodel/QuranTrackerViewModelFactory.kt | 60 | QuranTrackerViewModelFactory | app/providers/AppProviders.tsx; state/store.ts; Expo notification adapter |
| 32 | ui/SurahScreen.kt | 376 | Surah | practice/ProgressScreen; quran/QuranScreen Surah-lijst; content/quran.ts; NoteCountButton |
| 33 | ui/JuzzScreen.kt | 350 | JuzStartInfo | practice/ProgressScreen; quran/QuranScreen Juz-lijst; content/quran.ts divisions |
| 34 | ui/HizbScreen.kt | 351 | Functies; geen benoemde klasse | practice/ProgressScreen; quran/QuranScreen Hizb-lijst; PartActionsSheet; HizbOpeningPreview |
| 35 | ui/DashboardScreen.kt | 2367 | ReadingJourneyProgressView, PointsPopupState, HifzOverview, HifzBrowseScore, HifzScoreItem, ReviewDueItem, HifzRawScore, DashboardPeriodStats, MotivationPointsStats, MotivationLevel, ReadingJourneyProgress, JourneyStatus | home/MainScreen; PracticeOverview; TodayReadingCard; TodayPlanning; domain/hifz/motivation/statistics/readingJourney |
| 36 | ui/StatsScreen.kt | 1126 | RingEntry, HistoryGroupMode, HistoryGroup, HistoryDisplayItem, SingleHistoryItem, HizbDaySummaryItem, RubHistoryEntry | practice/StatsScreen; ReadingStatisticsOverview/Summary; StatisticsHistory; domain/statistics.ts |
| 37 | ui/StatsDrilldown.kt | 53 | StatsReadingPeriod, StatsDistribution, StatsReadingBucket | domain/statistics.ts StatsReadingPeriod/StatsDistribution/StatsReadingBucket |
| 38 | ui/StatsReadingDetails.kt | 78 | Functies; geen benoemde klasse | practice/ReadingStatisticsOverview detailmodal |
| 39 | ui/FocusSessionScreen.kt | 469 | FocusGoal, FocusStrings | practice/FocusScreen; FocusProvider; domain/focus.ts; i18n |
| 40 | ui/ReadingChecklistScreen.kt | 198 | Functies; geen benoemde klasse | practice/ChecklistScreen; usePracticeListAnchor; domain/checklist.ts |
| 41 | ui/ReadingChecklistText.kt | 32 | Functies; geen benoemde klasse | i18n/index.ts; i18n/source-catalog.json checklist.* |
| 42 | ui/GoalHubPanel.kt | 361 | Functies; geen benoemde klasse | practice/GoalsScreen; domain/goals.ts; domain/goalRegistration.ts |
| 43 | ui/PlanningScreen.kt | 19 | Functies; geen benoemde klasse | practice/GoalsScreen (originele kleine wrapper om GoalHubPanel) |
| 44 | ui/AgendaScreen.kt | 1305 | AgendaDayStatus | planning/PlanningScreen; AgendaCalendar; domain/agenda.ts; domain/journey.ts |
| 45 | ui/ReadingJourneyDialog.kt | 97 | Functies; geen benoemde klasse | planning/ReadingJourneyPanel; domain/readingJourney.ts |
| 46 | ui/ReadingPlanScreen.kt | 135 | ReadingPlan | planning/ReadingPlanScreen; ReadingPlanHomeCard; useReadingPlan; domain/readingPlan.ts |
| 47 | ui/ReadingPlanText.kt | 41 | Functies; geen benoemde klasse | i18n; domain/readingPlan.ts normalizePlanNumber |
| 48 | ui/AyahNotesScreen.kt | 1384 | NoteStrings, NoteLayoutColors, NoteTextColor, ActiveNoteFormat, NoteFormatSpan, NoteFormatVisualTransformation | notes/NotesScreen; NoteEditorView; FormattedNote; noteEditor; noteFormat; i18n/notes.ts; notesExport |
| 49 | ui/NoteTargetComponents.kt | 174 | Functies; geen benoemde klasse | notes/NoteTargetControl; NoteTargetSummary; domain/quran.ts; noteEditor |
| 50 | ui/HizbOverviewCard.kt | 120 | Functies; geen benoemde klasse | home/HizbOverviewCard |
| 51 | ui/HizbOverviewText.kt | 30 | Functies; geen benoemde klasse | i18n hizbOverview.* |
| 52 | ui/HizbMultiSelect.kt | 53 | Functies; geen benoemde klasse | practice/QuickCheckInSheet |
| 53 | ui/DailyGoalNumbers.kt | 11 | Functies; geen benoemde klasse | useI18n format + Number.toLocaleString in Goals/TodayReadingCard |
| 54 | ui/QuickCheckTags.kt | 4 | Functies; geen benoemde klasse | QuickCheckInSheet testID/accessibility labels |
| 55 | ui/ReadingCelebrationDialog.kt | 174 | CelebrationLevel, ReadingCelebration, ConfettiPiece | QuickCheckInSheet/ProgressScreen notice; PartActionsSheet close (visuele aanpassing) |
| 56 | PlanningReminderWorker.kt | 31 | PlanningReminderWorker | services/notifications/planningReminders.ts; planning/PlanningReminderCoordinator |
| 57 | QuranReminderWorker.kt | 20 | QuranReminderWorker | services/notifications/localReminders.ts |
| 58 | MainActivity.kt | 891 | Screen, Dashboard, Hizb, Juzz, Surahs, Reader, Tafsir, Mutashabihat, Translation, BookReader, Notes, Focus, Groups, ReadingPlan, Notifications, ReadingChecklist, DailyGoal, Stats, Agenda, MainActivity | app/navigation; FocusProvider; NoteCountButton; PlanningScreen planId-route (gerichte integratie) |

**Telling:** 58 unieke bestanden, 12.929 bronregels op schijf. Daarvan is MainActivity.kt (891 regels) gericht geïnspecteerd; de volledige appbrede MainActivity-dekking wordt niet dubbel als dit deelwerk geclaimd. De oudere auditdocumenten en RN-bestanden tellen niet mee in dit Kotlin-totaal.

## Gewijzigde bestanden

Deze deelimplementatie wijzigt 15 RN-bronbestanden en 5 testbestanden. NoteCountButton.tsx, noteCounts.ts en hun tests zijn door de reader-agent geleverd en in dit deel gebruikt; die bestanden staan in diens wijzigingsinventaris.

- [src/domain/checklist.ts](../../src/domain/checklist.ts)
- [src/domain/progressActions.ts](../../src/domain/progressActions.ts)
- [src/features/practice/hooks/usePracticeListAnchor.ts](../../src/features/practice/hooks/usePracticeListAnchor.ts)
- [src/features/practice/screens/ChecklistScreen.tsx](../../src/features/practice/screens/ChecklistScreen.tsx)
- [src/features/practice/screens/GoalsScreen.tsx](../../src/features/practice/screens/GoalsScreen.tsx)
- [src/features/practice/screens/ProgressScreen.tsx](../../src/features/practice/screens/ProgressScreen.tsx)
- [src/features/notes/components/NoteTargetSummary.tsx](../../src/features/notes/components/NoteTargetSummary.tsx)
- [src/features/notes/components/NoteTargetControl.tsx](../../src/features/notes/components/NoteTargetControl.tsx)
- [src/features/notes/components/NoteEditorView.tsx](../../src/features/notes/components/NoteEditorView.tsx)
- [src/features/notes/screens/NotesScreen.tsx](../../src/features/notes/screens/NotesScreen.tsx)
- [src/features/notes/hooks/useNoteEditor.ts](../../src/features/notes/hooks/useNoteEditor.ts)
- [src/features/notes/editor/noteFilters.ts](../../src/features/notes/editor/noteFilters.ts)
- [src/features/planning/screens/PlanningScreen.tsx](../../src/features/planning/screens/PlanningScreen.tsx)
- [src/services/notifications/notificationDestinations.ts](../../src/services/notifications/notificationDestinations.ts)
- [src/app/navigation/types.ts](../../src/app/navigation/types.ts)

- [tests/checklist-input.test.ts](../../tests/checklist-input.test.ts)
- [tests/tracking-recheck-components.test.ts](../../tests/tracking-recheck-components.test.ts)
- [tests/tracking-ui.test.ts](../../tests/tracking-ui.test.ts)
- [tests/notification-destinations.test.ts](../../tests/notification-destinations.test.ts)
- [tests/notes-editor.test.ts](../../tests/notes-editor.test.ts)

De enige gedeelde wijziging is de optionele planId-parameter in de Plan-navigatieroute. NotificationDestinations is afgestemd met de community-agent: group_reply-afhandeling is hierdoor niet gewijzigd. De originele Kotlin-bestanden, inhoudsbestanden, Nederlandse/Engelse/Arabische curated teksten en import-/exportformaten zijn niet aangepast.

## Verificatie

- npm run typecheck: geslaagd na alle codewijzigingen.
- ESLint op de 15 gewijzigde bronbestanden en 5 gewijzigde tests: geslaagd.
- Gerichte regressieset: 33/33 geslaagd.
- Uitgebreide relevante set: **105/105 geslaagd, 0 overgeslagen**, verdeeld over 24 testbestanden. Hieronder de exacte selectie.
- Componenttests laden de echte gewijzigde component-/hooklogica met gecontroleerde React Native/storage/navigation-poorten. Zij bewijzen callbacks, afgeleide rijen, rangegrenzen, retry-/snapshotgedrag en routes; zij zijn geen bewijs van Android-/iOS-rendering of OS-notificatieaflevering.

~~~powershell
npx tsx --test tests/agenda.test.ts tests/checklist-input.test.ts tests/focus.test.ts tests/hizb-opening.test.ts tests/hizb-analytics.test.ts tests/hifz-slider.test.ts tests/hifz-motivation.test.ts tests/goals.test.ts tests/local-notification-preferences.test.ts tests/journey.test.ts tests/notification-system.test.ts tests/notification-destinations.test.ts tests/notes-format.test.ts tests/notes-editor.test.ts tests/note-counts.test.ts tests/planning-reminders.test.ts tests/progress-actions.test.ts tests/quick-check-in.test.ts tests/reading-journey.test.ts tests/reading-plan.test.ts tests/tracking-recheck-components.test.ts tests/tracking-ui.test.ts tests/statistics.test.ts tests/statistics-surface.test.ts
~~~

Het nieuwe componentbewijs omvat Rub 157 → Hizb 40 → Juz 20, alle 8 geneste kwartieren van Juz 20, gemengde parentdekking, geen extra sprong na een stopwijziging, alle 5 notitiescopes, historische Juz-doelregistratie nadat het huidige doel pagina's is geworden, en melding → juiste agenda-datum → exact Mushaf-bereik.

## Open native verificatie en bewuste verschillen

Er is door dit deelonderzoek geen nieuwe native build geïnstalleerd, geen emulator gestart en geen OS-melding afgeleverd. Geen gebruikersaccount, notities, leesgeschiedenis of clouddata is gewijzigd. De volgende acceptancechecks blijven daarom expliciet toestelwerk:

1. Open een opgeslagen verre Tahajjud-stop bij een verse schermmount, wissel Surah/Hizb/Juz/Rub en controleer zichtbaarheid en uitklappen op kleine en grote schermen. Scroll vervolgens handmatig en verander een check/stop: de lijst mag niet terugtrekken.
2. Open Hizb/Juz met veel bestaande markeringen; controleer eerste onvoltooide rij onder echte FlatList-virtualisatie, verschillende lettergroottes en RTL. Controleer dat selectie en notitie-/scoreknoppen bereikbaar blijven.
3. Controleer contextual Notes-preview met Arabische beginayah, lege context, toetsenbord, native opmaakselectie/IME, todo en JSON-share op Android/iOS.
4. Tik een planningsmelding aan vanuit koude en warme app, selecteer de juiste lokale agenda-datum en open daarna de reader-rij. OS-permissies, quiet hours, exacte levertijd, herplannen na tijdzonewijziging en iOS-notificatielimieten vereisen platformtests.
5. Controleer Focus bij achtergronden, hervatten en procesherstart; de deadline-logica is getest, de OS-lifecycle is hier niet opnieuw uitgevoerd.

Compose-confetti, decoratieve overgangen en de exacte oorspronkelijke kaartindeling zijn geen letterlijke reconstructie. De nieuwe RN-interface behoudt de taken en gegevens; de confetti-aanpassing is met de hoofdagent afgestemd. Voor individuele PartActions geldt nog steeds dispatch + sluiten, terwijl quick-check/bulk en Notes wachten op de duurzame commit. Dit verschil is hier niet als een succesvol geteste durable-confirmation gepresenteerd.

De drie afzonderlijke concepten blijven herkenbaar en gescheiden: dagelijkse doelen, de gekoppelde leesreis en het onafhankelijke leesplan. Tahajjud-checkmarks vormen weer een eigen checklist. Geen van de in deze hercontrole toegevoegde afleidingen creëert nieuwe leesgeschiedenis.

## Documentatie-overdracht

Voor de gebruikershandleiding zijn de relevante aanvullingen: Tahajjud opent bij de bewaarde stop en kan Hizb/Juz uitklappen; notitiecontext/preview toont de beginayah; voortgang toont de exacte notitie-aantallen; Juz-compleet kan uit 8 Rub-marks volgen; een planningsmelding opent de agenda-datum en de rij opent Mushaf. De hoofdagent is over deze wijzigingen en de bovenstaande native grenzen geïnformeerd.

