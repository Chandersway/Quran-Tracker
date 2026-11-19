# Platformopslag en bestandsdeling

`deviceStorage` verzorgt apparaatopslag; `sessionStorage` bewaart sessies met platformvarianten en de bijbehorende coremodules. `shareNotesFile` verzorgt platformafhankelijk delen of downloaden van een JSON-bestand; de inhoud en het exportformaat blijven eigendom van `exporting/notesExport.ts`. Behoud opslag- en herstelgedrag bij wijzigingen.

`readOnlyAssetDatabase` opent gebundelde naslagdata (QAC/Lane) in een aparte map, met een bestandsnaam gebaseerd op de bronhash. Native loopt de bestandskopie buiten JavaScript om. De helper valideert bronmetadata en zet SQLite op alleen lezen. Bij fouten wordt uitsluitend die eigen kopie verwijderd voor een nieuwe poging; gebruikersdata en het gebundelde bronbestand worden niet aangeraakt. Browserplatforms gebruiken een losse geheugendatabase.

`pickNotesFile.*` kiest een notitie-export en leest maximaal 10 MiB. Het parseert of importeert niet: formaatvalidatie en samenvoeging staan in `domain/notesLibrary.ts`, de duurzame wijziging in de appstate. De native adapter gebruikt een cachekopie; de webadapter importeert geen native bestandssysteemmodule.
