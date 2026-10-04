# Hizb-check-ins en homepageoverzicht

## Implementatie

De app is native Kotlin/Compose. De bestaande Room-database bewaart check-ins lokaal; Supabase verzorgt de bestaande authenticatie, niet de synchronisatie van deze leesregistraties. Er is geen nieuwe chartdependency toegevoegd.

- `ui/DashboardScreen.kt`: compacte Hizb-selector, één submitpad voor single/multi, opslaan-/foutstatus, succes pas na databasecommit; overzicht onder de leesplankaart.
- `ui/HizbMultiSelect.kt`: Material3-bottomsheet met maximaal 360 dp hoge LazyColumn, opties 1–60, checkboxsemantiek, selectieteller en compacte samenvatting.
- `ui/HizbOverviewCard.kt`: verticale balken van 24 dp in 48 dp brede touchtargets, horizontale LazyRow, vaste Y-as, details na tikken, uitklappen en periodefilters. Numerieke volgorde blijft 1–60 in RTL.
- `ui/HizbOverviewText.kt`: nieuwe teksten voor NL/EN/AR/FR, volgens het bestaande patroon van feature-specifieke vertaalhelpers.
- `ui/QuickCheckTags.kt`: stabiele testlabels voor de check-in-controls.
- `viewmodel/QuranViewModel.kt`: submitbewaking en foutafhandeling.
- `viewmodel/QuranTrackerViewModelFactory.kt`: database en bestaande soeranamen doorgeven aan repository.
- `viewmodel/HizbOverviewViewModel.kt`: account- en periodegebonden Room Flow, loading/error/retry, herladen bij relevante databasewijzigingen.
- `data/QuranProgressRepository.kt`: gedeelde transactionele check-in, validatie, unieke requestregistratie tegen dubbele submit en rollback bij accountwissel. Volledige Hizb telt als één historyrecord en werkt de vier rub-voortgangsrecords bij. Hifz-beoordelingen blijven hierbij behouden.
- `data/ReadingHistory.kt`: eigenaar, geaggregeerde query en requestledger.
- `data/HizbAnalytics.kt`: centrale datumgrenzen en aanvullen van ontbrekende Hizbs met nul.
- `data/QuranDatabase.kt` en Room-schema 20: migratie 19→20.

## Database en afbakening

Migratie voegt `ownerId` (standaard leeg), index `(ownerId, timestamp)` en `checkin_requests` toe. De index ondersteunt de eigenaar- en tijdfilters. Bestaande historie wordt niet gewist of aan een willekeurig account toegeschreven. De geaggregeerde SQL-query telt volledige Hizb-check-ins per eigenaar en datuminterval; niet alle historische rijen worden naar de grafiek geladen. Ontbrekende nummers worden daarna aangevuld tot alle 60 Hizbs.

Nieuwe snelle check-ins gebruiken de actuele account-ID, of `guest` als de gebruiker aantoonbaar uitgelogd is. Tijdens de auth-check wordt opslaan geweigerd en toont het overzicht een laadstatus. Losse rub-registraties worden niet achteraf tot volledige Hizbs samengevoegd. De grafiek vermeldt expliciet dat alleen volledige Hizb-check-ins meetellen.

De bestaande overige voortgang blijft apparaatgebonden. Deze uitbreiding introduceert geen cloudsync of algemene accountisolatie voor andere appschermen. Supabase-tabellen en RLS zijn niet gewijzigd.

Week betekent de laatste zeven lokale kalenderdagen, maand/jaar het afgelopen kalendermaand-/jaarinterval inclusief vandaag. Een aangepaste einddatum is inclusief; SQL gebruikt de exclusieve start van de volgende lokale dag. Hierdoor blijven zomertijdgrenzen correct.

## Verificatie (26 september 2026)

- `testDebugUnitTest`, `assembleDebugAndroidTest`, `assembleDebug`: geslaagd.
- `HizbAnalyticsTest`: periodes, nulwaarden/1–60, ongeldige range, zomertijd.
- Telefoon: `HizbCheckInDatabaseTest`, `HizbMultiSelectTest`, `ReadingPlanDatePickerTest`, `NotificationTimePickerTest`, `TopLevelNavigationTest`: testrunner OK (10 tests, inclusief één bewust overgeslagen opt-in-wistest).
- Getest: batch en herhaald lezen, request-idempotentie, account- en tijdfilters, rollback bij accountwissel, single-check-ins met eigenaar, Room-observerupdate, selecteren/deselecteren/scrollen in NL/EN/AR/FR, Arabische RTL en chart-scroll/touch tot Hizb 60.
- Met expliciete toestemming is de opt-in-wistest afzonderlijk uitgevoerd op telefoon R3GL300KGGJ: alleen `reading_history` gewist en leeg geverifieerd. Geen automatische productiewisactie. Geen herstelkopie gemaakt; account, instellingen en plannen zijn behouden.
- Lint is **niet groen**: drie detectorcrashes in GoalViewModel, HamburgerMenu en SupabaseService. Compose-lint ondersteunt metadata tot 2.0.0, terwijl een geanalyseerde klasse metadata 2.1.0 heeft. Geen checks onderdrukt. De lint-toolchain moet nog compatibel gemaakt worden voordat aan de volledige production-ready Definition of Done is voldaan.

## Resterende aandachtspunten

Geen volledige visuele toegankelijkheidsaudit of handmatige end-to-end controle van alle fout- en aangepaste-datumstates uitgevoerd. De accountgebonden lokale statistieken verschijnen niet automatisch op een tweede apparaat. Oude ongetagde data op andere installaties blijft bewaard maar verschijnt niet in het nieuwe accountoverzicht.
