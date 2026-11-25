# Native Mushaf-downloads

`withBackgroundMushafDownloads.js` in de bovenliggende map installeert deze module tijdens prebuild. De app-identiteit blijft `com.Ameender.qurantracker`. Een wijziging aan de plugin of native bron vereist een nieuwe native build; Metro-refresh installeert die wijziging niet.

- `catalog.json` bevat uitsluitend de vier oorspronkelijke downloadbronnen en hun vaste formaten. De JavaScript-brug accepteert editie-/taak-ID’s, geen willekeurige URL of bestandspad.
- `BackgroundMushafDownloads.kt` gebruikt Android DownloadManager voor overdracht en persistente JobService-reconciliatie. Kleine voltooiingen worden kort afgehandeld; grote bestanden en PDF-installaties gaan naar JobService. Bestanden worden gecontroleerd, gesynchroniseerd en atomair naar hun eigen editiepad geïnstalleerd. Een taakmanifest en download-ID’s herstellen werk zonder React-runtime.
- `BackgroundMushafDownloads.h/.m` gebruiken een stabiele iOS background URLSession, eigen seriële coördinatie, taakbeschrijvingen en atomische installatie. De plugin verbindt AppDelegate met de actuele completion-handler; die wordt niet tussen oude en nieuwe eventbatches hergebruikt.

`src/services/mushaf/background.native.ts` is de smalle brug; `backgroundManager.ts` vertaalt native momentopnamen naar de bestaande bibliotheek-/voortgangsinterface. JavaScript-timers observeren status en zijn geen overdrachtsengine. Web behoudt zijn bestaande platformpad. Uitvoer staat in dezelfde `downloaded_mushafs/<editie>`-mappen die de opslagadapter leest; gebruikersdatabases en oorspronkelijke importbestanden worden niet overschreven.

Annuleren is expliciet en behoudt reeds geïnstalleerde geldige pagina’s. Verwijderen gebruikt een marker zodat later native werk een verwijderde uitgave niet stilzwijgend terugplaatst. Voortgang na een normale processtop verschilt van Android force-stop, iOS user force-quit, appverwijdering en OS-planning. Onderbrekingen kunnen worden uitgesteld; onbeperkte achtergrondtijd wordt niet gegarandeerd.

Bron-/contracttests: [background-mushaf](../../tests/background-mushaf.test.ts) en [onafhankelijke contracten](../../tests/background-download-contract.test.ts). Ze controleren onder meer pluginregistratie, broncatalogus, taakherstel en annuleren tijdens starten; ze bewijzen geen volledige native apparaatacceptatie. De daadwerkelijk gebouwde/gecontroleerde platforms en processtopscenario’s staan in [NATIVE_QA](../../docs/NATIVE_QA.md).
